
```
lol-challenges-platform
├─ .DS_Store
├─ .claude
│  └─ settings.local.json
├─ CLAUDE.md
├─ backend
│  ├─ .DS_Store
│  ├─ .env
│  ├─ .env.example
│  ├─ .eslintrc.js
│  ├─ .prettierrc
│  ├─ dist
│  │  ├─ migrations
│  │  │  ├─ 1700000000001-CreateEnums.d.ts
│  │  │  ├─ 1700000000001-CreateEnums.js
│  │  │  ├─ 1700000000001-CreateEnums.js.map
│  │  │  ├─ 1700000000002-CreateUsers.d.ts
│  │  │  ├─ 1700000000002-CreateUsers.js
│  │  │  ├─ 1700000000002-CreateUsers.js.map
│  │  │  ├─ 1700000000003-CreateRiotAccounts.d.ts
│  │  │  ├─ 1700000000003-CreateRiotAccounts.js
│  │  │  ├─ 1700000000003-CreateRiotAccounts.js.map
│  │  │  ├─ 1700000000004-CreateChallengeTemplates.d.ts
│  │  │  ├─ 1700000000004-CreateChallengeTemplates.js
│  │  │  ├─ 1700000000004-CreateChallengeTemplates.js.map
│  │  │  ├─ 1700000000005-CreateChallenges.d.ts
│  │  │  ├─ 1700000000005-CreateChallenges.js
│  │  │  ├─ 1700000000005-CreateChallenges.js.map
│  │  │  ├─ 1700000000006-CreateCoinTransactions.d.ts
│  │  │  ├─ 1700000000006-CreateCoinTransactions.js
│  │  │  ├─ 1700000000006-CreateCoinTransactions.js.map
│  │  │  ├─ 1700000000007-CreateChallengeValidationLogs.d.ts
│  │  │  ├─ 1700000000007-CreateChallengeValidationLogs.js
│  │  │  ├─ 1700000000007-CreateChallengeValidationLogs.js.map
│  │  │  ├─ 1700000000008-CreateIndexes.d.ts
│  │  │  ├─ 1700000000008-CreateIndexes.js
│  │  │  ├─ 1700000000008-CreateIndexes.js.map
│  │  │  ├─ 1700000000009-SeedChallengeTemplates.d.ts
│  │  │  ├─ 1700000000009-SeedChallengeTemplates.js
│  │  │  └─ 1700000000009-SeedChallengeTemplates.js.map
│  │  ├─ src
│  │  │  ├─ app.module.d.ts
│  │  │  ├─ app.module.js
│  │  │  ├─ app.module.js.map
│  │  │  ├─ common
│  │  │  │  ├─ enums
│  │  │  │  │  ├─ index.d.ts
│  │  │  │  │  ├─ index.js
│  │  │  │  │  └─ index.js.map
│  │  │  │  ├─ index.d.ts
│  │  │  │  ├─ index.js
│  │  │  │  └─ index.js.map
│  │  │  ├─ config
│  │  │  │  ├─ configuration.d.ts
│  │  │  │  ├─ configuration.js
│  │  │  │  ├─ configuration.js.map
│  │  │  │  ├─ index.d.ts
│  │  │  │  ├─ index.js
│  │  │  │  ├─ index.js.map
│  │  │  │  ├─ typeorm.config.d.ts
│  │  │  │  ├─ typeorm.config.js
│  │  │  │  └─ typeorm.config.js.map
│  │  │  ├─ main.d.ts
│  │  │  ├─ main.js
│  │  │  ├─ main.js.map
│  │  │  ├─ modules
│  │  │  │  ├─ auth
│  │  │  │  │  ├─ auth.controller.d.ts
│  │  │  │  │  ├─ auth.controller.js
│  │  │  │  │  ├─ auth.controller.js.map
│  │  │  │  │  ├─ auth.module.d.ts
│  │  │  │  │  ├─ auth.module.js
│  │  │  │  │  ├─ auth.module.js.map
│  │  │  │  │  ├─ auth.service.d.ts
│  │  │  │  │  ├─ auth.service.js
│  │  │  │  │  ├─ auth.service.js.map
│  │  │  │  │  ├─ decorators
│  │  │  │  │  │  ├─ current-user.decorator.d.ts
│  │  │  │  │  │  ├─ current-user.decorator.js
│  │  │  │  │  │  └─ current-user.decorator.js.map
│  │  │  │  │  ├─ dto
│  │  │  │  │  │  ├─ auth-response.dto.d.ts
│  │  │  │  │  │  ├─ auth-response.dto.js
│  │  │  │  │  │  ├─ auth-response.dto.js.map
│  │  │  │  │  │  ├─ index.d.ts
│  │  │  │  │  │  ├─ index.js
│  │  │  │  │  │  ├─ index.js.map
│  │  │  │  │  │  ├─ login.dto.d.ts
│  │  │  │  │  │  ├─ login.dto.js
│  │  │  │  │  │  ├─ login.dto.js.map
│  │  │  │  │  │  ├─ refresh-token.dto.d.ts
│  │  │  │  │  │  ├─ refresh-token.dto.js
│  │  │  │  │  │  ├─ refresh-token.dto.js.map
│  │  │  │  │  │  ├─ register.dto.d.ts
│  │  │  │  │  │  ├─ register.dto.js
│  │  │  │  │  │  └─ register.dto.js.map
│  │  │  │  │  ├─ guards
│  │  │  │  │  │  ├─ admin.guard.d.ts
│  │  │  │  │  │  ├─ admin.guard.js
│  │  │  │  │  │  ├─ admin.guard.js.map
│  │  │  │  │  │  ├─ index.d.ts
│  │  │  │  │  │  ├─ index.js
│  │  │  │  │  │  ├─ index.js.map
│  │  │  │  │  │  ├─ jwt-auth.guard.d.ts
│  │  │  │  │  │  ├─ jwt-auth.guard.js
│  │  │  │  │  │  ├─ jwt-auth.guard.js.map
│  │  │  │  │  │  ├─ onboarding.guard.d.ts
│  │  │  │  │  │  ├─ onboarding.guard.js
│  │  │  │  │  │  └─ onboarding.guard.js.map
│  │  │  │  │  └─ strategies
│  │  │  │  │     ├─ jwt.strategy.d.ts
│  │  │  │  │     ├─ jwt.strategy.js
│  │  │  │  │     └─ jwt.strategy.js.map
│  │  │  │  ├─ challenges
│  │  │  │  │  ├─ challenges.controller.d.ts
│  │  │  │  │  ├─ challenges.controller.js
│  │  │  │  │  ├─ challenges.controller.js.map
│  │  │  │  │  ├─ challenges.module.d.ts
│  │  │  │  │  ├─ challenges.module.js
│  │  │  │  │  ├─ challenges.module.js.map
│  │  │  │  │  ├─ challenges.service.d.ts
│  │  │  │  │  ├─ challenges.service.js
│  │  │  │  │  ├─ challenges.service.js.map
│  │  │  │  │  ├─ dto
│  │  │  │  │  │  ├─ create-challenge.dto.d.ts
│  │  │  │  │  │  ├─ create-challenge.dto.js
│  │  │  │  │  │  └─ create-challenge.dto.js.map
│  │  │  │  │  ├─ entities
│  │  │  │  │  │  ├─ challenge-template.entity.d.ts
│  │  │  │  │  │  ├─ challenge-template.entity.js
│  │  │  │  │  │  ├─ challenge-template.entity.js.map
│  │  │  │  │  │  ├─ challenge-validation-log.entity.d.ts
│  │  │  │  │  │  ├─ challenge-validation-log.entity.js
│  │  │  │  │  │  ├─ challenge-validation-log.entity.js.map
│  │  │  │  │  │  ├─ challenge.entity.d.ts
│  │  │  │  │  │  ├─ challenge.entity.js
│  │  │  │  │  │  ├─ challenge.entity.js.map
│  │  │  │  │  │  ├─ index.d.ts
│  │  │  │  │  │  ├─ index.js
│  │  │  │  │  │  └─ index.js.map
│  │  │  │  │  ├─ templates.controller.d.ts
│  │  │  │  │  ├─ templates.controller.js
│  │  │  │  │  └─ templates.controller.js.map
│  │  │  │  ├─ economy
│  │  │  │  │  ├─ economy.controller.d.ts
│  │  │  │  │  ├─ economy.controller.js
│  │  │  │  │  ├─ economy.controller.js.map
│  │  │  │  │  ├─ economy.module.d.ts
│  │  │  │  │  ├─ economy.module.js
│  │  │  │  │  ├─ economy.module.js.map
│  │  │  │  │  ├─ economy.service.d.ts
│  │  │  │  │  ├─ economy.service.js
│  │  │  │  │  ├─ economy.service.js.map
│  │  │  │  │  └─ entities
│  │  │  │  │     ├─ coin-transaction.entity.d.ts
│  │  │  │  │     ├─ coin-transaction.entity.js
│  │  │  │  │     ├─ coin-transaction.entity.js.map
│  │  │  │  │     ├─ index.d.ts
│  │  │  │  │     ├─ index.js
│  │  │  │  │     └─ index.js.map
│  │  │  │  ├─ health
│  │  │  │  │  ├─ health.controller.d.ts
│  │  │  │  │  ├─ health.controller.js
│  │  │  │  │  ├─ health.controller.js.map
│  │  │  │  │  ├─ health.module.d.ts
│  │  │  │  │  ├─ health.module.js
│  │  │  │  │  └─ health.module.js.map
│  │  │  │  ├─ riot
│  │  │  │  │  ├─ riot.module.d.ts
│  │  │  │  │  ├─ riot.module.js
│  │  │  │  │  ├─ riot.module.js.map
│  │  │  │  │  ├─ riot.service.d.ts
│  │  │  │  │  ├─ riot.service.js
│  │  │  │  │  └─ riot.service.js.map
│  │  │  │  ├─ users
│  │  │  │  │  ├─ entities
│  │  │  │  │  │  ├─ index.d.ts
│  │  │  │  │  │  ├─ index.js
│  │  │  │  │  │  ├─ index.js.map
│  │  │  │  │  │  ├─ riot-account.entity.d.ts
│  │  │  │  │  │  ├─ riot-account.entity.js
│  │  │  │  │  │  ├─ riot-account.entity.js.map
│  │  │  │  │  │  ├─ user.entity.d.ts
│  │  │  │  │  │  ├─ user.entity.js
│  │  │  │  │  │  └─ user.entity.js.map
│  │  │  │  │  ├─ users.controller.d.ts
│  │  │  │  │  ├─ users.controller.js
│  │  │  │  │  ├─ users.controller.js.map
│  │  │  │  │  ├─ users.module.d.ts
│  │  │  │  │  ├─ users.module.js
│  │  │  │  │  ├─ users.module.js.map
│  │  │  │  │  ├─ users.service.d.ts
│  │  │  │  │  ├─ users.service.js
│  │  │  │  │  └─ users.service.js.map
│  │  │  │  └─ validation
│  │  │  │     ├─ interfaces
│  │  │  │     │  ├─ validator.interface.d.ts
│  │  │  │     │  ├─ validator.interface.js
│  │  │  │     │  └─ validator.interface.js.map
│  │  │  │     ├─ validation.processor.d.ts
│  │  │  │     ├─ validation.processor.js
│  │  │  │     ├─ validation.processor.js.map
│  │  │  │     ├─ validators
│  │  │  │     │  ├─ assists-accumulated.validator.d.ts
│  │  │  │     │  ├─ assists-accumulated.validator.js
│  │  │  │     │  ├─ assists-accumulated.validator.js.map
│  │  │  │     │  ├─ assists-single-game.validator.d.ts
│  │  │  │     │  ├─ assists-single-game.validator.js
│  │  │  │     │  ├─ assists-single-game.validator.js.map
│  │  │  │     │  ├─ kills-accumulated.validator.d.ts
│  │  │  │     │  ├─ kills-accumulated.validator.js
│  │  │  │     │  ├─ kills-accumulated.validator.js.map
│  │  │  │     │  ├─ kills-single-game.validator.d.ts
│  │  │  │     │  ├─ kills-single-game.validator.js
│  │  │  │     │  ├─ kills-single-game.validator.js.map
│  │  │  │     │  ├─ validator.registry.d.ts
│  │  │  │     │  ├─ validator.registry.js
│  │  │  │     │  ├─ validator.registry.js.map
│  │  │  │     │  ├─ wins-any-champion.validator.d.ts
│  │  │  │     │  ├─ wins-any-champion.validator.js
│  │  │  │     │  ├─ wins-any-champion.validator.js.map
│  │  │  │     │  ├─ wins-with-champion.validator.d.ts
│  │  │  │     │  ├─ wins-with-champion.validator.js
│  │  │  │     │  └─ wins-with-champion.validator.js.map
│  │  │  │     ├─ worker.module.d.ts
│  │  │  │     ├─ worker.module.js
│  │  │  │     └─ worker.module.js.map
│  │  │  ├─ worker.d.ts
│  │  │  ├─ worker.js
│  │  │  └─ worker.js.map
│  │  └─ tsconfig.build.tsbuildinfo
│  ├─ migrations
│  │  ├─ 1700000000001-CreateEnums.ts
│  │  ├─ 1700000000002-CreateUsers.ts
│  │  ├─ 1700000000003-CreateRiotAccounts.ts
│  │  ├─ 1700000000004-CreateChallengeTemplates.ts
│  │  ├─ 1700000000005-CreateChallenges.ts
│  │  ├─ 1700000000006-CreateCoinTransactions.ts
│  │  ├─ 1700000000007-CreateChallengeValidationLogs.ts
│  │  ├─ 1700000000008-CreateIndexes.ts
│  │  └─ 1700000000009-SeedChallengeTemplates.ts
│  ├─ nest-cli.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ app.module.ts
│  │  ├─ common
│  │  │  ├─ enums
│  │  │  │  └─ index.ts
│  │  │  └─ index.ts
│  │  ├─ config
│  │  │  ├─ configuration.ts
│  │  │  ├─ index.ts
│  │  │  └─ typeorm.config.ts
│  │  ├─ main.ts
│  │  ├─ modules
│  │  │  ├─ auth
│  │  │  │  ├─ auth.controller.ts
│  │  │  │  ├─ auth.module.ts
│  │  │  │  ├─ auth.service.ts
│  │  │  │  ├─ decorators
│  │  │  │  │  └─ current-user.decorator.ts
│  │  │  │  ├─ dto
│  │  │  │  │  ├─ auth-response.dto.ts
│  │  │  │  │  ├─ index.ts
│  │  │  │  │  ├─ login.dto.ts
│  │  │  │  │  ├─ refresh-token.dto.ts
│  │  │  │  │  └─ register.dto.ts
│  │  │  │  ├─ guards
│  │  │  │  │  ├─ admin.guard.ts
│  │  │  │  │  ├─ index.ts
│  │  │  │  │  ├─ jwt-auth.guard.ts
│  │  │  │  │  └─ onboarding.guard.ts
│  │  │  │  └─ strategies
│  │  │  │     └─ jwt.strategy.ts
│  │  │  ├─ challenges
│  │  │  │  ├─ challenges.controller.ts
│  │  │  │  ├─ challenges.module.ts
│  │  │  │  ├─ challenges.service.ts
│  │  │  │  ├─ dto
│  │  │  │  │  └─ create-challenge.dto.ts
│  │  │  │  ├─ entities
│  │  │  │  │  ├─ challenge-template.entity.ts
│  │  │  │  │  ├─ challenge-validation-log.entity.ts
│  │  │  │  │  ├─ challenge.entity.ts
│  │  │  │  │  └─ index.ts
│  │  │  │  └─ templates.controller.ts
│  │  │  ├─ economy
│  │  │  │  ├─ economy.controller.ts
│  │  │  │  ├─ economy.module.ts
│  │  │  │  ├─ economy.service.ts
│  │  │  │  └─ entities
│  │  │  │     ├─ coin-transaction.entity.ts
│  │  │  │     └─ index.ts
│  │  │  ├─ health
│  │  │  │  ├─ health.controller.ts
│  │  │  │  └─ health.module.ts
│  │  │  ├─ riot
│  │  │  │  ├─ riot.module.ts
│  │  │  │  └─ riot.service.ts
│  │  │  ├─ users
│  │  │  │  ├─ entities
│  │  │  │  │  ├─ index.ts
│  │  │  │  │  ├─ riot-account.entity.ts
│  │  │  │  │  └─ user.entity.ts
│  │  │  │  ├─ users.controller.ts
│  │  │  │  ├─ users.module.ts
│  │  │  │  └─ users.service.ts
│  │  │  └─ validation
│  │  │     ├─ interfaces
│  │  │     │  └─ validator.interface.ts
│  │  │     ├─ validation.processor.ts
│  │  │     ├─ validators
│  │  │     │  ├─ assists-accumulated.validator.ts
│  │  │     │  ├─ assists-single-game.validator.ts
│  │  │     │  ├─ kills-accumulated.validator.ts
│  │  │     │  ├─ kills-single-game.validator.ts
│  │  │     │  ├─ validator.registry.ts
│  │  │     │  ├─ wins-any-champion.validator.ts
│  │  │     │  └─ wins-with-champion.validator.ts
│  │  │     └─ worker.module.ts
│  │  └─ worker.ts
│  ├─ test
│  │  ├─ app.e2e-spec.ts
│  │  └─ jest-e2e.json
│  ├─ tsconfig.build.json
│  └─ tsconfig.json
├─ docker-compose.yml
├─ docs
│  ├─ LoL_API_Contracts.docx
│  ├─ LoL_Challenge_Platform_Architecture.docx
│  ├─ LoL_Database_Design.docx
│  ├─ LoL_Developer_Setup.docx
│  ├─ LoL_Infrastructure_Guide.docx
│  └─ LoL_Validator_Guide.docx
└─ frontend

```