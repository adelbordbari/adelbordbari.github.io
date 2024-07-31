---
title: "Race Condition in DRF"
layout: "post"
---

## Table of Contents
- [Situation](#situation)


---

## Takeaways
1. race condition is a possible risk and must be considered.
2. there are several solutions on how to handle the condition, choose based on specific requirements.

## Footnotes
[^1]: this constraint throws a `django.db.utils.IntegrityError` if you try to violate it by creating a duplicate instance.
