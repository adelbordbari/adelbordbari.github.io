---
layout: page
title: Et cetera
permalink: /etc/
---

<ul>
  {% for post in site.etc %}
    <li>
       {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
