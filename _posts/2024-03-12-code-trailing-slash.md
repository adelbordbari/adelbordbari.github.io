---
title: "code | Trailing Slash"
layout: "post"
---

## Table of Contents
1. [Situation](#Situation)
2. [Expectation](#Expectation)
3. [Problem](#Problem)
4. [Investigation](#Investigation)
5. [Solution](#Solution)
6. [References](#References)

## Situation
I have two endpoints in the Django rest framework[^1] that do almost the same thing. check if a user's credentials are correct. the difference is that one of them works with the typical username/password pair, but the other one checks the validity of the OTP code[^2]. the code for both functions looks pretty similar except the validation part.

```python
class CheckPasswordView(APIView):
	# to show the fields in browsable API
    serializer_class = CheckPasswordSerializer
    def post(self, request):
        serializer = CheckPasswordSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data["phone_number"]
            password = serializer.validated_data["password"]
			# unlike request data, empty serializer data is blank, and not None
            if phone_number == "" or password == "":
                return Response(
                    {"error": "phone_number and/or password not provided"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                user = CustomUser.objects.get(phone_number=phone_number)
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "user not found"}, status=status.HTTP_404_NOT_FOUND
                )
			# the code is the same for both so far
			# the next section, however, is a bit different for OTP
			# where it checks both the token and the expiration date
			# and also returns the status for valid, expired, or incorrect tokens			
            if not user.check_password(password):
                return Response(
                    {"error": "password is incorrect"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # user found with correct password. login the user
            token_pair = generate_jwt_tokens(user)
            return Response(token_pair, status=status.HTTP_200_OK)
        else:  # invalid serializer, also the same in both
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

```

## Expectation
I want these errors to be handled:
1. either of the inputs is empty (or both are)
2. username does not exist
3. entered password is incorrect
4. entered OTP is invalid, that is either
	1. incorrect token
	2. expired token (despite being correct)

### check-password
- at `/check-password`
- receives: username and password
- returns: if the password is correct

### check-otp
- at `/check-otp`
- receives: username and otp
- returns: if the token is valid or invalid (incorrect / expired)

## Problem
The second endpoint (`check-otp`) works fine, both in browsable API[^3] and Postman<i class="fa-solid fa-user-astronaut"></i>. but the first endpoint works only in browsable API. I get an HTML page (as the result of an unhandled error) in Postman that looks like this:

```html
<div id="summary">
	<h1>RuntimeError at /one/two/check-password</h1>
	<pre class="exception_value">
You called this URL via POST, but the URL doesn&#x27;t end in a slash and you have APPEND_SLASH set. Django can&#x27;t redirect to the slash URL while maintaining POST data. Change your form to point to 127.0.0.1:8000/one/two/check-password/ (note the trailing slash), or set APPEND_SLASH=False in your Django settings.</pre>
	<table class="meta">
		<tr>
			<th>Request Method:</th>
			<td>POST</td>
		</tr>
		<tr>
			<th>Request URL:</th>
			<td>http://127.0.0.1:8000/one/two/check-password</td>
		</tr>

		<tr>
			<th>Django Version:</th>
			<td>4.1.3</td>
		</tr>

		<tr>
			<th>Exception Type:</th>
			<td>RuntimeError</td>
		</tr>

		<tr>
			<th>Python Version:</th>
			<td>3.11.4</td>
		</tr>
		<tr>
			<th>Server time:</th>
			<td>Tue, 12 Mar 2024 05:36:40 +0000</td>
		</tr>
	</table>
</div>
```

## Investigation
I looked into Stackoverflow and found some useful answers. the problem was that my faulty URL didn't have a slash at the end. I basically changed 
A trailing slash is a forward slash placed at the end of a URL. the decision to use a trailing slash or not can impact SEO, since including or excluding it can lead to different versions being indexed. whatever that decision is, it's important to stay consistent and use `301 Redirect` methods to avoid duplicate content.[^5] it semantically indicates a resource[^6].
You can write your preferred way of handling trailing slash in `settings.py` and using `APPEND_SLASH`, which is set to `True` by default in Django[^7]. another solution is to use the `trailing_slash` argument when defining your router, i.e., `router = SimpleRouter(trailing_slash=False)`.

## Solution
I tweaked my URL patterns, as the error message said, I used the slash URL in POST requests and it worked as expected.

before:
```python
path("one/two/check-otp", CheckOTPView.as_view(), name="check-otp"),
path("one/two/check-password/", CheckPasswordView.as_view(), name="login"),
```

after:
```python
path("one/two/check-otp", CheckOTPView.as_view(), name="check-otp"),
path("one/two/check-password", CheckPasswordView.as_view(), name="login"),
```

## Takeaway
1. beware of trailing slashes. be explicit about it. have a consistent and uniform approach towards it, in `urlconf` or anywhere else
2. take care of the url patterns, so that they look alike. that way, even if there's a malfunction, all of the endpoints will malfunction in the same manner so you can focus on the "real, logical, engineering" problem instead of a typo.
3. do not let two URLs (endpoint with and without trailing slash) serve the same page. it's sloppy, bad for crawlers, harder to maintain, harder to migrate to a new system, and not desirable for SEO either[^4].
4. by default URLs without the trailing slash are redirected to the URL with the trailing slash
5. during this redirection (from `/path` to `/path/`), the data of the POST request is lost

## References
[^1]: [Django rest framework](https://www.django-rest-framework.org)
[^2]: [OTP](https://en.wikipedia.org/wiki/One-time_password)
[^3]: [Browsable API](https://www.django-rest-framework.org/topics/browsable-api)
[^4]: [https://stackoverflow.com/questions/1596552/django-urls-without-a-trailing-slash-do-not-redirect](https://stackoverflow.com/questions/1596552/django-urls-without-a-trailing-slash-do-not-redirect)
[^5]: [Trailing Slash](https://searchfacts.com/url-trailing-slash/)
[^6]: [https://stackoverflow.com/questions/30580562/what-is-the-difference-between-resource-and-endpoint](https://stackoverflow.com/questions/30580562/what-is-the-difference-between-resource-and-endpoint)
[^7]: [https://stackoverflow.com/questions/45784191/django-is-append-slash-set-to-true-even-if-not-in-settings-py](https://stackoverflow.com/questions/45784191/django-is-append-slash-set-to-true-even-if-not-in-settings-py)
