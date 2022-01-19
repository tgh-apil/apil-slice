import { writable } from 'svelte/store';

export const userData = writable('');
export const helpBox = writable(false);

// all for the descirption box ui
export const btnBoxSize = writable('btn-box-min');
export const descriptionBox = writable(true);
export const descriptionBoxMax = writable(false);
export const viewWidth = writable('full-less');
export const titleBox = writable(true);
export const titleBoxPosition = writable('titleBox-min-description');