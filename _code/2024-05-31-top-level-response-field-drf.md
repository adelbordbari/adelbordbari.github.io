---
title: "Top-level Response Field in DRF"
layout: "post"
---

## Table of Contents
- [Situation](#situation)
- [Problem](#problem)
- [Investigation](#investigation)
- [Solution](#solution)
- [Takeaways](#takeaways)

---

## Situation
In my DRF project, I have several simple CRUD endpoints that use `ModelViewSet` and `ModelSerializer`. A few of them have certain customizations and overridden codes based on their use cases. these are the same as regular `ViewSet`s and `Serializer`s which generate fields, validators, and CRUD functionalities based on the models. anything more specific can be later overridden for more explicit functions.

more on [ModelViewSet](https://www.django-rest-framework.org/api-guide/viewsets/#modelviewset), and [ModelSerializer](https://www.django-rest-framework.org/api-guide/serializers/#modelserializer)

I have a `Slide` model wired up. below is a sample response from an endpoint that incorporates `ModelViewSet` and `ModelSerializer`. As you can see I have two instances of the model. My model has several fields, some are use inputs and some are auto-generated in the backend(`id`, `created_at`, `updated_at`):

<p id="prev-response"></p>

```json
[
	{
		"id": "0b9b8b7b-4e3f-42f9-b021-ccdc5fe906e9",
		"created_at": "2024-05-12T08:30:57.480924Z",
		"updated_at": "2024-05-12T08:30:57.480924Z",
		"type": "movie",
		"title": "Gone With The Wind 1939",
		"description": "In April of 1861, Scarlett O'Hara is in love with Ashley and learns about his engagement. Despite warnings from her family, Scarlett intends to throw herself at Ashley at the event at Twelve Oaks.",
		"bg_image": "https://upload.wikimedia.org/wikipedia/commons/2/27/Poster_-_Gone_With_the_Wind_01.jpg",
		"bg_video": "https://upload.wikimedia.org/wikipedia/commons/2/27/Poster_-_Gone_With_the_Wind_01.mp4"
	},
	{
		"id": "8e8f9d8d-21de-45c8-b6ea-0042456bc8f4",
		"created_at": "2024-05-12T08:52:30.135001Z",
		"updated_at": "2024-05-12T08:52:30.135001Z",
		"type": "movie",
		"title": "Moonlight 2016",
		"description": "A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood, adolescence, and burgeoning adulthood.",
		"bg_image": "https://www.imdb.com/title/tt4975722/mediaviewer/rm1452607488/?ref_=tt_ov_i.jpg",
		"bg_video": "https://www.imdb.com/title/tt4975722/mediaviewer/rm1452607488/?ref_=tt_ov_i.mp4"
	}
]
```

## Problem
The problem with `ModelSerializer` is that it generates the response body based on the model's fields. However, I needed some top-level fields that weren't present in my models. this is an example of what I needed (compare with the previous code block [here](#prev-response)):

<p id="desired-response"></p>

```json
{
	"apiName": "slide",
	"standard": "Open-API 3.1.0",
	"version": "14",
	"content": [
		{
			"id": "0b9b8b7b-4e3f-42f9-b021-ccdc5fe906e9",
			"created_at": "2024-05-12T08:30:57.480924Z",
			"updated_at": "2024-05-12T08:30:57.480924Z",
			"type": "movie",
			"title": "Gone With The Wind 1939",
			"description": "In April of 1861, Scarlett O'Hara is in love with Ashley and learns about his engagement. Despite warnings from her family, Scarlett intends to throw herself at Ashley at the event at Twelve Oaks.",
			"bg_image": "https://upload.wikimedia.org/wikipedia/commons/2/27/Poster_-_Gone_With_the_Wind_01.jpg",
			"bg_video": "https://upload.wikimedia.org/wikipedia/commons/2/27/Poster_-_Gone_With_the_Wind_01.mp4"
		},
		{
			"id": "8e8f9d8d-21de-45c8-b6ea-0042456bc8f4",
			"created_at": "2024-05-12T08:52:30.135001Z",
			"updated_at": "2024-05-12T08:52:30.135001Z",
			"type": "movie",
			"title": "Moonlight 2016",
			"description": "A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood, adolescence, and burgeoning adulthood.",
			"bg_image": "https://www.imdb.com/title/tt4975722/mediaviewer/rm1452607488/?ref_=tt_ov_i.jpg",
			"bg_video": "https://www.imdb.com/title/tt4975722/mediaviewer/rm1452607488/?ref_=tt_ov_i.mp4"
		}
	]
}
```

## Investigation
At the beginning, this was my code:

<p id="initial-code"></p>

```python
# Serializer
class SlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slide
        fields = "__all__"

# View
class SlideViewSet(viewsets.ModelViewSet):
    queryset = Slide.objects.all()
    serializer_class = SlideSerializer
```

Next, I tried overriding the `to_representation` function in the viewI changed my code to this:

```python
# Serializer
class SlideSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slide
        fields = "__all__"
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        title = self.context.get("toplevel", None)
        if title:
            return {"apiName": "slide",
		"standard": "Open-API 3.1.0",
		"version": "14",
		"content": representation}
        return representation

# View
class SlideModelViewSet(ModelViewSet):
    queryset = Slide.objects.all()
    serializer_class = SlideSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['apiName'] = "slide"
        context['standard'] = "Open-API 3.1.0"
        context['version'] = "14"
        return context
```

This failed because it changed each object, and added my top-level field to every single instance of my model (and not only once, at the top per request). this is what the response looked like (compare with what I wanted [here](#desired-response))::

```json
[
	{
		"apiName": "slide",
		"standard": "Open-API 3.1.0",
		"version": "14",
		"content": {
			"id": "0b9b8b7b-4e3f-42f9-b021-ccdc5fe906e9",
			"created_at": "2024-05-12T08:30:57.480924Z",
			"updated_at": "2024-05-12T08:30:57.480924Z",
			"type": "movie",
			"title": "Gone With The Wind 1939",
			"description": "In April of 1861, Scarlett O'Hara is in love with Ashley and learns about his engagement. Despite warnings from her family, Scarlett intends to throw herself at Ashley at the event at Twelve Oaks.",
			"bg_image": "https://upload.wikimedia.org/wikipedia/commons/2/27/Poster_-_Gone_With_the_Wind_01.jpg",
			"bg_video": "https://upload.wikimedia.org/wikipedia/commons/2/27/Poster_-_Gone_With_the_Wind_01.mp4"
		}
	},
	{
		"apiName": "slide",
		"standard": "Open-API 3.1.0",
		"version": "14",
		"content": {
			"id": "8e8f9d8d-21de-45c8-b6ea-0042456bc8f4",
			"created_at": "2024-05-12T08:52:30.135001Z",
			"updated_at": "2024-05-12T08:52:30.135001Z",
			"type": "movie",
			"title": "Moonlight 2016",
			"description": "A young African-American man grapples with his identity and sexuality while experiencing the everyday struggles of childhood, adolescence, and burgeoning adulthood.",
			"bg_image": "https://www.imdb.com/title/tt4975722/mediaviewer/rm1452607488/?ref_=tt_ov_i.jpg",
			"bg_video": "https://www.imdb.com/title/tt4975722/mediaviewer/rm1452607488/?ref_=tt_ov_i.mp4"
		}
	}
]
```

## Solution
I went back to my original code and used an overridden `list` function. I added the top-level fields to the final `serializer.data`. finally, I also did the same with the `retrieve` function. serializer had no change from its [initial state](#initial-code). this is the code that worked as I intended:

```python
# View
class SlideViewSet(viewsets.ModelViewSet):
    queryset = Slide.objects.all()
    serializer_class = SlideSerializer

    def list(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        responseBody["content"] = serializer.data
        return Response(responseBody)

    def retrieve(self, request, pk=None):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        responseBody["content"] = serializer.data
        return Response(responseBody)
```

## Takeaways
**By customizing the to_representation method, you can create more complex and tailored serialized representations of your models, allowing you to control the output of your API endpoints.**

`ModelSerializer` inherits from `rest_framework.serializers.Serializer` which has many functions that can all be overridden. some of them include:
1. `get_fields` and `fields`
2. `get_validators` and `validate`
3. `to_internal_value` and `to_representation`
4. properties like `data` and `errors`
5. dunder methods like `__iter__` and `__repr__`

based on docs, serializer's purpose is _"Object instance -> Dict of primitive datatypes"_

and for the `to_representation` method:

By overriding the to_representation method, you can:
- Add or remove fields from the serialized output
- Modify the values of existing fields
- Perform calculations or transformations on the data
