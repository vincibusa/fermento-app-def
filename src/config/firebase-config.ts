import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyBJBJFAOSocvG0DhCMxlSfH8Zh_xTmghSg",
    authDomain: "fermento-pizzeria.firebaseapp.com",
    databaseURL: "https://fermento-pizzeria-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "fermento-pizzeria",
    storageBucket: "fermento-pizzeria.firebasestorage.app",
    messagingSenderId: "122203791113",
    appId: "1:122203791113:web:9b41f493a975b64c88bdd8",
    measurementId: "G-EP7TTXCQY3"
  };

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app); 