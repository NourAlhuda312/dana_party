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
  getAuth,
  type Auth
} from "firebase-admin/auth";

import {
  getFirestore,
  type Firestore
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
      .FIREBASE_SERVICE_ACCOUNT_BASE64
      ?.trim();

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
        "The service account JSON is missing project_id, client_email, or private_key."
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
      "Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 configuration:",
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

  if (serviceAccount) {
    cachedAdminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId
    });

    return cachedAdminApp;
  }

  const localCredentialsPath =
    process.env
      .GOOGLE_APPLICATION_CREDENTIALS
      ?.trim();

  if (
    process.env.NODE_ENV ===
      "production" ||
    !localCredentialsPath
  ) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_BASE64 is missing."
    );
  }

  cachedAdminApp = initializeApp({
    credential: applicationDefault()
  });

  return cachedAdminApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}