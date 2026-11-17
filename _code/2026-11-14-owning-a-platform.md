---
title: "Running a Django Stack on a Single VPS"
layout: "post"
---

## Situation

Over the past year, I've been developing and operating the backend and infrastructure for a web and mobile application.

The team includes Next.js and Flutter developers, a designer, and a marketing person. My responsibilities cover the Django backend, database, infrastructure, deployment, networking, security, and production operations. The frontend developers handle their application code, while I manage how those applications are built, deployed, and served.

The system currently runs on a single VPS with:

- 4 vCPU
- 7.8 GiB RAM
- Ubuntu Linux
- Docker Compose
- Django and Django REST Framework
- Gunicorn
- PostgreSQL
- Nginx
- Next.js and Flutter Web
- Prometheus, Grafana, Loki, and exporters

The application has around 100 registered users, although traffic is still relatively low.

At this stage, there was no reason to start with a distributed infrastructure. The codebase was small, the number of users was limited, and the priority was keeping the system reliable without introducing unnecessary operational complexity.

The main challenge was making several different services work together on one machine while keeping deployment, resource usage, and production changes under control.

---

## Problem

Running everything on one VPS is simple until the services start competing for resources or interfering with each other.

The server hosts:

- A Django REST API
- A PostgreSQL database
- A Next.js application
- Flutter Web builds and Android APK downloads
- Development and production environments
- Background reporting processes
- Monitoring and logging services

All of these share the same CPU, memory, disk, and Docker daemon.

A bad deployment can affect real users. A resource-intensive container can interfere with other services. A misconfigured reverse proxy can break several applications at once.

The infrastructure needed to provide:

1. Separation between development and production.
2. Predictable resource usage.
3. Centralized routing and HTTPS.
4. Repeatable deployments.
5. Database persistence and backups.
6. Authentication and authorization enforced by the backend.
7. Enough monitoring to investigate problems.
8. A way to measure performance instead of guessing about capacity.

I wanted these capabilities without introducing orchestration or infrastructure components that the application didn't yet need.

---

## Architecture

The backend is a Django modular monolith using Django REST Framework.

The application is organized into models, serializers, views, permissions, services, management commands, and tests. Different areas have their own logic, but they share one Django deployment and one PostgreSQL database.

The infrastructure uses Docker Compose to manage the application services.

At a high level, requests follow this path:

```text
                       ┌── Django / Gunicorn
                       │         │
                       │         └── PostgreSQL
                       │
Clients ── Nginx ──────┼── Next.js
                       │
                       ├── Flutter Web / APK files
                       │
                       └── Grafana
```

Nginx is the public entry point.

It terminates HTTPS, routes API requests to Django, forwards frontend requests to Next.js, and serves Flutter's compiled static files directly.

Django static and media files are also served through Nginx using shared Docker volumes.

This keeps static file delivery outside the Django request path.

PostgreSQL runs in its own container, with persistent storage and access restricted to the internal Docker network.

The application also depends on external providers for services such as SMS, payments, and AI. These are separate from the infrastructure running on the VPS.

### Docker networking

The Compose configuration defines separate internal and public bridge networks.

PostgreSQL is attached to the internal network and does not publish a database port on the host.

Services that need to communicate with the database can do so through Docker networking without making PostgreSQL directly accessible from outside.

The public-facing components are reached through Nginx.

I also configured container health checks, restart policies, process limits, and CPU and memory limits.

The goal wasn't to squeeze every available resource out of the server. I wanted one component to be less likely to consume resources needed by the others.

---

## Resource Management

With only four vCPUs and approximately 8 GiB of RAM, resource allocation matters.

I conducted an earlier audit simulating the standard activity of 50 users and used those observations to guide the container resource configuration.

Docker Compose allows limits and reservations to be defined per service.

For example, the production configuration allocates:

| Component | CPU limit | Memory limit |
|---|---:|---:|
| Django | 1.5 vCPU | 768 MiB |
| PostgreSQL | 1.5 vCPU | 1 GiB |
| Next.js | 1 vCPU | 512 MiB |
| Nginx | 0.5 vCPU | 256 MiB |

