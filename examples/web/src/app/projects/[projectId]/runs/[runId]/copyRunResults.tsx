'use client';

import { Button } from '@/components/catalyst/button';
import {
    Dialog,
    DialogActions,
    DialogBody,
    DialogDescription,
    DialogTitle,
} from '@/components/catalyst/dialog';
import { Field, Label } from '@/components/catalyst/fieldset';
import { Select } from '@/components/catalyst/select';
import { Textarea } from '@/components/catalyst/textarea';
import { useProject } from '@/contexts/projectContext';
import { useRun } from '@/contexts/runContext';
import { useToast } from '@/contexts/toastContext';
import { getProjectRun } from '@/lib/api/runs';
import { getRunSpecs } from '@/lib/api/specs';
import {
    formatDuration,
    formatRunName,
    getRunDisplayStatus,
    getRunStatusPresentation,
} from '@/lib/runPresentation';
import type {
    FullSpec,
    RunWithStats,
} from '@jc68124/test-results-dashboard-api-types';
import { ClipboardDocumentIcon } from '@heroicons/react/20/solid';
import { useRef, useState } from 'react';

type ResultContent = 'summary' | 'failed' | 'all';

// Add further formats here without changing how results are collected.
type ResultFormat = 'plainText';

type ResultSnapshot = {
    projectName: string;
    run: RunWithStats;
    specs: FullSpec[];
    url: string;
    capturedAt: Date;
};

export default function CopyRunResults() {
    const { project } = useProject();
    const { run } = useRun();
    const { addToast } = useToast();

    const [open, setOpen] = useState(false);
    const [content, setContent] = useState<ResultContent>('all');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [copying, setCopying] = useState(false);
    const requestId = useRef(0);

    function closeDialog() {
        requestId.current += 1;
        setOpen(false);
        setLoading(false);
        setText('');
    }

    async function prepareResults() {
        const currentRequest = ++requestId.current;
        setLoading(true);
        setText('');

        try {
            const response = await getProjectRun(
                project.publicId,
                run.publicId
            );
            const specs: FullSpec[] = [];

            if (content !== 'summary') {
                let page = 1;

                while (true) {
                    if (currentRequest !== requestId.current) {
                        return;
                    }

                    const result = await getRunSpecs(
                        project.publicId,
                        run.publicId,
                        page,
                        25
                    );

                    specs.push(...result.data);

                    if (page >= result.meta.pagination.totalPages) {
                        break;
                    }

                    page += 1;
                }
            }

            if (currentRequest !== requestId.current) {
                return;
            }

            const url = new URL(
                `/projects/${project.publicId}/runs/${run.publicId}`,
                window.location.origin
            ).href;

            setText(formatResults({
                projectName: project.name,
                run: response.data,
                specs,
                url,
                capturedAt: new Date(),
            }, content, 'plainText'));
        } catch (error) {
            if (currentRequest === requestId.current) {
                addToast(
                    'Failed to prepare results',
                    error instanceof Error ? error.message : 'Unknown error',
                    'error'
                );
            }
        } finally {
            if (currentRequest === requestId.current) {
                setLoading(false);
            }
        }
    }

    async function copyResults() {
        setCopying(true);

        try {
            await navigator.clipboard.writeText(text);
            addToast(
                'Results copied',
                'The results are ready to paste.',
                'success'
            );
        } catch {
            addToast(
                'Could not copy results',
                'Select the preview text and copy it manually.',
                'error'
            );
        } finally {
            setCopying(false);
        }
    }

    return (
        <>
            <Button
                outline
                onClick={() => setOpen(true)}
                className="shrink-0 cursor-pointer whitespace-nowrap"
            >
                <ClipboardDocumentIcon />
                Copy results
            </Button>

            <Dialog open={open} onClose={closeDialog} size="2xl">
                <DialogTitle>Copy run results</DialogTitle>
                <DialogDescription>
                    Prepare plain text to share in a message or work item.
                    Detailed results include the entire run.
                </DialogDescription>

                {run.status === 'running' && (
                    <p
                        role="status"
                        className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
                    >
                        <strong>Run still in progress.</strong> These results are incomplete
                        and may change.
                    </p>
                )}

                <DialogBody className="space-y-4">
                    <Field>
                        <Label>Include</Label>
                        <Select
                            value={content}
                            disabled={loading || copying}
                            onChange={(event) => {
                                setContent(
                                    event.target.value as ResultContent
                                );
                                setText('');
                            }}
                        >
                            <option value="all">All results</option>
                            <option value="failed">Failed results</option>
                            <option value="summary">Summary</option>
                        </Select>
                    </Field>

                    <Button
                        outline
                        onClick={prepareResults}
                        disabled={loading || copying}
                        className="cursor-pointer"
                    >
                        {loading ? 'Preparing…' : 'Prepare preview'}
                    </Button>

                    {text && (
                        <Field>
                            <Label>Preview</Label>
                            <Textarea
                                value={text}
                                readOnly
                                rows={14}
                                className="font-mono"
                                onFocus={(event) => {
                                    event.currentTarget.select();
                                }}
                            />
                        </Field>
                    )}
                </DialogBody>

                <DialogActions>
                    <Button
                        plain
                        onClick={closeDialog}
                        className="cursor-pointer"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={copyResults}
                        disabled={!text || loading || copying}
                        className="cursor-pointer"
                    >
                        {copying ? 'Copying…' : 'Copy results'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function formatResults(
    snapshot: ResultSnapshot,
    content: ResultContent,
    format: ResultFormat
): string {
    switch (format) {
        case 'plainText':
            return formatPlainText(snapshot, content);
    }
}

function formatPlainText(
    { projectName, run, specs }: ResultSnapshot,
    content: ResultContent
): string {
    const status = getRunStatusPresentation(getRunDisplayStatus(run)).label;
    const lines = [
        `${projectName} — ${formatRunName(run)} — ${status}`,
        `${run.stats.tests} tests: ${run.stats.passed} passed, ${run.stats.failed} failed, ${run.stats.pending} pending, ${run.stats.skipped} skipped`,
    ];

    if (content === 'summary') {
        return lines.join('\n');
    }

    const includedSpecs = specs.filter((spec) =>
        content !== 'failed' || spec.failed > 0 || spec.status === 'failed'
    );

    lines.push('');

    for (const spec of includedSpecs) {
        const result = spec.failed > 0 || spec.status === 'failed'
            ? 'FAIL'
            : spec.pending > 0 || spec.skipped > 0
                ? 'PARTIAL'
                : 'PASS';

        const counts = [
            `${spec.passed} passed`,
            `${spec.failed} failed`,
            ...(spec.pending ? [`${spec.pending} pending`] : []),
            ...(spec.skipped ? [`${spec.skipped} skipped`] : []),
        ].join(', ');

        lines.push(
            `${result} | ${spec.filename} | ${counts} | ${formatDuration(spec.duration)}`
        );
    }

    if (includedSpecs.length === 0) {
        lines.push(
            content === 'failed'
                ? 'No failed specs.'
                : 'No specs recorded.'
        );
    }

    return lines.join('\n');
}
