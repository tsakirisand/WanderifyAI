import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

const hasFirebaseCredentials = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

if (!getApps().length && hasFirebaseCredentials) {
  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel stores \n as literal \\n — this converts it back
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    adminApp = null;
  }
} else if (getApps().length) {
  adminApp = getApps()[0];
}

// ONLY call getFirestore/getAuth if an app was actually initialized successfully.
// Using hasFirebaseCredentials alone is wrong — credentials can exist but still fail.
export const adminDb = adminApp ? getFirestore(adminApp) : null as any;
export const adminAuth = adminApp ? getAuth(adminApp) : null as any;
