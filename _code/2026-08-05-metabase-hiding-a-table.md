---
title: "When Metabase Could See a ClickHouse Table but Refused to Browse It"
layout: "post"
---

## Table of Contents

- [Background](#background)
- [The symptom](#the-symptom)
- [The misleading part](#the-misleading-part)
- [The real problem](#the-real-problem)
- [Understanding what happened](#understanding-what-happened)
- [The fix](#the-fix)
- [Making it permanent](#making-it-permanent)
- [Takeaways](#takeaways)
- [Footnotes](#footnotes)

---

## Background

Adding a new ClickHouse table should have been boring.

We introduced a new table called `system_logs`, the stack was writing to it correctly, and ClickHouse happily listed it:

```sql
SHOW TABLES;
```

Everything looked healthy.

Except Metabase.

The table simply refused to appear under **Explore**.

---

## The symptom

At first glance it looked like a ClickHouse problem.

Maybe the table hadn't been created correctly.

Maybe Fluentd had created it differently.

Maybe Metabase's synchronization hadn't run yet.

But none of those turned out to be true.

Searching directly for the table worked.

Browsing the schema did not.

That tiny inconsistency ended up being the biggest clue.

---

## The misleading part

The first instinct was to investigate the data pipeline.

Was Fluentd creating the table differently?

Did the ClickHouse driver ignore some engines?

Was synchronization failing?

None of that explained why a direct lookup could find `system_logs` while the schema browser still behaved as if the table didn't exist.

That suggested the problem wasn't in ClickHouse at all.

It was somewhere inside Metabase.

---

## The real problem

Metabase doesn't read the database schema every time you open Explore.

Instead, it keeps its own metadata inside its application database (MariaDB in our case).

During synchronization, the ClickHouse driver had imported internal ClickHouse schemas like

```
INFORMATION_SCHEMA
information_schema
system
```

alongside user schemas.

Those internal schemas shouldn't really participate in normal browsing, but they had already been written into Metabase's metadata.

Unfortunately, Metabase indexes tables by

```
(db_id, schema, name)
```

and those duplicate/case-variant internal schemas polluted the metadata used by the Browse endpoint.

The result was surprisingly subtle:

- direct table lookup could resolve `system_logs`
- schema browsing kept serving an outdated table list

So ClickHouse wasn't lying.

Metabase's cached metadata was.

---

## Understanding what happened

The interesting part is that nothing was actually wrong with the table itself.

The metadata path and the lookup path weren't behaving the same way.

One endpoint effectively asked:

> "Does this table exist?"

The other asked:

> "Show me every table in this schema."

Because those code paths relied on different metadata, only one of them reflected reality.

Once we understood that, repairing ClickHouse itself no longer made sense.

The metadata had become the problem.

---

## The fix

The repair ended up being fairly small.

First, we removed Metabase metadata belonging to ClickHouse's internal schemas.

Then we rebuilt the `metabase_table` indexes so the metadata became internally consistent again.

Finally, we replaced the ClickHouse driver with a patched version that simply stops synchronizing those internal schemas in the first place.

Once synchronization ran again, `system_logs` immediately appeared in Explore without any manual table repair.

---

## Making it permanent

Initially it was tempting to add another startup script specifically for `system_logs`.

That would've solved today's problem.

It also would've guaranteed another repair script for the next table.

Instead, startup now seeds Metabase metadata generically.

Every ClickHouse table defined in the shared table definition is synchronized automatically, regardless of whether it's an existing table or one added months later.

That keeps the startup logic independent of individual table names and avoids accumulating one-off maintenance scripts over time.

---

## Takeaways

1. When two UI paths disagree, they're often reading different metadata.
2. Database synchronization bugs are sometimes metadata bugs rather than database bugs.
3. Internal system schemas are rarely useful in analytics tools and are often better excluded entirely.
4. Generalizing startup logic is usually a better long-term fix than adding another repair script.
5. Sometimes the healthiest database is the one whose cache is broken.

---

## Footnotes

[^1]: The table itself existed the entire time. Only Metabase's metadata became inconsistent.

[^2]: Preventing the driver from syncing ClickHouse internal schemas removes the root cause instead of repeatedly repairing the symptoms.
