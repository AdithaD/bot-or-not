import { writable } from 'svelte/store';

export type Toast = { text: string; type: 'error' | 'success' | 'info'; id: number };

export const toasts = writable<Toast[]>([]);

const defaultToastTime = 3000;
let toastId = 0;
export function addToast(
	text: string,
	type: 'error' | 'success' | 'info',
	timeout = defaultToastTime
) {
	let tId = toastId;
	setTimeout(() => {
		toasts.update((toasts) => toasts.filter((toast) => toast.id != tId));
	}, timeout);
	toasts.update((toasts) => [...toasts, { text, type, id: toastId++ }]);
}
