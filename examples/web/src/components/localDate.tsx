'use client';

import { formatRunDate } from '@/lib/runPresentation';
import { useEffect, useState } from 'react';

export function LocalDate({ value }: { value: Date }) {
	const [formattedDate, setFormattedDate] = useState<string>();

	useEffect(() => {
		setFormattedDate(formatRunDate(value));
	}, [value]);

	return <time dateTime={value.toISOString()}>{formattedDate ?? '—'}</time>;
}
