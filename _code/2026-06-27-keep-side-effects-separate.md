---
title: "Keep Side Effects Separate From Decision Logic"
layout: "post"
---

Imagine some code has to touch the real world. It calls a database, reads a file, hits an API, logs something, retries a request, etc. That's fine. Real software needs that.

But the small helper that *decides* something usually doesn't need to do any of that.

```python
def is_retryable_error(error):
    logger.info("checking retryability")
    config = read_config()
    client.ping_database()

    return isinstance(error, TimeoutError)
```

This function is supposed to answer a simple question: “is this error retryable?”

But now it also logs, reads config, and talks to the database. So testing it is harder, and it can fail for reasons that have nothing to do with the actual decision.

Better:

```python
def is_retryable_error(error):
    return isinstance(error, (TimeoutError, ConnectionError))
```

Then use it from the messy, on-the-edge real-world code:

```python
try:
    result = client.query(sql)      # side effect happens here
except Exception as error:
    if is_retryable_error(error):   # simple decision happens here
        retry()
    else:
        raise
```

This also fits nicely with [TDD](https://en.wikipedia.org/wiki/Test-driven_development).

You can write the small tests first:

```python
def test_timeout_is_retryable():
    assert is_retryable_error(TimeoutError()) is True

def test_value_error_is_not_retryable():
    assert is_retryable_error(ValueError("bad query")) is False
```

Then separately you test the actual integration path, where the query really runs and retry behavior matters.

I think this is one of those small design choices that does not look very impressive in code review, but saves a lot of pain later.

The goal isn't to avoid side effects, but to isolate them by putting side effects at the edges, and keep the boring decision code boring.
