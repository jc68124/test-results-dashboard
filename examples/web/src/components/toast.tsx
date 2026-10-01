'use client';

import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
	id: string;
	message: string;
	description?: string;
	type?: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
	toasts: ToastProps[];
	removeToast: (id: string) => void;
}

export default function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return createPortal(
		<div
			role="status"
			aria-live="polite"
			className="pointer-events-none fixed right-0 bottom-5 z-9999 flex w-full flex-col items-center space-y-4 px-4 sm:right-5 sm:items-end sm:space-y-2 sm:px-0"
		>
			{toasts.map((toast) => (
				<Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
			))}
		</div>,
		document.body
	);
}

function Toast({ id, message, description, type = 'success', onClose }: ToastProps & { onClose: () => void }) {
	const [show, setShow] = useState(true);

	useEffect(() => {
		setTimeout(() => {
			setShow(false);
			setTimeout(onClose, 300);
		}, 5000);
	}, [onClose]);

	const iconMap = {
		success: <CheckCircleIcon className="size-6 text-green-400" />,
		error: <XCircleIcon className="size-6 text-red-400" />,
		info: <InformationCircleIcon className="size-6 text-blue-400" />,
	};

	return (
		<Transition
			show={show}
			appear
			enter="transition transform ease-out duration-300"
			enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-4"
			enterTo="opacity-100 translate-y-0 sm:translate-x-0"
			leave="transition transform ease-in duration-300"
			leaveFrom="opacity-100 translate-y-0 sm:translate-x-0"
			leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:translate-x-4"
		>
			<div className="pointer-events-auto mx-auto w-[min(100vw-2rem,24rem)] overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 sm:mx-0 sm:max-w-sm dark:bg-zinc-800">
				<div className="flex items-start p-4">
					<div className="shrink-0">{iconMap[type]}</div>
					<div className="ml-3 w-0 flex-1">
						<p className="text-sm font-medium text-gray-900 dark:text-white">{message}</p>
						{description && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{description}</p>}
					</div>
					<div className="ml-4 flex shrink-0">
						<button
							type="button"
							onClick={() => {
								setShow(false);
								setTimeout(onClose, 300);
							}}
							className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							<span className="sr-only">Close</span>
							<XMarkIcon className="size-5" />
						</button>
					</div>
				</div>
			</div>
		</Transition>
	);
}
