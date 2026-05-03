const admin = require('firebase-admin');

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || "invalid",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  }
  module.exports = admin;
} catch (e) {
  console.warn("⚠️ Firebase Admin SDK failed to initialize - running with mock auth");
  // Export a true mock object instead of mutating the module
  module.exports = {
    auth: () => ({
      verifyIdToken: async (token) => {
        // Parse token if possible to get email/uid for UI testing, otherwise use defaults
        let uid = "mock-uid-123";
        let email = "test@example.com";
        try {
          // crude decode to allow different mock users
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          if (payload.user_id) uid = payload.user_id;
          if (payload.email) email = payload.email;
        } catch { /* ignore */ }

        return { 
          uid, 
          email, 
          name: email.split('@')[0],
          email_verified: true
        };
      }
    })
  };
}
