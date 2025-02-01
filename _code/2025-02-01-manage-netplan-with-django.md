---
title: "Managing Netplan with Django"
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
A docker-compose setup exists with several containers on it. the relevant containers include a web(Django), and a cronjob container. the web container hosts a Django webapp with several facilities. a meta-facility is assigned to setting, where the user can modify certain settings. a part of this facility has to with modifying the settings for the interfaces. this setup will be run on certain machines that can support up to 8 interfaces.
The docker-compose for these containers:
<pre><code>
version: "3.5"
services:
  web:
    image: ala_web
    user: root
    container_name: web
    restart: always
    command: python manage.py runserver --insecure 0.0.0.0:8000
    extra_hosts:
      - "token-service.dezhafzar.net:172.23.48.1"
    volumes:
<s>      - ../database_data:/var/lib/clickhouse</s>
<s>      - ./mainApp/:/code</s>
      - /sys/class/net:/host_sys/class/net:ro
      - /etc/netplan:/host_netplan
    logging:
      driver: "json-file"
      options:
        max-size: 10m
        max-file: "3"
    networks:
      project-network:
        ipv4_address: 172.23.48.11
    privileged: true
<s>    depends_on:
      - mariadb
      - clickhouse-backup
      - metabase</s>

  cronjob:
    image: ala_cronjob
    container_name: cronjob
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: 10m
        max-file: "3"
    networks:
      project-network:
        ipv4_address: 172.23.48.17
<s>    depends_on:
      - mariadb
      - clickhouse</s>
</code></pre>

## Problem
A previous version used to work with only one interface. an implementation of setting up the one interface using Django already exists but is rather obsolete, considering the many updates the netplan modification system must have. so I started coming up with a whole new system, while keeping the same mindset/logic.

## Investigation
There needed to be validation among the entered values:
1. subnet in range
2. gateway in accordance with IP address
3. gateway can be set only for the default interface
4. regex check for IP, and gateway
5. web form needs to show current settings (pre-filled forms)

The other challenge was to make sure reading and writing procedures result in the same format of the yaml content. this is the format I chose to follow for both:
```yaml
# sample config
network:
  ethernets:
    ens192:
      addresses:
      - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: 
        - 4.2.2.4
        search: []
  version: 2
```

## Solution
Netplan reads interfaces configs based on `.yaml` files in `/etc/netplan`. this can happen in two ways:
1. have a separate file per interface
2. have one large file that includes every setting for all interfaces
I decided to follow the first method to have a more atomic approach, so each file is managed individually and not risk messing up other interfaces' settings if one fails. it's more modular and thus easier to debug. although this method requires more awareness and a proper merging logic, it's worth it since the configurations are going to happen frequently.
I wrote a form:
```python
class ipForm(forms.Form):
    interface = forms.ChoiceField(
        label="Interface",
        required=True,
        widget=forms.Select(attrs={"class": "form-control"}),
    )
    ip = forms.CharField(
        label="IP/subnet",
        required=False,
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )
    gateway = forms.CharField(
        label="Gateway (only for default interface)",
        required=False,
        widget=forms.TextInput(
            attrs={"class": "form-control"}
        ),
    )
```
this was very basic at the beginning but in time I added more features to it. first I needed to pre-fill the form if a selected interface already had settings configured. so I wrote a function for the form to read an interface's settings from its yaml file:
```python
def retrieve_interface_config(self, interface):
    # /host_netplan is mounted with /etc/netplan from host machine
    netplan_dir = "/host_netplan"
    try:
        for file in os.listdir(netplan_dir):
            # Skip hidden files and ensure the path is a file
            file_path = os.path.join(netplan_dir, file)
            if file.startswith(".") or not os.path.isfile(file_path):
                continue

            if file.endswith(".yaml"):
                # Read and parse yaml file
                with open(file_path, "r") as yaml_file:
                    data = yaml.safe_load(yaml_file)
                    for config_name, config_data in (
                        data.get("network", {}).get("ethernets", {}).items()
                    ):
                        if config_name == interface:
                            addresses = config_data.get("addresses", [])
                            ip_address = addresses[0] if addresses else ""
                            gateway = (
                                config_data.get("gateway4", "")
                                if interface == "enp2s0" # default interface
                                else ""
                            )
                            return {
                                "ip": ip_address,
                                "gateway": gateway,
                            }
    except Exception as e:
        return e
```
then I used this function to populate the relevant fields:
```python
def __init__(self, *args, **kwargs):
    lang = kwargs.pop("lang", "english")
    interfaces = kwargs.pop("interfaces", [])
    selected_interface = kwargs.pop("selected_interface", None)
    super().__init__(*args, **kwargs)

    self.fields["interface"].choices = [("", "-----")] + [
        (iface, iface) for iface in interfaces
    ]
    self.fields["interface"].initial = ""

    if lang != "persian":
        self.fields["ip"].widget.attrs["placeholder"] = "IP Address"
        self.fields["gateway"].widget.attrs["placeholder"] = "Gateway"
    # pre-fill form fields based on current configs
    if selected_interface:
        config = self.retrieve_interface_config(selected_interface)
        if config:
            self.fields["ip"].initial = config.get("ip", "")
            if selected_interface == "enp2s0":
                self.fields["gateway"].initial = config.get("gateway", "")
            else:
                self.fields["gateway"].widget.attrs["readonly"] = True
```
finally I added some cleaning methods to the form:
```python
    def clean_ip(self):
        ip = self.cleaned_data.get("ip")
        if not ip:
            return ""
        # Regex to validate CIDR notation
        pattern = r"^\d{1,3}(\.\d{1,3}){3}/\d{1,2}$"
        if not re.match(pattern, ip):
            raise forms.ValidationError("follow this format: 192.168.1.1/24")
        # Additional validation for valid IP and subnet range
        try:
            ip_address, subnet = ip.split("/")
            subnet = int(subnet)
            if subnet < 0 or subnet > 32:
                raise ValueError("Invalid subnet value.")
            for octet in ip_address.split("."):
                if int(octet) < 0 or int(octet) > 255:
                    raise ValueError("Invalid IP address range.")
        except ValueError:
            raise forms.ValidationError("invalid address, re-enter IP and subnet")
        return ip

    def clean_gateway(self):
        gateway = self.cleaned_data.get("gateway")
        # Regex to validate IPv4 address (e.g., 192.168.1.1)
        pattern = r"^\d{1,3}(\.\d{1,3}){3}$"
        if not gateway:
            return gateway  # Allow empty value for non-enp2 interfaces
        if not re.match(pattern, gateway):
            raise forms.ValidationError("follow this format: 192.168.1.1")
        # Additional validation for valid IP range
        try:
            for octet in gateway.split("."):
                if int(octet) < 0 or int(octet) > 255:
                    raise ValueError("Invalid IP address range.")
        except ValueError:
            raise forms.ValidationError("invalid gateway, try again")
        return gateway
```

