import { writable } from 'svelte/store';

export const userData = writable('');
export const helpBox = writable(false);
export const descriptionBox = writable(true);
export const titleBox = writable(true);