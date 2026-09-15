# Cap Ruby

A web application for managing [Cap City Percussion](https://capcitypercussion.com)'s membership.

## Heroku Quick Reference

### Pushing commit to heroku
`git push production <local branch>:<master>`

To push to staging, switch `heroku` to `staging`.

### Copying database to staging
1. Run command `heroku pg:backups:capture --app <app-name>`
2. Note the backup version number from the output
3. Run command `heroku pg:backups:restore cap-production::<version number> DATABASE_URL --app <app-name>`
4. Follow prompts

### Migrating database
`heroku run rake db:migrate --app <app-name>`

### Running rails console
`heroku run rails console --app <app-name>`

### Database CLI
`heroku pg:psql --app <app-name>`

### Copying Prod DB to Local
There are seeds included with the codebase, but sometimes it's better to have real, production-like data. This will allow you to do so.

1. Capture a backup of the database and download it

  ```
  heroku pg:backups:capture --app <app-name>
  heroku pg:backups:download --app <app-name>
  ```

2. The downloaded file will be called `latest.dump`. Use `pg_restore` to set up a local temp database with the backup.

  ```
  pg_restore --verbose --clean --no-acl --no-owner -h localhost -U postgres -d tempdb latest.dump
  ```

  *Note: you will need postgres running to do this.*

3. Dump the local temp database into a file called `data.sql` that has insert statements (which can be used by SQLite3).

  ```
  pg_dump -U postgres --inserts -a -b tempdb > data.sql
  ```

4. Drop the existing local database and create a new, empty version, then run migrations.

  ```
  bundle exec rails db:drop
  bundle exec rails db:create
  bundle exec rails db:migrate
  ```

5. Strip schema info from the dumped SQL script.

  ```
  sed -i -e 's/^INSERT INTO public\./INSERT INTO /' data.sql
  ```

6. Strip out the block of `SET` statements from `data.sql` (starting around line 8).
7. Delete the insert into `ar_internal_metadata`
8. Delete the section inserting data into the `schema_migrations` table.
9. Delete the section at the end with a bunch of `SELECT pg_catalog.setval(...)` statements.
10. Open up a sqlite console and read in the data from `data.sql`

  ```
  sqlite3 db/development.sqlite3
  sqlite> .read data.sql
  ```

  Fix any remaining errors that get thrown from here.

11. Obfuscate user data.

  ```
  bundle exec rails c
  User.all.each do |u|
    next if u.id == 1
    u.email = Faker::Internet.email
    u.first_name = Faker::Name.first_name
    u.last_name = Faker::Name.last_name

    # Anything else that it makes sense to change for local development

    u.save
  end
  ```

## Stripe Quick Reference
### Stripe CLI for Development
Follow instructions [here](https://docs.stripe.com/stripe-cli/overview)

### Forwarding webhooks locally (required to test any payment end to end)

Stripe can't reach `localhost`, so without a forwarder the charge succeeds and
then **nothing else happens**. Both payment flows depend on the webhook:

- Calendar fundraiser donations — `Calendar::Donation` rows are written *only*
  by `StripeController#process_calendar`, and `CalendarMailer` fires from
  inside it.
- Member dues payments — `Payment` rows are written *only* by
  `#process_dues_payment`.

So with no forwarder running, a test donation looks like it worked, but the
performer's progress never moves, the donation never appears, and Letter Opener
never pops the notification email. Nothing is broken; the write half never ran.

```bash
stripe login
stripe listen --forward-to localhost:3000/stripe/webhook
```

That prints a signing secret (`whsec_…`). Put it in `.env` as
`STRIPE_WEBHOOK_SECRET` and restart the server — `StripeController#webhook`
verifies every event against it and returns 400 on a mismatch, so a stale
secret fails the same silent way.

Leave `stripe listen` running in its own terminal while testing. It logs each
forwarded event, which is the quickest way to tell "the webhook didn't fire"
from "the webhook fired and errored".
