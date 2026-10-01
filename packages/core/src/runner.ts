import { z } from 'zod';

export const RunnerNameSchema = z.enum(['cypress', 'playwright']);
export type RunnerName = z.infer<typeof RunnerNameSchema>;
