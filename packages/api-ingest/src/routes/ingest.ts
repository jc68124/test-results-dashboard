import type { IngestEventSuccessResponse, IngestEventErrorResponse } from '@jc68124/test-results-dashboard-core';
import { Hono } from 'hono';
import { dispatchEvent } from '../events/dispatcher';
import { IngestEventRequestSchema } from '@jc68124/test-results-dashboard-core';
import type { HonoEnv } from '../types';
import { z } from 'zod';
import { verifyProjectIngestionSecret } from '../services/auth';


export function createIngestRoutes<
	TD1Binding extends string,
>() {
    const app = new Hono<HonoEnv<TD1Binding>>();

    app.post('/events', async(c) => {
        const ctx = c.get('ctx');

        const authHeader = c.req.header('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json<IngestEventErrorResponse>({ ok: false, error: 'Unauthorized' }, 401);
        }

        let body: unknown;

        try {
            body = await c.req.json();
        } catch (error) {
            return c.json<IngestEventErrorResponse>({ ok: false, error: 'Invalid request body' }, 400);
        }

        const parseResult = IngestEventRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return c.json<IngestEventErrorResponse>({ ok: false, error: 'Invalid request body', details: z.flattenError(parseResult.error) }, 400);
        }

        const projectPublicId = parseResult.data.event.payload.projectId;
        const apiKey = authHeader.slice('Bearer '.length).trim();

        const isValid = await verifyProjectIngestionSecret<TD1Binding>(ctx, projectPublicId, apiKey);
        if (!isValid) {
            return c.json<IngestEventErrorResponse>({ ok: false, error: 'Unauthorized' }, 401);
        }

        await dispatchEvent<TD1Binding>(ctx, parseResult.data.event);

        return c.json<IngestEventSuccessResponse>({ ok: true });
    });

    return app;
}