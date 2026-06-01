# SmartEdu MVP

SmartEdu is a local MVP of an educational platform for online courses, video lessons, tests, progress tracking, notifications, comments, certificates, dark mode, and mobile-friendly usage.

## Stack

- Frontend: React, Vite, TailwindCSS, React Router
- Backend: Node.js, Express, Prisma
- Database: PostgreSQL in Docker
- Auth: JWT

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
└── docker-compose.yml
```

## Local Setup

> This machine currently has Node.js but no global `npm` command available. Install Node.js from https://nodejs.org or use any Node distribution that includes npm before running the commands below.

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Configure backend:

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Backend runs on `http://localhost:4000`.

3. Start frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Frontend-only Demo

If Docker or PostgreSQL is not installed yet, run the UI with mock data:

```bash
cd frontend
VITE_MOCK_API=true npm run dev
```

This mode supports login, course pages, lessons, tests, progress, comments, profile settings, notifications, and dark mode in the browser.

## Demo Account

After running seed:

- Email: `student@smartedu.local`
- Password: `password123`

## Main Features

- Register and login
- Protected dashboard
- Course catalog and filtering
- Course details with modules and lessons
- Lesson page with video player
- Test submission and score calculation
- User profile and settings
- Progress statistics
- Lesson comments
- Notifications
- Dark theme
- Responsive layout

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
