import type { TestStatus } from '@jc68124/test-results-dashboard-core';
import type { CypressAfterRunResult } from './types.js';

export function createRunId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isFailedRunResult(
    result: CypressAfterRunResult
): result is CypressCommandLine.CypressFailedRunResult {
    return 'status' in result && result.status === 'failed';
}

export function mapTestStatus(
    state?: string
): TestStatus | undefined {
    switch (state) {
        case 'passed':
            return 'passed';
        case 'failed':
            return 'failed';
        case 'pending':
            return 'pending';
        case 'skipped':
            return 'skipped';
        default:
            return undefined;
    }
}