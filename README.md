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

## Server Setup With Docker

This setup is intended for the Ubuntu server. It keeps SmartEdu separate from other projects such as `kokoChat`.

Used ports:

- Frontend: `http://192.168.31.125:3000`
- Backend API: `http://192.168.31.125:4000/api`
- Backend health check: `http://192.168.31.125:4000/api/health`
- PostgreSQL is available only inside the Docker network

On the server:

```bash
cd ~/server-projects
git clone git@github.com:YjastherY/SmartEdu_shizuki-s.git smartedu
cd smartedu
sudo docker compose -f docker-compose.server.yml up -d --build
```

Seed the demo data once after the containers start:

```bash
sudo docker compose -f docker-compose.server.yml exec backend npm run prisma:seed
```

Useful server commands:

```bash
sudo docker compose -f docker-compose.server.yml ps
sudo docker compose -f docker-compose.server.yml logs -f backend
sudo docker compose -f docker-compose.server.yml logs -f frontend
sudo docker compose -f docker-compose.server.yml down
sudo docker compose -f docker-compose.server.yml up -d --build
```

To update from GitHub:

```bash
cd ~/server-projects/smartedu
git pull
sudo docker compose -f docker-compose.server.yml up -d --build
```

The current backend covers the basic MVP API: auth, courses, lessons, tests, progress, comments, notifications, profile settings. Some newer teacher/admin UI features are still implemented in frontend mock mode and should be moved to backend routes before a full production release.

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
