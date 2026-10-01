import { z } from 'zod';
import { ArtifactSchema } from './artifact.js';
import { RunnerNameSchema } from './runner.js';
import { TestStatusSchema } from './testStatus.js';

export const RunAttributeSchema = z.object({
	key: z.string().trim().min(1).max(50),
	value: z.string().trim().min(1).max(255),
	showOnRunList: z.boolean().optional().default(false),
});

export type RunAttribute = z.infer<typeof RunAttributeSchema>;
export type RunAttributeInput = z.input<typeof RunAttributeSchema>;

export const RunAttributesSchema = z
	.array(RunAttributeSchema)
	.max(20)
	.superRefine((attributes, context) => {
		const keys = new Set<string>();

		for (const [index, attribute] of attributes.entries()) {
			if (keys.has(attribute.key)) {
				context.addIssue({
					code: 'custom',
					message: 'Run attribute keys must be unique.',
					path: [index, 'key'],
				});
			}

			keys.add(attribute.key);
		}

		if (attributes.filter((attribute) => attribute.showOnRunList).length > 3) {
			context.addIssue({
				code: 'custom',
				message: 'A maximum of three run attributes can be shown on the run list.',
			});
		}
	});


const ShortRunMetadataSchema = z
	.string()
	.trim()
	.min(1)
	.max(255);

const CommitShaSchema = z
	.string()
	.trim()
	.min(1)
	.max(128);

const CommitMessageSchema = z
	.string()
	.trim()
	.min(1)
	.max(4_096);


export const RunMetadataSchema = z.object({
	id: z.string(),
	name: z.string().trim().min(1).max(120).optional(),
	runner: RunnerNameSchema,
	projectId: z.string(),
	branch: ShortRunMetadataSchema.optional(),
	commitSha: CommitShaSchema.optional(),
	commitMessage: CommitMessageSchema.optional(),
	machineId: ShortRunMetadataSchema.optional(),
	shardId: ShortRunMetadataSchema.optional(),
	group: ShortRunMetadataSchema.optional(),
	parallel: z.boolean().optional(),
	attributes: RunAttributesSchema.optional(),
});

export type RunMetadata = z.infer<typeof RunMetadataSchema>;

export const RunInfoSchema = RunMetadataSchema.extend({
	startedAt: z.string().optional(),
	endedAt: z.string().optional(),
	browserName: z.string().optional(),
	browserVersion: z.string().optional(),
	osName: z.string().optional(),
	osVersion: z.string().optional(),
	runnerVersion: z.string().optional(),
});

export type RunInfo = z.infer<typeof RunInfoSchema>;

export const SpecInfoSchema = z.object({
	name: z.string(),
	relative: z.string().optional(),
	absolute: z.string().optional(),
	startedAt: z.string(),
	endedAt: z.string(),
	duration: z.number().optional(),
	tests: z.number(),
	passes: z.number(),
	failures: z.number(),
	pending: z.number(),
	skipped: z.number(),
	suites: z.number().optional(),
	video: z.string().nullable().optional(),
	screenshots: ArtifactSchema.array().optional(),
});

export type SpecInfo = z.infer<typeof SpecInfoSchema>;

export const TestAttemptSchema = z.object({
	state: z.union([TestStatusSchema, z.string()]),
});

export type TestAttempt = z.infer<typeof TestAttemptSchema>;

export const TestInfoSchema = z.object({
	title: z.string().min(1).array().min(1),
	status: z.union([TestStatusSchema, z.string()]),
	displayError: z.string().optional(),
	attempts: TestAttemptSchema.array().optional(),
	duration: z.number().optional(),
	retry: z.number().optional(),
	location: z
		.object({
			file: z.string().optional(),
			line: z.number().optional(),
			column: z.number().optional(),
		})
		.optional(),
	stdout: z.string().array().optional(),
	stderr: z.string().array().optional(),
	artifacts: ArtifactSchema.array().optional(),
});

export type TestInfo = z.infer<typeof TestInfoSchema>;
