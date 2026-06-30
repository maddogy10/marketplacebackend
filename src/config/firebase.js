import dotenv from "dotenv";
// imports Firebase Admin SDK into backend so server can interact with Firebase services with server-side privileges
import admin from "firebase-admin";

dotenv.config();
// lets you handle errors gracefully, anything that fails jumps to catch section
try {
  // gts firebase service account key for access, and converts JSON text into JS object so it can be used
  // if key doesn't exist, use empty object (parses '{}' into {})
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}",
  );
  // if the project_id is missing, credentials weren't configured correctly
  if (!serviceAccount.project_id) {
    // throws special error, jumps to catch block
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not properly configured",
    );
  }

  // connects backend to Firebase through initialization, starts firebase admin
  admin.initializeApp({
    // creates firebase credential using service account (backend is allowed to act as this service account)
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  // if anything fails, logs it and rethrows it so application stops instead of running with a broken Firebase connection
  console.error("Error initializing Firebase Admin SDK: ", error.message);
  throw error;
}
// allows other files to import already-configured Firebase instance
export default admin;
