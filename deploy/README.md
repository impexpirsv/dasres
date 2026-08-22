# Production operations

The supported initial topology is Caddy on the same VPS, one Next.js process
bound to `127.0.0.1:3000`, and clamd bound to `127.0.0.1:3310`.

1. Create a non-root `dasres` service user and `/etc/dasres/production.env`
   owned by root with mode `0600`. Generate independent high-entropy values
   for both rate-limit and trusted-proxy secrets.
   Create the retained legacy directory before starting the service:

   ```text
   install -d -o dasres -g dasres -m 0750 /srv/dasres/legacy-private
   ```

   Every immutable release must be owned by root and must include the cache
   mountpoint created after `npm run build`:

   ```text
   chown -R root:root /srv/dasres/releases/RELEASE_ID
   chmod -R go-w /srv/dasres/releases/RELEASE_ID
   install -d -o root -g root -m 0755 /srv/dasres/releases/RELEASE_ID/.next/cache
   ```

   `CacheDirectory=dasres-next` makes systemd create
   `/var/cache/dasres-next` as `dasres:dasres` with mode `0750`. The unit
   bind-mounts only that directory onto `/srv/dasres/current/.next/cache`.
   Source, server bundles, package files, public assets, the environment file,
   and every other `.next` path remain read-only under `ProtectSystem=strict`.
   Stop the service and empty `/var/cache/dasres-next` before switching the
   `current` symlink to a different release so cache data never crosses builds.

   ```text
   systemctl stop dasres
   find /var/cache/dasres-next -mindepth 1 -delete
   ln -sfn /srv/dasres/releases/RELEASE_ID /srv/dasres/current
   systemctl start dasres
   ```
2. Put the same `TRUSTED_PROXY_SECRET` in Caddy's service environment. Caddy
   overwrites the internal client-IP and authentication headers; do not expose
   port 3000. Do not set `VERCEL=1`.
3. Validate Caddy configuration and confirm its installed version supports the
   `request_body max_size` directive before enabling the site.
4. Start the ClamAV template and wait for its signature update and healthcheck.
5. Build an immutable release with `npm ci`, `npm run db:generate`, and
   `npm run build`.
6. During the approved maintenance window, run `npm run db:migrate:deploy` as
   an explicit release step. Migrations are intentionally absent from systemd
   startup.
7. Start the application and probe `/api/health/live` and, directly over the
   loopback application port, `/api/health/ready`.

The confidential migration defaults to inventory. Non-production use requires
a distinct disposable loopback `TEST_DATABASE_URL`. Production report modes
require `--production --acknowledge-production-read-only`; production mutation
requires all of `--production --apply --acknowledge-production`. Always run
inventory and dry-run first. The tool never deletes legacy sources. Reconcile
after apply; object deletion remains a separate manual checkpoint.

Do not use `prisma db push` or seed as a production release operation. Seeding
is restricted to acknowledged disposable loopback PostgreSQL.
