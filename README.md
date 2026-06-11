# SmartEdu

SmartEdu is an MVP educational platform for online courses, video lessons, tests, manual assessment, progress tracking, comments, live chat, learning assistant, notifications, role-based dashboards, dark mode, and responsive usage on desktop and mobile.

## Stack

- Frontend: React, Vite, TailwindCSS, React Router
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL
- Auth: JWT
- Deployment: Docker Compose

## Features

- Student registration and login
- Protected routes and JWT authorization
- Course catalog with search and filtering
- Course pages with modules and lessons
- Video lessons, uploaded video materials, and test lessons
- Tests with attempts, time limit, deadline, best-score logic, and weighted questions
- Question types: single choice, multiple choice, matching, manual answer
- Manual grading for open-answer tasks with teacher feedback
- Student progress, course statistics, and viewable certificates
- Learning assistant with answers based on course materials and student progress
- Lesson comments
- Notifications for students and teachers, including WebSocket updates
- Online chat for students and teachers
- Student profile and dark mode
- Avatar and lesson video uploads with static file serving
- Teacher dashboard for test creation, grading, groups, and student progress
- Admin dashboard for roles, groups, and teacher assignment
- Docker-based local/server setup

## Project Structure

```text
.
├── backend
│   ├── prisma
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src
│       ├── middleware
│       ├── routes
│       └── server.js
├── frontend
│   └── src
│       ├── components
│       ├── context
│       ├── pages
│       └── services
├── docker-compose.yml
└── docker-compose.server.yml
```

## Local Setup

Start PostgreSQL:

```bash
docker compose up -d
```

Configure and start the backend:

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend URL:

```text
http://localhost:4000
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Frontend Demo Mode

The frontend can run without PostgreSQL by using mock data:

```bash
cd frontend
VITE_MOCK_API=true npm run dev
```

Demo mode is useful for UI review and covers the student, teacher, and admin dashboards in the browser.

## Docker Deployment

Build and start the full application:

```bash
cp .env.server.example .env
docker compose -f docker-compose.server.yml up -d --build
```

The Docker frontend uses the same origin `/api` proxy by default, so it works from a remote IP without rebuilding for a specific address. Set `CLIENT_URL` in `.env` if the backend must restrict browser origins.

Seed demo data after the containers start:

```bash
docker compose -f docker-compose.server.yml exec backend npm run prisma:seed
```

Default Docker URLs:

```text
Frontend: http://localhost:3000
Backend API: http://localhost:3000/api
Health check: http://localhost:3000/api/health
```

Useful commands:

```bash
docker compose -f docker-compose.server.yml ps
docker compose -f docker-compose.server.yml logs -f backend
docker compose -f docker-compose.server.yml logs -f frontend
docker compose -f docker-compose.server.yml down
```

Run an automated smoke test against Docker or a deployed server:

```bash
cd backend
SMARTEDU_BASE_URL=http://localhost:3000 npm run smoke
```

Update an existing deployment:

```bash
git pull
docker compose -f docker-compose.server.yml up -d --build
```

## Demo Accounts

All demo accounts use the password:

```text
password123
```

- Student: `student@smartedu.local`
- Teacher: `teacher@smartedu.local`
- Admin: `admin@smartedu.local`

## Core API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/courses`
- `GET /api/courses/:id`
- `GET /api/lessons/:id`
- `POST /api/tests/:id/submit`
- `GET /api/progress/me`
- `GET /api/certificates/:code`
- `POST /api/comments`
- `GET /api/notifications`
- `GET /api/chat/messages`
- `POST /api/chat/messages`
- `POST /api/assistant/ask`
- `PATCH /api/users/settings`
- `POST /api/users/avatar`
- `PATCH /api/lessons/:id/video`
- `GET /api/teacher/overview`
- `POST /api/teacher/tests`
- `PATCH /api/teacher/submissions/:id/grade`
- `PATCH /api/teacher/students/:studentId/extensions/:testId`
- `GET /api/admin/overview`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/groups/:id`

## Realtime

Authenticated WebSocket endpoint:

```text
ws://localhost:3000/ws?token=<JWT>
```

Supported events:

- `notification`: pushed when a teacher receives a manual-review task or a student receives a grade/deadline update
- `chat_message`: pushed when a user sends a chat message

## Useful Scripts

Backend:

```bash
npm run dev
npm run start
npm run smoke
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

## QA and Demo

- [QA Test Plan](docs/QA.md)
- [Demo Script](docs/DEMO.md)

## Logging

The backend writes structured JSON logs to stdout. Each HTTP request includes a generated `x-request-id`, status code, response time, method, and URL. Docker users can inspect logs with:

```bash
docker compose -f docker-compose.server.yml logs -f backend
```

## Roadmap

- Replace `prisma db push` in Docker with production migrations
- Add generated PDF certificates
- Add API integration tests
- Add HTTPS, domain configuration, and production secrets management
