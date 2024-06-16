---
layout: page
title: Album
permalink: /album/
---

<ul>
  {% for post in site.album %}
    <li>
      {{ post.date }} - <a href="{{ post.url }}">{{ post.title }}</a> - {{ post.rating }}
    </li>
  {% endfor %}
</ul>
