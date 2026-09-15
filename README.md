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

### How the payment flows actually work

There are two, and **both are split in half**. The browser creates and confirms
a PaymentIntent; the database row is written later, by the webhook. Nothing in
the request that took the money writes a payment.

| Flow | Intent created by | Row written by |
|---|---|---|
| Calendar fundraiser donation | `Api::Fundraiser::PaymentIntentsController#create` | `StripeController#process_calendar` → one `Calendar::Donation` per sponsored date, then `CalendarMailer` |
| Member dues payment | `Api::Members::PaymentIntentsController#create` | `StripeController#process_dues_payment` → one `Payment`, then the receipt email |

`StripeController#webhook` only acts on `payment_intent.succeeded`, and routes
on the intent's `metadata.charge_type` (`calendar` or `dues_payment`). Both
writes are idempotent on a `"Stripe: <payment_intent_id>"` note, so a
redelivered event can't double-charge anyone.

The practical consequence: **if the webhook doesn't reach the app, the payment
appears to succeed and then nothing happens.** No donation, no progress
movement, no email. That isn't a bug, it's the write half never running.

### Forwarding webhooks locally (required to test a payment end to end)

Stripe can't reach `localhost`, so you have to forward events yourself:

```bash
stripe login
stripe listen --forward-to localhost:3000/stripe/webhook
```

`stripe listen` prints a webhook signing secret (it starts with `whsec_`). Add
it to your local `.env` as `STRIPE_WEBHOOK_SECRET` and restart the server.
`#webhook` verifies every event against that secret via
`Stripe::Webhook.construct_event` and returns **400** if it doesn't match, so a
missing or stale secret fails exactly as silently as no forwarder at all.

Leave `stripe listen` running in its own terminal while you test. It logs every
forwarded event and the app's response, which is the fastest way to tell
"the webhook never fired" from "it fired and the app 400'd or raised".

#### Testing a fundraiser donation

1. `stripe listen --forward-to localhost:3000/stripe/webhook` in one terminal.
2. `bundle exec rails s` in another.
3. Open `/fundraiser`, pick a performer, pick some dates, pay with Stripe's
   test card `4242 4242 4242 4242` (any future expiry, any CVC, any ZIP).
4. Expect all four of these:
   - the confirmation page shows a receipt listing the dates you picked;
   - `stripe listen` logs `payment_intent.succeeded` with a `200`;
   - the performer's progress has moved on `/fundraiser`;
   - Letter Opener pops the notification email to the performer.

If the page looks right but the last three don't happen, the forwarder or the
signing secret is the thing to check — not the donation code. Note the
confirmation page deliberately reads the PaymentIntent rather than the
database, so **it renders correctly even when the webhook failed**; trust
`stripe listen` and the picker, not the receipt, for whether the row was
written.

### Keys and test mode

Locally and in test you are always on Stripe **test** keys, and this is
enforced in code rather than by convention:
`ApplicationController#set_stripe_secret_key` and `#set_stripe_public_key` fall
back to the `*_TEST_KEY` variables unless `Rails.env.production?` and `STAGING`
is unset. A request spec pins that the public fundraiser renders the test
publishable key and never the live one.

The variable names the app reads:

| Variable | Used for |
|---|---|
| `STRIPE_PUBLIC_TEST_KEY` / `STRIPE_SECRET_TEST_KEY` | everywhere except the real production deploy |
| `STRIPE_PUBLIC_KEY` / `STRIPE_SECRET_KEY` | the production deploy only |
| `STRIPE_WEBHOOK_SECRET` | verifying webhook signatures |

Values live in `.env`, which is gitignored and **must stay that way** — a local
`.env` may hold real production credentials, so never commit it, paste it into
an issue or PR, or copy it into a worktree or scratch directory. Get your own
test keys from your Stripe dashboard in test mode; you do not need production
keys to develop any of this.
