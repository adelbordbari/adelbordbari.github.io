---
layout: page
title: Album
permalink: /album/
---

<ul>
  {% for post in site.album %}
 	<article class="post" style="margin-top: 30px;">
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
				<h3 style="margin: 0;">{{ post.title }}</h3>
					<small>
						by: {{ post.artist }}
					</small>
					<br />
					<strong>
						{{ post.rating }}
					</strong>
					<br />
					<small> {{ post.date | date: "%B %d, %Y" }}</small>
				<br />
				<strong
					><a
						href="{{ site.baseurl }}{{ post.url }}"
						class="read-more"
						>Read More</a
					></strong
				>
			</div>
		</div>
	</article>
  {% endfor %}
</ul>
