---
layout: page
title: Etc
permalink: /etc/
---

<ul>
  {% for post in site.etc %}
    <li>
       {{ post.date }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