### init
I added an empty option for the interface selector as well, to use the `OnChange` event on it later. the interface will be empty initially, and once user changes it to one of the interfaces, a get request is made to retrieve the current configs. I also needed to list the interfaces. I did that by mounting `/sys/class/net`, and in the relevant view, I initiaite the form by passing in the relevant items of this folder:

### rendering
I have a page in which I have few forms. I add named hidden inputs to differentiate them in the view. The url that renders the main settings page looks like `path("setting", settings_page, name="settings")`. this URL is available as an item in the sidebar, and it calls a view that processes multiple forms. First let's look at the helper functions:
```python
def get_interfaces():
    """
    Lists the real interfaces from the mounted dir
    """
    all_interfaces = os.listdir("/host_sys/class/net")
    filtered_interfaces = [
        iface for iface in all_interfaces if iface.startswith(("eth", "ens", "enp"))
    ]
    return filtered_interfaces

def fetch_interface_config(request):
    """
    Fetch one interface's config by reading its netplan yaml file, init the form with them
    """
    interface = request.GET.get("interface") # read from query param
    if interface:
        # if interface exists, read configs and sent form initiated with configs as JSON
        interfaces = get_interfaces()  # Fetch available interfaces
        form = ipForm(lang=lang, interfaces=interfaces, selected_interface=interface)
        config = form.retrieve_interface_config(interface)
        if config:
            return JsonResponse(config)
        else:
            return JsonResponse({"ip": "", "gateway": "",})
    return JsonResponse({}, status=400)
```

Now let's look at the view:
‍‍‍```python
def deletion_page(request):
    interfaces = get_interfaces()
    ...
    # handle forms
    if request.method == "POST":
        ...
        ip_form = ipForm(request.POST, lang=lang, interfaces=interfaces)
        if "custom" in request.POST:
            ...
        elif "session" in request.POST:
            ...
        elif "ip_form" in request.POST:
            if ip_form.is_valid():
                selected_interface = ip_form.cleaned_data.get("interface")
                ip = ip_form.cleaned_data.get("ip")
                gateway = ip_form.cleaned_data.get("gateway")
                interface_config = {
                    "network": {
                        "version": 2,
                        "renderer": "networkd",
                        "ethernets": {
                            selected_interface: {
                                "addresses": [] if not ip else [ip],
                                "dhcp4": False,
                                "optional": True,
                            }
                        },
                    }
                }
                if selected_interface == "enp2s0" and gateway:
                    interface_config["network"]["ethernets"][selected_interface][
                        "gateway4"
                    ] = gateway
                yaml_path = f"/host_netplan/{selected_interface}.yaml"
                try:
                    with open(yaml_path, "w") as yaml_file:
                        yaml.dump(
                            interface_config,
                            yaml_file,
                            default_flow_style=False,
                            default_style=None,
                        )
                    with open("ip_reset", "w") as reset_file:
                        reset_file.write("reset")
                        messages.success(request, "Changed applied!")
                    if selected_interface == "enp2s0":
                        return redirect("https://{}".format(re.match("\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}",ip[:-3])[0]))
                except Exception as e:
                    messages.error(request, e)
            else:
                messages.error(request, "Form is not valid.")
    else:
        ip_form = ipForm(lang=lang, interfaces=interfaces)
        settings_form = CustomSettingsForm(lang=lang)
        session_instance = CustomSettings.objects.filter(
            name="SESSION_EXPIRE_MINUTES"
        ).first()
        session_form = SessionExpireForm(
            initial={
                "value": session_instance.value
            }
        )

    return render(
        request,
        "rotation.html",
        {
            "version": os.environ.get("version"),
            "tablenames": tables,
            "lang": lang,
            "settings_form": settings_form,
            "custom_settings": custom_settings,
            "session_form": session_form,
            "ip_form": ip_form,
        },
    )
```

## Takeaways
1. race condition is a possible risk and must be considered.

## Footnotes
[^1]: 
