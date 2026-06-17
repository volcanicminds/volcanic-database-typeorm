# CLAUDE.md — @volcanicminds/typeorm

> Pacchetto npm `@volcanicminds/typeorm` (v2.3.x). Wrapper su **TypeORM 0.3.x** che traduce
> query-string HTTP in query TypeORM (filtri/sort/paginazione/logica booleana) — le **"Magic Query"** —
> più gestione connessione, autodiscovery entità e **multi-tenancy** Postgres via `search_path`.
> Usabile standalone o integrato in `@volcanicminds/backend` (vedi ecosistema nel CLAUDE.md del backend).

## Stack & convenzioni

- **Node >= 24**, **ESM puro** (`NodeNext`), import con estensione `.js`. Sorgente in `lib/`, entry `index.ts`, build `tsc` → `dist/`.
- Dipende da: `typeorm`, `pg` (driver implicito), `bcrypt`, `pluralize`, `reflect-metadata`, `glob`.

## Comandi

```bash
npm run build        # tsc -> dist/
npm run type-check   # tsc --noEmit
npm run lint         # eslint .  (lint:fix)
npm run check-all    # lint + type-check  <-- prima di committare
# NB: NON esiste `npm test`. C'è solo test/demo.test.js (smoke). Nessuna CI.
node generate-hash.js <stringa>   # genera hash bcrypt (password/test)
```

## API pubblica (da `index.ts`)

- `start(options)` — inizializza il `DataSource`, autocarica entità/repository, popola i globals. `options` accetta tutte le opzioni TypeORM + `sensitiveFields`, `cacheTimeout` (def 30000ms), `logging`.
- Traduzione query: `applyQuery(data, extraWhere, repo)` (core), `useWhere`, `useOrder`, `executeFindQuery(repo, relations, data, extraWhere, extraOptions)` (high-level find+count+headers), `executeCountQuery`, `executeFindView`/`executeCountView` (per `@ViewEntity`), `configureSensitiveFields`.
- Entità base esportate: `User`, `Tenant`, `Token`, `Change`. Manager: `userManager`, `tokenManager`, `dataBaseManager`, `TenantManager`. `DataSource` ri-esportato.

## Magic Query — sintassi

`campo:operatore=valore`; default (nessun operatore) = uguaglianza. Suffisso `i` = case-insensitive (ILIKE).
Operatori: `:eq :neq :eqi :gt :ge :lt :le :in :nin :overlap :between :null :notNull :contains[i] :ncontains[i] :starts[i] :ends[i] :like[i] :raw`.
- **Relazioni** con dot-notation: `?company.name:eq=Acme` (la relazione dev'essere joinata).
- **Paginazione** `page`/`pageSize` (def 1/25) → header risposta `v-page v-pageSize v-count v-total v-pageCount`.
- **Sort** `?sort=field:desc&sort=other:asc`.
- **Logica booleana** `_logic` con alias: `?status:eq[a]=active&country:eq[b]=IT&_logic=(a AND b) OR ...`. Parsing in `lib/query/parser.ts` (→ AST), build in `lib/query/builder.ts`.

## Sicurezza (decisioni architetturali, NON aggirare)

- **`global.repository.X` è VIETATO**: `index.ts` lo avvolge in un `Proxy` che lancia errore FATAL. Imporre sempre il pattern **context-aware** `service.use(req.db)` (multi-tenant safe). Questo è il cambiamento più importante della v2.x — la doc/llms.txt potrebbe ancora mostrare il vecchio accesso diretto: **vince il codice**.
- **`:raw` disabilitato di default** (rischio SQL injection): abilitabile solo con `VOLCANIC_CUSTOM_QUERY_OPERATORS=true`. Usare con estrema cautela.
- **Sensitive fields** bloccati nei filtri di default: `['password','mfaSecret','resetPasswordToken','confirmationToken']` (override via `sensitiveFields`).
- **Prototype pollution / ReDoS**: tutte le chiavi passano da `hasProtoRisk` in `lib/query.ts`; identificatori non validi vengono rifiutati.

## Multi-tenancy (Unified Context Pattern)

Isolamento via Postgres `search_path`. **Switch di contesto globale vietato**: passare sempre un `EntityManager` (da un `QueryRunner`).

```typescript
// ❌ tenantManager.switchContext(tenant)
// ✅
const qr = dataSource.createQueryRunner()
await tenantManager.switchContext(tenant, qr.manager)
// Job in background:
await tenantManager.runInTenantContext('tenant-id', async (em) => { /* isolato */ })
```
Con multi-tenant abilitato, `DB_SYNCHRONIZE_SCHEMA_AT_STARTUP` viene ignorato.

## Env rilevanti

`LOG_DB_LEVEL` (def `warn`; mappa su livelli TypeORM), `LOG_COLORIZE`, `DB_SYNCHRONIZE_SCHEMA_AT_STARTUP` (def false), `VOLCANIC_CUSTOM_QUERY_OPERATORS` (def false). Dettagli in `docs/configuration.md`.

## File chiave

`index.ts` (start + Proxy globals), `lib/query.ts` (motore, `reservedOperators`, `hasProtoRisk`),
`lib/query/parser.ts` + `lib/query/builder.ts` (logica `_logic`), `lib/loader/*` (entità/repo/tenant/user/token manager), `lib/entities/*` (User/Tenant/Token/Change), `lib/util/crypto.ts`.
