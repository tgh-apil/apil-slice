import { writable } from 'svelte/store';

export const userData = writable('');

// all for the descirption box ui
export const helpBox = writable(false);
export const descriptionBoxShow = writable(false);
export const viewWidth = writable('full');
export const decsriptionBoxHeight = writable('15%');
export const titleBox = writable(true);

export const navBarSize = writable('navbar-full');
export const uploadPanelShow = writable(false);
export const editModelDataOn = writable(false);

// can we set this based on the route?
export const currentView = writable('home');

// for the viewer/simulator set these as defaults in case someone visits /#/viewer directly without pre-loading a model
// change this behavior to load the normal heart from firebase
export const modelTitle = writable('Default Model');
export const modelPoster = writable('Default User');
export const modelDescription = writable('Default Description');
export const modelPath = writable('normal_heart.glb');
export const modelType = writable('heart');
export const modelId = writable('000');
export const modelDownloadUrl = writable('#');
export const storeUrlList = writable(false);
export const annotations = writable(false);

// use this as the default position list if none are on firebase
export const savedControlSphereList = writable({
    0: 
        {
            x: 25.3,
            y: 119.74,
            z: 63.12,
        },
    1: 
        {
            x: 13.2,
            y: 25.0,
            z: 46.83,
        },
    2: 
        {
            x: -52.74,
            y: -10.8,
            z: -70.77,
        }
});

export const userBookmarks = writable([]);
export const activateUltrasoundGlobal = writable(false);