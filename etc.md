---
layout: page
title: Et cetera
permalink: /etc/
pagination:
  enabled: true
  collection: etc
  per_page: 10
  sort_field: "date"
  sort_reverse: true
  permalink: /etc/:num/
---

<ul>
{% for post in paginator.posts %} 
  <li>
       {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
{% include pagination.html %}
