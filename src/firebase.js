const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)

export const firebaseConfigError =
  missingConfig.length > 0
    ? `Missing Firebase settings: ${missingConfig.join(', ')}. Add them to the project root .env file and restart Vite.`
    : ''

let appPromise

async function getFirebaseApp() {
  if (firebaseConfigError) {
    throw new Error(firebaseConfigError)
  }

  if (!appPromise) {
    appPromise = import('firebase/app').then(({ getApp, getApps, initializeApp }) =>
      getApps().some((registeredApp) => registeredApp.name === '[DEFAULT]')
        ? getApp()
        : initializeApp(firebaseConfig),
    )
  }

  return appPromise
}

export async function getFirebaseAuth() {
  const [app, authSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/auth'),
  ])

  return {
    auth: authSdk.getAuth(app),
    authSdk,
  }
}

export async function getFirebaseFirestore() {
  const [app, firestoreSdk] = await Promise.all([
    getFirebaseApp(),
    import('firebase/firestore'),
  ])

  return {
    db: firestoreSdk.getFirestore(app),
    firestoreSdk,
  }
}
