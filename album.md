---
layout: page
title: Albums
permalink: /album/
---

<ul>
  {% for post in site.album %}
   <div class="post" style="margin-top: 30px;">
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
			<div style="flex: 50%; line-height: 1;">
				<h3 style="word-wrap: anywhere;">
					<a
					href="{{ site.baseurl }}{{ post.url }}"
					class="read-more">
						{{ post.title }}
					</a>
				</h3>
				<h5 style="word-wrap: anywhere;">{{ post.year }} | by {{ post.artist }}</h5>
				<h6>posted on {{ post.date }} </h6>h6>
			</div>
			<div style="flex: 20%">
				<h4>{{ post.rating }}</h4>
			</div>
		</div>
	</div>
  {% endfor %}
</ul>
