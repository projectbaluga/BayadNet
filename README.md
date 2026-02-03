# BayadNet

[![CI](https://github.com/your-org/bayadnet/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/bayadnet/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey)](https://github.com/your-org/bayadnet/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

BayadNet is an Internet Subscriber Management System with a React + Vite client and a Node.js
Express + MongoDB backend. It tracks subscriber billing cycles, credits, and payment status.

## Project Structure

- `client/` - Vite + React frontend
- `server/` - Express API and MongoDB models
- `docker-compose.yml` - Local development stack

## Requirements

- Node.js 20+
- npm 9+
- MongoDB (or Docker)

## Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

## Run (Local)

### Server
```bash
cd server
npm start
```

### Client
```bash
cd client
npm run dev
```

## Run (Docker)

```bash
docker-compose up --build
```

## Environment Variables

See `.env.example` for supported variables. Never commit real secrets.

## API Reference

### `GET /api/subscribers`
Returns the subscriber list along with the current date and totals.

### `POST /api/subscribers/:id/pay`
Marks a subscriber as paid for the current month.

### `GET /health`
Basic health check endpoint that returns status and timestamp.

## Tests

Server tests are located in `server/__tests__`. Run:

```bash
cd server
npm test -- --coverage
```

Coverage reports are generated in `server/coverage/`. The CI workflow uploads coverage artifacts
for inspection and the README badge can be wired to a reporting service such as Codecov.

## Linting & Formatting

```bash
cd server && npm run lint
cd ../client && npm run lint
```

Prettier config is in `.prettierrc.json`.

## Database Seeders & Migrations

Seeding scripts live in `server/seed.js`. There are no automated migrations yet—consider adding
a migration tool such as `migrate-mongo` if schema changes become frequent.

## Health Checks, Logging, Monitoring

- Use the `/health` endpoint for uptime checks.
- Prefer structured JSON logs (e.g., `pino`) in production.
- Monitor MongoDB metrics and API latencies via tools like Prometheus + Grafana.

## Security

See [SECURITY.md](.github/SECURITY.md) for vulnerability reporting. Use secrets managers and do
not commit `.env` files.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Release Process

1. Update `CHANGELOG.md`.
2. Tag releases using semantic versioning: `vX.Y.Z`.
3. CI should pass; publish artifacts/deploy from a CI/CD pipeline.

## License

MIT. See [LICENSE](LICENSE).
