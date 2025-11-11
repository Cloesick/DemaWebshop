import admin from 'firebase-admin';

let app: admin.app.App | undefined;

function getCredentials() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }
  return null;
}

export function getAdminApp() {
  if (app) return app;
  const creds = getCredentials();
  if (!admin.apps.length) {
    if (creds) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: creds.projectId,
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey as string,
        }),
      });
    } else {
      // Attempt default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
      app = admin.initializeApp();
    }
  } else {
    app = admin.app();
  }
  return app!;
}

export function getAdminAuth() {
  return getAdminApp().auth();
}
