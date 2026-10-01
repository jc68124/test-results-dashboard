'use client';

import ToastContainer from '@/components/toast';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
	id: string;
	message: string;
	description?: string;
	type?: ToastType;
}

interface ToastContextType {
	addToast: (message: string, description?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastProps[]>([]);

	const addToast = useCallback((message: string, description?: string, type: ToastType = 'success') => {
		setToasts((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				message,
				description,
				type,
			},
		]);
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const value = useMemo(
		() => ({
			addToast,
		}),
		[addToast]
	);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<ToastContainer toasts={toasts} removeToast={removeToast} />
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);

	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}

	return context;
}
