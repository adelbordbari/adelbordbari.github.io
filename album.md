---
layout: page
title: Album
permalink: /album/
---

<ul>
  {% for post in site.album %}
		<div
			class="entry"
			style="display: flex; justify-content: center; align-items: center">
			<div style="flex: 30%">
				<a href="{{ site.baseurl }}{{ post.url }}"
					><img
						id="cover-small"
						alt="album cover"
						src="{{ post.cover }}"
				/></a>
			</div>
			<div style="flex: 70%">
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
					<br />
					<small>
						{{ post.rating }}
					</small>
			</div>
		</div>
  {% endfor %}
</ul>
