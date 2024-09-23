## Table of Contents
- [Situation](#situation)
- [Problem](#problem)
- [Solution](#solution)
- [Takeaways](#takeaways)

---

## Situation
I need my Django app to have dynamic, changeable settings. this is the crucial outline for the task: user can enter setting variables with values in a form, and this key-value pair becomes the new/updated variable that is then used as a part of `django.conf.settings`. a variable might exist beforehand, so this request becomes an "update". if the variable name does not exist, it is created.
This obviously isn't a regular task, not what you see very commonly everywhere. therefore there are not many accepted workarounds, best practices, 3rd-party libraries or tutorials for it (relative to the vast world of Django tutorials). although they do exist to be fair, but none of them worked for me.
Several blog posts, some youtube tutorials, and a few libraries exist on the internet for implementing this particular feature but eventually I had to come up with my own (of course *with a little help from my friends*).

## Problem
Given the specific nature of this problem, the obstacles are equally specific. the major issue is that every change in the `settings.py` requires a (Django) server restart to take effect (unlike `urls.py` or `views.py` in which changes take effect after an auto-restart. or templates that don't even require that). you need to stop the server, and start it with `runserver` again.
So naturally we need a way to store these form inputs somewhere, change the `settings.py` and then restart the server; this is the most manual way to think about this problem.

## Solution
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

Unfortunately, none of these libraries worked for my end goal.
To be more specific, this is what I intended to do:
I want the admin to be able to set session expiry time. for that I use `django-session-timeout`. this library uses the "setting" `SESSION_EXPIRE_SECONDS` (integer, seconds of session timeout) to set the period. that's why I needed a way to change the settings.

## Takeaways

## Footnotes
[^1]: this constraint throws a `django.db.utils.IntegrityError` if you try to violate it by creating a duplicate instance.
