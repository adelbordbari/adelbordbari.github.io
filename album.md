---
layout: page
title: Album
permalink: /album/
---

<ul>
  {% for post in site.album %}
		<div
			class="entry"
			style="display: flex; justify-content: center; align-items: center; margin-top: 30px;">
			<div style="flex: 30%">
				<a href="{{ site.baseurl }}{{ post.url }}"
					><img
						id="cover-small"
						alt="album cover"
						src="{{ post.cover }}"
				/></a>
			</div>
			<div style="flex: 60%">
				<h3 style="margin: 0;">
					<a
						href="{{ site.baseurl }}{{ post.url }}"
						class="read-more">
						{{ post.title }}
					</a>
						- {{ post.year }}</h3>
					<small>
						by: {{ post.artist }}
					</small>
			</div>
			<div style="flex: 10%">
				<h4>{{ post.rating }}</h4>
			</div>
		</div>
  {% endfor %}
</ul>
