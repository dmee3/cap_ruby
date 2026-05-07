# Intern Projects — Summer 2026

Potential projects for an intern with a cyber security background and limited Python/scripting experience. Projects marked with scope notes are higher priority or better fits for the background.

---

## Security-Adjacent Projects

### 1. Security Audit & Hardening

**Overview:** Review the app for common web vulnerabilities and produce a report with prioritized findings, then implement fixes for the most critical ones.

**Scope:**

**Phase 1 — Research & Audit (no code changes)**
- Read through OWASP Top 10 and map each category to areas of this app
- Review all controller actions for missing or incorrect authorization checks
  - Verify role-based access is enforced at the controller level (not just the view)
  - Check for insecure direct object references (e.g., can a member access another member's payment schedule by changing an ID in the URL?)
- Review all forms and API endpoints for mass assignment vulnerabilities (`permit` calls in Rails)
- Check Stripe webhook handling for signature verification
- Review Devise configuration (password minimums, lockout after failed attempts, secure cookie settings)
- Review for any sensitive data exposed in logs or error messages
- Check `robots.txt` and ensure admin/coordinator routes are not publicly discoverable
- Produce a written report with findings categorized by severity (critical / high / medium / low)

**Phase 2 — Remediation**
- Fix any critical or high findings from the report
- Add missing authorization checks
- Tighten `permit` calls where overly broad
- Confirm Stripe webhook signature verification is in place

**Skills involved:** Reading code, security research, Rails authorization patterns  
**Good for:** Direct application of cyber security coursework to a real codebase

---

### 2. Audit Logging / Activity Trail

**Overview:** Extend the existing `ActivityLogger` (`lib/activity_logger.rb`) to cover more sensitive actions across the app. The logger already handles conflict status changes and payment creation — several important actions are still unlogged.

**Scope:**

**Understand the existing system first**
- Read `lib/activity_logger.rb` — it writes `Activity` records with `user_id`, `created_by_id`, `activity_type`, `description`, and `activity_date`
- Read `app/models/activity.rb` to understand the schema
- Find all current `ActivityLogger` calls in the codebase to understand what's already covered (conflicts and payment creation via Stripe and admin)

**Actions to add logging for**
- Payment edited (`admin/payments_controller.rb#update`) — currently unlogged
- Payment deleted/restored (`admin/payments_controller.rb#destroy`, `#restore`) — currently unlogged
- User role assignment changed (`admin/users_controller.rb`) — who changed whom to what role
- Payment schedule created or edited (`admin/payment_schedules_controller.rb`)
- Inventory item created, updated, or deleted (whichever actions exist in the inventory controllers)

**Implementation steps**
- For each action: add a new `log_*` class method to `ActivityLogger` following the existing pattern
- Call it from the relevant controller after a successful save/update/destroy
- Choose a clear, human-readable `description` string and an appropriate `activity_type` string for each (e.g. `'user'`, `'inventory'`)

**Bonus: make the activity log viewable**
- If time allows, add a simple admin view that lists recent `Activity` records, filterable by `activity_type` or by user
- This would make the audit trail actually accessible without needing Rails console access

**Skills involved:** Reading existing patterns and extending them, Rails controllers, ActiveRecord  
**Good for:** Low-risk, well-defined scope with a clear existing pattern to follow; teaches the codebase incrementally

---

### 3. Rate Limiting & Abuse Prevention

**Overview:** Add `rack-attack` middleware rules to protect public-facing and sensitive endpoints from brute force attacks and spam.

**Scope:**

**Setup**
- Add the `rack-attack` gem to the project
- Configure it in an initializer (`config/initializers/rack_attack.rb`)
- Wire up logging so blocked requests are visible

**Endpoints to protect**
- Devise login (`/users/sign_in`) — throttle failed login attempts by IP
- Devise password reset — throttle requests by email and IP
- Calendar donation page (`/calendars`) — throttle POST requests by IP to prevent spam donations or card testing
- Auditions registration endpoint — throttle by IP
- Stripe webhook endpoint — this should be verified by signature, not rate-limited, but confirm that verification is in place (ties into project #1)

**Safelist**
- Ensure any known internal IPs or test environments are safelisted so rate limiting doesn't interfere with development

**Testing**
- Write a short script (Python is fine) that fires repeated requests to a throttled endpoint and confirms the 429 response kicks in at the right threshold

**Skills involved:** Rack middleware, Ruby gem configuration, HTTP concepts, scripting  
**Good for:** Security-relevant, contained scope, Python scripting fits naturally for the test script

---

### 4. Admin Dashboard Improvements

**Overview:** The admin dashboard (`app/views/admin/dashboard/index.html.erb`) already shows dues collected, upcoming payments, members behind on payments, and upcoming conflicts. This project adds useful missing pieces: data export, better filtering, and a payment breakdown by type.

**Scope:**

**CSV export for payments**
- Add a CSV export action to `admin/payments_controller.rb` (e.g. `GET /admin/payments.csv`)
- Export columns: member name, amount, date paid, payment type, notes
- Scope to current season; optionally accept a date range param
- Add a download button to the payments index page
- Ruby's built-in `CSV` library handles generation — no extra gems needed

**CSV export for conflicts**
- Same pattern: export to `admin/conflicts_controller.rb`
- Columns: member name, start date, end date, status, reason
- Add a download button to the conflicts index or calendar page

**Payment breakdown by type on the dashboard**
- The dashboard currently shows total expected vs. actual dues, but doesn't break down how payments were collected (Stripe vs. cash vs. Venmo etc.)
- Add a small summary card showing payment totals grouped by type for the current season
- Backend: a new action or JSON endpoint on the payments controller that returns totals per type
- Frontend: a simple React card component on the dashboard (follow the pattern of existing dashboard widgets in `app/javascript/`)

**Date range filtering on payments index**
- The payments index currently shows all payments for the season
- Add start/end date filter inputs that update the list without a full page reload (the page already uses React for the payments table, so this is a frontend filter or a new API param)

**Skills involved:** Ruby CSV generation, Rails controller actions, React components, JSON APIs  
**Good for:** Each piece is independently deliverable; touches both backend and frontend without deep architectural changes; CSV export is a practical skill with immediate value

---

### 5. Email Notification System Expansion

**Overview:** Extend the existing notification system (currently used for low-stock inventory alerts) to cover other meaningful events across the app.

**Scope:**

**Identify notification opportunities**
- Payment reminders: members who have a payment coming due in the next N days and haven't paid
- Late payment alerts: members who are past a due date with no payment recorded
- Conflict summary digest: a weekly or pre-rehearsal email to coordinators summarizing upcoming conflicts
- New conflict submitted: notify coordinators when a member submits a new conflict request

**Implementation steps**
- Review existing mailer setup (`app/mailers/`, Mailgun config) to understand the current pattern
- For each notification type: create or extend a mailer, write the email template (text + HTML), and add a Sidekiq job to handle delivery
- For scheduled notifications (reminders, digests): add a recurring Sidekiq-cron job with configurable timing
- Add a basic admin UI for toggling which notifications are active (a simple settings table or even a YAML config file is fine)

**Testing**
- Use Rails mailer previews (`/rails/mailers`) to visually review email templates during development
- Write RSpec tests for the mailer logic (correct recipients, correct content based on data state)

**Skills involved:** Rails mailers, Action Mailer, Sidekiq, background jobs, ERB templates, basic UI  
**Good for:** Teaches the full request-to-email pipeline; manageable scope per notification type so it can be delivered incrementally

---

### 6. Automated Testing

**Overview:** Increase RSpec test coverage for critical paths. The codebase currently has limited test coverage; this project focuses on the highest-risk areas first.

**Scope:**

**Priority areas (in order)**
1. Role-based access control — verify that each role (member/staff/coordinator/admin) can and cannot access the right controller actions; these are essentially security tests
2. Conflict workflow — submitting, approving, denying conflicts; status transitions behave correctly
3. Payment processing — payment schedule creation, manual payment entry, Stripe webhook handling
4. Inventory — CRUD actions, low-stock threshold logic, email rule triggering

**What to write**
- Request specs (`spec/requests/`) for controller-level authorization checks
- Model specs (`spec/models/`) for business logic (e.g., `role_for`, payment schedule calculations)
- Use FactoryBot (already in the project) for test data — review existing factories before adding new ones

**Process**
- Start by running the existing test suite to understand what's already covered
- Pick one priority area, write tests until that area feels covered, then move to the next
- Each PR should be a focused set of tests for one area — don't try to cover everything at once

**Skills involved:** RSpec, FactoryBot, Rails request specs, reading and understanding existing code  
**Good for:** Safe way to learn the codebase top-to-bottom; no risk of breaking production behavior; tests are self-evidently correct or not

---

### 7. Deployment & Infrastructure Documentation

**Overview:** Document the production environment, create runbooks for common operations, and automate some operational tasks with scripts.

**Scope:**

**Documentation to produce**
- Environment setup guide: all required environment variables, where they live in production, what each one does
- Deploy process: step-by-step deploy checklist from a merged PR to running in production
- Database operations: how to take a backup, how to restore, how to copy production data to local (a runbook version of the README instructions)
- Sidekiq operations: how to check job queue health, how to retry failed jobs, how to clear a stuck queue
- Rollbar & Mailgun: how to access each service, what to look for when something is broken

**Scripts to write (Python or Bash)**
- Database backup script: pg_dump to a timestamped file, optionally upload to a backup location
- Environment variable audit script: compare a `.env.example` file against what's actually set in the environment and report any missing keys
- Health check script: hit a few key endpoints and report HTTP status codes — useful as a post-deploy sanity check

**Skills involved:** Systems documentation, Python/Bash scripting, PostgreSQL, reading infrastructure config  
**Good for:** Directly plays to scripting background; produces artifacts that are useful long-term; low risk since it's mostly reading and writing, not changing production code
