# Peaksel admin publisher

This standalone Cloudflare Worker publishes question packages to the public
GitHub repository. It does not use a database. Canonical package JSON, the
generated package page, the package catalog, and search/author data are
published together in one GitHub commit.

Only packages created through this CMS appear in its management list. Existing
legacy package pages are left unchanged and are not yet editable from this
panel; importing them is a separate migration.

## Required configuration

1. Create a Google OAuth Web client. Add the deployed site origin
   (`https://peaksel.az` and, if used, `https://www.peaksel.az`) to its
   authorized JavaScript origins.
2. Set `GOOGLE_CLIENT_ID` in `wrangler.jsonc` and the same public client ID in
   `admin/config.js`.
3. Configure the GitHub OAuth-less fine-grained personal access token with
   read/write access to repository contents for `pikseliok/piksel.iokk`.
4. Install Wrangler locally, then from this directory run:

   ```powershell
   npx.cmd wrangler secret put GITHUB_TOKEN
   npx.cmd wrangler secret put ADMIN_EMAILS
   npx.cmd wrangler deploy
   ```

   Enter the token and comma-separated admin email allowlist only at Wrangler's
   secure prompts. Do not put either value in source files or browser code.
5. After deployment, set `apiBaseUrl` in `admin/config.js` to the Worker
   `workers.dev` URL. The Worker allows only the configured site origins.
6. Publish the repository changes so `/admin/` and its assets are hosted by the
   existing static-site deployment.

The Worker uses GitHub's tree/commit APIs and rejects a concurrent branch
update rather than overwriting it. If that happens, reload the admin page and
retry. A package slug may not overwrite a pre-existing non-CMS HTML page.

## Package format

Packages use `sections -> groups -> questions`. Xəmsə groups represent topics;
each topic must have an author and exactly five questions. Other formats may
use optional group/question authors. Rich text is supported in question,
answer, comment, source, and acceptance-criteria fields; the generated viewer
sanitizes markup before displaying it.

## Checks

Run the Worker validation tests with `node --test test/validation.test.js` from
this directory. The tests do not require Cloudflare or GitHub credentials.
