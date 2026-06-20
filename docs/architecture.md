# Architecture

```mermaid
flowchart TB
  subgraph ClientApps["Client applications"]
    App["Product app"]
    SDK["TypeScript SDK\nlocal cache + local evaluation"]
  end

  subgraph Dashboard["React dashboard"]
    UI["Panels\nflags, rules, metrics, audit"]
    ApiClient["Dashboard API client\nDTO boundary"]
  end

  subgraph API["Feature Flag API"]
    Routes["HTTP routes\nconfig, flags, rules, segments, evaluate"]
    ConfigService["ConfigService\ncache read + invalidation"]
    AuditService["AuditService\nchange history"]
    Store["FlagStore interface"]
    Realtime["RealtimeHub\nWebSocket /stream"]
  end

  subgraph Domain["Shared domain package"]
    Evaluator["Evaluation engine\nrules + segments + rollout hash"]
  end

  subgraph Infra["Infrastructure"]
    Postgres[("PostgreSQL\nflags, segments, audit, metrics")]
    Redis[("Redis\nconfig cache + pub/sub")]
  end

  UI --> ApiClient
  ApiClient -->|REST| Routes
  Routes --> ConfigService
  Routes --> AuditService
  Routes --> Store
  Routes --> Evaluator

  Store --> Postgres
  ConfigService --> Redis
  ConfigService --> Store
  ConfigService -->|config_changed| Redis
  Redis -->|pub/sub| Realtime
  Realtime -->|WebSocket updates| SDK
  Realtime -->|WebSocket updates| UI

  App --> SDK
  SDK -->|GET /api/config| Routes
  SDK --> Evaluator
  SDK -->|isEnabled(flagKey)| App
```

## Request Flow

1. The dashboard uses its own API client and DTOs to call the backend.
2. The API validates requests in route modules and delegates business work to services.
3. Flag configuration is read through `ConfigService`, which checks Redis first and falls back to the store.
4. Mutations update the store, write an audit entry, invalidate cache and publish a `config_changed` event.
5. WebSocket subscribers receive the update and refresh their local config.
6. The SDK downloads config, caches it, and evaluates flags locally with the shared evaluator.

## Module Boundaries

- `apps/dashboard`: presentation + frontend DTOs + API client only.
- `apps/api`: HTTP routes, services, storage adapters and realtime infrastructure.
- `packages/shared`: pure evaluation logic and backend/SDK domain types.
- `packages/sdk`: public client used by product applications.

## Consistency Model

Writes are durable in PostgreSQL. Cache and SDK clients converge through Redis invalidation and WebSocket updates. If streaming is unavailable, the SDK still refreshes config on TTL expiration.
