---
title: "Managing Netplan with Django in Production"
layout: "post"
---

## Table of Contents
- [Situation](#situation)
- [Problem](#problem)
- [Investigation](#investigation)
- [Solution](#solution)
- [Takeaways](#takeaways)
- [Footnotes](#footnotes)

---

## Situation

The environment is a production deployment using Docker Compose. Multiple services are involved, notably a Django-based web container (`web`) and a `cronjob` service. The Django container mounts the host’s `/etc/netplan` and `/sys/class/net` to gain access to the machine’s network interface configurations and status.

Inside the Django app, there's a settings panel accessible to authenticated users. One of the panels allows network configuration directly from the frontend. The web form is expected to work seamlessly across machines with multiple network interfaces (up to 8), and should reflect real-time settings for each interface.

## Problem

Originally, the system was designed to configure only one static interface (usually `enp2s0`). The older implementation had hardcoded assumptions and lacked flexibility. This was not suitable for real-world deployments where multiple interfaces are present, and configuration requirements vary per deployment.

The challenge was to:

- Scale the design to support multiple interfaces.
- Maintain form-based input via Django views.
- Make sure the YAML format written is consistent and readable by Netplan.
- Avoid impacting other interfaces when modifying one.

## Investigation

Goals included:

1. **List available interfaces**  
   Interfaces are read from `/host_sys/class/net` mounted from the host.

2. **Validate form input**
   - IP must be in CIDR format (`192.168.1.10/24`)
   - Gateway should only be allowed for the default interface (e.g., `enp2s0`)
   - Regex and logical checks for both IP and Gateway

3. **YAML Format Consistency**  
   Netplan expects strict YAML schema. Whether we write or read, we needed a uniform representation.

4. **Pre-filling the form**  
   If a YAML file exists for a selected interface, populate the form with existing values.

5. **Atomic Configuration**  
   Handle each interface via separate YAML files, instead of one monolithic config.

## Solution

The `ipForm` form class in Django was extended to handle dynamic rendering, pre-populated fields, and validation logic. Here's a key section of the form logic:

```python
self.fields["interface"].choices = [("", "-----")] + [(iface, iface) for iface in interfaces]
```

When a user selects an interface, the form reads `/host_netplan/{interface}.yaml` to extract existing configuration:

```python
def retrieve_interface_config(self, interface):
    ...
    if file.endswith(".yaml"):
        ...
        if config_name == interface:
            ...
            return {
                "ip": ip_address,
                "gateway": gateway,
            }
```

On form submission (`POST`), the view constructs a YAML structure like this:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp2s0:
      addresses:
        - 192.168.1.10/24
      dhcp4: false
      optional: true
      gateway4: 192.168.1.1
```

The file is written to `/host_netplan/enp2s0.yaml`, and a file `ip_reset` is touched to signal a change.

The form supports:
- Real-time validation
- Conditional readonly for gateway (non-default interfaces)
- Language support (via cookie-based `lang` param)

On success, the user is redirected. If the default interface was changed, they may even be redirected via the new IP address.

## Takeaways

- Writing YAML is not hard, but writing *valid* Netplan YAML is.
- Managing each interface as a separate file reduces risk and eases debugging.
- Cookie-based language detection makes the UX accessible.
- Race conditions between form write and system apply must be watched carefully in production.
- Graceful restarts (triggered by writing `ip_reset`) are safer than reboots.

## Footnotes

[^1]: The web UI uses Django forms with hidden input tags to distinguish between multiple settings forms on the same page. The main settings URL is routed via `path("setting", deletion_page, name="settings")`.
