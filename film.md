---
layout: page
title: Film
permalink: /film/
---

<ul>
  {% for post in site.film %}
   <article class="post" style="margin-top: 30px;">
		<div
			class="entry"
			style="display: flex; justify-content: center; align-items: center">
			<div style="flex: 30%">
				<a href="{{ site.baseurl }}{{ post.url }}"
					><img
						id="cover-small"
						alt="movie poster"
						src="{{ post.cover }}"
				/></a>
			</div>
			<div style="flex: 60%">
				<h3 style="margin: 0;">{{ post.title }} <small>| {{ post.year }} | by {{ post.director }}</small></h3>
				<small>{{ post.rating }}</small>
				<small> {{ post.date | date: "%B %d, %Y" }}</small>
			</div>
			<div style="flex: 10%">
				<small>
					<a
						href="{{ site.baseurl }}{{ post.url }}"
						class="read-more">
						Read More
					</a>
				</small>
			</div>
		</div>
	</article>
  {% endfor %}
</ul>
