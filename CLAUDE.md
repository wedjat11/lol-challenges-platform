# LoL Challenge Platform — Claude Code Context

## LEER ESTO PRIMERO

Este archivo es la fuente de verdad para Claude Code en este proyecto.
Antes de escribir cualquier código, leer las secciones relevantes completas.
Antes de crear cualquier archivo, verificar la estructura de módulos definida aquí.
Ante cualquier duda sobre una decisión técnica, la respuesta está en este archivo o en /docs.

---

## 1. Qué es este proyecto

Plataforma web de retos competitivos para jugadores de League of Legends.

Los usuarios pueden:

- Crear retos personalizados y enviarlos a otros jugadores
- Aceptar retos recibidos
- Completar retos automáticamente validados via Riot Games API
- Ganar monedas virtuales al completar retos
- Perder 1 moneda al crear y enviar un reto

La validación es 100% automática y asíncrona — nunca síncrona en el request HTTP.

---

## 2. Stack tecnológico — INAMOVIBLE

### Backend

- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS (TypeScript strict mode)
- **ORM**: TypeORM
- **Base de datos**: PostgreSQL 15
- **Cache / Queue**: Redis 7 + BullMQ
- **Auth**: JWT (access 15min) + httpOnly refresh cookie (7d)
- **Password hashing**: bcrypt (rounds: 12 prod, 10 dev)

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Estilos**: Tailwind CSS
- **Estado servidor**: TanStack Query (React Query)
- **Lenguaje**: TypeScript strict

### Infraestructura

- **Deploy**: Railway (backend + PostgreSQL + Redis en el mismo proyecto)
- **Región Riot API**: LA1 (Latin America North)
- **CI**: GitHub Actions

---

## 3. Arquitectura — principios no negociables

### Ownership de módulos (CRÍTICO)

Cada módulo es dueño exclusivo de sus tablas. Nadie más escribe en ellas.

| Módulo            | Tablas que posee                                           | Nunca escribe en                                |
| ----------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| auth/users        | users (identity fields), riot_accounts                     | coin_transactions, challenges                   |
| economy           | users.balance, coin_transactions                           | challenges, riot_accounts                       |
| challenges        | challenges, challenge_templates, challenge_validation_logs | coin_transactions, users.balance                |
| riot              | riot_api_cache (Redis only)                                | cualquier tabla PostgreSQL                      |
| validation-worker | ninguna (coordinador)                                      | escribe via servicios, nunca via repos directos |

### Regla de economía (CRÍTICO)

**NUNCA** modificar `users.balance` sin insertar simultáneamente en `coin_transactions`.
Ambas operaciones ocurren dentro de una transacción PostgreSQL atómica con `SELECT FOR UPDATE`.
Solo `EconomyService` puede escribir en estas tablas. Punto.

### Validación asíncrona (CRÍTICO)

La validación de retos NUNCA es síncrona.
`POST /challenges/:id/validate` → encola job en BullMQ → responde HTTP 202 inmediatamente.
El worker procesa el job de forma independiente.

### Controllers delgados (CRÍTICO)

Los controllers solo pueden:

1. Extraer datos del request
2. Llamar UN método de servicio
3. Retornar el resultado

Cero lógica de negocio en controllers. Sin excepciones.

---

## 4. Estructura del repositorio

```
lol-challenge-platform/
├── CLAUDE.md
├── docker-compose.yml
├── docker-compose.test.yml
├── docs/                          ← documentación completa del proyecto
│   ├── 01_architecture.docx
│   ├── 02_database_design.docx
│   ├── 03_api_contracts.docx
│   ├── 04_validator_guide.docx
│   ├── 05_infrastructure.docx
│   └── 06_developer_setup.docx
├── backend/
│   ├── src/
│   │   ├── main.ts                ← entrypoint API server
│   │   ├── worker.ts              ← entrypoint BullMQ worker (proceso separado)
│   │   ├── app.module.ts
│   │   └── modules/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── economy/
│   │       ├── challenges/
│   │       ├── validation/
│   │       │   └── validators/    ← un archivo por tipo de reto
│   │       └── riot/
│   ├── migrations/                ← TypeORM migrations (nunca auto-sync en prod)
│   ├── seeds/
│   ├── test/                      ← archivos e2e *.e2e-spec.ts
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/                   ← Next.js App Router
    │   ├── components/
    │   ├── lib/                   ← API client, utils
    │   └── hooks/                 ← TanStack Query hooks
    └── package.json
```

