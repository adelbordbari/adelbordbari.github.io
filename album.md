---
layout: page
title: Albums
permalink: /album/
pagination:
  enabled: true
  collection: album
  per_page: 10
  sort_field: "date"
  sort_reverse: true
  permalink: /album/:num/
---

{% assign album_posts = paginator.posts | default: site.album %}
{% assign album_posts = album_posts | sort: 'date' | reverse %}
<ul>
	{% for post in album_posts %}
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
				<h6>posted on {{ post.date | date: "%B %d, %Y" }} </h6>
			</div>
			<div style="flex: 20%">
				<h4>{{ post.rating }}</h4>
			</div>
		</div>
	</div>
  {% endfor %}
</ul>
{% include pagination.html %}
