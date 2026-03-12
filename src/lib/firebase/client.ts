"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const fallbackConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyB6xFIHo1dScHVia598sWrfJ90OVms0U8E",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "nanny-tech.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "nanny-tech",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "nanny-tech.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "269966152674",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:269966152674:web:310da6b6d60f4e4eb75fbb"
};

export function getClientApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(fallbackConfig);
}

export function getClientAuth() {
  return getAuth(getClientApp());
}
