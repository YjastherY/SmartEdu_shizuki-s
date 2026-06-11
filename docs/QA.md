# QA Test Plan

This checklist covers the MVP flows required for SmartEdu acceptance testing.

## Environment

- Frontend: `http://localhost:5173` for local dev or `http://localhost:3000` for Docker.
- Backend health: `GET /api/health`.
- Seeded accounts use password `password123`.

## Authentication

- Register a new student with a valid name, email, and password.
- Try registration with an already used email and confirm an error is shown.
- Log in as `student@smartedu.local`.
- Try login with a wrong password and confirm an error is shown.
- Open `/dashboard` without a token and confirm redirect to `/login`.
- Log out and confirm protected pages are no longer accessible.

## Student Flows

- Open dashboard and confirm course recommendations and progress cards are visible.
- Open course catalog and search by title or category.
- Open a course page and confirm modules and lessons are listed.
- Open a video lesson and confirm the player renders.
- Mark a non-test lesson as completed and confirm progress changes.
- Open a test lesson and review attempts, time limit, deadline, and total points.
- Submit a test with auto-graded answers and confirm score/progress update.
- Submit a test with a manual-answer question and confirm it enters review state.
- Add a lesson comment and confirm it appears in the comments list.
- Open progress page and confirm courses, scores, and certificates section render.
- If a certificate exists, open it and confirm student name, course, issue date, and code render.
- Upload an avatar file and confirm it remains after page refresh.
- Toggle dark mode and confirm the setting remains after refresh.
- Open notifications, read them, and confirm unread counter clears.
- Open the chat page, send a message, refresh the page, and confirm the message remains.
- Open the app in two browser sessions and confirm a chat message appears without refreshing.
- Open the learning assistant, ask a course question, and confirm the answer includes course sources.

## Teacher Flows

- Log in as `teacher@smartedu.local`.
- Confirm `/teacher` is accessible for the teacher account.
- Create, update, and delete a module through the content API.
- Create, update, and delete a lesson through the content API.
- Create a test with single-choice, multiple-choice, matching, and manual questions.
- Try saving an incomplete test and confirm validation feedback is shown.
- Upload a video file for a video lesson.
- Review a pending manual submission.
- Add a score and feedback, save the grade, and confirm it moves to checked work.
- Keep the student session open while grading and confirm the notification appears without refreshing.
- Edit a checked grade and confirm the updated result is stored.
- Open group progress and inspect a student's completed work and scores.
- Extend a deadline for an unfinished assignment and confirm the new date is visible.

## Admin Flows

- Log in as `admin@smartedu.local`.
- Confirm `/admin` is accessible only for an admin account.
- Change a user role and confirm the updated role is visible.
- Assign students to a group.
- Assign a teacher to a group.
- Attach courses to a group.

## Access Control

- As a student, manually open `/teacher` and confirm redirect to `/dashboard`.
- As a student, manually open `/admin` and confirm redirect to `/dashboard`.
- As a teacher, manually open `/admin` and confirm redirect to `/dashboard`.
- Call teacher/admin APIs without a token and confirm `401`.
- Call teacher/admin APIs as a student and confirm `403`.

## Responsive UI

- Check dashboard, catalog, lesson, profile, teacher, and admin pages at mobile width.
- Confirm sidebar can open and close on mobile.
- Confirm cards, forms, tables, and buttons do not overlap.

## Deployment Smoke Test

- Run `docker compose -f docker-compose.server.yml up -d --build`.
- Confirm `docker compose -f docker-compose.server.yml ps` shows all services running.
- Confirm `GET /api/health` returns `{"status":"ok","service":"smartedu-api"}`.
- Run `SMARTEDU_BASE_URL=http://localhost:3000 npm run smoke` from `backend`.
- Confirm smoke output includes `content-crud`, `assistant`, and `websocket`.
- Log in through the deployed frontend.
- Open one student, teacher, and admin page.
- Check backend logs and confirm requests include JSON fields such as `requestId`, `method`, `url`, `status`, and `responseTimeMs`.
