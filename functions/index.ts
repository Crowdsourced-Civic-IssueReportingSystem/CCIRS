/**
 * Firebase Cloud Functions Entry Point
 * Wraps the Express app as a Cloud Function
 */

import * as functions from "firebase-functions";
import app from "../src/indexFirestore";

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// Optional: Additional scheduled functions can be added here
// export const scheduledTask = functions.pubsub.schedule('every 24 hours').onRun(async () => {
//   // Scheduled job logic
// });
