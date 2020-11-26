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
