import { writable } from 'svelte/store';

export const userData = writable('');

// all for the descirption box ui
export const descriptionBoxGroupShow = writable(true);
export const helpBox = writable(false);

export const btnBoxSizeShow = writable(true);
export const btnBoxSize = writable('btn-box-min');

export const descriptionBox = writable(true);
export const descriptionBoxMax = writable(false);
export const viewWidth = writable('full-less');

export const titleBox = writable(true);
export const titleBoxPosition = writable('titleBox-min-description');

// can we set this based on the route?
export const currentView = writable('home');

// for the viewer/simulator
export const modelPath = writable('/gltf/normal.glb');