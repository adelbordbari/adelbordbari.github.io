---
title: "Dynamic Settings in Django"
layout: "post"
---

## Table of Contents
- [Situation](#situation)
- [Problem](#problem)
- [Endeavours](#endeavours)
- [Setbacks](#setbacks)
- [Solution](#solution)
- [Takeaways](#takeaways)

---

## Situation
I need my Django app to have dynamic, changeable settings. this is the crucial outline for the task: user can enter setting variables with values in a form, and this key-value pair becomes the new/updated variable that is then used as a part of `django.conf.settings`. a variable might exist beforehand, so this request becomes an "update". if the variable name does not exist, it is created.

This obviously isn't a regular task, not what you see very commonly everywhere. therefore there are not many accepted workarounds, best practices, 3rd-party libraries or tutorials for it (relative to the vast world of Django tutorials). although they do exist to be fair, but none of them worked for me.

Several blog posts, some youtube tutorials, and a few libraries exist on the internet for implementing this particular feature but eventually I had to come up with my own (of course *with a little help from my friends*).

## Problem
Given the specific nature of this problem, the obstacles are equally specific. the major issue is that every change in the `settings.py` requires a (Django) server restart to take effect (unlike `urls.py` or `views.py` in which changes take effect after an auto-restart. or templates that don't even require that). you need to stop the server, and start it with `runserver` again.
A restart can be done by `touch`ing a config file (e.g., `settings.py`) [^1]
![image](https://github.com/user-attachments/assets/c9b24fba-1005-4094-9645-968ac2f9acca)

So naturally we need a way to store these form inputs somewhere, change the `settings.py` and then restart the server; this is the most manual way to think about this problem.

## Endeavours
If you search "django dynamic settings" (realizing this is what it's called took me some time as well) you're likely to end up reading the docs on one of these three libraries:
- [dj-dynamic-settings](https://pypi.org/project/dj-dynamic-settings/)
- [django-dynamic-preferences](https://pypi.org/project/django-dynamic-preferences/)
- [Constance](https://django-constance.readthedocs.io/en/latest/)

All of these work the same. they implement an extension to the settings, so that you can access them wherever you need the settings (views, forms, etc.). for instance in your `view.py` you might have something like this with the Django settings:

```python
from django.conf import settings

def someView(request):
    debug_status = settings.DEBUG
    context = {'debug': debug_status}
    return render(request, 'my_template.html', context)
```

As mentioned, there's no dynamic way to edit `django.conf.settings`. you can only read from it (or I thought so).

The libraries do not follow a very different methodology either, except for the writing part. you can easily create, update and delete new settings (or *preferences*, as called by some).

### Preference vs. Setting
Although rather trivial, these two words serve different purposes.

A *setting* is usually a global configurations for the Django project. it's defined in the `setting.py` file. examples are `INSTALLED_APPS`, `DEBUG`, and `DATABASES`. it's defined in the global scope (project-wide) and not specific to any app/user.

On the other hand, a preference is (obviously the opposite of what's mentioned above) defined in the scope of specific apps or users, is stored within a model's instances (is read from the database, instead of the `settings.py` file), and can be modified dynamically without needing a full server restart.

## Setbacks
Unfortunately, none of these libraries worked for my end goal.
To be more specific, this is what I intended to do:
I want the admin to be able to set session expiry time. for that I use `django-session-timeout`. this library uses the "setting" `SESSION_EXPIRE_SECONDS` (integer, seconds of session timeout) to set the period. that's why I needed a way to change the settings. I also have another "explicit" setting named `METABASE_REFRESH_MINUTES`[^3]

If any of the libraries worked for you and yuor requirement, good for you. but I needed to have dynamic settings that's set AND used in `settings.py`, that was eventually impossible because of circular imports. no external module can be loaded `settings.py` before the django app loads the settings module itself, therefore creating a model (and corresponding form/view) was also not an option because I couldn't load the model into `settings.py` to use the instances as values for variables (namely `SESSION_EXPIRE_SECONDS`).

## Solution
This is a decription of what I came up with, and perfectly matched what I needed: [^2]
1. created a new app `globalSettings` with a model/form/view:

`models.py`
```python
class CustomSettings(models.Model):
    name = models.CharField(max_length=255)
    value = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.name}: {self.value}"
```

`forms.py`
```python
class CustomSettingsForm(forms.ModelForm):
    class Meta:
        model = CustomSettings
        fields = ["name", "value"]
        widgets = {
            "name": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Enter setting name"}
            ),
            "value": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Enter setting value"}
            ),
        }
```

`views.py`
```python
def create_update_settings(request):
    custom_settings = CustomSettings.objects.all()
    if request.method == "POST": # Regular form submission
        settings_form = CustomSettingsForm(request.POST) # for any key-value pair
        session_form = SessionExpireForm(request.POST) # for CustomSettings.filter(name="SESSION_EXPIRE_SECONDS")
        if "custom" in request.POST and settings_form.is_valid(): # look up templates for "custom"
            settings_form.save()
            update_settings()
            return redirect("settings")
        elif "session" in request.POST and session_form.is_valid():
            session_form.save()
            update_settings()
            return redirect("settings")
    else: # get, render empty form
        settings_form = CustomSettingsForm()
        session_form = SessionExpireForm()
    return render(
        request,
        "form_template.html",
        {
            "custom_settings": custom_settings,
            "settings_form": settings_form,
            "session_form": session_form,
        },
    )
def delete_setting(request, pk):
    setting = get_object_or_404(CustomSettings, pk=pk)
    if request.method == "POST":
        setting.delete()
        update_settings()
        return redirect("settings")
```

I needed to differentiate between "any key-value setting" with my explicit session timeout setting in the view, so I came up with a way to have different `request.POST`s after form submission by naming each form differetly. this is how I rendered the forms in my template:

`templates/form_template.html`
```html
{% raw %}
{% extends "shared/base.html" %}
{% block content %}
    <form method="post">
        {% csrf_token %}
        {{ session_form.as_p }}
        <button type="submit" class="btn btn-primary" name="session">Save</button>
    </form>
    <!-- updating a setting is creating the same name with a different value -->
    /* unique=True is NOT SET in database, so I can override it using forms
    otherwise I'd get a "instance already exists" error after form submission,
    and I'd needed a whole set of view/button/form/url for updateing settings. */
    <form method="post">
        {% csrf_token %}
        {{ settings_form.as_p }}
        <button type="submit" class="btn btn-primary" name="custom">Save</button>
        <!-- this "name" is what gets checked in view.py -->
    </form>

    <!-- show current setting pairs table with delete button -->
    <h2>Existing Settings</h2>
    <table class="table table-striped">
        <thead>
            <tr>
                <th>Name</th>
                <th>Value</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {% for setting in custom_settings %}
                <tr>
                    <td>{{ setting.name }}</td>
                    <td>{{ setting.value }}</td>
                    <td>
                        <form action="{% url 'delete_setting' pk=setting.pk %}" method="post" style="display:inline;">
                            {% csrf_token %}
                            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                        </form>
                    </td>
                </tr>
            {% empty %}
                <tr>
                    <td colspan="3">No settings found.</td>
                </tr>
            {% endfor %}
        </tbody>
    </table>
{% endblock %}
{% endraw %}
```

2. create a function to read from models and write to `settings.py`
By now users can create, update and delete settings. these are saved in database as instances. but this is just a simple CRUD. the real deal is the function `update_settings()`. let's have a look at the code:
```python
def update_settings():
    try:
        update_settings_file()
        restart_server()
    except Exception as e:
        return e
```

this does not tell us much, let's dig deeper:
```python
def format_value(value):
    """
    Convert the value to its appropriate Python representation.
    """
    if value.lower() in ["true", "false"]:
        return value.capitalize()  # Capitalize True/False for Python boolean
    elif value.isdigit():
        return int(value)  # Convert to integer if the value is all digits
    else:
        return repr(value)
def update_settings_file():
    # Get the absolute path of the settings file
    settings_path = os.path.abspath(
        importlib.import_module("myApp.settings").__file__
    )
    # Get all custom settings from the database
    custom_settings = CustomSettings.objects.all()
    with open(settings_path, "r") as f:
        lines = f.readlines()
    # Remove the old custom settings block
    start = None
    end = None
    for i, line in enumerate(lines):
        if "# Custom settings start" in line:
            start = i
        if "# Custom settings end" in line:
            end = i
    # Ensure the custom settings block is removed if it exists
    if start is not None and end is not None:
        del lines[start : end + 1]
    # Insert the new custom settings at the same position
    if start is not None:
        # Re-insert the custom settings block at the position where it was removed
        lines.insert(start, "# Custom settings start\n")
        for setting in custom_settings:
            lines.insert(
                start + 1, f"{setting.name.upper()} = {format_value(setting.value)}\n"
            )
        lines.insert(start + 1 + len(custom_settings), "# Custom settings end\n")
    else:
        # If no custom settings block was found, append it to the end of the file
        lines.append("# Custom settings start\n")
        for setting in custom_settings:
            lines.append(f"{setting.name.upper()} = {format_value(setting.value)}\n")
        lines.append("# Custom settings end\n")
    # Write the updated settings back to the file
    with open(settings_path, "w") as f:
        f.writelines(lines)
def restart_server():
    os.execl(sys.executable, sys.executable, *sys.argv)
```
Although it might seem ovewhelming (or not? it was for me) it's a pretty simple procedure:
1. open `setting.py`
2. find "# Custom settings start" and "# Custom settings end" in the file, set them as the dynamic, changeable section
3. for each `CustomSetting` instance, write the key and teh value into this section

This removes every custom setting, and rewrites all over again. even if only one instance is changed, the whole section is written again to the file

The `format_value()` is also trivial. since my model's `value` field is a `CharField` all values are saved as strings. this function tried to extract boolean and integer values because that's what will be used in `settings.py`.

I have this little workaround in `settings.py` for setting explicit defaults as well:
```python
##################DYNAMIC SETTINGS##########################
SESSION_EXPIRE_MINUTES = 15

# Custom settings start
# Custom settings end

SESSION_EXPIRE_SECONDS = SESSION_EXPIRE_MINUTES * 60
```

As I mentioned, the `django-session-timeout` library uses `SESSION_EXPIRE_SECONDS` to set session timeout, but for UX reasons I prefered users to set minutes instead of seconds. it's odd to say "I want to log out after 900 seconds". so I set a default (`15`) before the changeable section. if user set the variable, it will be redefined, thus overridden and finally converted to seconds which is what's directly used by the timeout library.

### Restart
As mentioned earlier, a restart can be done by merely touching the `settings.py` file. but I did it using the `restart_server()` function.

`os.execl()` replaces the current process with a new process. It executes the program specified by `sys.executable`, which is basically the Python interpreter in use. `sys.executable` retrieves the path of the Python executable that is currently running the script. `*sys.argv` unpacks the list of command-line arguments passed to the script, effectively passing them to the new process: any arguments used to start the Django server (like settings or configs).

There is a problem though, the server restart takes some time (2-3 seconds on my instance) and during this time you see a 502 page so don't remember to handle the error pages for this period too. you could some js to keep requesting the page and redirect to the settings page when server is ready. that can be another post.

## Takeaways
1. There's not always a simple solution to copy and paste, even for a megaproject like django with a community of millions
2. and even if there is a solution, it might not exactly fit your needs.
3. it's ok to use external libraries
4. it's impossible to change django settings without a restart
5. use `<button name="user">` in template and `if user in request.POST` to handle multiple form submissions in one view
6. touch `settings.py` to restart server
7. can't load models in `settings.py`
8. if model has a unique field, instances can't be updated using the create view/url. django throws a "resource exists" error

## Footnotes
[^1]: this will not cause any problem since using the `touch` command on a file that already contains content will not alter the file's content. Instead, it will update the timestamps associated with that file
[^2]: although it feels a bit "forced" and not specifically modular
[^3]: irrelevant to this post but metabase is a BI tool and I needed this setting for the proxy add to append a query parametr to the dashboard's iframe URL, so the dashboards automatically refresh after the given time
