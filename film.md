---
layout: page
title: Film
permalink: /film/
---

<ul>
  {% for post in site.film %}
    <li>
      <p>{{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a> - {{ post.rating }}</p>
      <small>by {{ post.director }}</small>
    </li>
  {% endfor %}
</ul>
