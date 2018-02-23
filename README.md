# Cap ruby

A web-based application for managing [Cap City Percussion](https://capcitypercussion.com)'s membership.




## Heroku database info
### Copying to staging
1. Run command `heroku pg:backups:capture --app cap-production`
2. Note the backup version number from the output
3. Run command `heroku pg:backups:restore cap-production::<version number> DATABASE_URL --app cap-staging`
4. Follow prompts

### Migrating
`heroku run rake db:migrate --app cap-production`