### Estructura interna de cada módulo NestJS

```
modules/nombre-modulo/
├── nombre-modulo.module.ts
├── nombre-modulo.controller.ts    ← HTTP adapter ONLY
├── nombre-modulo.service.ts       ← business logic
├── nombre-modulo.repository.ts    ← custom DB queries (si aplica)
├── dto/
│   ├── create-X.dto.ts
│   └── X-response.dto.ts
├── entities/
│   └── X.entity.ts
├── interfaces/
│   └── X.interface.ts
└── nombre-modulo.service.spec.ts  ← unit tests co-localizados
```

---

## 5. Esquema de base de datos completo

### ENUMs PostgreSQL (crear antes que las tablas)

```sql
CREATE TYPE auth_provider AS ENUM ('EMAIL', 'GOOGLE');

CREATE TYPE challenge_status AS ENUM (
  'PENDING_ACCEPTANCE', 'ACTIVE', 'COMPLETED',
  'FAILED', 'EXPIRED', 'CANCELLED'
);

CREATE TYPE coin_tx_type AS ENUM (
  'CHALLENGE_CREATED', 'CHALLENGE_COMPLETED', 'CHALLENGE_CANCELLED',
  'SIGNUP_BONUS', 'ADMIN_GRANT', 'ADMIN_DEDUCT'
);

CREATE TYPE validation_result AS ENUM ('PASS', 'FAIL', 'ERROR', 'DEFERRED');
```

### Tabla: users

```sql
CREATE TABLE users (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username         VARCHAR(50)  NOT NULL,
  email            VARCHAR(255) NOT NULL,
  password_hash    VARCHAR(255) NULL,           -- NULL para Google OAuth
  auth_provider    auth_provider NOT NULL DEFAULT 'EMAIL',
  google_id        VARCHAR(255) NULL,
  balance          INTEGER      NOT NULL DEFAULT 0,
  has_riot_account BOOLEAN      NOT NULL DEFAULT false,
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT users_email_unique    UNIQUE (email),
  CONSTRAINT users_username_unique UNIQUE (username),
  CONSTRAINT users_google_unique   UNIQUE (google_id),
  CONSTRAINT users_balance_non_neg CHECK (balance >= 0),
  CONSTRAINT users_google_id_required
    CHECK (auth_provider != 'GOOGLE' OR google_id IS NOT NULL)
);
```

### Tabla: riot_accounts

```sql
CREATE TABLE riot_accounts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puuid        VARCHAR(78) NOT NULL,
  game_name    VARCHAR(50) NOT NULL,   -- 'TOTO' de 'TOTO#LAN'
  tag_line     VARCHAR(10) NOT NULL,   -- 'LAN' de 'TOTO#LAN'
  region       VARCHAR(10) NOT NULL,   -- 'LA1'
  is_verified  BOOLEAN     NOT NULL DEFAULT false,
  verified_at  TIMESTAMPTZ NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT riot_accounts_user_unique  UNIQUE (user_id),
  CONSTRAINT riot_accounts_puuid_unique UNIQUE (puuid),
  CONSTRAINT riot_tag_line_format CHECK (tag_line ~ '^[A-Za-z0-9]{2,5}$'),
  CONSTRAINT riot_verified_timestamp CHECK (is_verified = false OR verified_at IS NOT NULL)
);
```

### Tabla: challenge_templates

```sql
CREATE TABLE challenge_templates (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  description    TEXT         NOT NULL,
  validator_key  VARCHAR(50)  NOT NULL,
  param_schema   JSONB        NOT NULL,
  reward_formula VARCHAR(200) NOT NULL,
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT templates_validator_key_unique UNIQUE (validator_key)
);
```

### Tabla: challenges

