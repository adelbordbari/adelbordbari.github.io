---
layout: page
title: Film
permalink: /film/
---

<ul>
  {% assign sorted_posts = site.film | sort: 'date' | reverse %}
  {% for post in sorted_posts %} 
    <li>
      {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
