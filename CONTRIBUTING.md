# Contributing to BayadNet

Thanks for contributing! Please follow these guidelines to keep the project consistent.

## Getting Started

1. Fork and clone the repo.
2. Create a feature branch: `git checkout -b feat/your-change`.
3. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

## Development

- Use `.env.example` as your starting point.
- Keep changes focused and documented.
- Add or update tests for new logic.
- Run lint and tests before submitting:
  ```bash
  cd server && npm run lint && npm test
  cd ../client && npm run lint
  ```

## Commit Messages

Use concise, present-tense messages (e.g., `Add health check endpoint`).

## Pull Requests

- Fill out the PR template.
- Link issues when applicable.
- Ensure CI is green.

## Reporting Bugs

Open an issue using the bug report template and include steps to reproduce.
