---
layout: page
title: Code
permalink: /code/
---

<ul>
  {% for post in site.code %}
    <li>
      {{ post.date }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