These aren't dedicated CPU allocations. They constrain how much CPU time individual containers can consume.

The limits also don't mean all services can simultaneously use their maximum configured CPU shares without contention.

Memory reservations, process limits, restart policies, and shutdown grace periods provide additional runtime controls.

The monitoring containers have their own limits as well.

This became particularly important after introducing the observability stack, because monitoring itself consumes resources on the same machine it's observing.

---

## Development and Production

I didn't have a separate development environment from the beginning.

Initially, the application was small enough that deployment was relatively straightforward. Once we had real users, the situation changed.

Both the Flutter and Next.js developers needed somewhere to test their applications against the Django backend before releasing changes.

More importantly, I didn't want integration problems to appear for the first time in production.

I introduced a development environment on the same VPS.

Development and production use separate:

- Django containers
- Next.js containers
- PostgreSQL instances
- Docker networks
- Persistent volumes
- Environment configurations

They also use separate Git worktrees.

The two environments still share the host, Docker daemon, and part of the ingress infrastructure. This is environment separation, not complete infrastructure isolation.

The development workflow is fairly simple.

The Next.js developer works on a feature branch, pushes changes, and creates a pull request targeting the development branch. I deploy the development version and make it available for testing.

If integration checks pass, the changes can be promoted to production.

Flutter follows a slightly different process because I'm serving its compiled build.

The Flutter developer provides the generated static files. I first serve them in development, verify that the frontend works with the API, and then update the production build.

This gives us a place to check the integration of the three stacks without immediately affecting production users.

---

## CI and Deployment

GitHub Actions runs continuous integration checks.

The workflow includes:

- Docker Compose and deployment configuration checks
- Django tests against PostgreSQL
- Django image builds
- Next.js tests and linting
- Next.js image builds

I originally intended to automate deployment as well, but other priorities came up, so I postponed that part.

For now, deployment remains a manual operation using scripts on the server.

This is an important distinction: GitHub Actions handles CI, while production deployment is explicitly initiated by me.

The production deployment script performs several checks before replacing the running application.

The process is approximately:

```text
Verify repository and branch
          │
          ▼
Validate configuration and secrets
          │
          ▼
Build and verify application image
          │
          ▼
Run Django deployment checks
          │
          ▼
Create database backup
          │
          ▼
Apply database migrations
          │
          ▼
Recreate application containers
          │
          ▼
Verify container health
          │
          ▼
Reload Nginx
          │
          ▼
Run HTTPS smoke tests
```

The script also checks that the production database and Nginx containers weren't unintentionally recreated during the application deployment.

The deployment isn't atomic or zero-downtime. Recreating the only Django container can cause a short interruption, and rollback is not fully automated.

For the current scale, I have accepted those limitations rather than introducing a more complex release system prematurely.

The objective is to make the existing deployment process controlled and repeatable.

---

## Backend Design and Data Integrity

The Django backend exposes versioned REST APIs through Django REST Framework.

Most requests are handled synchronously through Gunicorn.

PostgreSQL is responsible for persistent application data, and several operations use database transactions to maintain consistency.

One example is handling concurrent changes to records with limited available capacity.

The backend uses transactions, row-level locks, and database-side updates where concurrent requests could otherwise produce conflicting results.

Payment initiation has additional safeguards.

The implementation uses idempotency keys, request fingerprints, persisted operation state, and PostgreSQL advisory locks.

The purpose is to avoid creating duplicate operations or blindly repeating requests when the result of an external payment interaction is uncertain.

These mechanisms were mostly preventive. I didn't wait for a duplicate-payment incident before implementing them.

### Background processing

Not every operation needs to execute during an HTTP request.

The application has a separate reporting worker that processes persisted events.

Instead of using Redis and Celery, the worker stores its work in PostgreSQL and periodically checks for pending records.

It uses persisted delivery state, bounded retries, and locking to coordinate processing.

This means pending reporting work can survive a worker restart without requiring another message broker.

