# Flagship: Feature Flag Platform

Plataforma estilo LaunchDarkly para activar features por usuario, pais, porcentaje, segmento y entorno. Incluye API, dashboard React, SDK TypeScript, cache Redis, persistencia PostgreSQL, auditoria, metricas y streaming por WebSocket.

## Stack

- API: Node.js, TypeScript, Fastify
- Storage: PostgreSQL con JSONB para documentos de configuracion
- Cache/eventos: Redis para config cache y pub/sub
- Dashboard: React + Vite
- SDK: TypeScript con evaluacion local y cache
- Infra local: Docker Compose

## Ejecutar rapido

```bash
npm install
npm run dev
```

La API corre en `http://localhost:4000` y el dashboard en `http://localhost:5173`.

Sin `DATABASE_URL`, la API usa datos en memoria para que se pueda probar inmediatamente. Con Docker usa PostgreSQL y Redis:

```bash
docker compose up --build
```

Dashboard Docker: `http://localhost:8080`.

## Demo incluida

Project key:

```txt
demo_project_key
```

Flag principal:

```txt
new-checkout
```

Reglas seed:

- `beta-testers`: 100%
- Colombia (`CO`): 5%
- Mexico (`MX`): 20%

## SDK

```ts
import { FeatureFlagClient } from "@flagship/sdk";

const flags = new FeatureFlagClient({
  apiKey: "demo_project_key",
  userId: "user_123",
  country: "CO",
  baseUrl: "http://127.0.0.1:4000"
});

if (await flags.isEnabled("new-checkout")) {
  showNewCheckout();
}
```

El SDK descarga la configuracion, evalua localmente con el mismo motor del backend y refresca la cache cuando recibe eventos por WebSocket.

## Endpoints principales

- `GET /health`
- `GET /api/config?apiKey=demo_project_key&environment=production`
- `GET /api/flags?projectKey=demo_project_key&environment=production`
- `POST /api/flags`
- `PATCH /api/flags/:id`
- `POST /api/flags/:id/rules`
- `POST /api/flags/:id/rollback`
- `POST /api/evaluate`
- `GET /api/metrics`
- `GET /api/audit`
- `GET /stream?projectKey=demo_project_key&environment=production`

## Decisiones de arquitectura

- Diagrama completo: [docs/architecture.md](docs/architecture.md)
- Evaluacion compartida en `packages/shared` para que API y SDK no diverjan.
- Hash FNV-1a deterministico para rollouts estables por usuario.
- Cache de configuracion por `projectKey + environment`.
- Invalidation + pub/sub para consistencia eventual entre instancias.
- Rollback instantaneo como operacion explicita que apaga flag y baja rollout a 0%.
- Audit log para cambios de flags, reglas y segmentos.
- Metricas de evaluacion por flag para observar adopcion.

## Scripts utiles

```bash
npm run test
npm run build
npm run typecheck
npm run docker:up
npm run docker:down
```
