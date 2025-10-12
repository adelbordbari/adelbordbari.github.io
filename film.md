---
layout: page
title: Film
permalink: /film/
---

<div class="lbdiary">
  <iframe
    title="Letterboxd Diary"
    src="https://lb-embed-content.bokonon.dev?username=adel_bordbari"
    loading="lazy"
    allowtransparency="true"
  ></iframe>
</div>

<ul>
  {% assign sorted_posts = site.film | sort: 'date' | reverse %}
  {% for post in sorted_posts %}
   <div class="post" style="margin-top: 30px;">
		<div
			class="entry"
			style="display: flex; justify-content: center; align-items: center">
			<div style="flex: 30%">
				<a href="{{ site.baseurl }}{{ post.url }}"
					><img
						id="cover-small"
						alt="film cover"
						src="{{ post.cover }}"
				/></a>
			</div>
			<div style="flex: 50%; line-height: 1;">
				<h3 style="word-wrap: anywhere;">
					<a
					href="{{ site.baseurl }}{{ post.url }}"
					class="read-more">
						{{ post.title }} - {{ post.year }}
					</a>
				</h3>
				<h6>posted on {{ post.date | date: "%B %d, %Y" }} </h6>
			</div>
			<div style="flex: 20%">
				<h4>{{ post.rating }}</h4>
			</div>
		</div>
	</div>
  {% endfor %}
</ul>