I haven't introduced Redis or Celery yet.

Part of the reason is practical: I would need to learn and maintain them, and the current workload hasn't justified that additional complexity.

If background processing requirements grow, I can reconsider that decision.

For now, PostgreSQL and a dedicated worker are enough for the reporting requirements I've implemented.

---

## Authentication and RBAC

Role-based access control was one of the more time-consuming parts of backend development.

Most of the difficulty came from defining requirements and coordinating the expected behavior between different parts of the application.

There was also an important technical issue.

Initially, I mostly thought about API usage through the Flutter application.

The frontend only called endpoints that were part of its implemented workflows, so unauthorized API access wasn't as visible as a problem during early development.

But the frontend is not an authorization boundary.

Anyone who can reach an HTTP endpoint can attempt to call it directly, regardless of whether the Flutter application exposes that operation.

The backend must decide whether the authenticated user is allowed to perform the requested action.

I implemented role-based and object-level permission checks in Django to enforce those rules at the API layer.

The application also uses JWT authentication, refresh-token rotation, and token blacklisting.

Sensitive endpoints have additional rate controls through Nginx and, in some cases, application-level checks.

The important change was treating authorization as a backend responsibility rather than relying on how the frontend happens to use the API.

---

## Security

At one point, the VPS became unresponsive and the Docker services were down.

While investigating, I checked SSH sessions and found an unexpected user account and a file associated with a known cryptocurrency miner.

The server had been compromised and its resources were being used for mining.

After that incident, I tightened the host and application security configuration.

The current setup includes controls such as:

- SSH key authentication
- Disabled SSH password and root login
- fail2ban
- Docker network isolation
- Non-root application containers
- Dropped container capabilities where possible
- Production secret validation
- TLS and HTTP security headers
- Sensitive endpoint rate limiting

I also introduced checks around secret handling and authentication configuration.

I didn't establish enough evidence to document the exact initial entry point of the compromise, so I wouldn't attribute it to a particular vulnerability.

The experience changed how I approached operating the server.

Security controls that had seemed less urgent during initial development became part of the deployment and operations workflow.

---

## Observability

Once multiple application and infrastructure services were running on the same machine, investigating problems through individual container logs became less convenient.

I introduced a monitoring stack built around:

- **Prometheus** for collecting metrics
- **Grafana** for dashboards
- **Loki** for log storage
- **Promtail** for log collection
- **Node Exporter** for host metrics
- **cAdvisor** for container metrics
- **PostgreSQL Exporter** for database metrics
- **Blackbox Exporter** for HTTP availability checks

Nginx produces structured logs with request and upstream timing information.

This makes it possible to investigate whether slow responses are associated with the reverse proxy, application processing, or broader resource pressure.

The monitoring configuration also includes metrics and checks for database availability, container resources, disk usage, and application health.

Alert rules exist, although external alert delivery hasn't been implemented yet.

The monitoring stack provides visibility into the running system, but it doesn't eliminate the underlying single-machine failure risks.

---

## Load Testing

After the application was deployed, I wanted to understand how much traffic the existing infrastructure could handle.

There wasn't a major performance problem driving the test.

I was mainly interested in measuring the system rather than relying on assumptions about capacity.

I used k6 to generate traffic through the public HTTPS and Nginx request path.

The workload included application APIs while excluding operations involving paid external services, such as payments, SMS, and AI.

Monitoring endpoints were also excluded from the application workload.

Because real users weren't generating enough activity to establish reliable traffic patterns, the workload was synthetic rather than a statistically validated reproduction of production traffic.

The load generator ran on the same VPS, so its resource usage could also influence the measurements.

### Gunicorn worker comparison

I compared configurations with three and four Gunicorn workers.

The recorded results at approximately 80 requests per second were:

| Metric | 3 workers | 4 workers |
|---|---:|---:|
| Throughput | 80.09 req/s | 80.10 req/s |
| p95 latency | 66 ms | 90 ms |
| p99 latency | 169 ms | 296 ms |
| Failed requests | 0 | 0 |

