---
layout: page
title: Etc
permalink: /etc/
---

<ul>
  {% for etc in site.etc %}
    <li>
      <a href="{{ etc.url }}">{{ etc.title }}</a>
    </li>
  {% endfor %}
</ul>
