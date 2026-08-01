import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount
} from "firebase-admin/app";

import {
  getAuth
} from "firebase-admin/auth";

import {
  getFirestore
} from "firebase-admin/firestore";

interface FirebaseServiceAccountJson {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

let cachedAdminApp: App | null = null;

function readServiceAccount():
  ServiceAccount | null {
  const encodedServiceAccount =
    process.env
      .FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!encodedServiceAccount) {
    return null;
  }

  try {
    const decodedJson = Buffer.from(
      encodedServiceAccount,
      "base64"
    ).toString("utf8");

    const parsed =
      JSON.parse(
        decodedJson
      ) as FirebaseServiceAccountJson;

    if (
      !parsed.project_id ||
      !parsed.client_email ||
      !parsed.private_key
    ) {
      throw new Error(
        "The service account JSON is missing required fields."
      );
    }

    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey:
        parsed.private_key.replace(
          /\\n/g,
          "\n"
        )
    };
  } catch (error) {
    console.error(
      "Invalid FIREBASE_SERVICE_ACCOUNT_BASE64:",
      error
    );

    throw new Error(
      "Firebase Admin service account could not be decoded."
    );
  }
}

function getAdminApp(): App {
  if (cachedAdminApp) {
    return cachedAdminApp;
  }

  if (getApps().length > 0) {
    cachedAdminApp = getApp();
    return cachedAdminApp;
  }

  const serviceAccount =
    readServiceAccount();

  cachedAdminApp = serviceAccount
    ? initializeApp({
        credential: cert(serviceAccount)
      })
    : initializeApp({
        /*
         * Local fallback:
         * works when GOOGLE_APPLICATION_CREDENTIALS
         * points to the service-account JSON.
         */
        credential: applicationDefault()
      });

  return cachedAdminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}