# SmartEdu Retrospective

## What Went Well

- The MVP was built around a clear learning flow: auth, courses, lessons, tests, progress, and feedback.
- Role separation makes the platform easier to demonstrate: student, teacher, and admin each have their own workflows.
- Docker deployment keeps local and server setup close to each other.
- The smoke test gives fast confidence that the deployed version works even when browser access is affected by VPN.
- Documentation now maps the original plan to implemented evidence.

## What Was Difficult

- Test logic needed several details to feel realistic: attempt limits, deadlines, weighted questions, manual grading, and best-score handling.
- Teacher review UX needed iteration so manual grading, comments, checked work, and group progress were understandable.
- Uploaded files had to persist across refreshes and Docker container rebuilds.
- Server checks had to work even when direct browser access from the local machine was unreliable.

## Decisions

- Certificates are implemented as verifiable HTML pages. PDF export is left as a future improvement.
- WebSocket is used for notifications and chat; REST fallbacks remain available.

## What To Improve Next

- Add integration tests for auth, tests, grading, uploads, and admin flows.
- Replace Docker `prisma db push` startup behavior with production migrations.
- Add HTTPS, a domain name, and production secret management.
- Improve analytics with per-topic mastery and exportable reports.
- Add PDF certificates.

## Final Status

The project is ready for MVP demonstration. Core functionality, advanced UX features, deployment, smoke testing, and documentation are in place.
