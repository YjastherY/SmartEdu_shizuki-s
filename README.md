# SmartEdu

SmartEdu is an MVP educational platform for online courses, video lessons, tests, manual assessment, progress tracking, comments, notifications, role-based dashboards, dark mode, and responsive usage on desktop and mobile.

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
- Video lessons and test lessons
- Tests with attempts, time limit, deadline, best-score logic, and weighted questions
- Question types: single choice, multiple choice, matching, manual answer
- Manual grading for open-answer tasks with teacher feedback
- Student progress, course statistics, and certificates foundation
- Lesson comments
- Notifications for students and teachers
- Student profile and dark mode
- Avatar upload with static file serving
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

For a remote server, set `CLIENT_URL` and `VITE_API_URL` in `.env` before building.

Seed demo data after the containers start:

```bash
docker compose -f docker-compose.server.yml exec backend npm run prisma:seed
```

Default Docker URLs:

```text
Frontend: http://localhost:3000
Backend API: http://localhost:4000/api
Health check: http://localhost:4000/api/health
```

Useful commands:

```bash
docker compose -f docker-compose.server.yml ps
docker compose -f docker-compose.server.yml logs -f backend
docker compose -f docker-compose.server.yml logs -f frontend
docker compose -f docker-compose.server.yml down
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
- `POST /api/comments`
- `GET /api/notifications`
- `PATCH /api/users/settings`
- `POST /api/users/avatar`
- `GET /api/teacher/overview`
- `POST /api/teacher/tests`
- `PATCH /api/teacher/submissions/:id/grade`
- `PATCH /api/teacher/students/:studentId/extensions/:testId`
- `GET /api/admin/overview`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/groups/:id`

## Useful Scripts

Backend:

```bash
npm run dev
npm run start
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

## Roadmap

- Replace `prisma db push` in Docker with production migrations
- Add file uploads for video materials
- Add generated PDF certificates
- Add WebSocket notifications and live student chat
- Add API integration tests
- Add HTTPS, domain configuration, and production secrets management
