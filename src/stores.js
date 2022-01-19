import { writable } from 'svelte/store';

export const userData = writable('');
export const helpBox = writable(false);
export const descriptionBox = writable(true);
export const viewWidth = writable('full-less');
export const titleBox = writable(true);
export const titleBoxPosition = writable('titleBox-min-description');