import type { DashboardEvent } from '@jc68124/test-results-dashboard-core';
import type { CypressReporterOptions } from './types.js';

export async function postEvent(
    options: CypressReporterOptions,
    event: DashboardEvent
): Promise<void> {
    const headers: Record<string, string> = {
        'content-type': 'application/json',
        ...options.headers,
    };

    if (options.token) {
        headers.authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(options.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            event,
        }),
    });

    if (!response.ok) {
        const body = await safeReadText(response);

        throw new Error(
            `Failed to post Cypress reporter event: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`
        );
    }
}

async function safeReadText(response: Response): Promise<string> {
    try {
        return await response.text();
    } catch {
        return '';
    }
}