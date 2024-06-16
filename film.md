---
layout: page
title: Film
permalink: /film/
---

<ul>
  {% for film in site.film %}
    <li>
      <a href="{{ film.url }}">{{ film.title }}</a> - {{ film.description }}
    </li>
  {% endfor %}
</ul>
