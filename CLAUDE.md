# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Application

**Cap City Percussion Management System** - A web application for managing Cap City Percussion, a competitive music performance group based in Columbus, Ohio.

**Organization Structure:**
- Two competitive ensembles (both compete in spring)
- Weekend rehearsals throughout winter and spring
- Seasons run fall → spring (e.g., "2026 season" starts fall 2025, ends spring 2026)
- Similar structure to sports leagues with yearly competitive seasons

**Core Purpose:**
Manage all aspects of ensemble operations including member registration, rehearsal conflict tracking, dues collection, equipment inventory, and fundraising activities.

## Development Commands

**Ruby/Rails Commands:**
- `bundle exec rails server` - Start development server
- `bundle exec rails console` - Open Rails console
- `bundle exec rspec` - Run test suite
- `bundle exec rubocop` - Run Ruby linter
- `bundle exec rubocop -a` - Auto-fix Ruby linting issues
- `bundle exec rails db:migrate` - Run database migrations
- `bundle exec rails db:seed` - Load seed data

**Frontend Commands:**
- `yarn install` - Install JavaScript dependencies
- `yarn dev` or `bin/vite dev` - Start Vite development server
- `yarn build` or `bin/vite build` - Build assets for production

**Database Operations:**
- `bundle exec rails db:drop db:create db:migrate` - Reset local database
- See README.md for detailed production database copy instructions

## Application Domain & Business Logic

### Seasons
- Yearly membership periods running fall → spring
- Each user has a role per season (via `seasons_users` join table)
- Users can have different roles in different seasons
- Current season determined by `Season.current` method

### Conflict Management
- Members submit rehearsal conflicts (date ranges when they cannot attend)
- Conflicts flow: Submit → Pending → Approved/Denied by coordinators
- Tracked via `Conflict` model with status workflow
- Coordinators/admins view conflicts on interactive calendar

### Payment Processing
- Each member has a `PaymentSchedule` with multiple entries (due dates + amounts)
- Two member types: "vet" (returning) and "new" with different payment schedules
- Members can pay via Stripe integration (online card payments)
- Admins can manually enter payments made outside system (cash, Venmo, etc.)
- Payment types: Stripe, Venmo, Cash, Check, Other
- Dashboard shows: expected vs. actual dues, members behind on payments, burndown charts

### Calendar Fundraiser
- Fundraising mechanism where donors sponsor calendar dates for ensemble members
- 100 calendar images available (days 1-100 of the year)
- Public donation page (no authentication required)
- Donors select member, dates, and pay via Stripe
- Members can view their personal fundraiser progress
- Admins see ensemble-wide fundraiser statistics

### Inventory Management
- Track equipment: sticks, mallets, drum heads, uniforms, etc.
- Namespaced under `Inventory::` (models: `Inventory::Item`, `Inventory::Category`)
- Access controlled by `inventory_access` flag on User model (role-independent)
- Users with access are called "Quartermasters"
- Email notification rules for low stock levels
- Inventory transactions tracked with user attribution

### File Management
- Google Drive integration for shared files
- Files organized by season year
- All authenticated users can access files
- Implemented via Google Drive API

### Whistleblower System
- Anonymous reporting mechanism for member concerns
- Submitter selects at least 3 admins to notify
- Optional contact information for follow-up
- Available to all authenticated users

### Auditions System
- Public-facing audition registration
- Google Sheets integration for data processing
- No authentication required

## User Roles & Permissions

### Authorization Pattern
- Roles stored per season in `seasons_users` table
- Check current role via `current_user.role_for(Season.current)`
- Base controllers enforce role: `AdminController`, `CoordinatorsController`, `StaffController`, `MembersController`
- Controllers in `app/controllers/admin/`, `app/controllers/coordinators/`, etc.

### Member Role

**Dashboard:**
- Personal dues status (amount owed vs. paid)
- Next scheduled event
- Recent conflicts and payment history

**Capabilities:**
- Submit/view personal conflict requests (`members/conflicts_controller.rb`)
- View payment schedule and make Stripe payments (`members/payments_controller.rb`)
- View personal calendar fundraiser status (`members/calendars_controller.rb`)
- Download calendar images for personal fundraising
- Submit whistleblower reports (`whistleblowers_controller.rb`)
- Access Google Drive files (`api/files_controller.rb`)
- Update account settings: username, email, password (`settings_controller.rb`)

**Conditional Access:**
- **Inventory**: Only if `inventory_access` flag is true on user record
  - If granted: full CRUD on inventory items and categories
  - Checked in `inventory_controller.rb:7-12`

