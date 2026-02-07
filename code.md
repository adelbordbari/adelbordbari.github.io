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

{% if paginator %}
  {% assign code_posts = paginator.posts %}
{% else %}
  {% assign code_posts = site.code %}
{% endif %}
{% assign code_posts = code_posts | sort: 'date' | reverse %}

<ul>
  {% for post in code_posts %} 
  <li>
      {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
{% include pagination.html %}
