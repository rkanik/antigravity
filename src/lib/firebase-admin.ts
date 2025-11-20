import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT;

    if (serviceAccount) {
        try {
            const serviceAccountJson = JSON.parse(serviceAccount);

            // Fix for newlines in private key
            if (serviceAccountJson.private_key) {
                serviceAccountJson.private_key = serviceAccountJson.private_key.replace(/\\n/g, '\n');
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountJson)
            });
            console.log('Firebase Admin initialized successfully');
        } catch (error) {
            console.error('Firebase Admin initialization error', error);
        }
    } else {
        console.error('GOOGLE_SERVICE_ACCOUNT environment variable is not set');
    }
}

export const getAdminDb = () => {
    if (!admin.apps.length) {
        throw new Error("Firebase Admin not initialized. Check GOOGLE_SERVICE_ACCOUNT.");
    }
    return admin.firestore();
};

export const getAdminAuth = () => {
    if (!admin.apps.length) {
        throw new Error("Firebase Admin not initialized. Check GOOGLE_SERVICE_ACCOUNT.");
    }
    return admin.auth();
};
