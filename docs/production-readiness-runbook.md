# Production readiness runbook

## Vercel environments

Set server secrets only in Vercel; never prefix secrets with `VITE_`. Configure separate Production and Preview values:

- Production: `DEPLOYMENT_ENVIRONMENT=production`, a production-only `MONGODB_URI`, and `MONGODB_DATABASE_NAME=kiyo_topup`.
- Preview: `DEPLOYMENT_ENVIRONMENT=preview`, a non-production MongoDB deployment or database, and a name containing `preview` or `staging`.
- Keep production payment, webhook, Telegram, and provider credentials unset in Preview. Use sandbox/test payment credentials only where a provider supports them.
- Set explicit HTTPS `CLIENT_URL`, `ADMIN_URL`, and `CORS_ORIGINS` for each environment.

The backend rejects production startup when Vercel environment metadata and `DEPLOYMENT_ENVIRONMENT` disagree, when preview uses a non-preview database name, or when automatic seeding/in-memory storage/payment simulation is enabled.

## Settings credential migration

1. Inventory legacy Settings fields without exposing values:
   `npm --prefix backend run migrate-settings-credentials`
2. Manually copy each reported value from the approved secret-management process into the matching Vercel server environment variable. Do not paste values into tickets, terminal history, or frontend variables.
3. Verify the target deployment starts and payment/provider integrations use the environment configuration.
4. Retire stored fields only after a backup and a rollback window:
   `CONFIRM_SETTINGS_CREDENTIAL_MIGRATION=true npm --prefix backend run migrate-settings-credentials -- --apply`
5. Rotate every migrated credential with its provider, especially if Settings or historic logs were ever broadly accessible.

The script is dry-run by default, prints field names/counts only, and refuses writes if matching environment variables are not configured.

## Logs and indexes

- Audit historic provider data first: `npm --prefix backend run sanitize-provider-logs`
- Apply redaction only after backup approval: `CONFIRM_PROVIDER_LOG_SANITIZATION=true npm --prefix backend run sanitize-provider-logs -- --apply`
- Run `npm --prefix backend run verify-production-indexes` before manual index creation. It only reports duplicate groups; it never creates indexes or deletes data.

Credential rotation remains recommended after sanitization because redaction cannot prove prior copies, exports, or third-party log retention are clean.

## Backup, rollback, and incident response

- Enable Atlas point-in-time recovery and take a verified backup before migrations or schema/index changes.
- Deploy Preview first; run health, readiness, checkout regression, and admin permission checks before Production.
- Roll back by redeploying the previous Vercel deployment. Do not restore a database backup unless data-loss impact is approved.
- For a suspected secret leak: disable/rotate the affected provider credential, revoke sessions if applicable, sanitize retained logs, inspect access logs, and document scope/timeline without including secrets.
- `/health` and `/health/live` are liveness probes; `/health/ready` returns only `ready` or `not_ready` based on MongoDB initialization.

## Current blocker

Do not enable real G2Bulk catalogue synchronization until official endpoint, authentication, payload, status, and currency documentation is provided and reviewed.