**Cannot:**
- View other members' data
- Approve/edit conflicts
- Access payment/user administration
- View ensemble-wide statistics

### Staff Role

**Dashboard:**
- Next scheduled event
- Upcoming conflicts (future conflicts within 14 days)

**Capabilities:**
- **View** all submitted conflicts (read-only, cannot edit/approve)
- Access Google Drive files
- Submit whistleblower reports
- Update account settings

**Cannot:**
- Edit or approve conflicts (coordinator-only feature)
- Access inventory (no inventory_access by default)
- Manage payments
- Manage users
- Access administrative features

**Note:** Staff is the most limited role with minimal permissions.

### Coordinator Role

**Dashboard:**
- Next scheduled event
- Coordinator-specific overview

**Capabilities:**
- **Full conflict management** (`coordinators/conflicts_controller.rb`):
  - View all conflicts on interactive calendar
  - Create new conflicts for any member
  - Edit existing conflicts
  - Update conflict status (approve/deny/archive)
  - All modifications logged via `ActivityLogger`
- **Full inventory access** (`inventory_controller.rb:8`):
  - View all inventory categories and items
  - Create/update inventory items and categories
  - Set up email notification rules for low stock (`inventory/email_rules_controller.rb`)
- Access Google Drive files
- Submit whistleblower reports
- Update account settings

**Cannot:**
- Manage users or seasons
- Manage payments or payment schedules
- View payment analytics
- Access admin-only features

**Routes Note:** Coordinator conflicts routes use `except: %i[show destroy]` - no explicit destroy action.

### Admin Role

**Dashboard:**
- Comprehensive overview with analytics
- Total expected dues vs. actual collected
- Alerts for members with blank payment schedules
- Next scheduled event

**User Management** (`admin/users_controller.rb`):
- Full CRUD on users
- Assign seasons to users
- Assign roles per season (admin/coordinator/staff/member)
- Set ensemble and section assignments
- Auto-creates payment schedules for new users

**Conflict Management** (`admin/conflicts_controller.rb`):
- View all conflicts with date range filtering
- Create/edit/update conflicts
- Interactive calendar view
- View ensemble and section data

**Payment Management** (`admin/payments_controller.rb`, `api/admin/payments_controller.rb`):
- View all payments across season
- Create manual payments (for non-Stripe payments)
- Edit/delete/restore payments (soft delete via paranoid gem)
- Select payment type when entering manual payments
- View upcoming payment schedule (next 2 weeks default)
- View recent payments (past week default)
- View members behind on payments
- View payment burndown charts (biweekly scheduled vs. actual)
- View payment by type collected to date

**Payment Schedule Management** (`admin/payment_schedules_controller.rb`):
- View/edit individual payment schedules
- Create default schedules based on member type (vet/new)
- Add/remove/update schedule entries

**Calendar Fundraiser** (`admin/calendars_controller.rb`):
- View ensemble-wide fundraiser overview
- See all members and fundraiser status
- Total donations by member
- Completed vs. in-progress tracking

**Inventory Management:**
- Full access (same as coordinators)
- Create/edit inventory items and categories
- Manage email notification rules

**Season Management:**
- View all seasons (`api/admin/seasons_controller.rb`)

**Other:**
- Access Google Drive files
- Submit whistleblower reports
- Update account settings

**Inherits:** All coordinator and staff capabilities

### Public/Unauthenticated Access

**Calendar Fundraiser Donations** (`calendars_controller.rb`):
- View member list
- Submit donations via Stripe
- Provide donor name and select dates
- Choose which member to support

**Auditions** (`auditions_controller.rb`):
- View auditions spreadsheet page
- Trigger Google Sheets update

## Architecture Overview

### Tech Stack
- **Backend:** Ruby on Rails 7.2 (API + server-rendered views)
- **Frontend:** Vite + React/TypeScript with WindiCSS for styling
- **Database:** SQLite (development) / PostgreSQL (production)
- **Background Jobs:** Sidekiq
- **Authentication:** Devise
- **Payments:** Stripe (checkout sessions + payment intents)
- **Email:** Mailgun
- **Error Tracking:** Rollbar

### Multi-Tenant Architecture
- Multi-season system where users have different roles per season
- Current season context drives most queries
- Role checking: `current_user.role_for(Season.current)`
- Season scoping: Most queries filtered by `Season.current`

### Frontend Architecture
- **React Widgets:** `app/javascript/react/widgets/` organized by user role
  - `admin/`, `coordinators/`, `members/`, `staff/` subdirectories
  - Each widget is a standalone React component mounted on specific pages
