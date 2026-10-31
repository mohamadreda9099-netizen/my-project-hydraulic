# my-project-hydraulic

An inventory management system for a hydraulic equipment shop in Lebanon. It resolves inventory shortages and tracks outstanding debts.

## Tech Stack

- Next.js
- Prisma (ORM)
- PostgreSQL (database)


### Branch Naming

- `main` holds stable code only. No direct commits.
- One branch per task, in lowercase with hyphens:
  - `feature/<short-description>` (new functionality)
  - `fix/<short-description>` (bug fixes)
  - `chore/<short-description>` (setup, config, tooling)
  - `docs/<short-description>` (documentation only)
- Examples: `feature/add-product-model`, `fix/migration-error`, `chore/setup-prisma`

### Pull Request Rules

- Every change reaches `main` through a PR. No direct pushes.
- PR title is clear; the description says what changed and why.
- Keep PRs small and focused on a single task.
- Link the related board card in the description.
- At least one approval is required before merging.
- No merge conflicts, no failing build.
- Never commit secrets, `.env` files, or credentials.

### Definition of Done

A task is done only when all of these are true:

-  The code works and was tested manually (or by automated tests).
-  The build passes with no errors or warnings in the console.
-  `npm run lint` passes and the code follows the project style.
-  A PR was opened, reviewed, and approved.
-  Docs or README were updated if the change affects them.
-  The card on the project board was moved to **Done**.

## Environment Variables

- Never commit `.env`. It is listed in `.gitignore`.
- Keep `.env.example` updated with variable names only (no real values).

## Bootstrap Week Checklist

- [ ] Mon: Watch the Prisma environment lessons. Initialize the Next.js project.
- [ ] Tue: Repo conventions: branch naming, PR rules and a written definition of done go into the README. Set up the project board and load it with the backlog from Discovery. Attend System Design Session.
- [ ] Wed: Initialize Prisma. Translate the approved ERD into `schema.prisma`. Run the first migration.
- [ ] Thu: Write seed data. Verify queries against the seeded database.
- [ ] Fri: Environment variables and secrets hygiene. Submit repo link + board link to Discord. Attend Marwa's session.
- [ ] Sat: Catch-up only.

## Project Board

[Project board](https://github.com/users/mohamadreda9099-netizen/projects/1)