```sql
CREATE TABLE challenges (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID             NOT NULL REFERENCES users(id),
  target_id     UUID             NOT NULL REFERENCES users(id),
  template_id   UUID             NOT NULL REFERENCES challenge_templates(id),
  params        JSONB            NOT NULL,
  status        challenge_status NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
  reward_amount INTEGER          NOT NULL,
  expires_at    TIMESTAMPTZ      NULL,
  accepted_at   TIMESTAMPTZ      NULL,   -- inicio de ventana de validación (CRÍTICO)
  completed_at  TIMESTAMPTZ      NULL,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT now(),

  CONSTRAINT challenges_no_self_challenge CHECK (creator_id != target_id),
  CONSTRAINT challenges_reward_positive   CHECK (reward_amount > 0),
  CONSTRAINT challenges_accepted_at_when_active
    CHECK (status = 'PENDING_ACCEPTANCE' OR status = 'CANCELLED' OR accepted_at IS NOT NULL),
  CONSTRAINT challenges_completed_at_when_done
    CHECK (status != 'COMPLETED' OR completed_at IS NOT NULL),
  CONSTRAINT challenges_expires_after_creation
    CHECK (expires_at IS NULL OR expires_at > created_at)
);
```

### Tabla: coin_transactions (INMUTABLE — nunca UPDATE ni DELETE)

```sql
CREATE TABLE coin_transactions (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES users(id),
  amount         INTEGER      NOT NULL,     -- positivo=crédito, negativo=débito
  type           coin_tx_type NOT NULL,
  reference_id   UUID         NULL,
  reference_type VARCHAR(50)  NULL,
  balance_after  INTEGER      NOT NULL,     -- snapshot del balance tras esta tx
  notes          TEXT         NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT cointx_amount_nonzero         CHECK (amount != 0),
  CONSTRAINT cointx_balance_after_non_neg  CHECK (balance_after >= 0),
  CONSTRAINT cointx_reference_consistency
    CHECK (
      (reference_id IS NULL AND reference_type IS NULL) OR
      (reference_id IS NOT NULL AND reference_type IS NOT NULL)
    )
);
```

### Tabla: challenge_validation_logs (INMUTABLE)

```sql
CREATE TABLE challenge_validation_logs (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id      UUID              NOT NULL REFERENCES challenges(id),
  triggered_by      UUID              NOT NULL REFERENCES users(id),
  result            validation_result NOT NULL,
  reason            TEXT              NULL,
  matches_evaluated INTEGER           NOT NULL DEFAULT 0,
  matches_qualified INTEGER           NOT NULL DEFAULT 0,
  riot_api_snapshot JSONB             NULL,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT now(),

  CONSTRAINT vallogs_matches_qualified_lte_evaluated
    CHECK (matches_qualified <= matches_evaluated)
);
```

### Orden de migraciones

001 → ENUMs
002 → users
003 → riot_accounts
004 → challenge_templates
005 → challenges
006 → coin_transactions
007 → challenge_validation_logs
008 → indexes
009 → seed challenge_templates

---

## 6. Variables de entorno requeridas

```bash
# App
NODE_ENV=development|staging|production
PORT=3001
API_PREFIX=v1
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug|info

# Database
DATABASE_URL=postgresql://lolapp:lolapp_dev@localhost:5432/lolchallenge
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_SSL=false  # true en producción

# Redis
REDIS_URL=redis://localhost:6379
REDIS_QUEUE_NAME=challenge-validation
REDIS_CACHE_TTL_MATCH=86400
REDIS_CACHE_TTL_MATCHLIST=90

# Auth (SECRETS — nunca en código)
JWT_SECRET=<min 64 chars>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<min 64 chars, diferente a JWT_SECRET>
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECRET=<min 32 chars>
BCRYPT_ROUNDS=10  # 12 en producción
CORS_ORIGIN=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>
GOOGLE_CALLBACK_URL=http://localhost:3001/v1/auth/google/callback

# Riot API
RIOT_API_KEY=RGAPI-xxxx  # expira cada 24h en dev
RIOT_API_BASE_URL=https://la1.api.riotgames.com
RIOT_API_REGIONAL_URL=https://americas.api.riotgames.com
RIOT_RATE_LIMIT_PER_SECOND=18
RIOT_RATE_LIMIT_PER_2MIN=90
RIOT_MAX_RETRIES=3
RIOT_RETRY_BASE_DELAY_MS=5000

# Economy
SIGNUP_BONUS_COINS=10
CHALLENGE_CREATION_COST=1
VALIDATION_COOLDOWN_MINUTES=10

# Worker
WORKER_CONCURRENCY=2
JOB_MAX_RETRIES=3
JOB_BACKOFF_DELAY_MS=5000
JOB_RETENTION_COMPLETED=24
JOB_RETENTION_FAILED=168
```

