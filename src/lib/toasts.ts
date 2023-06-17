import { writable } from 'svelte/store';

export type Toast = { text: string; type: 'error' | 'success' | 'info' };

export const toasts = writable<Toast[]>([]);

export function addToast(text: string, type: 'error' | 'success' | 'info', timeout = 5000) {
	setTimeout(() => {
		toasts.update((toasts) => toasts.filter((toast) => toast.text != text));
	}, timeout);
	toasts.update((toasts) => [...toasts, { text, type }]);
}
