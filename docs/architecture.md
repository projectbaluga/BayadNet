# Architecture Overview

## High-level Components

- **Client**: React + Vite frontend for subscriber management.
- **Server**: Express API backed by MongoDB for persistence.
- **Database**: MongoDB instance (local or containerized).

## Data Flow

1. The client requests data from the Express API.
2. The API reads/writes subscriber data in MongoDB.
3. The API returns JSON responses to the client for rendering.

## Deployment Notes

- Use the provided Docker Compose file for a local full-stack environment.
- Configure environment variables using `.env` (see `.env.example`).
- For production, consider managed MongoDB and a reverse proxy (e.g., Nginx).
