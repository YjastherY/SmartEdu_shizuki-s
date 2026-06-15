# SmartEdu Project Board

This file represents the Trello/Jira-style board used for planning and review.

## Backlog

| Task | Owner | Priority | Notes |
| --- | --- | --- | --- |
| PDF certificate export | Backend | Medium | Current MVP has HTML certificate verification. |
| HTTPS and domain setup | DevOps | Medium | Needed before public production usage. |
| API integration tests | QA/Backend | Medium | Smoke test already covers critical deployment flow. |
| Production migrations | Backend/DevOps | Medium | Replace Docker `prisma db push` for production release. |

## Ready

| Task | Owner | Priority | Notes |
| --- | --- | --- | --- |
| Final demo rehearsal | All | High | Use `docs/DEMO.md`. |
| Manual acceptance pass | QA | High | Use `docs/QA.md`. |

## In Progress

| Task | Owner | Priority | Notes |
| --- | --- | --- | --- |
| Server monitoring during demo | DevOps | High | Check Docker containers and backend logs. |

## Review

| Task | Owner | Priority | Notes |
| --- | --- | --- | --- |
| Four-week plan mapping | All | High | Documented in `docs/PLAN_STATUS.md`. |
| Smoke test evidence | QA/DevOps | High | `npm run smoke` checks auth, courses, content CRUD, chat, and WebSocket. |

## Done

| Task | Owner | Priority | Evidence |
| --- | --- | --- | --- |
| React + Tailwind frontend | Frontend | High | `frontend/src`. |
| Express + Prisma backend | Backend | High | `backend/src`, `backend/prisma/schema.prisma`. |
| PostgreSQL Docker setup | DevOps | High | `docker-compose.yml`, `docker-compose.server.yml`. |
| Authentication and protected routes | Fullstack | High | JWT API and `ProtectedRoute`. |
| Course, module, and lesson APIs | Backend | High | Course and lesson route files. |
| Tests and manual grading | Fullstack | High | `TestForm`, teacher review flow. |
| Progress and certificates | Fullstack | High | Progress page and certificate endpoint. |
| Notifications and WebSocket | Fullstack | High | `NotificationBell`, `realtime.js`. |
| Live chat | Fullstack | Medium | `/chat`, chat API, WebSocket messages. |
| Teacher and admin dashboards | Fullstack | High | `/teacher`, `/admin`. |
| Documentation package | All | High | README, QA, demo, plan status, board, presentation, retrospective. |
