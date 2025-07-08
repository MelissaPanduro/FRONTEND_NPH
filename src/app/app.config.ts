import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { provideFirebaseApp, initializeApp, getApps, getApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDDz8hbW_znZtwfNDQ_sX3HYztwyxA-ciU",
  authDomain: "nhp-gal.firebaseapp.com",
  projectId: "nhp-gal",
  storageBucket: "nhp-gal.firebasestorage.app",
  messagingSenderId: "310959380960",
  appId: "1:310959380960:web:3872950d5e404396d9b385",
  measurementId: "G-YE2W80F2DR"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    provideFirebaseApp(() => {
      if (!getApps().length) {
        return initializeApp(firebaseConfig);
      } else {
        return getApp();
      }
    }),
    provideAuth(() => getAuth())
  ]
};
