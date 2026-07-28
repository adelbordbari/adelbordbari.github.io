---
title: "ClickHouse Recovery After Disk Corruption"
layout: "post"
---

## Table of Contents

- [Situation](#situation)
- [Problem](#problem)
- [Solution](#solution)
- [Takeaways](#takeaways)
- [Footnotes](#footnotes)

---

# Situation

A few weeks ago, one of our production servers experienced an unexpected power outage. After power was restored, the application itself came back online, but something felt off.

The dashboard still showed a healthy events-per-second (EPS) rate, yet new logs were no longer appearing. At first glance everything looked normal—the containers were running, the web interface was accessible, and there were no obvious failures visible from the application.

The first real clue came from Fluentd. Instead of running normally, it was continuously restarting because it couldn't initialize its ClickHouse output.

Following that trail eventually led to a much deeper problem than a failed container.

---

# Problem

ClickHouse refused to load one of the largest tables in the database.

The error wasn't a corrupted database in the traditional sense. Instead, ClickHouse detected **153 suspicious or broken data parts**, exceeding its configured safety threshold of 100.

Rather than automatically deleting a large number of parts and potentially causing irreversible data loss, ClickHouse refused to attach the table altogether.

This behavior turned out to be exactly what protected the remaining data.

Unfortunately, that wasn't the only issue.

Looking through the kernel logs revealed repeated ATA **uncorrectable media errors**. The disk itself had developed unreadable sectors, meaning this wasn't simply a metadata inconsistency caused by the abrupt shutdown. There was actual physical storage damage.

During recovery, every filesystem read failure belonged to the same ClickHouse table.

Some part directories couldn't be fully read. Others were missing files such as checksum metadata, serialization metadata, or compression information. The remaining ClickHouse tables showed no read failures.

At that point there were two separate problems:

- recovering the database without making the situation worse;
- determining whether the hardware itself was still trustworthy.

---

# Solution

The first decision was also the most important one:

**stop every writer immediately.**

There was no benefit in allowing Fluentd or the application to continue attempting writes while recovery was in progress.

The original ClickHouse data directory was preserved untouched as evidence.

Ideally, recovery would have been performed on another physical disk. Since one wasn't immediately available, I created **exactly one** low-priority working copy on the same machine, allowing unreadable filesystem entries to be skipped while logging every failure.

This copy became the recovery candidate.

Instead of experimenting on production data, the copied database was started inside an isolated Docker container with:

- no network connectivity;
- no exposed ports;
- the exact same ClickHouse version as production.

That allowed ClickHouse to perform its normal startup checks without risking accidental writes from any application.

On startup, ClickHouse quarantined **254 detached parts** marked as broken or obsolete.

At first that number looked alarming.

Fortunately, detached parts don't necessarily represent unique business data.

MergeTree continuously creates new merged parts while keeping superseded ones around temporarily. After inspecting the active block ranges, it became clear that the quarantined parts largely overlapped newer active merged parts.

The active table contained:

- more than **214 million rows**;
- approximately **6.6 GiB** of active data;
- continuous block coverage with no logical gaps.

Every table then passed `CHECK TABLE`, confirming that ClickHouse considered the recovered copy internally consistent.

Only after those checks completed successfully was the verified copy promoted into production.

The services were then restarted gradually:

1. ClickHouse
2. validation queries
3. Fluentd
4. the remaining application containers

Within seconds, new events started arriving again.

The dashboard was healthy—but this time, it was actually reflecting live ingestion.

---

# Takeaways

This incident reinforced several lessons that are worth documenting.

## A successful database recovery does not repair failing hardware

Recovering ClickHouse was only half of the incident.

The disk continued reporting uncorrectable media errors afterward.

Replacing the storage device became a much higher priority than celebrating a successful recovery.

---

## Always recover from a copy

Working directly on damaged production data removes your ability to retry.

Even though the recovery copy lived on the same physical disk, preserving the original untouched made every recovery step reversible.

---

## Detached parts are not automatically lost data

Seeing hundreds of detached ClickHouse parts can be frightening.

In this case, most represented obsolete merge inputs rather than unique rows.

Inspecting active block coverage told a much more accurate story than simply counting detached directories.

---

## Running containers don't necessarily mean a healthy pipeline

Every major service appeared to be running.

The dashboard even displayed a believable EPS value.

Neither actually proved that logs were being ingested.

Health monitoring should include metrics such as:

- latest event timestamp;
- Fluentd retries;
- insert failures;
- output buffer growth.

Otherwise it's easy to mistake stale data for live traffic.

---

## Backups must live somewhere else

Both the preserved original and the recovered copy existed on the same failing disk.

They protected against recovery mistakes—not hardware failure.

A proper backup strategy requires physically independent storage and periodic restore testing.

A backup that has never been restored is only an assumption.

---

## ClickHouse's safety mechanisms exist for a reason

It can be tempting to simply increase `max_suspicious_broken_parts` or force the table to attach.

Doing so would have hidden the underlying problem instead of solving it.

The safety limit forced investigation before potentially destructive cleanup occurred.

In hindsight, refusing to start was the safest possible behavior.

---

# Footnotes

1. During recovery, ClickHouse quarantined approximately **763 KiB** of detached parts. This should **not** be interpreted as confirmed business data loss. Those detached parts overlapped newer merged active parts, and no logical gaps were found in the recovered active block range.

2. While no logical data loss could be demonstrated, claiming **zero loss** would be inaccurate. One ClickHouse part directory was physically unreadable, and there was no independent backup available for comparison. The most accurate conclusion is that **all logically accessible data was recovered**, but absolute zero loss cannot be proven.

3. The stale EPS shown by the dashboard wasn't caused by ClickHouse or Fluentd. The application calculated the current rate from the last two stored samples without verifying their age, making historical values appear current after ingestion had already stopped.
