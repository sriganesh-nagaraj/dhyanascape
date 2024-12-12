import { clsx, type ClassValue } from 'clsx'
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const firebaseConfig = {
  apiKey: 'AIzaSyDd7DK45mVCgHcMD0rOJhcg4YJAVo6p5n0',
  authDomain: 'dhyanascape-f1433.firebaseapp.com',
  projectId: 'dhyanascape-f1433',
  storageBucket: 'dhyanascape-f1433.firebasestorage.app',
  messagingSenderId: '1067890015453',
  appId: '1:1067890015453:web:cc55a9edfdd6d23b0caf34',
  measurementId: 'G-YPYER6SXQ7',
}

// Initialize Firebase
initializeApp(firebaseConfig)

export const db = getFirestore()
