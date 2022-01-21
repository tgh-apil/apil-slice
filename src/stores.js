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

// for the viewer/simulator set these as defaults in case someone visits /#/viewer directly without pre-loading a model
// change this behavior to load the normal heart from firebase
export const modelTitle = writable('Default Model');
export const modelPoster = writable('Default User');
export const modelDescription = writable('Default Description');
export const modelPath = writable('/gltf/normal.glb');