- **Entry Points:** `app/javascript/entrypoints/`
  - One entry file per page/widget
  - Vite bundles each entry point separately
- **Styling:** WindiCSS (utility-first, like Tailwind)
- **Build Tool:** Vite with hot module reload in development

### Backend Code Organization

**Controllers:**
```
app/controllers/
├── application_controller.rb          # Base controller, authentication
├── admin_controller.rb                # Admin base (inherits from application)
├── coordinators_controller.rb         # Coordinator base
├── staff_controller.rb                # Staff base
├── members_controller.rb              # Member base
├── admin/                             # Admin-only controllers
│   ├── users_controller.rb
│   ├── payments_controller.rb
│   ├── payment_schedules_controller.rb
│   ├── conflicts_controller.rb
│   ├── calendars_controller.rb
│   └── dashboard_controller.rb
├── coordinators/                      # Coordinator-only controllers
│   ├── conflicts_controller.rb
│   └── dashboard_controller.rb
├── staff/                             # Staff-only controllers
│   └── dashboard_controller.rb
├── members/                           # Member-only controllers
│   ├── conflicts_controller.rb
│   ├── payments_controller.rb
│   ├── calendars_controller.rb
│   └── dashboard_controller.rb
├── api/                               # JSON API endpoints
│   ├── admin/
│   ├── coordinators/
│   └── files_controller.rb
└── inventory/                         # Inventory namespace
    └── email_rules_controller.rb
```

**Models:**
```
app/models/
├── user.rb                            # Central user model, has role_for(season)
├── season.rb                          # Yearly periods, has Season.current
├── seasons_user.rb                    # Join table, stores role per season
├── payment.rb                         # Individual payments
├── payment_schedule.rb                # Payment plan for a user
├── payment_schedule_entry.rb          # Individual due dates in schedule
├── conflict.rb                        # Rehearsal conflicts
├── conflict_status.rb                 # Status workflow (pending/approved/denied)
├── calendar_donation.rb               # Fundraiser donations
├── whistleblower.rb                   # Anonymous reports
└── inventory/
    ├── item.rb                        # Inventory items
    ├── category.rb                    # Inventory categories
    └── email_rule.rb                  # Low stock email alerts
```

**Services:**
- `app/services/` contains business logic extracted from controllers/models
- Examples: payment processing, Google API integrations, complex queries

**Background Jobs:**
- `app/jobs/` contains Sidekiq jobs
- Handle async tasks: emails, API calls, scheduled tasks

**Routes:**
- `config/routes.rb` defines all endpoints
- Organized with namespace blocks for each role
- API routes under `/api` namespace return JSON

### Key Models & Relationships

**User:**
- Central authentication model (Devise)
- `has_many :seasons, through: :seasons_users`
- `role_for(season)` returns role string for given season
- Boolean flags: `inventory_access`, etc.

**Season:**
- Represents yearly membership period
- `Season.current` returns active season
- `has_many :users, through: :seasons_users`

**SeasonsUser (Join Table):**
- Stores user's role for a specific season
- Roles: 'admin', 'coordinator', 'staff', 'member'
- Also stores: ensemble, section, member_type (vet/new)

**Payment & PaymentSchedule:**
- `User has_one :payment_schedule`
- `PaymentSchedule has_many :payment_schedule_entries`
- `PaymentScheduleEntry` has due date and amount
- `Payment` records actual payments made
- Payment types: stripe, venmo, cash, check, other

**Conflict:**
- Belongs to user
- Has conflict_status (pending, approved, denied, etc.)
- Date range: start_date, end_date
- Includes reason text

**Inventory:**
- Namespaced models: `Inventory::Item`, `Inventory::Category`
- Items belong to categories
- Email rules trigger notifications at stock thresholds

### External Integrations

**Stripe:**
- Payment processing for member dues and calendar donations
- Uses Checkout Sessions and Payment Intents
- Webhooks handle payment completion events

**Google APIs:**
- Drive API for file sharing/viewing
- Sheets API for auditions data processing
- Requires service account credentials

**Mailgun:**
- Transactional email delivery
- Action Mailer configured to use Mailgun SMTP

**Rollbar:**
- Error tracking and monitoring
- Exceptions automatically reported to Rollbar dashboard

## Testing

**Framework:**
- RSpec for Ruby tests in `spec/` directory
- FactoryBot for test data generation

**Current State:**
- Limited test coverage (as noted by maintainer)
- Integration tests needed before major refactoring (e.g., adding Sorbet)