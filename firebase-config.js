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

// ==================== IMAGE CHUNKS (Firestore subcollection) ====================
// Splits large base64 strings into ~750KB chunks stored in Firestore subcollection
const _CHUNK_SIZE = 750000; // 750KB per chunk (Firestore limit is ~1MB per doc)

async function _saveImageChunks(docId, docImage, docPages) {
    if (!smoovFirestoreReady || !smoovDb) return false;
    try {
        const chunksRef = smoovDb.collection('smoov_docs').doc(docId).collection('img_chunks');
        const batch = smoovDb.batch();
        let chunkIdx = 0;

        // Save docImage in chunks
        if (docImage) {
            for (let i = 0; i < docImage.length; i += _CHUNK_SIZE) {
                batch.set(chunksRef.doc('c_' + chunkIdx), {
                    type: 'docImage',
                    idx: Math.floor(i / _CHUNK_SIZE),
                    data: docImage.substring(i, i + _CHUNK_SIZE)
                });
                chunkIdx++;
            }
        }

        // Save each page in chunks
        if (docPages && docPages.length > 0) {
            for (let p = 0; p < docPages.length; p++) {
                if (!docPages[p]) continue;
                const page = docPages[p];
                for (let i = 0; i < page.length; i += _CHUNK_SIZE) {
                    batch.set(chunksRef.doc('c_' + chunkIdx), {
                        type: 'page',
                        page: p,
                        idx: Math.floor(i / _CHUNK_SIZE),
                        data: page.substring(i, i + _CHUNK_SIZE)
                    });
                    chunkIdx++;
                }
            }
        }

        // Save meta (how many chunks total, page count)
        batch.set(chunksRef.doc('_meta'), {
            totalChunks: chunkIdx,
            pageCount: (docPages && docPages.length) || 0,
            hasDocImage: !!docImage
        });

        // Firestore batch limit is 500 writes. If more, use multiple batches.
        if (chunkIdx <= 498) {
            await batch.commit();
        } else {
            // Fallback: write sequentially for very large docs
            const writes = [];
            if (docImage) {
                for (let i = 0; i < docImage.length; i += _CHUNK_SIZE) {
                    writes.push(chunksRef.doc('img_' + writes.length).set({
                        type: 'docImage', idx: Math.floor(i / _CHUNK_SIZE),
                        data: docImage.substring(i, i + _CHUNK_SIZE)
                    }));
                }
            }
            if (docPages) {
                for (let p = 0; p < docPages.length; p++) {
                    if (!docPages[p]) continue;
                    for (let i = 0; i < docPages[p].length; i += _CHUNK_SIZE) {
                        writes.push(chunksRef.doc('img_' + writes.length).set({
                            type: 'page', page: p, idx: Math.floor(i / _CHUNK_SIZE),
                            data: docPages[p].substring(i, i + _CHUNK_SIZE)
                        }));
                    }
                }
            }
            writes.push(chunksRef.doc('_meta').set({
                totalChunks: writes.length, pageCount: (docPages && docPages.length) || 0, hasDocImage: !!docImage
            }));
            await Promise.all(writes);
        }
        return true;
    } catch (err) {
        console.warn('Image chunks save error:', err);
        return false;
    }
}

async function _loadImageChunks(docId) {
    if (!smoovFirestoreReady || !smoovDb) return null;
    try {
        const chunksRef = smoovDb.collection('smoov_docs').doc(docId).collection('img_chunks');
        const metaSnap = await chunksRef.doc('_meta').get();
        if (!metaSnap.exists) return null;

        const snapshot = await chunksRef.get();
        if (snapshot.empty) return null;

        const chunks = [];
        snapshot.forEach(doc => {
            if (doc.id !== '_meta') chunks.push(doc.data());
        });

        // Reassemble docImage
        let docImage = null;
        const imgChunks = chunks.filter(c => c.type === 'docImage').sort((a, b) => a.idx - b.idx);
        if (imgChunks.length > 0) {
            docImage = imgChunks.map(c => c.data).join('');
        }

        // Reassemble pages
        const docPages = [];
        const meta = metaSnap.data();
        for (let p = 0; p < (meta.pageCount || 0); p++) {
            const pageChunks = chunks.filter(c => c.type === 'page' && c.page === p).sort((a, b) => a.idx - b.idx);
            if (pageChunks.length > 0) {
                docPages.push(pageChunks.map(c => c.data).join(''));
            } else {
                docPages.push(null);
            }
        }

        return (docImage || docPages.length > 0) ? { docImage, docPages } : null;
    } catch (err) {
        console.warn('Image chunks load error:', err);
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
        await smoovDb.collection('smoov_docs').doc(doc.id).set(_stripImages(doc));
        // Save images as chunks in background
        if (doc.docImage || (doc.docPages && doc.docPages.length)) {
            _saveImageChunks(doc.id, doc.docImage, doc.docPages).catch(e => console.warn('Image chunks bg error:', e));
        }
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
        // Load images from chunks
        const imgs = await _loadImageChunks(docId);
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
        await smoovDb.collection('smoov_docs').doc(doc.id).set(_stripImages(doc));
        if (doc.docImage || (doc.docPages && doc.docPages.length)) {
            _saveImageChunks(doc.id, doc.docImage, doc.docPages).catch(e => console.warn('Image chunks bg error:', e));
        }
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
        // Save metadata to Firestore first (fast)
        await smoovDb.collection('smoov_docs').doc(tpl.id).set(_stripImages(tpl));
        console.log('Template metadata saved to Firebase:', tpl.id);
        // Save images as chunks (wait for completion so fill links work immediately)
        if (tpl.docImage || (tpl.docPages && tpl.docPages.length)) {
            const ok = await _saveImageChunks(tpl.id, tpl.docImage, tpl.docPages);
            if (ok) console.log('Template images saved:', tpl.id);
            else console.warn('Template image save failed:', tpl.id);
        }
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
        // Load images from chunks
        const imgs = await _loadImageChunks(tplId);
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
        // Delete chunks subcollection
        try {
            const chunksRef = smoovDb.collection('smoov_docs').doc(tplId).collection('img_chunks');
            const snap = await chunksRef.get();
            const batch = smoovDb.batch();
            snap.forEach(doc => batch.delete(doc.ref));
            if (!snap.empty) await batch.commit();
        } catch (e) { /* chunks may not exist */ }
        await smoovDb.collection('smoov_docs').doc(tplId).delete();
        return true;
    } catch (err) {
        console.warn('Firestore delete template error:', err);
        return false;
    }
}
