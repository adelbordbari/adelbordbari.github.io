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
			<div style="flex: 50%">
				<a
					href="{{ site.baseurl }}{{ post.url }}"
					class="read-more">
						<h3 style="margin: 0;">{{ post.title }}</h3>
				</a>
				<h5 style="margin: 0;">{{ post.year }} | by {{ post.director }}</h5>
			</div>
			<div style="flex: 10%">
				<small> {{ post.date | date: "%Y %B" }}</small>
			</div>
			<div style="flex: 10%">
				<h4 style="margin: 0;">{{ post.rating }}</h4>
			</div>
		</div>
	</article>
  {% endfor %}
</ul>
