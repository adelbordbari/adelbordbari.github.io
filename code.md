---
layout: page
title: Code
permalink: /code/
pagination:
  enabled: true
  collection: code
  per_page: 10
  sort_field: "date"
  sort_reverse: true
  permalink: /code/:num/
---

<ul>
  {% assign sorted_posts = site.code | sort: 'date' | reverse %}
  {% for post in sorted_posts %} 
    <li>
      {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
{% include pagination.html %}
