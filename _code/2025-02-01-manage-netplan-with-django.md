---
title: "Managing Netplan with Django in Production (Revisited)"
layout: "post"
---

<img width="1376" height="768" alt="Network settings illustration" src="https://github.com/user-attachments/assets/dd4fdb3e-1098-4b7f-8757-adefbbf440e0" />

## Table of Contents
- [Situation](#situation)
- [Problem](#problem)
- [What Changed](#what-changed)
- [Architecture](#architecture)
- [Safety Rules](#safety-rules)
- [Django Workflow](#django-workflow)
- [Host Watcher](#host-watcher)
- [UI Feedback](#ui-feedback)
- [Terminal Fallback](#terminal-fallback)
- [Flow](#flow)
- [Takeaways](#takeaways)
- [Final Notes](#final-notes)

---

## Situation

Changing a server IP address remotely is the kind of task that punishes
overconfidence. One wrong route, one malformed YAML file, or one DHCP lease with
an unexpected default route can make the management UI disappear.

In field deployments we do not always have SSH access. Operators may need to:

- Move the appliance between networks
- Switch the default Ethernet interface
- Change an interface from static addressing to DHCP
- Leave a secondary interface with no address at all
- Recover from stale netplan or cloud-init files left by the OS image

So the project manages netplan through a guarded workflow instead of letting the
web request run `netplan apply` directly.

The important idea is still simple:

> Django stages the desired config. The host watcher applies it. The UI waits
> until the real host interface state matches what was requested.

---

## Problem

Manually editing `/etc/netplan/*.yaml` is risky in production because:

1. A YAML mistake can break networking immediately.
2. A default route on the wrong interface can kill the active session.
3. DHCP can inject routes unless it is explicitly controlled.
4. Old netplan files can conflict with the file you intended to use.
5. Cloud-init can reintroduce network settings after boot.
6. A web request is the wrong place to run long, privileged host operations.

The project needed a UI-driven process with:

- A strict stage -> confirm -> apply flow
- Validation before any live netplan file is touched
- A clear default-interface rule
- Per-interface YAML files
- Backups before promotion
- A host-side service that survives errors
- A status endpoint that checks actual interface state
- Logs that operators can understand

---

## What Changed

The old post described the core idea, but the implementation has grown.

The current code now has:

- A separate form for selecting the default interface
- Three addressing modes: `static`, `dhcp`, and `no_ip`
- A hidden DHCP flag in the web UI so disabled inputs do not confuse the server
- Server-side validation for interface name, gateway placement, static default
  interface, CIDR format, and gateway subnet membership
- A watcher-generated `interface_config.json` file used as the source of truth
  for UI status
- A polling endpoint that validates the final state from JSON, not only from log
  text
- A summarized network log with English and Persian user-facing messages
- A manual/terminal `dialog` path that uses the same pending-file and watcher
  contract
- A watcher startup routine that removes conflicting netplan entries, disables
  cloud-init networking, validates netplan syntax, and refreshes interface JSON

The rest of this post describes the current behavior without exposing real
deployment values. Code blocks are pseudocode, not exact project code.

---

## Architecture

The web container has controlled access to host networking files:

```text
host /sys/class/net      -> container /host_sys/class/net     read-only
host /etc/netplan        -> container /host_netplan           read-write
app state directory      -> container /code                   read-write
```

Django uses those mounts to list interfaces and stage netplan YAML. The host
watcher runs outside the request path and uses the real host locations:

```text
/etc/netplan
/sys/class/net
<app-state>/ip_reset
<app-state>/ip_refresh
<app-state>/netplan_result.log
<app-state>/interface_config.json
```

The split is intentional:

- Django owns validation, staging, confirmation, session state, and UI feedback.
- The host watcher owns `netplan generate`, `netplan apply`, cleanup, and JSON
  state generation.
- The wait page polls Django, and Django reads host-generated state.

The systemd service is deliberately small:

```ini
[Service]
ExecStart=/bin/bash <app-dir>/host_network_info.sh
Restart=always
RestartSec=2
StandardOutput=append:<app-dir>/netplan_result.log
StandardError=append:<app-dir>/netplan_result.log
```

The service is allowed to restart, but the script itself is also written to keep
running through most failures and log what happened.

---

## Safety Rules

The default interface is stored in a project config file under a system setting.
Operators can change it from the settings page, but every network change reads
the current value again before building netplan.

Pseudocode:

```python
def get_default_interface():
    return read_config_value(section="system", key="default_interface")
```

Only Ethernet-style interfaces are accepted:

```python
def allowed_interfaces():
    return [
        name
        for name in list_directory("/host_sys/class/net")
        if name.startswith(("eth", "ens", "enp"))
    ]
```

The server validates the selected interface even though the UI already provides
a dropdown:

```python
if selected_interface not in allowed_interfaces():
    reject("Unknown interface")
```

The critical route rules are:

- Only the default interface may have a gateway.
- The default interface must use a static IP.
- DHCP is allowed only on non-default interfaces.
- A gateway is only valid with a static IP.
- If a gateway is provided, it must belong to the same subnet as the static IP.
- Non-default DHCP must not install default routes.

Pseudocode:

```python
if interface != default_interface and gateway:
    reject("Gateway is only allowed on the default interface")

if interface == default_interface and (use_dhcp or not ip_cidr):
    reject("Default interface requires a static IP")

if gateway and not ip_cidr:
    reject("Gateway requires a static IP")

if ip_cidr and gateway and gateway not in network(ip_cidr):
    reject("Gateway must be inside the IP subnet")
```

These rules are the main lockout protection. They keep the default route
predictable and prevent secondary DHCP interfaces from taking over traffic.

---

## Django Workflow

### 1. Read Current Interface State

The UI displays the watcher-generated interface snapshot:

```json
[
  {
    "interface": "<iface>",
    "ip": "<current-ip-cidr-or-empty>",
    "gateway": "<default-gateway-or-empty>"
  }
]
```

Django does not shell out on every page load to discover state. It reads the JSON
file generated by the watcher.

There is also a small endpoint for one interface:

```python
def interface_status(request):
    iface = request.query["interface"]
    state = read_json("<app-state>/interface_config.json")
    return state_for(iface)
```

### 2. Control the Form

The frontend helps operators avoid invalid combinations:

- No interface selected: IP, gateway, and DHCP controls are disabled.
- Default interface selected: DHCP is disabled and gateway is editable.
- Non-default interface selected: DHCP is allowed and gateway is read-only.
- DHCP checked: IP input is disabled and the server receives a hidden
  `use_dhcp=true` field.

The hidden field matters because disabled inputs are not submitted by browsers.
The server still revalidates everything, but the hidden DHCP flag makes the
operator's intent explicit.

### 3. Build Netplan In Memory

Django builds a per-interface netplan document in memory first:

```python
config = {
    "network": {
        "version": 2,
        "renderer": "networkd",
        "ethernets": {
            interface: {
                "optional": True
            }
        }
    }
}
```

Static mode:

```python
config["network"]["ethernets"][interface].update({
    "dhcp4": False,
    "addresses": ["<ip>/<cidr>"]
})
```

DHCP mode for a non-default interface:

```python
config["network"]["ethernets"][interface].update({
    "dhcp4": True,
    "addresses": [],
    "dhcp4-overrides": {
        "use-routes": False,
        "route-metric": 500
    }
})
```

No-IP mode for a non-default interface:

```python
config["network"]["ethernets"][interface].update({
    "dhcp4": False,
    "addresses": []
})
```

Default route only when the selected interface is the default interface and a
gateway was provided:

```python
if interface == default_interface and gateway:
    config["network"]["ethernets"][interface]["routes"] = [
        {"to": "0.0.0.0/0", "via": "<gateway-ip>"}
    ]
```

Notice that the examples use placeholders. The real system writes the actual
operator-provided values after validation.

### 4. Stage Only

Saving the form does not activate the change. It writes only a pending file:

```text
/host_netplan/<interface>.yaml.pending
```

Pseudocode:

```python
remove_old_pending_file(interface)
write_yaml("<netplan-mount>/<interface>.yaml.pending", config)
chmod_owner_root_only("<netplan-mount>/<interface>.yaml.pending")
redirect_to_confirm_page(interface, mode, expected_ip)
```

At this point:

- The live YAML is untouched.
- `netplan apply` has not run.
- Routing has not changed.
- The operator still gets a confirmation screen.

### 5. Confirm Is the Commit Point

The confirmation view is the only place where pending config becomes live.

On confirm:

1. Ensure the pending file exists.
2. Copy the current live file to a `.bak` file if it exists.
3. Promote pending to live with a same-filesystem replace.
4. Atomically write the `ip_reset` signal file.
5. Store expected state in the session for polling.
6. Redirect to the wait page, or to the new default-interface IP if the default
   interface IP actually changed.

Pseudocode:

```python
if not exists(pending):
    reject("No pending config")

if exists(live):
    copy(live, backup)

replace(pending, live)
atomic_write("<app-state>/ip_reset", "request metadata")

session["ip_change_iface"] = interface
session["ip_change_mode"] = mode
session["ip_change_expected_ip"] = expected_ip_or_empty
session["ip_change_started_at"] = now()
```

The signal file is written atomically:

```python
def atomic_write(path, content):
    tmp = path + ".tmp"
    write_and_fsync(tmp, content)
    replace(tmp, path)
```

This gives the watcher a clean file modification event and avoids partially
written signals.

---

## Host Watcher

The watcher is the part that touches the real host networking stack.

On startup it:

1. Removes conflicting netplan entries.
2. Keeps only per-interface YAML files with expected Ethernet-style names.
3. Disables cloud-init network configuration if needed.
4. Runs `netplan generate` to validate syntax.
5. Waits briefly for interfaces to settle.
6. Writes `interface_config.json`.

Pseudocode:

```bash
cleanup_netplan_dir
disable_cloud_init_network
netplan_generate_for_validation
wait_for_interfaces
generate_interface_json
remember_signal_file_timestamps
```

The cleanup is intentionally strict. It keeps files shaped like:

```text
<interface>.yaml
```

and removes stale or conflicting entries. That prevents old cloud-init or
installer-generated files from defining the same interface behind our back.

The main loop watches two signal files:

```bash
while true; do
  if refresh_signal_changed; then
    regenerate_interface_json
    write_refresh_log
  fi

  if reset_signal_changed; then
    detect_duplicate_interface_definitions
    run_netplan_apply_without_crashing_watcher
    wait_for_interfaces
    regenerate_interface_json
    write_apply_log
  fi

  sleep 1
done
```

After an apply, the watcher logs:

- Whether netplan apply completed with success or warning
- Duplicate interface definitions, if detected
- Which interfaces changed IP
- Any relevant netplan output, with noisy Open vSwitch warnings filtered out

It then rewrites `interface_config.json` from the actual host state:

```bash
for iface in ethernet_interfaces; do
  ip = current_ipv4_for(iface)
  gateway = default_gateway_for(iface)
  append_json({ "interface": iface, "ip": ip, "gateway": gateway })
done
```

That JSON file is the bridge between the host and Django.

---

## UI Feedback

The wait page does not assume that a log line means the network is correct.
Instead, Django checks both time and actual state.

When the confirm view starts an apply, it records:

```python
session = {
    "interface": "<iface>",
    "mode": "static | dhcp | no_ip",
    "expected_ip": "<ip-without-cidr-or-empty>",
    "started_at": now()
}
```

The polling endpoint reads only logs and JSON newer than `started_at`, so old
success messages do not accidentally satisfy a new request.

Readiness is mode-specific:

```python
if mode == "static":
    ready = current_ip_without_cidr(interface) == expected_ip

elif mode == "dhcp":
    ready = interface_has_some_ipv4(interface)

elif mode == "no_ip":
    ready = interface_has_no_ipv4(interface)

else:
    ready = interface_has_some_ipv4(interface)
```

Then the endpoint returns:

- `updated` when the host state matches the request
- `pending` while the watcher or JSON refresh is still catching up
- `error` when apply status fails or the wait times out

On error or timeout, Django copies the `.bak` file back over the live YAML when
a backup exists, then sends the operator back to the network settings page.

The raw watcher log is summarized before display. Instead of showing every shell
line, the UI maps known messages to short operator-facing text, for example:

```text
Preparing network settings.
Validating network settings.
Network changes were applied successfully.
Address updated on interface <iface>.
```

The same summarizer has Persian labels as well.

---

## Terminal Fallback

There is also a host-side `dialog` tool for operators who are working locally or
through a console session.

It follows the same contract:

1. Read the default interface from the same config file.
2. List Ethernet-style interfaces.
3. Warn before changing the default interface.
4. Stage `<interface>.yaml.pending`.
5. Back up the live YAML before promotion.
6. Promote pending files to live files.
7. Signal the same watcher with `ip_reset`.
8. Wait for the watcher log and show the result.

The terminal path is not a separate networking system. It is another front end
for the same stage -> promote -> signal -> apply design.

---

## Flow

<img width="1377" height="758" alt="Network settings flow" src="https://github.com/user-attachments/assets/9d873a01-62d2-49b1-8236-4415af33b805" />

1. Operator opens Network Settings.
2. Django reads the default interface and watcher-generated interface JSON.
3. Operator optionally changes the default interface.
4. Operator selects an Ethernet interface.
5. UI enables only valid controls for that interface.
6. Operator chooses static, DHCP, or no-IP behavior.
7. Django validates the submitted values.
8. Django writes `<interface>.yaml.pending`.
9. Operator reviews the confirmation page.
10. Confirm backs up live YAML and promotes pending YAML.
11. Confirm atomically writes `ip_reset`.
12. The host watcher runs `netplan apply`.
13. The watcher regenerates `interface_config.json`.
14. The wait page polls Django.
15. Django compares requested state to actual host state.
16. The operator is returned to settings, or the browser moves to the new IP if
    the default-interface address changed.

Downtime is usually just the time netplan needs to apply and the browser needs
to reconnect.

---

## Takeaways

- Keep web validation separate from privileged host application.
- Treat netplan changes as a staged transaction.
- Make confirmation the only commit point.
- Store the default interface in one place and enforce it everywhere.
- Keep the default interface static-only.
- Never allow gateways on non-default interfaces.
- Disable DHCP route injection on non-default DHCP interfaces.
- Verify success from actual interface state, not only from logs.
- Generate a small JSON snapshot for the UI.
- Keep backups before promotion.
- Clean stale netplan and cloud-init conflicts.
- Keep the watcher alive even when individual operations fail.

---

## Final Notes

The design works because it accepts that network changes are dangerous.

Instead of pretending a web form can safely edit networking directly, the project
turns the change into a controlled handoff:

```text
validate -> stage -> confirm -> promote -> signal -> apply -> verify
```

That gives operators a predictable workflow without requiring SSH, while still
keeping the risky part on the host side where netplan actually belongs.

The most important part is not the YAML generation. It is the discipline around
when the YAML becomes live, who applies it, and how the UI decides the change
really worked.
