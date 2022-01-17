import { initializeApp } from 'firebase/app';
import config from './credentials.js';

let firebaseConfig = config;

export let app = initializeApp(firebaseConfig);