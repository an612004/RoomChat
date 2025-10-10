"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
require("firebase/firestore");
require("firebase/analytics");
require("firebase/auth");
console.log('🔄 Checking Firebase connection...');
let db;
let app;
try {
    // Check if Firebase app is already initialized
    if ((0, app_1.getApps)().length === 0) {
        // Initialize Firebase Admin with service account for "minitrelooapp" project
        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID || "minitrelooapp",
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
            private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
            client_id: process.env.FIREBASE_CLIENT_ID || "",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || ""
        };
        // Only initialize if we have valid credentials
        if (serviceAccount.project_id && serviceAccount.client_email && serviceAccount.private_key) {
            app = (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(serviceAccount),
                projectId: serviceAccount.project_id
            });
            exports.db = db = (0, firestore_1.getFirestore)(app);
            console.log('✅ Firebase Admin SDK initialized successfully!');
            console.log('� Project ID:', serviceAccount.project_id);
            // Test connection
            db.collection('_test').limit(1).get()
                .then(() => {
                console.log('✅ Firebase Firestore connection successful!');
            })
                .catch((error) => {
                console.log('⚠️  Firebase Firestore connection test failed:', error.message);
            });
        }
        else {
            throw new Error('Missing Firebase service account credentials');
        }
    }
    else {
        app = (0, app_1.getApps)()[0];
        exports.db = db = (0, firestore_1.getFirestore)(app);
        console.log('✅ Firebase app already initialized');
    }
}
catch (error) {
    console.log('❌ Firebase initialization failed:', error instanceof Error ? error.message : 'Unknown error');
    console.log('📝 Using mock Firebase for development...');
    // Fallback to mock implementation
    exports.db = db = {
        collection: (path) => ({
            add: (data) => Promise.resolve({ id: 'mock-id' }),
            get: () => Promise.resolve({ empty: true, docs: [] }),
            limit: () => ({
                get: () => Promise.resolve({ empty: true, docs: [] })
            }),
            doc: (id) => ({
                get: () => Promise.resolve({ exists: false, data: () => null }),
                set: (data) => Promise.resolve(),
                update: (data) => Promise.resolve(),
                delete: () => Promise.resolve()
            }),
            where: () => ({
                get: () => Promise.resolve({ empty: true, docs: [] })
            })
        })
    };
}
