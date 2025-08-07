# Launch app instruction

## Start necessary docker containers

- navigate to `/backend` folder

  **Run docker cli**:

- `docker compose -f .\docker-compose.yml --env-file .\.env.development up -d`

## Init prisma

### Migration

**Run migration command**:

- `yarn prisma:create`
- `yarn prisma:migrate`

### Seed data (already auto seed in `src/main.ts`)

`yarn prisma:seed`
