---
title: "code | Race Condition in DRF"
layout: "post"
---

## Table of Contents
- [Situation](#situation)
- [Problem](#problem)
- [Investigation](#investigation)
- [Solution](#solution)
- [Takeaways](#takeaways)
- [Footnotes](#footnotes)

---

## Situation
In Django Rest Framework, I have an endpoint in which I like to receive an object via POST and based on three fields of that object, decide if the object is new or already exists. my model is `Product` and the three fields are `brand`, `serial`, and `manufacturer`. if it already exists (i.e., an object with those three fields exists) update other fields; and if it does not exist, create it. I have not implemented any `unique` constraints in my database[^1] based on these three fields. I could do that using [unique_together](https://docs.djangoproject.com/en/5.0/ref/models/options/#unique-together), like this:
```python
class MyModel(models.Model):
  first_name = models.CharField(max_length=50)
  last_name = models.CharField(max_length=50)

  class Meta:
    unique_together = ('first_name', 'last_name',)
```


At first, I tried writing a very manual code, something like this:
1. receive request data, and pass it to the serializer
2. check the three fields from `validated_data`
3. check if a model instance exists with those three values
4. if it exists: update other fields
5. if does not exist: create a new object with the received data
6. finally, return the created or updated object with the proper status code (201 CREATED or 200 OK)

```python
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Product
from .serializers import ProductSerializer

class ProductView(APIView):
    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            # Extracting the values of the fields
            brand = serializer.validated_data.get('brand')
            serial = serializer.validated_data.get('serial')
            manufacturer = serializer.validated_data.get('manufacturer')
            
            # Check if object already exists
            existing_instance = Product.objects.filter(
                brand=brand,
                serial=serial,
                manufacturer=manufacturer
            ).first()
            
            if existing_instance:
                # Object exists, update it
                serializer_instance = ProductSerializer(existing_instance, data=request.data)
                if serializer_instance.is_valid():
                    serializer_instance.save()
                    return Response(serializer_instance.data, status=status.HTTP_200_OK)
                return Response(serializer_instance.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Object doesn't exist, create it
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

## Problem
I faced race condition. I deployed the code and the client used it but after some time we observed that there were still duplicates, despite setting conditions for updating and creating.
I tried using the [update_or_create](https://docs.djangoproject.com/en/5.0/ref/models/querysets/#update-or-create) method from Django ORM too. using something like this:
```python
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Product
from .serializers import ProductSerializer

class ProductView(APIView):
    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            # Extracting the values of the fields
            brand = serializer.validated_data.get('brand')
            serial = serializer.validated_data.get('serial')
            manufacturer = serializer.validated_data.get('manufacturer')
            
            # Try to update the object, or create it if it doesn't exist
            instance, created = Product.objects.update_or_create(
                brand=brand,
                serial=serial,
                manufacturer=manufacturer,
                defaults=serializer.validated_data
            )

            if created:
                # Object was created
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                # Object was updated
                return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

```

## Investigation
I debugged the code but it was working as expected so I suspected that it might be the result of a [race condition](https://en.wikipedia.org/wiki/Race_condition), where two incoming requests clash.
The system receives two duplicate objects as two simultaneous requests:
1. checks the first one
2. find no duplicates
3. checks the second
4. finds no duplicates again[^2]
5. creates the first object
6. creates the second object

## Solution
After studying about race condition, atomic transactions, and some relevant Django conventions I figured there is more than one solution to this problem, such as:
- using [select_for_update](https://docs.djangoproject.com/en/5.0/ref/models/querysets/#select-for-update)
- locking mechanisms[^3]
  - [Django docs](https://docs.djangoproject.com/en/5.0/topics/db/transactions/#controlling-transactions-explicitly)
  - [stackoverflow](https://stackoverflow.com/questions/42520917/does-django-atomic-transaction-lock-the-database)
- rate limiting[^4]
  - [wiki](https://en.wikipedia.org/wiki/Rate_limiting)
- idempotent operation[^5]
  - [wiki](https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://en.wikipedia.org/wiki/Idempotence&ved=2ahUKEwicupLsuYuFAxXpXvEDHX12CdMQFnoECCgQAQ&usg=AOvVaw2tBKzMM7JWe5m8N5lGXEiY)
  - [dev.to](https://dev.to/ck3130/idempotence-and-post-requests-in-django-2bbf)
- concurrency control in front-end[^6]
- atomic database transactions[^7] - almost similar to the next option
- optimistic concurrency control [^8]
  - [wiki](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
  - [freecodecamp](https://www.freecodecamp.org/news/how-databases-guarantee-isolation/)

I eventually re-wrote my view to look like this:
```python
class ProductViewset(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        serial = serializer.validated_data["serial"]
        manufacturer = serializer.validated_data["manufacturer"]
        brand = serializer.validated_data["brand"]
        # enter a transaction block
        with transaction.atomic():
            # if it's new, create
            if not Product.objects.filter(
                serial=serial, manufacturer=manufacturer, brand=brand
            ).exists():
                self.perform_create(serializer)
                status_code = status.HTTP_201_CREATED
            else:  # if it already exists, update
                instance = Product.objects.get(
                    serial=serial, manufacturer=manufacturer, brand=brand
                )
                # update other fields
                for field, value in serializer.validated_data.items():
                    setattr(instance, field, value)
                instance.save()
                status_code = status.HTTP_200_OK

        return Response(serializer.data, status=status_code)
```
I did \*NOT\* implement unique constraints on database level.

## Takeaways
1. race condition is a possible risk and must be considered.
2. there are several solutions on how to handle the condition, choose based on specific requirements.

## Footnotes
[^1]: this constraint throws a `django.db.utils.IntegrityError` if you try to violate it by creating a duplicate instance.
[^2]: since the first object is still not saved in database.
[^3]: such as row-level locking or application-level locking to ensure that only one request can modify a resource at a time.
[^4]: enforcing rate limiting to prevent clients from sending too many requests within a short period, reducing the likelihood of race conditions occurring.
[^5]: where multiple identical requests have the same effect as a single request.
[^6]: to prevent users from submitting conflicting requests. e.g., disable UI elements while a request is in progress.
[^7]: by wrapping critical sections of your code in transactions, you can ensure that either all operations within the transaction succeed or none of them do.
[^8]: by adding a version or timestamp field to your model. When a resource is updated, the client must provide the current version/timestamp. Before applying the update, check if the provided version/timestamp matches the current one in the database. If they match, proceed with the update; otherwise, reject the request.
