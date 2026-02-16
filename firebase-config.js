// ==================== SMOOV FIREBASE CONFIGURATION ====================
// Firebase Firestore for cross-browser document sharing
// Documents are stored in Firestore so signing links work across devices

const SMOOV_FIREBASE_ENABLED = true;

const smoovFirebaseConfig = {
    apiKey: "AIzaSyCjmXuphRp1MC9L6CNrkgAtcW4eH0HkvTM",
    authDomain: "smoov-sign.firebaseapp.com",
    projectId: "smoov-sign",
    storageBucket: "smoov-sign.firebasestorage.app",
    messagingSenderId: "37806096141",
    appId: "1:37806096141:web:81de52a28dcd0e2cc07a44"
};

let smoovDb = null;
let smoovFirestoreReady = false;

function initSmoovFirebase() {
    if (!SMOOV_FIREBASE_ENABLED || typeof firebase === 'undefined') return false;
    try {
        // Check if already initialized
        if (firebase.apps.length === 0) {
            firebase.initializeApp(smoovFirebaseConfig);
        }
        smoovDb = firebase.firestore();
        smoovFirestoreReady = true;
        console.log('Smoov Firebase initialized');
        return true;
    } catch (err) {
        console.warn('Smoov Firebase init failed:', err);
        return false;
    }
}

// Save a document to Firestore (called when sending)
async function firebaseSaveDoc(doc) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        await smoovDb.collection('smoov_docs').doc(doc.id).set(JSON.parse(JSON.stringify(doc)));
        return true;
    } catch (err) {
        console.warn('Firestore save doc error:', err);
        return false;
    }
}

// Load a document from Firestore by ID (for signing links)
async function firebaseLoadDoc(docId) {
    if (!smoovFirestoreReady || !smoovDb) return null;
    try {
        const snap = await smoovDb.collection('smoov_docs').doc(docId).get();
        if (snap.exists) return snap.data();
        return null;
    } catch (err) {
        console.warn('Firestore load doc error:', err);
        return null;
    }
}

// Update a document in Firestore (after signing a field)
async function firebaseUpdateDoc(doc) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        await smoovDb.collection('smoov_docs').doc(doc.id).set(JSON.parse(JSON.stringify(doc)));
        return true;
    } catch (err) {
        console.warn('Firestore update doc error:', err);
        return false;
    }
}
