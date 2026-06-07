---
layout: default
title: Photos
permalink: /photo/
pagination:
  enabled: true
  collection: photos
  per_page: 10
  sort_field: "date"
  sort_reverse: true
  permalink: /photo/:num/
---

{% assign pagination_data = paginator | default: page.pagination %}
{% assign photo_posts = pagination_data.posts | default: site.photos %}
{% assign photo_posts = photo_posts | sort: 'date' | reverse %}

<main class="photo-page">
  <section class="photo-hero" aria-labelledby="photo-title">
    <div class="photo-hero__kicker">mobile / 35mm</div>
    <h1 id="photo-title">Photo</h1>
    <p>light leaks, street corners, small rooms, passing weather.</p>
    <div class="photo-hero__ticker" aria-hidden="true">
      <span>shoot</span>
      <span>develop</span>
      <span>scan</span>
      <span>remember</span>
    </div>
  </section>

  <section class="photo-marquee" aria-hidden="true">
    <div>
      <span>phone</span>
      <span>35mm</span>
      <span>grain</span>
      <span>flash</span>
      <span>contact sheet</span>
      <span>phone</span>
      <span>35mm</span>
      <span>grain</span>
      <span>flash</span>
      <span>contact sheet</span>
    </div>
  </section>

  {% if photo_posts.size > 0 %}
    <section class="photo-grid" aria-label="Photo posts">
      {% for post in photo_posts %}
        <a class="photo-card" href="{{ post.url | relative_url }}">
          <span class="photo-card__number">{{ forloop.index | prepend: '00' | slice: -2, 2 }}</span>
          <figure>
            <img src="{{ post.image | relative_url }}" alt="{{ post.title | escape }}" loading="lazy">
            <figcaption>
              <span>{{ post.title }}</span>
              <small>{{ post.date | date: site.date_format }}</small>
            </figcaption>
          </figure>
        </a>
      {% endfor %}
    </section>
  {% else %}
    <section class="photo-empty" aria-label="No photos yet">
      <div class="photo-empty__frame"></div>
      <p>No photos yet.</p>
    </section>
  {% endif %}

  {% include pagination.html %}
</main>
