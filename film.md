---
layout: page
title: Film
permalink: /film/
---

<ul>
  {% for post in site.film %}
  <article style="margin-top: 30px;">
		<div
			class="entry"
			style="display: flex; justify-content: center; align-items: center">
			<div style="flex: 30%;;">
				<a href="{{ site.baseurl }}{{ post.url }}"
					><img
						src="{{ post.cover }}"
				/></a>
			</div>
			<div style="flex: 70%">
				<h4 style="margin: 0;">{{ post.title }}</h4>
				<small>by {{ post.director }}</small>
				<p>
					<strong>
						{{ post.rating }}
					</strong>
					<br />
					<small>{{ post.release }}</small>
				</p>
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
