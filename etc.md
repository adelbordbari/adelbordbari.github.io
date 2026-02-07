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

{% assign etc_posts = paginator.posts | default: site.etc %}
{% assign etc_posts = etc_posts | sort: 'date' | reverse %}
<ul>
{% for post in paginator.posts %} 
{% for post in etc_posts %} 
  <li>
       {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
{% include pagination.html %}
