import { createIngestionWorker } from '@jc68124/test-results-dashboard-api-ingest';

const app = createIngestionWorker({
	basePath: '/ingest',
	d1Binding: 'DB',
});

export default app;
