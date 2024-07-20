---
title: "Setting IP Address on Linux"
layout: "post"
---

## Table of Contents
- [Problem](#problem)
- [Solution](#solution)
- [Sources](#sources)

---

## Problem
I have a 22.04LTS Ubuntu machine and I want to change the IP address on it. There are several methods to check the current IP address:
1. `ip a` (shorthand, `ip addr`, `ip address` or `ip addr show`. shows info for all interfaces)
2. `ifconfig` (needed installation)
3. `hostname -I` (concise output)
4. `nmcli device show` (similar to #1)

## Solution
the routine to change the IP address includes disabling the interface, changing IP and enabling it again:
1. `ip link set <interface> down`
2. `ip addr add <ip>/<subnet> dev <interface>`
3. `ip link set <interface> up`

however I came across a method using `netplan`, by modifying a `.yaml` config file. this is how it goes:
1. locate config `netplan` files: `ls /etc/netplan`
2. the contents in that folder depends on the machine:
  1. user-defined configs are typically named `01-netcfg.yaml`
  2. config created by `NetworkManager` is often named `01-network-manager-all.yaml`
  3. `00-installer-config.yaml` is a common name for configs that are generated while installing, often on a server, and can contain network defaults
3. filenames are important, since `netplan` processes files alphabetically (so `00-*` files are processed before `01-*` files, etc.)
4. the renderer also matters, and determines how the settings are applied (e.g., using `NetworkManager` or `networkd`)
5. backup the original config (in case you mess something up like I did)
6. edit the proper `.yaml` file
7. `netplan apply`
8. `ping` to verify

this was my initial config :

```bash
# Let NetworkManager manage all devices on this system
network:
  version: 2
  renderer: NetworkManager
```

an example config looks like below:

```bash
network:
  version: 2
  renderer: networkd  # or NetworkManager
  ethernets:
    enp0s3:  # Replace with your interface name
      dhcp4: no
      addresses:
        - 192.168.1.100/24  # Replace with your desired static IP
      gateway4: 192.168.1.1  # Replace with your gateway IP
      nameservers:
        addresses:
          - 8.8.8.8          # Primary DNS
          - 8.8.4.4          # Secondary DNS

```

> ⚠️ <strong style="color: yellow">YAML files</strong>  
> human-readable markup language  
> highly sensitive to whitespaces, indentations, case/caps, etc.  
> take extra care


## Sources
1. https://pimylifeup.com/ubuntu-static-ip-netplan/
2. https://ostechnix.com/configure-static-ip-address-ubuntu/
3. https://www.serverlab.ca/tutorials/linux/administration-linux/how-to-configure-networking-in-ubuntu-20-04-with-netplan/
