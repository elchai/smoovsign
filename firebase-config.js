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
let smoovStorage = null;
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
        smoovStorage = firebase.storage();
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

// ==================== FIREBASE STORAGE (images) ====================
async function storageUploadImages(id, docImage, docPages) {
    if (!smoovStorage) return false;
    try {
        // Upload main image
        if (docImage) {
            const ref = smoovStorage.ref(`docs/${id}/docImage`);
            await ref.putString(docImage, 'data_url');
        }
        // Upload pages
        if (docPages && docPages.length > 0) {
            for (let i = 0; i < docPages.length; i++) {
                if (docPages[i]) {
                    const ref = smoovStorage.ref(`docs/${id}/page_${i}`);
                    await ref.putString(docPages[i], 'data_url');
                }
            }
            // Save page count for loading
            const metaRef = smoovStorage.ref(`docs/${id}/_meta.json`);
            await metaRef.putString(JSON.stringify({ pageCount: docPages.length }), 'raw', { contentType: 'application/json' });
        }
        return true;
    } catch (err) {
        console.warn('Storage upload error:', err);
        return false;
    }
}

async function storageDownloadImages(id) {
    if (!smoovStorage) return null;
    try {
        let docImage = null;
        let docPages = [];
        // Download main image
        try {
            const url = await smoovStorage.ref(`docs/${id}/docImage`).getDownloadURL();
            const resp = await fetch(url);
            docImage = await resp.text();
        } catch (e) { /* no main image */ }
        // Check for pages
        try {
            const metaUrl = await smoovStorage.ref(`docs/${id}/_meta.json`).getDownloadURL();
            const metaResp = await fetch(metaUrl);
            const meta = await metaResp.json();
            for (let i = 0; i < meta.pageCount; i++) {
                try {
                    const pageUrl = await smoovStorage.ref(`docs/${id}/page_${i}`).getDownloadURL();
                    const pageResp = await fetch(pageUrl);
                    docPages.push(await pageResp.text());
                } catch (e) { docPages.push(null); }
            }
        } catch (e) { /* no pages */ }
        return (docImage || docPages.length > 0) ? { docImage, docPages } : null;
    } catch (err) {
        console.warn('Storage download error:', err);
        return null;
    }
}

// ==================== FIRESTORE ====================
// Helper: strip large image data before Firestore save
function _stripImages(obj) {
    const copy = JSON.parse(JSON.stringify(obj));
    delete copy.docImage;
    delete copy.docPages;
    return copy;
}

async function firebaseSaveDoc(doc) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        // Save images to Storage, metadata to Firestore
        if (doc.docImage || (doc.docPages && doc.docPages.length)) {
            storageUploadImages(doc.id, doc.docImage, doc.docPages).catch(e => console.warn('Image upload bg error:', e));
        }
        await smoovDb.collection('smoov_docs').doc(doc.id).set(_stripImages(doc));
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
        if (!snap.exists) return null;
        const data = snap.data();
        // Load images from Storage
        const imgs = await storageDownloadImages(docId);
        if (imgs) {
            if (imgs.docImage) data.docImage = imgs.docImage;
            if (imgs.docPages && imgs.docPages.length) data.docPages = imgs.docPages;
        }
        return data;
    } catch (err) {
        console.warn('Firestore load doc error:', err);
        return null;
    }
}

async function firebaseUpdateDoc(doc) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        // Upload images if present
        if (doc.docImage || (doc.docPages && doc.docPages.length)) {
            storageUploadImages(doc.id, doc.docImage, doc.docPages).catch(e => console.warn('Image upload bg error:', e));
        }
        await smoovDb.collection('smoov_docs').doc(doc.id).set(_stripImages(doc));
        return true;
    } catch (err) {
        console.warn('Firestore update doc error:', err);
        return false;
    }
}

// ==================== TEMPLATES ====================
// Templates are stored in smoov_docs collection (same rules as docs, IDs use tpl_ prefix)
async function firebaseSaveTemplate(tpl) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        // Save images to Storage, metadata to Firestore
        if (tpl.docImage || (tpl.docPages && tpl.docPages.length)) {
            await storageUploadImages(tpl.id, tpl.docImage, tpl.docPages);
        }
        await smoovDb.collection('smoov_docs').doc(tpl.id).set(_stripImages(tpl));
        console.log('Template saved to Firebase:', tpl.id);
        return true;
    } catch (err) {
        console.warn('Firestore save template error:', err);
        return false;
    }
}

async function firebaseLoadTemplate(tplId) {
    if (!smoovFirestoreReady || !smoovDb) return null;
    try {
        const snap = await smoovDb.collection('smoov_docs').doc(tplId).get();
        if (!snap.exists) { console.warn('Template not found in Firebase:', tplId); return null; }
        const data = snap.data();
        // Load images from Storage
        const imgs = await storageDownloadImages(tplId);
        if (imgs) {
            if (imgs.docImage) data.docImage = imgs.docImage;
            if (imgs.docPages && imgs.docPages.length) data.docPages = imgs.docPages;
        }
        console.log('Template loaded from Firebase:', tplId);
        return data;
    } catch (err) {
        console.warn('Firestore load template error:', err);
        return null;
    }
}

async function firebaseDeleteTemplate(tplId) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        await smoovDb.collection('smoov_docs').doc(tplId).delete();
        return true;
    } catch (err) {
        console.warn('Firestore delete template error:', err);
        return false;
    }
}
