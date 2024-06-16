---
layout: page
title: Film
permalink: /film/
---

<ul>
  {% for post in site.film %}
    <li>
      {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a> - {{ post.rating }}
      <small>by {{ post.director }}</small>
    </li>
  {% endfor %}
</ul>
