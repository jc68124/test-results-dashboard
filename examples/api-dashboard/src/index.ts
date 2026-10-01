import { createAPIWorker } from '@jc68124/test-results-dashboard-api-dashboard';

const app = createAPIWorker({
	basePath: '/api',
	d1Binding: 'DB',
});

export default app;