---

## 7. API — endpoints completos

Base URL: `/v1`

### Auth (`/auth`) — todos públicos

| Method | Path           | Descripción                     |
| ------ | -------------- | ------------------------------- |
| POST   | /auth/register | Registro email + password       |
| POST   | /auth/login    | Login email + password          |
| POST   | /auth/google   | Google OAuth                    |
| POST   | /auth/refresh  | Renovar access token via cookie |
| POST   | /auth/logout   | Cerrar sesión                   |

### Users (`/users`) — JWT requerido

| Method | Path             | Auth     | Descripción                              |
| ------ | ---------------- | -------- | ---------------------------------------- |
| GET    | /users/me        | JWT      | Perfil propio + balance                  |
| GET    | /users/search?q= | JWT+Riot | Buscar jugadores (username o NOMBRE#TAG) |
| GET    | /users/:userId   | JWT      | Perfil público                           |

### Riot Account (`/users/me/riot-account`)

| Method | Path                   | Auth | Descripción            |
| ------ | ---------------------- | ---- | ---------------------- |
| POST   | /users/me/riot-account | JWT  | Linkear cuenta Riot    |
| GET    | /users/me/riot-account | JWT  | Ver cuenta linkeada    |
| PATCH  | /users/me/riot-account | JWT  | Actualizar cuenta Riot |

### Challenges (`/challenges`) — JWT+Riot

| Method | Path                     | Descripción                                    |
| ------ | ------------------------ | ---------------------------------------------- |
| GET    | /challenges              | Listar mis retos (query: role, status, cursor) |
| POST   | /challenges              | Crear y enviar reto (-1 moneda)                |
| GET    | /challenges/:id          | Detalle de reto                                |
| POST   | /challenges/:id/accept   | Aceptar reto (solo target)                     |
| POST   | /challenges/:id/reject   | Rechazar reto (solo target)                    |
| POST   | /challenges/:id/validate | Disparar validación async (cooldown 10min)     |

### Economy (`/economy`) — JWT

| Method | Path                  | Descripción                         |
| ------ | --------------------- | ----------------------------------- |
| GET    | /economy/balance      | Balance actual                      |
| GET    | /economy/transactions | Historial de transacciones paginado |

### Templates (`/templates`)

| Method | Path           | Auth     | Descripción              |
| ------ | -------------- | -------- | ------------------------ |
| GET    | /templates     | JWT+Riot | Listar templates activos |
| GET    | /templates/:id | JWT      | Detalle de template      |

### Admin (`/admin`) — rol ADMIN requerido

| Method | Path                    | Descripción                |
| ------ | ----------------------- | -------------------------- |
| POST   | /admin/templates        | Crear template             |
| PATCH  | /admin/templates/:id    | Actualizar template        |
| GET    | /admin/users            | Listar usuarios            |
| GET    | /admin/users/:id        | Detalle usuario            |
| PATCH  | /admin/users/:id/status | Activar/desactivar usuario |
| POST   | /admin/economy/grant    | Acreditar monedas          |
| POST   | /admin/economy/deduct   | Debitar monedas            |

### Health

| Method | Path    | Auth   | Descripción                   |
| ------ | ------- | ------ | ----------------------------- |
| GET    | /health | Public | Estado de todos los servicios |

---

## 8. Sistema de validadores

### Los 6 validators del MVP

| validator_key         | Params                              | Lógica                                              |
| --------------------- | ----------------------------------- | --------------------------------------------------- |
| `wins_any_champion`   | `{ games: 1-20 }`                   | Contar partidas ganadas en ventana                  |
| `wins_with_champion`  | `{ games: 1-20, champion: string }` | Contar victorias con ese campeón (case-insensitive) |
| `assists_accumulated` | `{ assists: 1-200, games: 1-30 }`   | Sumar asistencias en las N partidas más recientes   |
| `assists_single_game` | `{ assists: 1-30 }`                 | Encontrar UNA partida con >= assists                |
| `kills_accumulated`   | `{ kills: 1-200, games: 1-30 }`     | Sumar kills en las N partidas más recientes         |
| `kills_single_game`   | `{ kills: 1-20 }`                   | Encontrar UNA partida con >= kills                  |

### Regla de ventana de validación (CRÍTICO — seguridad)

Solo cuentan partidas donde:

1. `match.gameStartTimestamp >= challenge.accepted_at` (en milisegundos)
2. `match.gameDuration >= 300` segundos (excluye remakes)
3. `match.gameMode` in `['CLASSIC', 'RANKED_SOLO', 'RANKED_FLEX']`
4. El PUUID del target aparece en `match.metadata.participants`

**NUNCA** validar partidas anteriores a `accepted_at`. Es la frontera de seguridad principal.

### Interface IValidator

```typescript
interface IValidator {
  readonly validatorKey: string;
  evaluate(
    matches: RiotMatch[],
    params: Record<string, unknown>,
    context: ValidationContext,
  ): ValidatorResult;
}

interface ValidatorResult {
  passed: boolean;
  matchesEvaluated: number;
  matchesQualified: number;
  reason: string;
  snapshot?: Record<string, unknown>;
}

interface ValidationContext {
  challengeId: string;
  creatorId: string;
  targetId: string;
  targetPuuid: string;
  acceptedAt: Date;
  rewardAmount: number;
}
```

---

## 9. Convenciones de código

### Naming

- Archivos: `kebab-case` → `wins-any-champion.validator.ts`
- Clases: `PascalCase` → `WinsAnyChampionValidator`
- Interfaces: `PascalCase` con prefijo `I` → `IValidator`
- Variables/funciones: `camelCase`
- Constantes: `SCREAMING_SNAKE_CASE`
- Columnas DB: `snake_case`
- Variables de entorno: `SCREAMING_SNAKE_CASE`

### TypeScript

- Strict mode activado — sin `any`, sin `!` (non-null assertion)
- Todos los parámetros y returns tipados explícitamente
- Interfaces para shapes de datos, clases solo para servicios/entidades

### Errores (qué excepción usar)

```typescript
NotFoundException; // recurso no existe
ForbiddenException; // usuario no tiene permiso
BadRequestException; // input inválido
ConflictException; // duplicado (email ya existe)
UnprocessableEntityException; // INSUFFICIENT_FUNDS, CHALLENGE_NOT_ACTIVE
TooManyRequestsException; // VALIDATION_COOLDOWN
```

### Tests

- Unit tests: `*.spec.ts` co-localizados con el archivo que testean
- E2E tests: `*.e2e-spec.ts` en `/test`
- Cobertura mínima: 80% global, 100% en validators y EconomyService

---

## 10. Riot API — notas de integración

### URLs para LA1

- Regional (summoner, champion mastery): `https://la1.api.riotgames.com`
- Continental (match v5, account v1): `https://americas.api.riotgames.com`

### Endpoints usados

```
# Verificar cuenta al linkear:
GET americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}

# Match list para validación:
GET americas.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids
  params: { start: 0, count: 20, queue: 420 }

# Detalle de partida:
GET americas.api.riotgames.com/lol/match/v5/matches/{matchId}
```

### Queue IDs incluidos en validación

- 420: Ranked Solo/Duo ✅
- 440: Ranked Flex ✅
- 400: Normal Draft ✅
- 450: ARAM ❌
- 830-850: Co-op vs AI ❌

### Dev API Key

- Expira cada 24 horas a medianoche UTC
- Renovar en: https://developer.riotgames.com
- Si validation-worker devuelve ERROR en todos los jobs → verificar primero si la key expiró
- Riot retorna HTTP 403 (no 401) cuando la key expira

---

## 11. Flujo de operación de economía (patrón atómico)

Toda operación que modifique balance sigue EXACTAMENTE este patrón:

```typescript
// Dentro de EconomyService — NUNCA en otro servicio
async deductForChallengeCreation(userId: string, challengeId: string): Promise<void> {
  await this.dataSource.transaction(async (manager) => {
    // 1. Lock exclusivo de la fila
    const user = await manager
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .setLock('pessimistic_write')
      .getOneOrFail();

    // 2. Verificar fondos suficientes
    if (user.balance < 1) {
      throw new UnprocessableEntityException({
        code: 'INSUFFICIENT_FUNDS',
        message: `Balance insuficiente. Tienes ${user.balance} monedas.`
      });
    }

    // 3. Actualizar balance
    await manager.getRepository(User).update(userId, {
      balance: user.balance - 1,
    });

    // 4. Insertar registro de transacción (OBLIGATORIO)
    await manager.getRepository(CoinTransaction).insert({
      userId,
      amount:       -1,
      type:         CoinTxType.CHALLENGE_CREATED,
      referenceId:  challengeId,
      referenceType: 'challenge',
      balanceAfter: user.balance - 1,
    });
  });
}
```

---

## 12. Guards de NestJS requeridos

### JwtAuthGuard

- Verifica Bearer token en Authorization header
- Adjunta `user` al request con `{ id, email, role, hasRiotAccount }`
- Aplica a todos los endpoints excepto `/auth/*` y `/health`

### OnboardingGuard (aplica DESPUÉS de JwtAuthGuard)

- Verifica `request.user.hasRiotAccount === true`
- Si false → lanza ForbiddenException con code: `RIOT_ACCOUNT_REQUIRED`
- NO aplica a: `/auth/*`, `/users/me/riot-account`, `/health`

### AdminGuard

- Verifica `request.user.role === 'ADMIN'`
- Aplica solo a rutas `/admin/*`

---

## 13. BullMQ — configuración del job de validación

```typescript
// Job encolado por ChallengesService
{
  name: 'validate-challenge',
  data: {
    challengeId: string,
    userId:      string,   // quien disparó la validación
    triggeredAt: string,   // ISO timestamp
  },
  opts: {
    attempts:  3,
    backoff: {
      type:  'exponential',
      delay: 5000,         // 5s, 10s, 20s
    },
    removeOnComplete: { age: 86400 },   // 24h
    removeOnFail:     { age: 604800 },  // 7d
  }
}
```

---

## 14. Reglas que Claude Code debe respetar siempre

1. **Nunca** escribir en tablas de otro módulo directamente — usar el servicio del módulo dueño
2. **Nunca** modificar `users.balance` sin `coin_transactions` en la misma transacción
3. **Nunca** hacer llamadas síncronas a la Riot API en el request HTTP — siempre via worker
4. **Nunca** confiar en datos enviados por el frontend para validación — verificar con Riot API
5. **Nunca** usar `synchronize: true` en TypeORM — solo migrations explícitas
6. **Nunca** hacer `SELECT FOR UPDATE` fuera de `EconomyService`
7. **Nunca** retornar `password_hash`, `google_id` o datos sensibles en responses de API
8. **Siempre** usar `TIMESTAMPTZ` para timestamps — nunca `TIMESTAMP` naive
9. **Siempre** filtrar partidas por `gameStartTimestamp >= accepted_at` antes de evaluar
10. **Siempre** escribir unit tests para cualquier Validator o método de EconomyService
11. **Siempre** usar el envelope de error estándar: `{ statusCode, code, message, details? }`
12. **Nunca** exponer stack traces en producción (`NODE_ENV=production`)

---

## 15. Documentación completa

Los 6 documentos en `/docs` tienen el detalle completo de cada decisión:

- `01_architecture.docx` — arquitectura de alto nivel, decisiones técnicas, trade-offs
- `02_database_design.docx` — esquema completo, constraints, índices, orden de migraciones
- `03_api_contracts.docx` — todos los endpoints con request/response schemas exactos
- `04_validator_guide.docx` — implementación de los 6 validators, interfaz IValidator, testing
- `05_infrastructure.docx` — Railway deploy, variables de entorno, Docker Compose
- `06_developer_setup.docx` — setup local, scripts NPM, Git workflow, troubleshooting

Ante cualquier duda de implementación, consultar el documento relevante antes de improvisar.
