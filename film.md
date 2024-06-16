---
layout: page
title: Film
permalink: /film/
---

<ul>
  {% for post in site.film %}
    <li>
      {{ post.date }} - <a href="{{ post.url }}">{{ post.title }}</a>
      <small>{{ post.description }}</small>
    </li>
  {% endfor %}
</ul>
