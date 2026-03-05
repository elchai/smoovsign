/**
 * SmoovSign SDK - Client-side SDK for digital signatures
 *
 * Usage:
 *   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
 *   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
 *   <script src="https://smoovsign.com/smoov-sdk.js"></script>
 *   <script>
 *     const smoov = new SmoovSDK();
 *     // Create document, get signing link, check status...
 *   </script>
 */

class SmoovSDK {
    constructor(options = {}) {
        this._CHUNK_SIZE = 750000;
        this._db = null;
        this._ready = false;
        this._appUrl = options.appUrl || 'https://smoovsign.com/app.html';

        const config = options.firebaseConfig || {
            apiKey: "AIzaSyCjmXuphRp1MC9L6CNrkgAtcW4eH0HkvTM",
            authDomain: "smoov-sign.firebaseapp.com",
            projectId: "smoov-sign",
            storageBucket: "smoov-sign.firebasestorage.app",
            messagingSenderId: "37806096141",
            appId: "1:37806096141:web:81de52a28dcd0e2cc07a44"
        };

        this._init(config);
    }

    _init(config) {
        if (typeof firebase === 'undefined') {
            console.error('SmoovSDK: Firebase SDK not loaded. Include firebase-app-compat.js and firebase-firestore-compat.js before smoov-sdk.js');
            return;
        }
        try {
            // Use existing Firebase app or create a named one to avoid conflicts
            let app;
            const existing = firebase.apps.find(a => a.name === 'smoov-sdk');
            if (existing) {
                app = existing;
            } else if (firebase.apps.length === 0) {
                app = firebase.initializeApp(config);
            } else {
                app = firebase.initializeApp(config, 'smoov-sdk');
            }
            this._db = firebase.firestore(app);
            this._ready = true;
        } catch (err) {
            console.error('SmoovSDK init error:', err);
        }
    }

    // ==================== Document Creation ====================

    /**
     * Create a document for signing.
     * @param {Object} opts
     * @param {string} opts.fileName - Document name
     * @param {string} opts.docImage - Base64 image of the document (single page)
     * @param {string[]} [opts.docPages] - Array of base64 page images (multi-page)
     * @param {number[]} [opts.pageHeights] - Height of each page in pixels
     * @param {number} [opts.pageWidth] - Width in editor pixels (default 800)
     * @param {Object[]} opts.recipients - Array of { name, email?, phone? }
     * @param {Object[]} opts.fields - Array of field definitions (see below)
     * @param {string} [opts.expiresAt] - ISO date string for expiration
     * @param {string} [opts.createdBy] - Creator email
     * @returns {Promise<{id: string, signUrl: string, doc: Object}>}
     *
     * Field definition:
     *   { type: 'signature'|'text'|'date'|'date_auto'|'checkbox'|'file'|'id_number'|'fullname',
     *     label: string, x: number, y: number, w: number, h: number,
     *     recipientId?: string, required?: boolean }
     */
    async createDocument(opts) {
        this._ensureReady();
        const now = new Date().toISOString();
        const id = 'dm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

        const recipients = (opts.recipients || []).map((r, i) => ({
            id: r.id || 'r_' + (i + 1),
            name: r.name,
            email: r.email || '',
            phone: r.phone || '',
            color: i
        }));

        const fields = (opts.fields || []).map((f, i) => ({
            id: f.id || 'f_' + (i + 1),
            type: f.type || 'text',
            label: f.label || '',
            x: f.x || 0,
            y: f.y || 0,
            w: f.w || 200,
            h: f.h || 40,
            recipientId: f.recipientId || (recipients[0] && recipients[0].id) || 'r_1',
            required: f.required !== false,
            signedValue: '',
            signatureData: null,
            fileData: null
        }));

        const doc = {
            id,
            fileName: opts.fileName || 'מסמך',
            docImage: opts.docImage || null,
            docPages: opts.docPages || [],
            pageHeights: opts.pageHeights || [],
            pageWidth: opts.pageWidth || 800,
            recipients,
            fields,
            status: 'sent',
            createdAt: now,
            createdBy: opts.createdBy || 'sdk',
            ownerUid: opts.ownerUid || '',
            expiresAt: opts.expiresAt || null,
            _fromSDK: true,
            audit: [
                { action: 'created', time: now, detail: 'נוצר דרך SDK' },
                { action: 'sent', time: now, detail: `נשלח ל-${recipients.length} נמענים` }
            ]
        };

        // Save metadata (without images) to Firestore
        const stripped = this._stripImages(doc);
        await this._db.collection('smoov_docs').doc(id).set(stripped);

        // Save images as chunks
        if (doc.docImage || (doc.docPages && doc.docPages.length)) {
            await this._saveImageChunks(id, doc.docImage, doc.docPages);
        }

        return {
            id,
            signUrl: `${this._appUrl}#sign/${id}`,
            doc: stripped
        };
    }

