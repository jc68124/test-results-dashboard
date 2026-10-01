export * from './types.js';
export * from './reporter.js';

import type { CypressReporterOptions } from './types.js';
import { CypressReporter } from './reporter.js';

export function createCypressReporter(
    options: CypressReporterOptions
): CypressReporter {
    return new CypressReporter(options);
}