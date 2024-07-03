---
layout: page
title: Et cetera
permalink: /etc/
---

<ul>
  {% assign sorted_posts = site.etc | sort: 'date' | reverse %}
  {% for post in sorted_posts %}
    <li>
       {{ post.date | date: "%B %d, %Y" }} - <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>
