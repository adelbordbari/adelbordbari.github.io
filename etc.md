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

{% assign pagination_data = paginator %}
{% assign etc_posts = pagination_data.posts | default: site.etc %}
{% assign etc_posts = etc_posts | sort: 'date' | reverse %}
<ul>
{% for post in etc_posts %} 
  <li>
       {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
{% include pagination.html %}
