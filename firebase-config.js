// ==================== SMOOVSIGN FIREBASE CONFIGURATION ====================
// Firebase Firestore for cross-browser document sharing
// Firebase Auth for Google Sign-In

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
let smoovAuth = null;
let smoovFirestoreReady = false;
let smoovCurrentUser = null;

function initSmoovFirebase() {
    if (!SMOOV_FIREBASE_ENABLED || typeof firebase === 'undefined') return false;
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(smoovFirebaseConfig);
        }
        smoovDb = firebase.firestore();
        smoovAuth = firebase.auth();
        smoovFirestoreReady = true;
        console.log('SmoovSign Firebase initialized');

        // Listen for auth state changes
        smoovAuth.onAuthStateChanged(user => {
            smoovCurrentUser = user;
            if (typeof onAuthStateChanged === 'function') {
                onAuthStateChanged(user);
            }
        });

        return true;
    } catch (err) {
        console.warn('SmoovSign Firebase init failed:', err);
        return false;
    }
}

// ==================== AUTH ====================
async function signInWithGoogle() {
    if (!smoovAuth) {
        toast('שגיאה באתחול Firebase', 'error');
        return;
    }
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await smoovAuth.signInWithPopup(provider);
    } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') return;
        console.error('Google sign-in error:', err);
        toast('שגיאה בהתחברות עם Google', 'error');
    }
}

async function signOut() {
    if (!smoovAuth) return;
    try {
        await smoovAuth.signOut();
        closeUserDropdown();
    } catch (err) {
        console.error('Sign out error:', err);
    }
}

function toggleUserDropdown() {
    const dd = document.getElementById('userDropdown');
    dd.classList.toggle('hidden');
    if (!dd.classList.contains('hidden')) {
        setTimeout(() => document.addEventListener('click', closeUserDropdownOnClick, { once: true }), 0);
    }
}

function closeUserDropdownOnClick(e) {
    const dd = document.getElementById('userDropdown');
    if (dd && !dd.contains(e.target)) dd.classList.add('hidden');
}

function closeUserDropdown() {
    const dd = document.getElementById('userDropdown');
    if (dd) dd.classList.add('hidden');
}

// ==================== FIRESTORE ====================
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

// ==================== TEMPLATES ====================
async function firebaseSaveTemplate(tpl) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        await smoovDb.collection('smoov_templates').doc(tpl.id).set(JSON.parse(JSON.stringify(tpl)));
        return true;
    } catch (err) {
        console.warn('Firestore save template error:', err);
        return false;
    }
}

async function firebaseLoadTemplate(tplId) {
    if (!smoovFirestoreReady || !smoovDb) return null;
    try {
        const snap = await smoovDb.collection('smoov_templates').doc(tplId).get();
        if (snap.exists) return snap.data();
        return null;
    } catch (err) {
        console.warn('Firestore load template error:', err);
        return null;
    }
}

async function firebaseDeleteTemplate(tplId) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        await smoovDb.collection('smoov_templates').doc(tplId).delete();
        return true;
    } catch (err) {
        console.warn('Firestore delete template error:', err);
        return false;
    }
}
