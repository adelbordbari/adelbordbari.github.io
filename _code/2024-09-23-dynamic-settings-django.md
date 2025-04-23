---
title: "Dynamic Settings in Django (Revisited)"
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

Sometimes, the need arises for application-level settings to be configurable at runtime — without redeployments or code edits. In our Django setup, we wanted admin users to define or modify settings such as session expiration time or Metabase dashboard refresh intervals. These changes should propagate to the `settings.py` file so that other parts of the project relying on `django.conf.settings` can access them.

## Problem

Django loads the `settings.py` at startup, and changes to this file don't take effect until the server restarts. Simply put, unlike templates or URLs, there is no built-in live reloading mechanism for Python settings.

We needed a way to:
1. Store new or updated key-value settings from a form.
2. Persist these in the database.
3. Reflect them inside `settings.py`.
4. Restart the Django server automatically.

## Investigation

We reviewed several libraries:
- `django-constance`
- `django-dynamic-preferences`
- `dj-dynamic-settings`

While they provide models and admin interfaces for preferences, they either don’t reflect settings in `django.conf.settings` or require custom logic to do so — which still doesn't help when a hard setting like `SESSION_EXPIRE_SECONDS` needs to live in `settings.py`.

Additionally, circular import issues block you from directly referencing database models from within `settings.py`.

## Solution

We created a custom implementation using:

- A model: `CustomSettings`
- A form: `CustomSettingsForm`
- Views to handle submissions
- A utility function to rewrite `settings.py` dynamically and trigger a restart

### Key Components

#### Model

```python
class CustomSettings(models.Model):
    name = models.CharField(max_length=255, unique=True)
    value = models.CharField(max_length=255)
```

#### Form

```python
class CustomSettingsForm(forms.ModelForm):
    class Meta:
        model = CustomSettings
        fields = ["name", "value"]
```

#### Writing to `settings.py`

```python
def update_settings_file():
    settings_path = os.path.abspath(importlib.import_module("mainApp.settings").__file__)
    custom_settings = CustomSettings.objects.all()
    
    with open(settings_path, "r") as f:
        lines = f.readlines()

    start = end = None
    for i, line in enumerate(lines):
        if "# Custom settings start" in line: start = i
        if "# Custom settings end" in line: end = i

    if start is not None and end is not None:
        del lines[start:end + 1]

    new_lines = ["# Custom settings start
"]
    for setting in custom_settings:
        new_lines.append(f"{setting.name.upper()} = {format_value(setting.value)}
")
    new_lines.append("# Custom settings end
")

    lines = lines[:start] + new_lines + lines[start:] if start is not None else lines + new_lines

    with open(settings_path, "w") as f:
        f.writelines(lines)
```

#### Restarting Server

```python
def restart_server():
    os.execl(sys.executable, sys.executable, *sys.argv)
```

This restarts the Django server by replacing the current process with a fresh one.

#### Form Handling

We handled multiple forms in the same view using button names and/or hidden inputs:

```python
if "custom" in request.POST:
    ...
elif "session" in request.POST:
    ...
```

This lets us handle each form differently based on what button was clicked.

#### Final `settings.py` Snippet

```python
SESSION_EXPIRE_MINUTES = 15 # this is basically how we set default values

# Custom settings start

# this is where django writes the name-value pairs

# Custom settings end

SESSION_EXPIRE_SECONDS = SESSION_EXPIRE_MINUTES * 60 # post-processing if needed
```

This ensures there's always a fallback value, and the real value is updated when the section is rewritten dynamically.

## Takeaways

- Dynamic settings require a custom solution when you need them available inside `settings.py`
- Restarting the server is mandatory for these changes to take effect
- Circular imports prevent models from being used in `settings.py`
- Use button `name` in form submissions to identify multiple forms
- Rewriting the full settings block is safer and more predictable than trying to diff/patch
- Graceful restarts via `os.execl` work well for small to medium apps, but consider async handling in production

## Footnotes

[^1]: Changing `settings.py` doesn’t affect a running server unless it’s restarted.
[^2]: This solution is custom-built, but fits the requirement exactly — especially for settings that must live in Python context.
[^3]: Metabase is a BI tool we use, and we dynamically change the refresh time for embedded dashboards through this same mechanism.