    /**
     * Create a document from an existing template.
     * @param {string} templateId - Template ID (tpl_xxx)
     * @param {Object} [opts]
     * @param {Object[]} [opts.recipients] - Override template recipients
     * @param {string} [opts.createdBy] - Creator email
     * @returns {Promise<{id: string, signUrl: string, fillUrl: string, doc: Object}>}
     */
    async createFromTemplate(templateId, opts = {}) {
        this._ensureReady();
        const tpl = await this.getDocument(templateId);
        if (!tpl) throw new Error('Template not found: ' + templateId);

        const createOpts = {
            fileName: tpl.fileName || tpl.name || 'מסמך',
            docImage: tpl.docImage,
            docPages: tpl.docPages || [],
            pageHeights: tpl.pageHeights || [],
            pageWidth: tpl.pageWidth || 800,
            recipients: opts.recipients || tpl.recipients || [],
            fields: (tpl.fields || []).map(f => ({ ...f, signedValue: '', signatureData: null, fileData: null })),
            createdBy: opts.createdBy || tpl.createdBy || 'sdk'
        };

        const result = await this.createDocument(createOpts);
        // Link back to template
        await this._db.collection('smoov_docs').doc(result.id).update({
            templateId: templateId,
            _fromTemplate: true
        });

        return {
            ...result,
            fillUrl: `${this._appUrl}#fill/${templateId}`
        };
    }

    // ==================== Document Status ====================

    /**
     * Get a document by ID (including image data).
     * @param {string} docId
     * @returns {Promise<Object|null>}
     */
    async getDocument(docId) {
        this._ensureReady();
        const snap = await this._db.collection('smoov_docs').doc(docId).get();
        if (!snap.exists) return null;
        const data = snap.data();

        // Load images from chunks
        const imgs = await this._loadImageChunks(docId);
        if (imgs) {
            if (imgs.docImage) data.docImage = imgs.docImage;
            if (imgs.docPages && imgs.docPages.length) data.docPages = imgs.docPages;
        }
        return data;
    }

    /**
     * Get document status and field completion info (without loading images).
     * @param {string} docId
     * @returns {Promise<{status: string, fields: Object[], recipients: Object[], audit: Object[], completedFields: number, totalFields: number, isComplete: boolean}|null>}
     */
    async getStatus(docId) {
        this._ensureReady();
        const snap = await this._db.collection('smoov_docs').doc(docId).get();
        if (!snap.exists) return null;
        const doc = snap.data();
        const fields = doc.fields || [];
        const completedFields = fields.filter(f => f.signedValue || f.signatureData || f.fileData).length;
        const requiredFields = fields.filter(f => f.required !== false);
        const completedRequired = requiredFields.filter(f => f.signedValue || f.signatureData || f.fileData).length;

        return {
            status: doc.status,
            fields: fields.map(f => ({
                id: f.id,
                type: f.type,
                label: f.label,
                signed: !!(f.signedValue || f.signatureData || f.fileData),
                value: f.signedValue || null
            })),
            recipients: doc.recipients || [],
            audit: doc.audit || [],
            completedFields,
            totalFields: fields.length,
            completedRequired: completedRequired,
            totalRequired: requiredFields.length,
            isComplete: doc.status === 'completed' || completedRequired === requiredFields.length,
            createdAt: doc.createdAt,
            expiresAt: doc.expiresAt
        };
    }

