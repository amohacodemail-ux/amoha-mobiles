# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api-health-check.spec.ts >> API Health Check >> Orders API - GET /admin/orders
- Location: e2e\api-health-check.spec.ts:78:7

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:10000
Call log:
  - → GET http://localhost:10000/api/admin/orders
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br

```