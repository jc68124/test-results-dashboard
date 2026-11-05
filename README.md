# Test Results Dashboard

A self-hosted dashboard for Cypress test results. Browse projects and runs, inspect test failures and retries, and track pass rates and durations.

The Cypress reporter sends run and spec events to an ingestion API, which stores results in Cloudflare D1 through Prisma. A Next.js dashboard reads them through a separate API. All three applications run on Cloudflare Workers behind a shared gateway.

## Setup

Requires Node.js 24, pnpm (the version in `package.json`), and a Cloudflare account with Workers and D1. A dev container is included.

```bash
git clone https://github.com/jc68124/test-results-dashboard.git
cd test-results-dashboard
pnpm install --frozen-lockfile
pnpm build:packages
pnpm --dir examples/api-ingest exec wrangler login
pnpm --dir examples/api-ingest exec wrangler d1 create test_results_dashboard
```

Update the Wrangler files under `examples/`:

- Set the new database name and ID in `api-ingest/wrangler.jsonc` and `api-dashboard/wrangler.jsonc`, keeping the binding named `DB`.
- If you rename Workers, update their Service Bindings in the web and gateway configurations.
- For deployment, configure a domain or route for the gateway, or enable its `workers.dev` endpoint.

Both APIs currently use remote D1, including during local development. Use a dedicated development database.

Apply the SQL migrations in timestamp order. For a **new, empty database only**, run from the repository root:

```bash
for migration in packages/db/src/migrations/*/migration.sql; do
    pnpm --dir examples/api-ingest exec wrangler d1 execute DB \
        --remote --file "../../$migration" || break
done
```

Resolve any errors before continuing. This command does not track applied migrations; on an existing database, apply only pending files. Deployment does not apply migrations automatically.

### Run locally

Start each application in a separate terminal from the repository root:

```bash
# Dashboard API
pnpm --dir examples/api-dashboard dev

# Ingestion API; override its default port to avoid the gateway port
pnpm --dir examples/api-ingest exec wrangler dev --port 8790

# Web app in the Cloudflare runtime
pnpm --dir examples/web preview

# Public gateway
pnpm --dir examples/gateway dev
```


Open [http://localhost:8787](http://localhost:8787). Use the web preview for the full platform because server-side API requests require Cloudflare Service Bindings. Rebuild shared packages after changing them.

### Deploy

```bash
pnpm build
pnpm --dir examples/web deploy
pnpm --dir examples/api-ingest deploy
pnpm --dir examples/api-dashboard deploy
pnpm --dir examples/gateway deploy
```

The GitHub Deploy workflow also supports manual dispatch and published releases. It requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets.

The dashboard and management API currently have no built-in authentication. Protect them through your deployment's access controls; keep the ingestion endpoint reachable by test runners using their ingestion keys.

## Use with Cypress

1. Create a project in the dashboard.
2. Open its settings, create an ingestion key, and copy the key and project public ID.
3. Install the reporter in your Cypress project:

```bash
pnpm add -D @jc68124/test-results-dashboard-cypress-reporter
```

Register it in your existing `cypress.config.ts`:

```ts
import { defineConfig } from 'cypress';
import { createCypressReporter } from '@jc68124/test-results-dashboard-cypress-reporter';

export default defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            const endpoint = process.env.TEST_RESULTS_ENDPOINT;
            const projectId = process.env.TEST_RESULTS_PROJECT_ID;
            const token = process.env.TEST_RESULTS_TOKEN;

            if (!endpoint || !projectId || !token) {
                throw new Error('Missing test results dashboard configuration.');
            }

            createCypressReporter({
                endpoint,
                projectId,
                token,
            }).register(on, config);

            return config;
        },
    },
});
```

Set these variables in your shell or CI environment:

| Variable | Value |
| --- | --- |
| `TEST_RESULTS_ENDPOINT` | Full URL, such as `https://your-dashboard.example.com/ingest/events`. |
| `TEST_RESULTS_PROJECT_ID` | Your project's public ID. |
| `TEST_RESULTS_TOKEN` | Your project's ingestion key. Store it as a CI secret. |

Run `pnpm exec cypress run`, then open the project's run list to view results. Runs update as specs finish, and each test retains its status, duration, and available error details.

The reporter collects Git metadata automatically. Optional settings include `runName`, `runAttributes`, and `debug: true` for diagnosing reporting errors. Reporting failures do not fail the Cypress run.
