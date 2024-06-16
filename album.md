---
layout: page
title: Album
permalink: /album/
---

<ul>
  {% for album in site.album %}
    <li>
      <a href="{{ album.url }}">{{ album.title }}</a> - {{ album.description }}
    </li>
  {% endfor %}
</ul>
