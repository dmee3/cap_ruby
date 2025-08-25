# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Architecture Overview

**Tech Stack:**
- Ruby on Rails 7.2 backend API and web framework
- Vite + React/TypeScript frontend with WindiCSS for styling  
- SQLite (development) / PostgreSQL (production)
- Sidekiq for background jobs
- Devise for authentication
- Stripe for payments

**Application Structure:**
- Multi-tenant system organized by "seasons" (yearly membership periods)
- Role-based access: admin, coordinator, staff, member
- Key domains: user management, conflict tracking, payment processing, inventory management, calendar generation

**Frontend Architecture:**
- React components in `app/javascript/react/widgets/` organized by user role
- TypeScript entry points in `app/javascript/entrypoints/` 
- Vite handles asset compilation with hot reload
- WindiCSS for utility-first styling

**Key Models:**
- `User` - Central model with role-based access per season
- `Season` - Yearly membership periods with associated users
- `Payment`/`PaymentSchedule` - Dues and payment tracking
- `Conflict` - Schedule conflict management
- `Inventory::Item` - Equipment/uniform tracking

**External Integrations:**
- Stripe for payment processing
- Google APIs for spreadsheet/drive integration (auditions processor)
- Mailgun for email delivery
- Rollbar for error tracking

**File Structure:**
- Controllers organized by user role namespaces (`admin/`, `members/`, etc.)
- Services in `app/services/` handle complex business logic
- Background jobs in `app/jobs/`
- API endpoints under `api/` namespace return JSON

**Testing:**
- RSpec for Ruby tests in `spec/` directory
- FactoryBot for test data generation