    /**
     * List documents by creator email.
     * @param {string} email
     * @returns {Promise<Object[]>}
     */
    async listDocuments(email) {
        this._ensureReady();
        const snapshot = await this._db.collection('smoov_docs')
            .where('createdBy', '==', email)
            .get();
        const docs = [];
        snapshot.forEach(snap => {
            const d = snap.data();
            if (!d.id || d.id.startsWith('tpl_')) return; // skip templates
            docs.push({
                id: d.id,
                fileName: d.fileName,
                status: d.status,
                createdAt: d.createdAt,
                recipients: (d.recipients || []).map(r => ({ name: r.name, email: r.email })),
                signUrl: `${this._appUrl}#sign/${d.id}`
            });
        });
        return docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    /**
     * List templates by creator email.
     * @param {string} email
     * @returns {Promise<Object[]>}
     */
    async listTemplates(email) {
        this._ensureReady();
        const snapshot = await this._db.collection('smoov_docs')
            .where('createdBy', '==', email)
            .get();
        const templates = [];
        snapshot.forEach(snap => {
            const d = snap.data();
            if (!d.id || !d.id.startsWith('tpl_')) return; // only templates
            templates.push({
                id: d.id,
                name: d.name || d.fileName,
                createdAt: d.createdAt,
                fields: (d.fields || []).map(f => ({ type: f.type, label: f.label })),
                fillUrl: `${this._appUrl}#fill/${d.id}`
            });
        });
        return templates.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }

    // ==================== Realtime Listener ====================

    /**
     * Listen for realtime changes on a document.
     * @param {string} docId
     * @param {function} callback - Called with (doc) on every change
     * @returns {function} unsubscribe function
     */
    onDocumentChange(docId, callback) {
        this._ensureReady();
        return this._db.collection('smoov_docs').doc(docId).onSnapshot(snap => {
            if (snap.exists) callback(snap.data());
        });
    }

    /**
     * Wait for a document to be fully signed (all required fields completed).
     * @param {string} docId
     * @param {number} [timeoutMs=0] - Timeout in ms (0 = no timeout)
     * @returns {Promise<Object>} Resolves with the completed document
     */
    waitForCompletion(docId, timeoutMs = 0) {
        this._ensureReady();
        return new Promise((resolve, reject) => {
            let timer;
            const unsub = this.onDocumentChange(docId, doc => {
                const fields = doc.fields || [];
                const required = fields.filter(f => f.required !== false);
                const done = required.filter(f => f.signedValue || f.signatureData || f.fileData);
                if (done.length === required.length || doc.status === 'completed') {
                    unsub();
                    if (timer) clearTimeout(timer);
                    resolve(doc);
                }
            });
            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    unsub();
                    reject(new Error('Timeout waiting for document completion'));
                }, timeoutMs);
            }
        });
    }

    // ==================== Signing URL Helpers ====================

    /**
     * Get the signing URL for a document.
     * @param {string} docId
     * @returns {string}
     */
    getSignUrl(docId) {
        return `${this._appUrl}#sign/${docId}`;
    }

    /**
     * Get the fill URL for a template.
     * @param {string} templateId
     * @returns {string}
     */
    getFillUrl(templateId) {
        return `${this._appUrl}#fill/${templateId}`;
    }

    /**
     * Open signing page in a new window/tab.
     * @param {string} docId
     * @returns {Window|null}
     */
    openSignPage(docId) {
        return window.open(this.getSignUrl(docId), '_blank');
    }

    // ==================== Delete ====================

    /**
     * Delete a document from Firestore.
     * @param {string} docId
     * @returns {Promise<boolean>}
     */
    async deleteDocument(docId) {
        this._ensureReady();
        try {
            // Delete image chunks
            const chunksRef = this._db.collection('smoov_docs').doc(docId).collection('img_chunks');
            const snap = await chunksRef.get();
            if (!snap.empty) {
                const batch = this._db.batch();
                snap.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
            await this._db.collection('smoov_docs').doc(docId).delete();
            return true;
        } catch (err) {
            console.error('SmoovSDK deleteDocument error:', err);
            return false;
        }
    }

    // ==================== Internal Helpers ====================

    _ensureReady() {
        if (!this._ready) throw new Error('SmoovSDK not initialized. Make sure Firebase SDK is loaded.');
    }

    _stripImages(obj) {
        const copy = JSON.parse(JSON.stringify(obj));
        delete copy.docImage;
        delete copy.docPages;
        return copy;
    }

    async _saveImageChunks(docId, docImage, docPages) {
        const chunksRef = this._db.collection('smoov_docs').doc(docId).collection('img_chunks');
        const writes = [];
        let chunkIdx = 0;

        if (docImage) {
            for (let i = 0; i < docImage.length; i += this._CHUNK_SIZE) {
                writes.push(chunksRef.doc('c_' + chunkIdx).set({
                    type: 'docImage', idx: Math.floor(i / this._CHUNK_SIZE),
                    data: docImage.substring(i, i + this._CHUNK_SIZE)
                }));
                chunkIdx++;
            }
        }
        if (docPages && docPages.length > 0) {
            for (let p = 0; p < docPages.length; p++) {
                if (!docPages[p]) continue;
                for (let i = 0; i < docPages[p].length; i += this._CHUNK_SIZE) {
                    writes.push(chunksRef.doc('c_' + chunkIdx).set({
                        type: 'page', page: p, idx: Math.floor(i / this._CHUNK_SIZE),
                        data: docPages[p].substring(i, i + this._CHUNK_SIZE)
                    }));
                    chunkIdx++;
                }
            }
        }
        writes.push(chunksRef.doc('_meta').set({
            totalChunks: chunkIdx,
            pageCount: (docPages && docPages.length) || 0,
            hasDocImage: !!docImage
        }));
        await Promise.all(writes);
    }

    async _loadImageChunks(docId) {
        try {
            const chunksRef = this._db.collection('smoov_docs').doc(docId).collection('img_chunks');
            const metaSnap = await chunksRef.doc('_meta').get();
            if (!metaSnap.exists) return null;
            const snapshot = await chunksRef.get();
            if (snapshot.empty) return null;

            const chunks = [];
            snapshot.forEach(doc => { if (doc.id !== '_meta') chunks.push(doc.data()); });

            let docImage = null;
            const imgChunks = chunks.filter(c => c.type === 'docImage').sort((a, b) => a.idx - b.idx);
            if (imgChunks.length > 0) docImage = imgChunks.map(c => c.data).join('');

            const docPages = [];
            const meta = metaSnap.data();
            for (let p = 0; p < (meta.pageCount || 0); p++) {
                const pageChunks = chunks.filter(c => c.type === 'page' && c.page === p).sort((a, b) => a.idx - b.idx);
                docPages.push(pageChunks.length > 0 ? pageChunks.map(c => c.data).join('') : null);
            }

            return (docImage || docPages.length > 0) ? { docImage, docPages } : null;
        } catch (err) {
            console.warn('SmoovSDK _loadImageChunks error:', err);
            return null;
        }
    }
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmoovSDK;
}
