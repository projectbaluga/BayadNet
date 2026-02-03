# API Guide

Base URL: `http://localhost:3000`

## Health Check

`GET /health`

Returns service status and timestamp.

## List Subscribers

`GET /api/subscribers`

Response includes the subscriber list, current date, and totals.

## Record a Payment

`POST /api/subscribers/:id/pay`

Marks a subscriber as paid for the current month.

## Example Request (cURL)

```bash
curl -X POST http://localhost:3000/api/subscribers/123/pay
```
