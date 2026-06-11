# Demo Script

Use this script for the final SmartEdu presentation.

## 1. Project Overview

- SmartEdu is an educational platform for online courses, video lessons, tests, manual grading, progress tracking, live chat, learning assistant, notifications, and role-based dashboards.
- The MVP uses React, TailwindCSS, Node.js, Express, Prisma, PostgreSQL, JWT, and Docker Compose.

## 2. Student Demo

1. Log in as `student@smartedu.local`.
2. Open the dashboard and show recommended courses and progress.
3. Open the course catalog and use search/filtering.
4. Open a course page and show modules and lessons.
5. Open a video lesson and play the embedded video.
6. Mark a lesson as completed.
7. Open a test lesson and show attempts, time limit, deadline, and weighted points.
8. Submit a test and show progress update.
9. Add a comment below a lesson.
10. Open notifications and show unread counter clearing.
11. Open the learning assistant and ask what to repeat before the React test.
12. Open chat, send a message, and show realtime delivery if a second session is open.
13. Open profile, upload an avatar, and toggle dark mode.
14. Open progress and show course statistics and the certificate section.
15. If a certificate exists, open it in a new tab and show the verification code.

## 3. Teacher Demo

1. Log in as `teacher@smartedu.local`.
2. Open the teacher dashboard.
3. Create a new test with several question types.
4. Show validation messages for incomplete test fields.
5. Upload a video file for a video lesson.
6. Open pending manual submissions.
7. Grade a manual answer and add feedback.
8. Open checked work and edit a grade.
9. Open group progress and inspect a student.
10. Extend a student's deadline for an unfinished assignment.

## 4. Admin Demo

1. Log in as `admin@smartedu.local`.
2. Open the admin dashboard.
3. Change a user's role.
4. Assign a student to a group.
5. Assign a teacher to a group.
6. Attach a course to a group.

## 5. Technical Demo

1. Show the repository structure: `frontend`, `backend`, Docker Compose, README, QA docs.
2. Show backend health endpoint: `/api/health`.
3. Show CI workflow in `.github/workflows/ci.yml`.
4. Show Docker deployment command.
5. Run or show `npm run smoke` against the deployed Docker frontend.
6. Show structured backend logs with request ids.
7. Mention persisted uploads for avatars and videos through Docker volume.

## 6. Closing

- Implemented core plan: auth, courses, lessons, tests, progress, certificates, comments, WebSocket notifications, live chat, learning assistant, dark mode, responsive UI, teacher/admin roles, Docker deploy, structured logs, CI, and QA documentation.
- Future improvements: production migrations, PDF certificates, API integration tests, HTTPS and domain setup.
