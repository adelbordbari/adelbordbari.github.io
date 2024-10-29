---
title: "RTL Django Forms"
layout: "post"
---

## Table of Contents
- [Situation](#situation)
- [Problem](#problem)
- [Solution](#solution)
- [Takeaways](#takeaways)
- [Footnotes](#footnotes)

---

## Situation
I'm a native Farsi[^1] speaker, and Farsi (like Arabic and Hebrew) is an RTL language, meaning unlike Enligsh (or most western scripts) we write from Right-to-Left. this has been a challenge since the dawn of web, and despite the many improvements and integrations throughout the years, it's still and obstacle.
The task at hand is an admin dashboard in English that needs to also have a Farsi version as well. llanguage can be changed using a navbar button. I've had the experience of creating an RTL version of a dashboard in the past using React and Tailwind but that was only in the scope of front-end, not very troublesome although it was new. then I was really glad to be introduced to direction-agnostic CSS[^2] that's more generally "logical" than explicit. these are largely supported, and have been around since 2017 but I never knew they exist until last year.

## Problem
My second experience, that I'm writing about is not only front-end anymore. what I had to deal with in React, was a `context` that was modified using the navbar button, and by checking the context, components were rendered as LTR or RTL "versions". now though, it's a huge dashboard with +20 menu items and so many integrations. moreover, there's no front-end framework, only Djano templates. furthermore, not every direction change could happen in templates, as I figured. Forms were the first example of this that I faced. I decided to change the directions directly from the `forms.py` instead of writing CSS for the renders in the template.
I use request cookies to set language. the whole process is very similar to my previous example (using context in React) but instead I set a cookie for my requests, and by checking it in the template (either as context, or directly inspecting the incoming request from view to template). eventually `request.COOKIES.get("rtl")` is a string that decides whether I should render RTL or LTR. noteworthy that I used `request.COOKIES.get("rtl", "true")` in case anything unexpected happens. this means that `rtl` by default is `"false"`.
So in order to check the direction in template, I can either do this:
```python
def MyView(request):
  ...
  context[rtl] = request.COOKIES.get("rtl", "true")
  return render(request,'myapp/basetemplate.html', context)
```
and in the template, render conditionally:
```html
<form method="post" id="infoform">
  <label for="username">Enter a username:</label>
  <input type="text" id="usernameinput" name="username" placeholder="Username"
    style="{% if rtl == "true" %}direction=rtl;
    {% else %}direction=ltr;{% endif %}"
  >
  ...
  <input type="submit">
</form>
```
However, I decided to do this by modifying the form itself and simplifying my template.

## Solution
The solution is overriding the `__init__()` for the form. this is the default `__init__()` for `django.forms.Form`:
```python
    def __init__(
        self,
        data: Mapping[str, Any] | None = ...,
        files: Mapping[str, Any] | None = ...,
        auto_id: bool | str | None = ...,
        prefix: str | None = ...,
        initial: Mapping[str, Any] | None = ...,
        error_class: type[ErrorList] = ...,
        label_suffix: str | None = ...,
        empty_permitted: bool = ...,
        field_order: list[str] | None = ...,
        use_required_attribute: bool | None = ...,
        renderer: type[BaseRenderer] | None = ...,
    ) -> None: ...
```
This is how I used to initiat the form in my view:
```python
def infoView(request):
  contact_form = loginForm(request.POST or None, direction=direction)
  context = {"form": contact_form)
  ...
```

I achieved what I wanted by changing my form, and adding a new argument, `dir` that decides direction on placeholders and inputs (which have been my targets). I changed my form to this:
```python
class loginForm(forms.Form):
    def __init__(self, *args, **kwargs):
        # accept a direction argument (rtl is true or false)
        rtl = kwargs.pop("rtl", "false")  # default dir is false
        super(loginForm, self).__init__(*args, **kwargs)

        # align text RTL if rtl="true"
        direction = "rtl" if rtl else "ltr"

        # update the widget attributes for FullName field
        self.fields["FullName"].widget.attrs.update(
            {
                "style": f"margin-top:5%; font-size: 18px; text-align: {direction};",
                "placeholder": "نام کاربری" if direction == "rtl" else "Username",
                "title": "نام کاربری خود را وارد نمایید." if direction == "rtl" else "Enter your username.",
            }
        )
        # do the same for other fields/widgets

  FullName = forms.CharField(
        required=True,
        widget=forms.TextInput(
            attrs={
                "class": "form-control",
                "autocomplete": "off",
                # this is where I used to have style, placeholder, title, etc.
            }
        ),
    )
  # do the same for other fields/widgets
```
finally render the template, simply like:
```html
<form method="post" id="infoform">
  {{ form }}
</form>
```

![image](https://github.com/user-attachments/assets/d47a76e0-7819-4e78-ad5e-c2f36c162c9c)


## Takeaways
1. you can RTL Django forms both in `forms.py` and templates
2. depending on the apllication, either can work and be more suitable
3. in order to do it in `forms.py`, override the `__init__()` function
4. you can use cookies if you need a global variable for the Django app
5. cookies can be read inside the view and passed to template to conditionally render

## Footnotes
[^1]: Persian (interch.)
[^2]: `margin-inline-start`, `padding-inline-end`, `text-orientation`, `writing-mode`, etc.