Both configurations handled the tested request rate without reported failures.

Adding a fourth worker didn't improve throughput in this comparison.

It increased p95 latency by approximately 36% and p99 latency by approximately 75%.

I kept the three-worker configuration.

This doesn't establish that three workers are universally optimal. The comparison would need repeated controlled runs to establish how consistent the difference is.

It also doesn't establish the server's maximum throughput.

The result demonstrates that the application handled the tested short-duration workload at approximately 80 requests per second.

A planned 20-minute soak test at that rate was skipped because the server was receiving real traffic.

Therefore, sustained capacity at 80 requests per second remains unverified.

The original raw evidence for this particular worker comparison is no longer available, so the published numbers should be understood as recorded test results rather than an independently reproducible benchmark.

### What I learned

The main result was that the existing infrastructure could handle a much higher request rate than the application currently experiences.

It also showed that increasing Gunicorn's worker count wasn't automatically beneficial.

The test gave me more confidence in the current configuration, but it didn't provide a reason to introduce Redis, Celery, horizontal scaling, or additional servers.

Those decisions should depend on actual bottlenecks and operational requirements.

---

## Current Limitations

The infrastructure is intentionally simple, but that comes with limitations.

### Single point of failure

The application, database, frontend, and monitoring services share one VPS.

If the machine fails, the entire system can become unavailable.

Container restart policies help recover from process failures, but they don't provide high availability.

### Shared development and production resources

Development and production have separate containers, databases, networks, and volumes.

However, they still compete for the same physical resources.

This works at the current scale but would need to change if resource contention became a recurring problem.

### Deployment downtime

Production deployment is controlled through scripts, but it isn't atomic.

There is one Django application instance, and replacing it can interrupt active requests.

Automated deployment and rollback remain future improvements.

### Capacity

The load test verified short-duration throughput under a particular workload.

It didn't establish sustained capacity, maximum throughput, or how the infrastructure would behave under a much larger database or different traffic distribution.

These are questions for future testing rather than conclusions I can draw from the current results.

### Background processing

The PostgreSQL-backed worker is sufficient for current reporting tasks.

It isn't intended to replace a dedicated task-processing architecture for every workload.

If task volume, execution time, or reliability requirements increase, Redis and Celery may become worth introducing.

---

## Takeaways

A year of building and operating this system changed how I think about backend infrastructure.

A few things became clear.

**Start with the requirements you actually have.**

The application didn't need Kubernetes, multiple application servers, or a distributed database when it launched.

Docker Compose and a single VPS were enough to support the initial requirements.

**Production changes need boundaries.**

Development and production separation became important once real users depended on the application.

The same applies to deployment checks, database migrations, and access permissions.

**The backend must enforce its own rules.**

Frontend behavior isn't a security boundary. Authentication, authorization, transaction consistency, and idempotency belong in the backend.

**More processes don't necessarily mean more throughput.**

The Gunicorn comparison was a useful reminder that configuration changes should be measured instead of assumed to improve performance.

**Monitoring and testing answer different questions.**

Monitoring helps explain what the system is doing during operation.

Load testing helps examine how it behaves under a controlled workload.

Neither replaces the other, and neither automatically proves reliability.

**Infrastructure complexity should have a reason.**

Adding more services creates additional things to deploy, secure, monitor, debug, and maintain.

That cost is justified when the new component solves a problem that the existing architecture cannot handle adequately.

---

## Final Notes

The current setup isn't intended to be a final architecture.

It is a single-server deployment supporting a relatively small application and a limited number of users.

Over time, I added environment isolation, deployment safeguards, authorization controls, monitoring, backups, and performance testing as the operational requirements became clearer.

There are still areas to improve, especially recovery, deployment automation, and sustained capacity testing.

If traffic and background processing requirements grow, I'll reconsider components such as Redis and Celery, and eventually the separation of services across machines.

For now, I prefer to improve and measure the existing system before adding more infrastructure.

The objective isn't to use as many technologies as possible. It's to understand what the system needs, implement it, and know where its limits are.