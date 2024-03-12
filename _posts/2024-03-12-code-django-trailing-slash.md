---
title: "code/ django/ Trailing Slash"
layout: "post"
---

## Situation

## Problem
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
</div>```

## Solution

## Takeaway
