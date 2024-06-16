---
layout: page
title: Etc
permalink: /etc/
---

<ul>
  {% for psot in site.etc %}
    <li>
       {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
