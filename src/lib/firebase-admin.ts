import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const hasFirebaseCredentials = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (!getApps().length && hasFirebaseCredentials) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Prevent calling getFirestore() / getAuth() if no Firebase app has been initialized,
// which avoids throwing an error during the Next.js build phase.
export const adminDb = (hasFirebaseCredentials || getApps().length) ? getFirestore() : null as any;
export const adminAuth = (hasFirebaseCredentials || getApps().length) ? getAuth() : null as any;

