// ==================== SmoovSign - Digital Signature App ====================
// Standalone signature system

// ==================== STATE ====================
const DM = {
    view: 'home', // home, docs_all, docs_sent, docs_drafts, docs_deleted, docs_waiting, templates, contacts, create, sign
    docs: JSON.parse(localStorage.getItem('smoov_docs') || '[]'),
    templates: JSON.parse(localStorage.getItem('smoov_templates') || '[]'),
    // Editor state
    step: 1,
    docImage: null,
    docPages: [], // array of page images for multi-page PDFs
    fileName: '',
    recipients: [],
    fields: [],
    selectedFieldId: null,
    activeRecipientId: null,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    dragItem: null,
    dragOffset: { x: 0, y: 0 },
    resizeStart: {},
    _selectedDocs: [], // multi-select document IDs
    _userProfile: null, // { plan: 'full'|'trial', sendCount, ... }
    isTemplate: false, // true when creating a template
    editingTemplateId: null,
    signDocId: null,
    recipientSearch: '',
    // Form Builder state
    formTitle: '',
    formDescription: '',
    formLogo: null,
    formFields: [],
    _isFormBuilder: false,
    _formSheetsUrl: '',
    _formMakeUrl: '',
    fieldColors: [
        { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8', fill: '#2563eb' },
        { bg: '#f3e8ff', border: '#7c3aed', text: '#6d28d9', fill: '#7c3aed' },
        { bg: '#dcfce7', border: '#16a34a', text: '#15803d', fill: '#16a34a' },
        { bg: '#ffedd5', border: '#ea580c', text: '#c2410c', fill: '#ea580c' }
    ]
};

// HTML-escape to prevent XSS from user-controlled strings
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// SVG Icons (monochrome, no emoji)
const ICO = {
    edit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
    bell: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    log: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    doc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    send: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    eye: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    pen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    sign: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>',
    calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    id: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    checkbox: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>',
    share: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    dropdown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="8 10 12 14 16 10"/></svg>',
    heading: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>',
    paragraph: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>',
    number: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17l6-12"/><path d="M14 17l6-12"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/></svg>',
    text: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
};

const FORM_FIELD_TYPES = [
    { type: 'text', label: 'טקסט חופשי', icon: 'text' },
    { type: 'number', label: 'מספר', icon: 'number' },
    { type: 'fullname', label: 'שם מלא', icon: 'user' },
    { type: 'id_number', label: 'תעודת זהות', icon: 'id' },
    { type: 'date', label: 'תאריך', icon: 'calendar' },
    { type: 'checkbox', label: 'תיבת סימון', icon: 'checkbox' },
    { type: 'signature', label: 'חתימה', icon: 'pen' },
    { type: 'file', label: 'צירוף קובץ', icon: 'doc' },
    { type: 'dropdown', label: 'בחירה מרשימה', icon: 'dropdown' },
    { type: 'heading', label: 'כותרת', icon: 'heading' },
    { type: 'paragraph', label: 'פסקה/הסבר', icon: 'paragraph' },
];

// ==================== IndexedDB for large image data ====================
const _idbName = 'smoov_images_db';
const _idbStore = 'images';
let _idb = null;

function openImageDB() {
    return new Promise((resolve, reject) => {
        if (_idb) { resolve(_idb); return; }
        const req = indexedDB.open(_idbName, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(_idbStore);
        req.onsuccess = () => { _idb = req.result; resolve(_idb); };
        req.onerror = () => reject(req.error);
    });
}

async function idbSaveImages(id, images) {
    try {
        const db = await openImageDB();
        return new Promise((resolve) => {
            const tx = db.transaction(_idbStore, 'readwrite');
            tx.objectStore(_idbStore).put(images, id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    } catch { return false; }
}

async function idbLoadImages(id) {
    try {
        const db = await openImageDB();
        return new Promise((resolve) => {
            const tx = db.transaction(_idbStore, 'readonly');
            const req = tx.objectStore(_idbStore).get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch { return null; }
}

async function idbDeleteImages(id) {
    try {
        const db = await openImageDB();
        return new Promise((resolve) => {
            const tx = db.transaction(_idbStore, 'readwrite');
            tx.objectStore(_idbStore).delete(id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        });
    } catch { return false; }
}

// Save images to IndexedDB, metadata to localStorage
function save() {
    // Strip large image data from localStorage copies
    const docsLite = DM.docs.map(d => {
        const copy = Object.assign({}, d);
        delete copy.docImage;
        delete copy.docPages;
        return copy;
    });
    const tplsLite = DM.templates.map(t => {
        const copy = Object.assign({}, t);
        delete copy.docImage;
        delete copy.docPages;
        return copy;
    });
    try {
        localStorage.setItem('smoov_docs', JSON.stringify(docsLite));
        localStorage.setItem('smoov_templates', JSON.stringify(tplsLite));
    } catch (e) {
        console.warn('localStorage save error:', e);
    }
    // Save images to IndexedDB in background
    DM.docs.forEach(d => {
        if (d.id && (d.docImage || (d.docPages && d.docPages.length))) {
            idbSaveImages(d.id, { docImage: d.docImage, docPages: d.docPages });
        }
    });
    DM.templates.forEach(t => {
        if (t.id && (t.docImage || (t.docPages && t.docPages.length))) {
            idbSaveImages(t.id, { docImage: t.docImage, docPages: t.docPages });
        }
    });
}

// Load images from IndexedDB back into DM arrays on startup
async function restoreImagesFromIDB() {
    for (const d of DM.docs) {
        if (d.id && !d.docImage) {
            const imgs = await idbLoadImages(d.id);
            if (imgs) { d.docImage = imgs.docImage; d.docPages = imgs.docPages || []; }
        }
    }
    for (const t of DM.templates) {
        if (t.id && !t.docImage) {
            const imgs = await idbLoadImages(t.id);
            if (imgs) { t.docImage = imgs.docImage; t.docPages = imgs.docPages || []; }
        }
    }
}

function smoovConfirm(message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `<div class="modal-card" style="max-width:380px;text-align:center;">
            <p style="font-weight:600;font-size:1em;margin-bottom:20px;">${esc(message)}</p>
            <div style="display:flex;gap:8px;justify-content:center;">
                <button class="btn btn-outline" id="_confirmNo">ביטול</button>
                <button class="btn btn-danger" id="_confirmYes">אישור</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        const dismiss = () => { overlay.remove(); document.removeEventListener('keydown', escH); resolve(false); };
        const confirm = () => { overlay.remove(); document.removeEventListener('keydown', escH); resolve(true); };
        overlay.querySelector('#_confirmYes').onclick = confirm;
        overlay.querySelector('#_confirmNo').onclick = dismiss;
        overlay.onclick = e => { if (e.target === overlay) dismiss(); };
        const escH = e => { if (e.key === 'Escape') dismiss(); };
        document.addEventListener('keydown', escH);
    });
}

function friendlyError(err) {
    const m = (err && err.message) || '';
    if (m.includes('permission') || m.includes('PERMISSION_DENIED')) return 'אין הרשאה לבצע פעולה זו';
    if (m.includes('quota') || m.includes('QuotaExceeded')) return 'נגמר מקום האחסון';
    if (m.includes('network') || m.includes('offline') || m.includes('Failed to fetch')) return 'בעיית חיבור לאינטרנט';
    if (m.includes('not-found') || m.includes('NOT_FOUND')) return 'הפריט לא נמצא';
    return 'נסה שוב';
}

function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type}`;
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => el.className = 'toast hidden', duration);
}

// ==================== NAVIGATION ====================
function switchView(view) {
    DM.view = view;
    DM._selectedDocs = []; // clear multi-select on view change
    // Reset sub-filters when switching views
    if (!view.startsWith('docs_')) { DM._dashFilter = 'all'; DM._dashSearch = ''; }
    closeMobileMenu(); // close sidebar on mobile after navigation
    render();
}

// Sidebar expand state
if (!DM._sidebarOpen) DM._sidebarOpen = { docs: true, templates: false };

function toggleSidebarGroup(group) {
    DM._sidebarOpen[group] = !DM._sidebarOpen[group];
    renderSidebar();
}

function renderSidebar() {
    const sb = document.getElementById('appSidebar');
    if (!sb) return;

    const v = DM.view;
    const waitingCount = DM.docs.filter(d => !d._deleted && d.status !== 'completed' && !(d.expiresAt && new Date(d.expiresAt) < new Date())).length;
    const docsOpen = DM._sidebarOpen.docs;
    const tplOpen = DM._sidebarOpen.templates;
    const isDocView = v.startsWith('docs_') || v === 'home';

    sb.innerHTML = `
        <button class="sidebar-send-btn" onclick="newDocument()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            שלח מסמך
        </button>
        <button class="sidebar-send-btn" style="background:linear-gradient(135deg,#059669,#10b981);margin-top:6px;" onclick="startFormBuilder()">
            ${ICO.doc} צור טופס חדש
        </button>

        <button class="sidebar-item ${v === 'home' ? 'active' : ''}" onclick="switchView('home')">
            <span class="sidebar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
            ראשי
        </button>

        <button class="sidebar-group-header ${docsOpen ? 'open' : ''}" onclick="toggleSidebarGroup('docs')">
            <span class="sidebar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
            מסמכים
            <span class="sidebar-arrow"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg></span>
        </button>
        <div class="sidebar-group-items ${docsOpen ? 'open' : ''}">
            <button class="sidebar-item sidebar-sub ${v === 'docs_all' ? 'active' : ''}" onclick="switchView('docs_all')">כל המסמכים</button>
            <button class="sidebar-item sidebar-sub ${v === 'docs_sent' ? 'active' : ''}" onclick="switchView('docs_sent')">נשלח</button>
            <button class="sidebar-item sidebar-sub ${v === 'docs_drafts' ? 'active' : ''}" onclick="switchView('docs_drafts')">טיוטות</button>
            <button class="sidebar-item sidebar-sub ${v === 'docs_deleted' ? 'active' : ''}" onclick="switchView('docs_deleted')">נמחק</button>
            <button class="sidebar-item sidebar-sub ${v === 'docs_waiting' ? 'active' : ''}" onclick="switchView('docs_waiting')">
                ממתינים לי
                ${waitingCount > 0 ? `<span class="sidebar-badge">${waitingCount}</span>` : ''}
            </button>
        </div>

        <button class="sidebar-group-header ${tplOpen ? 'open' : ''}" onclick="toggleSidebarGroup('templates')">
            <span class="sidebar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></span>
            תבניות
            <span class="sidebar-arrow"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg></span>
        </button>
        <div class="sidebar-group-items ${tplOpen ? 'open' : ''}">
            <button class="sidebar-item sidebar-sub ${v === 'templates' ? 'active' : ''}" onclick="switchView('templates')">טפסים</button>
            <button class="sidebar-item sidebar-sub locked" title="בקרוב">🔒 מעטפות</button>
            <button class="sidebar-item sidebar-sub locked" title="בקרוב">🔒 סבב אישורים</button>
            <button class="sidebar-item sidebar-sub locked" title="בקרוב">🔒 צ'קליסטים</button>
            <button class="sidebar-item sidebar-sub locked" title="בקרוב">🔒 אוטומציות</button>
        </div>

        <div class="sidebar-divider"></div>

        <button class="sidebar-item locked" title="בקרוב">
            <span class="sidebar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></span>
            משאבי אנוש 🔒
        </button>
        <button class="sidebar-item ${v === 'contacts' ? 'active' : ''}" onclick="switchView('contacts')">
            <span class="sidebar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            אנשי קשר
        </button>
        <button class="sidebar-item locked" title="בקרוב">
            <span class="sidebar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg></span>
            משימות 🔒
        </button>
        <button class="sidebar-item locked" title="בקרוב">
            <span class="sidebar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
            דוחות 🔒
        </button>

        <div class="sidebar-divider"></div>

        <button class="sidebar-item locked" title="בקרוב">
            <span class="sidebar-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.2.65.76 1.09 1.44 1.09H21a2 2 0 010 4h-.09c-.68 0-1.24.44-1.44 1.09z"/></svg></span>
            הגדרות 🔒
        </button>
    `;
}

function render() {
    // Save scroll positions before re-render
    const scrolls = {};
    const canvasArea = document.getElementById('canvasArea');
    const signDoc = document.querySelector('.sign-doc');
    const wizardBody = document.getElementById('wizardBody');
    if (canvasArea) scrolls.canvas = { x: canvasArea.scrollLeft, y: canvasArea.scrollTop };
    if (signDoc) scrolls.signDoc = { x: signDoc.scrollLeft, y: signDoc.scrollTop };
    if (wizardBody) scrolls.wizard = { y: wizardBody.scrollTop };

    // Toggle fullscreen mode for wizard/sign views
    const isFullscreen = DM.view === 'create' || DM.view === 'sign' || DM.view === 'create_form';
    document.body.classList.toggle('fullscreen-view', isFullscreen);

    // Render sidebar for non-fullscreen views
    if (!isFullscreen) renderSidebar();

    const main = document.getElementById('mainContent');
    const v = DM.view;
    if (v === 'home') renderHome(main);
    else if (v === 'docs_all') renderDocTable(main, 'all');
    else if (v === 'docs_sent') renderDocTable(main, 'sent');
    else if (v === 'docs_drafts') renderDocTable(main, 'drafts');
    else if (v === 'docs_deleted') renderDocTable(main, 'deleted');
    else if (v === 'docs_waiting') renderDocTable(main, 'waiting');
    else if (v === 'templates') renderTemplates(main);
    else if (v === 'contacts') renderContacts(main);
    else if (v === 'create') renderWizard(main);
    else if (v === 'create_form') { renderFormBuilder(main); return; }
    else if (v === 'sign') renderSignView(main);
    else if (v === 'shared') renderSharedDocumentView(main);

    // Restore scroll positions after re-render
    requestAnimationFrame(() => {
        if (scrolls.canvas) {
            const el = document.getElementById('canvasArea');
            if (el) { el.scrollLeft = scrolls.canvas.x; el.scrollTop = scrolls.canvas.y; }
        }
        if (scrolls.signDoc) {
            const el = document.querySelector('.sign-doc');
            if (el) { el.scrollLeft = scrolls.signDoc.x; el.scrollTop = scrolls.signDoc.y; }
        }
        if (scrolls.wizard) {
            const el = document.getElementById('wizardBody');
            if (el) { el.scrollTop = scrolls.wizard.y; }
        }
    });
}

// ==================== HOME DASHBOARD ====================
function renderHome(el) {
    const allDocs = DM.docs.filter(d => !d._deleted).slice().reverse();
    const completed = allDocs.filter(d => d.status === 'completed').length;
    const inProcess = allDocs.filter(d => d.status !== 'completed' && !(d.expiresAt && new Date(d.expiresAt) < new Date())).length;
    const myEmail = (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser) ? smoovCurrentUser.email : '';
    const waiting = myEmail ? allDocs.filter(d => d.status !== 'completed' && !(d.expiresAt && new Date(d.expiresAt) < new Date()) && (d.recipients || []).some(r => r.email === myEmail && !r.signed)).length : 0;
    const recentDocs = allDocs.slice(0, 10);

    el.innerHTML = `<div class="dashboard">
        <div class="dashboard-stats">
            <div class="stat-card" style="border-top:3px solid #f472b6;" onclick="switchView('docs_waiting')">
                <div class="stat-num">${waiting}</div><div class="stat-label">ממתין לחתימה שלי</div>
            </div>
            <div class="stat-card" style="border-top:3px solid var(--success);" onclick="switchView('docs_all')">
                <div class="stat-num" style="color:var(--success)">${completed}</div><div class="stat-label">נחתמו לאחרונה</div>
            </div>
            <div class="stat-card" style="border-top:3px solid var(--primary);" onclick="switchView('docs_sent')">
                <div class="stat-num" style="color:var(--primary)">${inProcess}</div><div class="stat-label">בתהליך חתימה</div>
            </div>
            <div class="stat-card" style="border-top:3px solid var(--warning);">
                <div class="stat-num" style="color:var(--warning)">0</div><div class="stat-label">משימות פתוחות</div>
            </div>
        </div>

        <div style="margin-bottom:24px;">
            <h2 style="font-size:1.15em;font-weight:700;margin-bottom:14px;">שליחת מסמך</h2>
            <div style="display:flex;gap:14px;flex-wrap:wrap;">
                ${DM.templates.slice(0, 4).map(t => `
                    <div class="template-quick-card" onclick="useTemplate('${t.id}')">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span style="font-size:0.82em;font-weight:600;margin-top:6px;">${esc(t.name || 'תבנית')}</span>
                    </div>
                `).join('')}
                <div class="template-quick-card" onclick="newDocument()" style="border:2px dashed var(--border);">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span style="font-size:0.82em;font-weight:600;margin-top:6px;">העלאת מסמך</span>
                </div>
            </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h2 style="font-size:1.15em;font-weight:700;">מסמכים אחרונים</h2>
            <a href="#" onclick="event.preventDefault();switchView('docs_all')" style="font-size:0.85em;color:var(--primary);font-weight:600;">כל המסמכים →</a>
        </div>
        ${recentDocs.length === 0 ? `
            <div class="empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h2>אין מסמכים עדיין</h2>
                <p>צור מסמך חדש או השתמש בתבנית קיימת</p>
                <button class="btn btn-primary" onclick="newDocument()" style="margin-top:12px;">העלאת מסמך חדש</button>
            </div>
        ` : `<div class="doc-table-wrap">${renderDocRows(recentDocs)}</div>`}
    </div>`;
}

// ==================== DOCUMENT TABLE VIEW ====================
function renderDocTable(el, mode) {
    const allDocs = DM.docs.slice().reverse();
    const search = DM._dashSearch || '';
    const titles = { all: 'כל המסמכים', sent: 'נשלח', drafts: 'טיוטות', deleted: 'מסמכים שנמחקו', waiting: 'המסמכים מטה ממתינים לחתימתך' };

    let docs = allDocs;
    if (mode === 'deleted') docs = docs.filter(d => d._deleted);
    else {
        docs = docs.filter(d => !d._deleted); // exclude deleted from all other views
        if (mode === 'sent') docs = docs.filter(d => d.status === 'completed' || (d.recipients || []).some(r => r.signed));
        else if (mode === 'drafts') docs = docs.filter(d => d.status !== 'sent' && d.status !== 'completed');
        else if (mode === 'waiting') docs = docs.filter(d => d.status !== 'completed' && !(d.expiresAt && new Date(d.expiresAt) < new Date()));
    }

    if (search) docs = docs.filter(d => (d.fileName || '').includes(search) || (d.recipients || []).some(r => (r.name || '').includes(search)));

    // Pagination
    const pageSize = 15;
    const page = DM._docPage || 1;
    const totalPages = Math.max(1, Math.ceil(docs.length / pageSize));
    const pageDocs = docs.slice((page - 1) * pageSize, page * pageSize);

    el.innerHTML = `<div class="dashboard">
        <h1 style="font-size:1.4em;font-weight:800;margin-bottom:18px;">${titles[mode] || 'מסמכים'}</h1>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
            <input type="text" class="form-input" placeholder="חיפוש..." value="${search}" oninput="DM._dashSearch=this.value;DM._docPage=1;render()" style="max-width:240px;padding:8px 14px;font-size:0.88em;">
            ${mode === 'sent' ? `
                <div style="display:flex;gap:4px;">
                    <button class="btn btn-sm ${(DM._sentFilter||'all')==='all'?'btn-primary':'btn-outline'}" onclick="DM._sentFilter='all';render()">הכל</button>
                    <button class="btn btn-sm ${DM._sentFilter==='process'?'btn-primary':'btn-outline'}" onclick="DM._sentFilter='process';render()">בתהליך</button>
                    <button class="btn btn-sm ${DM._sentFilter==='done'?'btn-primary':'btn-outline'}" onclick="DM._sentFilter='done';render()">הושלם</button>
                </div>
            ` : ''}
        </div>
        ${pageDocs.length === 0 ? `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h2>אין מסמכים</h2>
            </div>
        ` : `
            <div class="doc-table-wrap">
                <div class="doc-table-header">
                    <span class="dtc dtc-check"><input type="checkbox" ${DM._selectedDocs.length > 0 && DM._selectedDocs.length === pageDocs.length ? 'checked' : ''} onchange="toggleSelectAllDocs(this.checked, '${mode}')" title="בחר הכל"></span>
                    <span class="dtc dtc-name">שם מסמך</span>
                    <span class="dtc dtc-rcpt">נשלח אל</span>
                    <span class="dtc dtc-status">סטטוס</span>
                    <span class="dtc dtc-actions"></span>
                </div>
                ${renderDocRows(pageDocs, mode)}
            ${DM._selectedDocs.length > 0 ? renderBulkActionBar() : ''}
            </div>
            ${totalPages > 1 ? `
                <div class="pagination">
                    ${Array.from({length: totalPages}, (_, i) => `
                        <button class="page-btn ${page === i+1 ? 'active' : ''}" onclick="DM._docPage=${i+1};render()">${i+1}</button>
                    `).join('')}
                    <span style="font-size:0.78em;color:var(--text-light);margin-right:12px;">${docs.length} פריטים</span>
                </div>
            ` : ''}
        `}
    </div>`;
}

function renderDocRows(docs, mode) {
    return docs.map(doc => {
        const signedCount = (doc.recipients || []).filter(r => r.signed).length;
        const totalR = (doc.recipients || []).length;
        const pct = totalR > 0 ? Math.round((signedCount / totalR) * 100) : 0;
        const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date() && doc.status !== 'completed';
        const statusText = doc.status === 'completed' ? 'אושר' : isExpired ? 'פג תוקף' : pct > 0 ? 'בתהליך' : 'ממתין';
        const statusBadge = doc.status === 'completed' ? 'badge-success' : isExpired ? 'badge-danger' : pct > 0 ? 'badge-warning' : 'badge-info';
        const statusColor = doc.status === 'completed' ? 'var(--success)' : isExpired ? 'var(--danger)' : pct > 0 ? 'var(--warning)' : 'var(--text-muted)';
        const created = doc.createdAt ? new Date(doc.createdAt).toLocaleString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
        const rcptName = (doc.recipients || [])[0]?.name || '';
        const rcptInitials = rcptName ? rcptName.split(' ').map(w => w[0]).join('').substring(0, 2) : '?';

        const isSelected = DM._selectedDocs.includes(doc.id);
        return `<div class="doc-table-row ${isSelected ? 'selected' : ''}" onclick="openSign('${doc.id}')">
            <div class="dtc dtc-check" onclick="event.stopPropagation()">
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleDocSelect('${doc.id}')">
            </div>
            <div class="dtc dtc-name">
                <div>
                    <div style="font-weight:600;font-size:0.9em;">${esc(doc.fileName || 'מסמך ללא שם')}</div>
                    <div style="font-size:0.75em;color:var(--text-light);">${created}</div>
                </div>
            </div>
            <div class="dtc dtc-rcpt">
                <span class="avatar-initials">${esc(rcptInitials)}</span>
                <span style="font-size:0.85em;">${esc(rcptName || '-')}</span>
            </div>
            <div class="dtc dtc-status">
                <span class="badge ${statusBadge}">${statusText}</span>
                ${totalR > 0 ? `
                    <div class="mini-progress" style="width:80px;margin-top:4px;"><div class="mini-progress-fill" style="width:${pct}%;background:${statusColor};"></div></div>
                    <span style="font-size:0.7em;color:var(--text-light);">${signedCount} מתוך ${totalR} חתמו</span>
                ` : ''}
            </div>
            <div class="dtc dtc-actions" onclick="event.stopPropagation()">
                <button class="btn btn-ghost btn-sm" onclick="openSign('${doc.id}')" title="צפייה">${ICO.eye}</button>
                <button class="btn btn-ghost btn-sm" onclick="downloadSignedPDF('${doc.id}')" title="הורדה">${ICO.download}</button>
                <button class="btn btn-ghost btn-sm" onclick="openShareModal('${doc.id}')" title="שיתוף">${ICO.share}</button>
                ${mode !== 'deleted' ? `<button class="btn btn-ghost btn-sm" onclick="deleteDoc('${doc.id}')" title="מחיקה" style="color:var(--danger);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg></button>` : ''}
                ${mode === 'waiting' ? `<button class="btn btn-primary btn-sm" onclick="openSign('${doc.id}')">מילוי טופס</button>` : ''}
                ${mode === 'deleted' ? `<button class="btn btn-outline btn-sm" onclick="restoreDoc('${doc.id}')">שחזור</button>` : ''}
            </div>
        </div>`;
    }).join('');
}

async function deleteDoc(id) {
    if (!await smoovConfirm('למחוק מסמך זה?')) return;
    const doc = DM.docs.find(d => d.id === id);
    if (doc) { doc._deleted = true; doc._deletedAt = new Date().toISOString(); }
    save();
    render();
    toast('המסמך הועבר לסל המחזור');
}

function restoreDoc(id) {
    const doc = DM.docs.find(d => d.id === id);
    if (doc) { delete doc._deleted; delete doc._deletedAt; }
    save();
    render();
}

// ==================== MULTI-SELECT ====================
function toggleDocSelect(docId) {
    const idx = DM._selectedDocs.indexOf(docId);
    if (idx >= 0) DM._selectedDocs.splice(idx, 1);
    else DM._selectedDocs.push(docId);
    render();
}

function toggleSelectAllDocs(checked, mode) {
    if (checked) {
        const allDocs = DM.docs.slice().reverse();
        let docs = mode === 'deleted' ? allDocs.filter(d => d._deleted) : allDocs.filter(d => !d._deleted);
        if (mode === 'sent') docs = docs.filter(d => d.status === 'completed' || (d.recipients || []).some(r => r.signed));
        else if (mode === 'drafts') docs = docs.filter(d => d.status !== 'sent' && d.status !== 'completed');
        else if (mode === 'waiting') docs = docs.filter(d => d.status !== 'completed' && !(d.expiresAt && new Date(d.expiresAt) < new Date()));
        const search = DM._dashSearch || '';
        if (search) docs = docs.filter(d => (d.fileName || '').includes(search) || (d.recipients || []).some(r => (r.name || '').includes(search)));
        const pageSize = 15;
        const page = DM._docPage || 1;
        const pageDocs = docs.slice((page - 1) * pageSize, page * pageSize);
        DM._selectedDocs = pageDocs.map(d => d.id);
    } else {
        DM._selectedDocs = [];
    }
    render();
}

function clearDocSelection() {
    DM._selectedDocs = [];
    render();
}

async function bulkDeleteDocs() {
    const count = DM._selectedDocs.length;
    if (!count) return;
    if (!await smoovConfirm(`למחוק ${count} מסמכים?`)) return;
    DM._selectedDocs.forEach(id => {
        const doc = DM.docs.find(d => d.id === id);
        if (doc) { doc._deleted = true; doc._deletedAt = new Date().toISOString(); }
    });
    save();
    DM._selectedDocs = [];
    render();
    toast(`${count} מסמכים הועברו לסל המחזור`);
}

async function bulkDownloadDocs() {
    const count = DM._selectedDocs.length;
    if (!count) return;
    toast(`מוריד ${count} מסמכים...`, 'info');
    for (const id of DM._selectedDocs) {
        await downloadSignedPDF(id);
    }
    DM._selectedDocs = [];
    render();
}

function renderBulkActionBar() {
    const count = DM._selectedDocs.length;
    return `<div class="bulk-action-bar">
        <span style="font-weight:700;font-size:0.9em;">${count} פריטים נבחרו</span>
        <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();bulkDownloadDocs()" title="הורדה">
                ${ICO.download} הורדה
            </button>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();bulkDeleteDocs()" title="מחיקה">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
                מחיקה
            </button>
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();clearDocSelection()" title="ביטול">✕</button>
        </div>
    </div>`;
}

// ==================== CONTACTS ====================
function renderContacts(el) {
    if (!DM.contacts) DM.contacts = JSON.parse(localStorage.getItem('smoov_contacts') || '[]');
    const search = DM._contactSearch || '';
    let contacts = DM.contacts;
    if (search) contacts = contacts.filter(c => (c.name || '').includes(search) || (c.email || '').includes(search) || (c.phone || '').includes(search));

    el.innerHTML = `<div class="dashboard">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <h1 style="font-size:1.4em;font-weight:800;">אנשי קשר</h1>
            <button class="btn btn-success" onclick="addContact()">+ הוסף איש קשר</button>
        </div>
        <div style="margin-bottom:16px;">
            <input type="text" class="form-input" placeholder="חיפוש..." value="${esc(search)}" oninput="DM._contactSearch=this.value;render()" style="max-width:300px;padding:8px 14px;font-size:0.88em;">
        </div>
        ${contacts.length === 0 ? `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <h2>${search ? 'לא נמצאו אנשי קשר' : 'אין אנשי קשר עדיין'}</h2>
            </div>
        ` : `
            <div class="doc-table-wrap">
                <div class="doc-table-header">
                    <span class="dtc" style="flex:2;">שם</span>
                    <span class="dtc" style="flex:2;">דוא"ל</span>
                    <span class="dtc" style="flex:1;">נייד</span>
                    <span class="dtc" style="flex:1;"></span>
                </div>
                ${contacts.map(c => `
                    <div class="doc-table-row">
                        <div class="dtc" style="flex:2;display:flex;align-items:center;gap:8px;">
                            <span class="avatar-initials">${esc((c.name || '?').split(' ').map(w => w[0]).join('').substring(0, 2))}</span>
                            <span style="font-weight:600;">${esc(c.name || '-')}</span>
                        </div>
                        <div class="dtc" style="flex:2;font-size:0.85em;color:var(--text-light);direction:ltr;">${esc(c.email || '-')}</div>
                        <div class="dtc" style="flex:1;font-size:0.85em;">${esc(c.phone || '-')}</div>
                        <div class="dtc" style="flex:1;display:flex;gap:4px;">
                            <button class="btn btn-primary btn-sm" onclick="editContact('${c.id}')">עריכה</button>
                            <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteContact('${c.id}')">מחק</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    </div>`;
}

function addContact() { openContactModal(); }

function editContact(id) {
    if (!DM.contacts) return;
    const c = DM.contacts.find(x => x.id === id);
    if (c) openContactModal(c);
}

function openContactModal(contact) {
    const isEdit = !!contact;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'contactModal';
    overlay.innerHTML = `<div class="modal-card" style="max-width:420px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <h3 style="font-weight:700;margin:0;">${isEdit ? 'עריכת איש קשר' : 'איש קשר חדש'}</h3>
            <button class="btn btn-ghost btn-sm" onclick="document.getElementById('contactModal').remove()" style="font-size:1.1em;">✕</button>
        </div>
        <div class="form-group">
            <label class="form-label">שם</label>
            <input type="text" class="form-input" id="ctName" value="${isEdit ? esc(contact.name || '') : ''}" placeholder="שם מלא">
        </div>
        <div class="form-group">
            <label class="form-label">דוא"ל</label>
            <input type="email" class="form-input" id="ctEmail" value="${isEdit ? esc(contact.email || '') : ''}" placeholder="email@example.com" dir="ltr">
        </div>
        <div class="form-group">
            <label class="form-label">נייד</label>
            <input type="tel" class="form-input" id="ctPhone" value="${isEdit ? esc(contact.phone || '') : ''}" placeholder="050-0000000" dir="ltr">
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
            <button class="btn btn-outline" onclick="document.getElementById('contactModal').remove()">ביטול</button>
            <button class="btn btn-primary" onclick="saveContact('${isEdit ? contact.id : ''}')">שמור</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    setTimeout(() => document.getElementById('ctName').focus(), 100);
}

function saveContact(editId) {
    const name = document.getElementById('ctName').value.trim();
    const email = document.getElementById('ctEmail').value.trim();
    const phone = document.getElementById('ctPhone').value.trim();
    if (!name) { toast('יש להזין שם', 'error'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('כתובת דוא"ל לא תקינה', 'error'); return; }
    if (!DM.contacts) DM.contacts = [];
    if (editId) {
        const c = DM.contacts.find(x => x.id === editId);
        if (c) { c.name = name; c.email = email; c.phone = phone; }
    } else {
        DM.contacts.push({ id: 'ct_' + Date.now(), name, email, phone });
    }
    localStorage.setItem('smoov_contacts', JSON.stringify(DM.contacts));
    document.getElementById('contactModal')?.remove();
    render();
}

async function deleteContact(id) {
    if (!await smoovConfirm('למחוק איש קשר זה?')) return;
    DM.contacts = (DM.contacts || []).filter(c => c.id !== id);
    localStorage.setItem('smoov_contacts', JSON.stringify(DM.contacts));
    render();
    toast('איש הקשר נמחק');
}

// ==================== SHARE FUNCTIONALITY ====================
// openShareModal is defined later (near shared document section)

// generateShareLink removed - replaced by openShareModal which generates links directly

// ==================== TEMPLATES ====================
if (!DM._tplSelected) DM._tplSelected = {};

function renderTemplates(el) {
    const selCount = Object.values(DM._tplSelected).filter(Boolean).length;
    const allSelected = DM.templates.length > 0 && selCount === DM.templates.length;
    el.innerHTML = `<div class="dashboard">
        <div class="dashboard-header">
            <h1>תבניות מסמכים</h1>
            <div style="display:flex;gap:8px;align-items:center;">
                ${selCount > 0 ? `<button class="btn btn-sm" style="background:var(--danger);color:white;" onclick="deleteSelectedTemplates()">מחק ${selCount} תבניות</button>` : ''}
                <button class="btn btn-primary" onclick="newTemplate()">+ תבנית חדשה</button>
            </div>
        </div>
        ${DM.templates.length === 0 ? `
            <div class="empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                <h2>אין תבניות עדיין</h2>
                <p>צור תבנית עם שדות מוכנים ושדות למילוי - חוסך זמן בכל שליחה!</p>
                <button class="btn btn-primary btn-lg" onclick="newTemplate()">+ צור תבנית</button>
            </div>
        ` : `
            <div style="padding:8px 12px;display:flex;align-items:center;gap:8px;">
                <input type="checkbox" id="tplSelectAll" ${allSelected ? 'checked' : ''} onchange="toggleAllTemplates(this.checked)" style="width:18px;height:18px;cursor:pointer;">
                <label for="tplSelectAll" style="font-size:0.82em;color:var(--text-light);cursor:pointer;">בחר הכל</label>
            </div>
            <div class="doc-list">${DM.templates.map(t => `
            <div class="template-card" style="${DM._tplSelected[t.id] ? 'background:var(--primary-light);' : ''}">
                <input type="checkbox" ${DM._tplSelected[t.id] ? 'checked' : ''} onchange="toggleTemplateSelect('${t.id}', this.checked)" style="width:18px;height:18px;cursor:pointer;flex-shrink:0;">
                <div class="template-icon" style="background:var(--primary-light);color:var(--primary);">${ICO.doc}</div>
                <div class="doc-info">
                    <h3>${esc(t.name || 'תבנית ללא שם')}</h3>
                    <div class="doc-meta">${t.fields ? t.fields.length + ' שדות' : ''} · ${t.fixedFields ? t.fixedFields.filter(f => f.value).length + ' שדות מוכנים' : ''}</div>
                </div>
                <div class="doc-actions">
                    <button class="btn btn-sm btn-primary" onclick="useTemplate('${t.id}')">שלח מתבנית</button>
                    <button class="btn btn-sm btn-outline" onclick="copyTemplateFillLink(this,'${t.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                        קישור
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="editTemplate('${t.id}')">ערוך</button>
                    <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="deleteTemplate('${t.id}')">מחק</button>
                </div>
            </div>
        `).join('')}</div>`}
    </div>`;
}

function toggleTemplateSelect(id, checked) {
    DM._tplSelected[id] = checked;
    render();
}

function toggleAllTemplates(checked) {
    DM.templates.forEach(t => { DM._tplSelected[t.id] = checked; });
    render();
}

async function deleteSelectedTemplates() {
    const ids = Object.keys(DM._tplSelected).filter(id => DM._tplSelected[id]);
    if (ids.length === 0) return;
    if (!await smoovConfirm('למחוק ' + ids.length + ' תבניות?')) return;
    ids.forEach(id => {
        if (typeof firebaseDeleteTemplate === 'function') firebaseDeleteTemplate(id);
    });
    DM.templates = DM.templates.filter(t => !DM._tplSelected[t.id]);
    DM._tplSelected = {};
    save();
    render();
}

async function deleteTemplate(id) {
    if (!await smoovConfirm('למחוק תבנית זו?')) return;
    DM.templates = DM.templates.filter(t => t.id !== id);
    save();
    if (typeof firebaseDeleteTemplate === 'function') firebaseDeleteTemplate(id);
    render();
}

function useTemplate(id) {
    const tpl = DM.templates.find(t => t.id === id);
    if (!tpl) return;
    resetEditor();
    DM.docImage = tpl.docImage;
    DM.docPages = tpl.docPages || [];
    DM.pageHeights = tpl.pageHeights || [];
    DM.pageWidth = tpl.pageWidth || 0;
    DM.fileName = tpl.name;
    // Copy template fields - fixed ones keep their value, dynamic ones are empty (except checkboxes with defaultChecked)
    DM.fields = (tpl.fields || []).map(f => ({
        ...f, id: Date.now() + Math.random(),
        value: f.fixed ? f.value : (f.type === 'date_auto' ? new Date().toLocaleDateString('he-IL') : (f.type === 'checkbox' && f.defaultChecked ? '✓' : ''))
    }));
    DM.isTemplate = false;
    DM._fromTemplate = true;
    DM._templateId = id;
    DM.step = 2; // skip upload, go to recipients
    DM.view = 'create';
    render();
}

function editTemplate(id) {
    const tpl = DM.templates.find(t => t.id === id);
    if (!tpl) return;
    resetEditor();
    DM.docImage = tpl.docImage;
    DM.docPages = tpl.docPages || [];
    DM.pageHeights = tpl.pageHeights || [];
    DM.pageWidth = tpl.pageWidth || 0;
    DM.fileName = tpl.name;
    DM.fields = JSON.parse(JSON.stringify(tpl.fields || []));
    DM.isTemplate = true;
    DM.editingTemplateId = id;
    DM.step = 1;
    DM.view = 'create';
    render();
}

// ==================== NEW DOCUMENT / TEMPLATE ====================
function newDocument() {
    resetEditor();
    DM.isTemplate = false;
    DM.view = 'create';
    render();
}

function newTemplate() {
    resetEditor();
    DM.isTemplate = true;
    DM.view = 'create';
    render();
}

function resetEditor() {
    DM.step = 1;
    DM.docImage = null;
    DM.docPages = [];
    DM.fileName = '';
    DM.recipients = [];
    DM.fields = [];
    DM.selectedFieldId = null;
    DM.activeRecipientId = null;
    DM.isDragging = false;
    DM.isResizing = false;
    DM.editingTemplateId = null;
    DM.recipientSearch = '';
    DM._allowNoRecipients = false;
    DM._fromTemplate = false;
    DM._templateId = null;
    // Form builder reset
    DM.formTitle = '';
    DM.formDescription = '';
    DM.formLogo = null;
    DM.formFields = [];
    DM._isFormBuilder = false;
    DM._formSheetsUrl = '';
    DM._formMakeUrl = '';
}

// ==================== WIZARD ====================
function renderWizard(el) {
    if (DM.recipients.length === 0 && !DM.isTemplate && !DM._allowNoRecipients) {
        DM.recipients = [{ id: 1, name: '', phone: '', colorIndex: 0, type: 'sender' }];
        DM.activeRecipientId = 1;
    }

    const steps = DM.isTemplate
        ? [{ id: 1, label: 'העלאת מסמך' }, { id: 2, label: 'הגדרת שדות' }]
        : [{ id: 1, label: 'העלאת מסמך' }, { id: 2, label: 'נמענים' }, { id: 3, label: 'הגדרת שדות' }, { id: 4, label: 'שליחה' }];

    el.innerHTML = `<div class="wizard">
        <div class="wizard-header">
            <button class="btn btn-ghost" onclick="switchView('home')">✕ סגור</button>
            <span style="font-weight:700;">${DM.isTemplate ? 'יצירת תבנית' : 'מסמך חדש'}</span>
            <div style="width:80px;"></div>
        </div>
        <div class="wizard-stepper">
            ${steps.map((s, i) => `
                ${i > 0 ? `<div class="step-line ${s.id <= DM.step ? 'done' : ''}"></div>` : ''}
                <div style="display:flex;flex-direction:column;align-items:center;${s.id < DM.step ? 'cursor:pointer;' : ''}" ${s.id < DM.step ? `onclick="goStep(${s.id})"` : ''}>
                    <div class="step-dot ${s.id === DM.step ? 'active' : s.id < DM.step ? 'done' : ''}">${s.id < DM.step ? '✓' : s.id === DM.step ? '●' : s.id}</div>
                    <span class="step-label ${s.id === DM.step ? 'active' : ''}">${s.label}</span>
                </div>
            `).join('')}
        </div>
        <div class="wizard-body" id="wizardBody"></div>
        <div class="wizard-footer">
            <div>${DM.step > 1 ? `<button class="btn btn-outline" onclick="goStep(${DM.step - 1})">הקודם</button>` : ''}</div>
            <div id="wizardNextBtn"></div>
        </div>
    </div>`;

    renderStep();
    renderNextBtn();
}

function renderNextBtn() {
    const el = document.getElementById('wizardNextBtn');
    if (!el) return;
    const maxStep = DM.isTemplate ? 2 : 4;
    if (DM.isTemplate && DM.step === 2) {
        el.innerHTML = `<button class="btn btn-success btn-lg" onclick="saveTemplate()">שמור תבנית</button>`;
    } else if (DM.step < maxStep) {
        const disabled = DM.step === 1 && !DM.docImage ? 'disabled' : '';
        el.innerHTML = `<button class="btn btn-primary btn-lg" onclick="goStep(${DM.step + 1})" ${disabled}>הבא</button>`;
    } else {
        if (DM.recipients.length === 0 || DM.recipients.every(r => !r.name || !r.name.trim())) {
            el.innerHTML = `<button class="btn btn-success btn-lg" onclick="createLinkOnly()">צור קישור לשיתוף</button>`;
        } else {
            el.innerHTML = `<button class="btn btn-success btn-lg" onclick="sendDocument()">שלח מסמך</button>`;
        }
    }
}

function goStep(s) {
    if (s === 2 && !DM.docImage && !DM.isTemplate) { toast('יש להעלות מסמך קודם', 'error'); return; }
    if (DM.isTemplate && s === 2 && !DM.docImage) { toast('יש להעלות מסמך קודם', 'error'); return; }
    if (s === 4 && DM.fields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }
    DM.step = s;
    render();
}

function renderStep() {
    const el = document.getElementById('wizardBody');
    if (!el) return;
    if (DM.isTemplate) {
        if (DM.step === 1) renderUpload(el);
        else if (DM.step === 2) renderFieldEditor(el);
    } else {
        if (DM.step === 1) renderUpload(el);
        else if (DM.step === 2) renderRecipients(el);
        else if (DM.step === 3) renderFieldEditor(el);
        else if (DM.step === 4) renderSend(el);
    }
}

// ==================== STEP 1: UPLOAD ====================
function renderUpload(el) {
    el.innerHTML = `<div class="upload-area">
        <h2 style="font-size:1.3em;font-weight:700;margin-bottom:6px;">${DM.isTemplate ? 'העלאת מסמך לתבנית' : 'בחירת מסמך'}</h2>
        <p style="color:var(--text-light);margin-bottom:24px;">${DM.isTemplate ? 'העלה את המסמך שישמש כתבנית. שדות מוכנים ימולאו מראש.' : 'העלה מסמך PDF או תמונה להחתמה'}</p>
        <div class="upload-card">
            ${DM.docImage ? `
                <div class="file-preview">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span style="font-weight:600;">${esc(DM.fileName || 'מסמך ללא שם')}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="clearDoc()">מחק</button>
                </div>
                ${DM.isTemplate ? `<div class="form-group">
                    <label class="form-label">שם התבנית</label>
                    <input type="text" class="form-input" value="${esc(DM.fileName || '')}" onchange="DM.fileName=this.value" placeholder="הזן שם לתבנית...">
                </div>` : ''}
                <div class="doc-preview-img"><img src="${DM.docImage}" alt="preview"></div>
            ` : `
                <label class="upload-dropzone" id="dropzone">
                    <div class="upload-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <span style="font-size:1.1em;font-weight:700;">הוספת מסמך</span>
                    <span style="font-size:0.82em;color:var(--text-light);margin-top:4px;">PDF, Word, JPG, PNG - גרור או לחץ</span>
                    <input type="file" style="display:none;" accept=".pdf,.doc,.docx,image/*" onchange="handleFileUpload(event)" id="fileInput">
                </label>`}
        </div>
    </div>`;

    // Setup drag & drop
    const dz = document.getElementById('dropzone');
    if (dz) {
        dz.ondragover = e => { e.preventDefault(); dz.style.borderColor = 'var(--primary)'; dz.style.background = 'rgba(37,99,235,0.04)'; };
        dz.ondragleave = () => { dz.style.borderColor = ''; dz.style.background = ''; };
        dz.ondrop = e => { e.preventDefault(); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); };
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

async function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const supportedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    if (!file.type.startsWith('image/') && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) && !supportedTypes.includes(ext)) {
        toast('סוג קובץ לא נתמך. ניתן להעלות: PDF, Word, JPG, PNG', 'error');
        return;
    }
    DM.fileName = file.name.replace(/\.\w+$/, '');
    const dz = document.getElementById('dropzone');

    if (file.type === 'application/pdf') {
        if (!window.pdfjsLib) { toast('PDF.js לא נטען', 'error'); return; }
        if (dz) dz.innerHTML = '<div style="text-align:center"><div style="width:24px;height:24px;border:3px solid var(--primary);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 10px;"></div>טוען PDF...</div>';
        try {
            const buf = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
            const numPages = pdf.numPages;
            if (numPages === 0) {
                toast('הקובץ ריק (0 עמודים)', 'error');
                render();
                return;
            }

            // Render all pages and combine into one tall image
            const pageCanvases = [];
            const pageHeights = []; // Store each page height for PDF export
            let totalH = 0;
            let maxW = 0;
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const vp = page.getViewport({ scale: 2 });
                const c = document.createElement('canvas');
                c.width = vp.width; c.height = vp.height;
                await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                pageCanvases.push(c);
                pageHeights.push(vp.height);
                totalH += vp.height;
                if (vp.width > maxW) maxW = vp.width;
            }

            // Combine all pages into one canvas
            const combined = document.createElement('canvas');
            combined.width = maxW;
            combined.height = totalH;
            const ctx = combined.getContext('2d');
            let y = 0;
            for (const c of pageCanvases) {
                ctx.drawImage(c, 0, y);
                y += c.height;
            }

            DM.docImage = combined.toDataURL('image/jpeg', 0.85);
            // Store page images in memory for editor (NOT saved to localStorage/Firebase)
            DM.docPages = pageCanvases.map(c => c.toDataURL('image/jpeg', 0.85));
            // Store page boundary info for PDF export (only numbers - safe for storage)
            DM.pageHeights = pageHeights;
            DM.pageWidth = maxW;
            if (numPages > 1) toast(`${numPages} דפים נטענו בהצלחה`);
            render();
        } catch (err) {
            console.error('PDF load error:', err);
            toast('שגיאה בטעינת PDF', 'error');
            render();
        }
    } else if (ext === 'docx' || ext === 'doc' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
        if (ext === 'doc') { toast('פורמט .doc ישן - יש לשמור כ-.docx ולנסות שוב', 'error'); return; }
        if (!window.mammoth) { toast('ספריית Word לא נטענה', 'error'); return; }
        if (dz) dz.innerHTML = '<div style="text-align:center"><div style="width:24px;height:24px;border:3px solid var(--primary);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 10px;"></div>טוען מסמך Word...</div>';
        try {
            const buf = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: buf });
            // Render HTML to canvas via hidden container
            const container = document.createElement('div');
            container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:40px 50px;background:white;font-family:Heebo,sans-serif;font-size:14px;line-height:1.8;direction:rtl;color:#000;';
            container.innerHTML = result.value;
            document.body.appendChild(container);
            // Use html2canvas from html2pdf bundle
            const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            document.body.removeChild(container);
            DM.docImage = canvas.toDataURL('image/jpeg', 0.85);
            DM.docPages = [DM.docImage];
            DM.pageHeights = [canvas.height];
            DM.pageWidth = canvas.width;
            toast('מסמך Word נטען בהצלחה');
            render();
        } catch (err) {
            console.error('Word load error:', err);
            toast('שגיאה בטעינת מסמך Word', 'error');
            render();
        }
    } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => {
            DM.docImage = ev.target.result;
            DM.docPages = [ev.target.result];
            const img = new Image();
            img.onload = () => { DM.pageHeights = [img.naturalHeight]; DM.pageWidth = img.naturalWidth; render(); };
            img.onerror = () => render();
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        toast('סוג קובץ לא נתמך. ניתן להעלות: PDF, Word, JPG, PNG', 'error');
    }
}

function clearDoc() { DM.docImage = null; DM.docPages = []; DM.pageHeights = []; DM.pageWidth = 0; DM.fileName = ''; DM.fields = []; render(); }

// ==================== STEP 2: RECIPIENTS ====================
function renderRecipients(el) {
    el.innerHTML = `<div class="recipients-area">
        <h2 style="font-size:1.3em;font-weight:700;margin-bottom:16px;">הגדרת נמענים</h2>
        ${DM.recipients.map((r, i) => {
            const c = DM.fieldColors[r.colorIndex % DM.fieldColors.length];
            return `<div class="recipient-card">
                <div class="recipient-num">${i + 1}</div>
                <div class="recipient-fields">
                    <div class="input-wrap">
                        <input type="text" value="${esc(r.name)}" placeholder="שם הנמען" oninput="updateRecipient(${r.id},'name',this.value)">
                        <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="input-wrap">
                        <input type="tel" value="${esc(r.phone || '')}" placeholder="מספר טלפון" oninput="updateRecipient(${r.id},'phone',this.value)" style="direction:ltr;text-align:right;">
                        <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72"/></svg>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;padding-right:10px;border-right:1px solid var(--border);">
                    <div style="width:8px;height:8px;border-radius:50%;background:${c.fill};"></div>
                    ${i > 0 ? `<button onclick="removeRecipient(${r.id})" style="padding:4px;background:none;border:none;color:var(--text-light);cursor:pointer;">✕</button>` : ''}
                </div>
            </div>`;
        }).join('')}
        <button class="add-recipient-btn" onclick="addRecipient()">+ הוסף נמען</button>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);text-align:center;">
            <p style="font-size:0.85em;color:var(--text-light);margin-bottom:10px;">או צור קישור לשיתוף ללא ציון נמענים</p>
            <button class="btn btn-outline" onclick="DM._allowNoRecipients=true;DM.recipients=[];DM.step=3;render();" style="font-size:0.88em;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-left:4px;"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                המשך ללא נמענים (קישור)
            </button>
        </div>
    </div>`;
}

function addRecipient() {
    DM.recipients.push({ id: Date.now(), name: '', phone: '', colorIndex: DM.recipients.length % 4, type: 'other' });
    render();
}

function updateRecipient(id, field, value) {
    const r = DM.recipients.find(x => x.id === id);
    if (r) r[field] = value;
}

function removeRecipient(id) {
    DM.recipients = DM.recipients.filter(r => r.id !== id);
    DM.fields = DM.fields.filter(f => f.assigneeId !== id);
    render();
}

// ==================== STEP 3: FIELD EDITOR ====================
// Zoom state
if (!DM._zoom) DM._zoom = 1;

function renderFieldEditor(el) {
    if (!DM.activeRecipientId && DM.recipients.length) DM.activeRecipientId = DM.recipients[0].id;
    const selField = DM.fields.find(f => f.id === DM.selectedFieldId);
    const zoomPct = Math.round(DM._zoom * 100);
    const activeRcpt = DM.recipients.find(x => x.id === DM.activeRecipientId);
    const rcptColor = activeRcpt ? DM.fieldColors[activeRcpt.colorIndex % DM.fieldColors.length] : DM.fieldColors[0];
    const hasPages = DM.docPages && DM.docPages.length > 1;
    const numPages = hasPages ? DM.docPages.length : (DM.docImage ? 1 : 0);
    if (!DM._activePage) DM._activePage = 1;

    // Page break markers for multi-page docs
    const pageOffsets = getPageYOffsets();
    const pageBreakMarkers = pageOffsets.length > 1 ? pageOffsets.slice(1).map((offset, i) =>
        `<div class="page-break-marker" style="top:${offset}px;"><span class="page-break-label">עמוד ${i + 2}</span></div>`
    ).join('') : '';

    el.innerHTML = `<div class="editor">
        <!-- RIGHT panel (first in RTL flex) -->
        <div class="editor-panel" id="editorPanel">
            <button class="panel-toggle-mobile" onclick="document.getElementById('editorPanel').classList.toggle('collapsed')">
                <span class="panel-toggle-icon">▼</span>
                <span>כלים</span>
                <span style="margin-right:auto;font-size:0.8em;color:var(--text-light);">${DM.fields.length} שדות</span>
            </button>
            ${selField ? `
                ${renderFieldProps(selField)}
                <div style="border-top:2px solid var(--border);"></div>
            ` : ''}
            <div class="panel-section">
                <div class="panel-header">
                    ${DM.isTemplate ? `
                        <div class="form-label" style="margin-bottom:6px;">סוג שדה</div>
                        <div style="display:flex;gap:4px;">
                            <button class="btn btn-sm" onclick="DM._fieldFixed=false;render();" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 6px;${!DM._fieldFixed ? 'background:#dcfce7;color:#15803d;border:2px solid #16a34a;font-weight:700;box-shadow:0 0 0 3px rgba(22,163,106,0.15);' : 'background:var(--card);color:var(--text-light);border:2px solid var(--border);'}">
                                <span style="width:10px;height:10px;border-radius:50%;background:#16a34a;display:inline-block;flex-shrink:0;"></span>דינמי
                            </button>
                            <button class="btn btn-sm" onclick="DM._fieldFixed=true;render();" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:8px 6px;${DM._fieldFixed ? 'background:#ffedd5;color:#c2410c;border:2px solid #ea580c;font-weight:700;box-shadow:0 0 0 3px rgba(234,88,12,0.15);' : 'background:var(--card);color:var(--text-light);border:2px solid var(--border);'}">
                                <span style="width:10px;height:10px;border-radius:50%;background:#ea580c;display:inline-block;flex-shrink:0;"></span>קבוע
                            </button>
                        </div>
                    ` : `
                        <div class="form-label" style="margin-bottom:6px;">הוספת שדה למילוי עבור</div>
                        <div class="rcpt-selector">
                            <select class="form-input" onchange="DM.activeRecipientId=Number(this.value);render();" style="font-weight:700;color:${rcptColor.text};background:${rcptColor.bg};border-color:${rcptColor.border};padding-right:30px;">
                                ${DM.recipients.map(r => {
                                    const rc = DM.fieldColors[r.colorIndex % DM.fieldColors.length];
                                    return `<option value="${r.id}" ${r.id === DM.activeRecipientId ? 'selected' : ''}>${esc(r.name || 'נמען ' + (DM.recipients.indexOf(r) + 1))}</option>`;
                                }).join('')}
                            </select>
                            <span class="rcpt-color-dot" style="background:${rcptColor.fill};"></span>
                        </div>
                    `}
                </div>
                <div class="tools-grid">
                    ${toolBtn('text', 'טקסט', 'T')}
                    ${toolBtn('signature', 'חתימה', ICO.sign)}
                    ${toolBtn('date_auto', 'תאריך אוטומטי', ICO.calendar)}
                    ${toolBtn('date_manual', 'בחירת תאריך', ICO.calendar)}
                    ${toolBtn('number', 'מספר', '#')}
                    ${toolBtn('fullname', 'שם מלא', ICO.user)}
                    ${toolBtn('id_number', 'ת.ז.', ICO.id)}
                    ${toolBtn('checkbox', 'סימון', ICO.checkbox)}
                    ${toolBtn('file', 'צירוף קובץ', ICO.doc)}
                </div>
            </div>
            ${numPages > 1 ? `
            <div class="panel-pages">
                <div class="panel-pages-title">עמודים</div>
                <div class="panel-pages-grid">
                    ${DM.docPages.map((pg, i) => `
                        <div class="panel-page-thumb ${DM._activePage === i + 1 ? 'active' : ''}" onclick="scrollToPage(${i + 1})">
                            <img src="${pg}" draggable="false">
                            <span>${i + 1}</span>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
            <div class="panel-footer-info">
                שדות: ${DM.fields.length}
                ${DM._pendingFieldType ? ' · <span style="color:var(--primary);font-weight:700;">לחץ על המסמך למיקום</span>' : ''}
                ${DM._pendingFieldType ? `<br><button class="btn btn-ghost btn-sm" onclick="DM._pendingFieldType=null;DM._pendingFieldLabel=null;render();" style="margin-top:4px;font-size:0.8em;">Esc ביטול</button>` : ''}
            </div>
        </div>

        <!-- LEFT canvas (second in RTL flex) -->
        <div class="editor-canvas" onclick="deselectField(event)" id="canvasArea">
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="event.stopPropagation();zoomDoc(-0.15)" title="הקטן">−</button>
                <span class="zoom-label">${zoomPct}%</span>
                <button class="zoom-btn" onclick="event.stopPropagation();zoomDoc(0.15)" title="הגדל">+</button>
                <button class="zoom-btn" onclick="event.stopPropagation();zoomDoc(0, true)" title="התאם" style="font-size:0.7em;padding:4px 8px;">התאם</button>
            </div>
            <div class="doc-container" id="docContainer" onclick="onCanvasClick(event)" style="transform:scale(${DM._zoom});transform-origin:top center;">
                ${DM.docImage ? `<img src="${DM.docImage}" alt="doc" id="docImage" onload="onDocImageLoad()">` : '<div style="height:1130px;"></div>'}
                <div class="fields-layer" id="fieldsLayer">
                    ${DM.fields.map(f => renderFieldOnCanvas(f)).join('')}
                </div>
                ${pageBreakMarkers}
            </div>
        </div>
    </div>`;

    // Attach drag listeners
    const area = document.getElementById('canvasArea');
    if (area) {
        area.onmousemove = handleMouseMove;
        area.onmouseup = handleMouseUp;
        area.onmouseleave = handleMouseUp;
        area.ontouchmove = e => { if (DM.isDragging || DM.isResizing) { e.preventDefault(); handleMouseMove(e.touches[0]); } };
        area.ontouchend = handleMouseUp;
        // Track active page on scroll
        if (DM.docPages && DM.docPages.length > 1) {
            area.onscroll = () => updateActivePage();
        }
    }
    // Set cursor based on pending field mode
    const docCont = document.getElementById('docContainer');
    if (docCont) docCont.style.cursor = DM._pendingFieldType ? 'crosshair' : 'default';
    // Setup drag-and-drop from tool buttons to canvas
    setupCanvasDrop();
}

// ==================== PAGE NAVIGATION ====================
function getPageYOffsets() {
    if (!DM.pageHeights || !DM.pageHeights.length || !DM.pageWidth) return [];
    const displayScale = 800 / DM.pageWidth;
    const offsets = [];
    let y = 0;
    for (const h of DM.pageHeights) {
        offsets.push(y);
        y += h * displayScale;
    }
    return offsets;
}

function scrollToPage(pageNum) {
    const area = document.getElementById('canvasArea');
    if (!area) return;
    const offsets = getPageYOffsets();
    if (offsets.length === 0) return;
    const idx = Math.max(0, Math.min(pageNum - 1, offsets.length - 1));
    const zoom = DM._zoom || 1;
    // Scroll to the page Y position (accounting for zoom + padding)
    area.scrollTo({ top: offsets[idx] * zoom + 16, behavior: 'smooth' });
    DM._activePage = pageNum;
    // Update thumbnail highlights without full re-render
    document.querySelectorAll('.panel-page-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === idx);
        const badge = thumb.querySelector('.page-badge');
        if (i === idx && !badge) {
            thumb.insertAdjacentHTML('beforeend', '<span class="page-badge">העמוד הנוכחי</span>');
        } else if (i !== idx && badge) {
            badge.remove();
        }
    });
}

function updateActivePage() {
    const area = document.getElementById('canvasArea');
    if (!area) return;
    const offsets = getPageYOffsets();
    if (offsets.length === 0) return;
    const zoom = DM._zoom || 1;
    const scrollY = area.scrollTop;
    let activePage = 1;
    for (let i = offsets.length - 1; i >= 0; i--) {
        if (scrollY >= offsets[i] * zoom - 20) { activePage = i + 1; break; }
    }
    if (DM._activePage !== activePage) {
        DM._activePage = activePage;
        document.querySelectorAll('.panel-page-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === activePage - 1);
            const badge = thumb.querySelector('.page-badge');
            if (i === activePage - 1 && !badge) {
                thumb.insertAdjacentHTML('beforeend', '<span class="page-badge">העמוד הנוכחי</span>');
            } else if (i !== activePage - 1 && badge) {
                badge.remove();
            }
        });
        // Scroll thumbnail into view in the sidebar
        const activeThumb = document.querySelectorAll('.panel-page-thumb')[activePage - 1];
        if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function zoomDoc(delta, fit) {
    if (fit) {
        DM._zoom = 1;
    } else {
        DM._zoom = Math.max(0.4, Math.min(2.5, DM._zoom + delta));
    }
    // Update transform without full re-render (smoother)
    const container = document.getElementById('docContainer');
    const label = document.querySelector('.zoom-label');
    if (container) container.style.transform = `scale(${DM._zoom})`;
    if (label) label.textContent = Math.round(DM._zoom * 100) + '%';
}

function toolBtn(type, label, icon) {
    return `<button class="tool-btn" draggable="true" onclick="addField('${type}','${label}')"
        ondragstart="onToolDragStart(event,'${type}','${label}')">
        <span class="tool-icon">${icon}</span>${label}
    </button>`;
}

// ==================== DRAG FROM MENU TO CANVAS ====================
function onToolDragStart(e, type, label) {
    e.dataTransfer.setData('fieldType', type);
    e.dataTransfer.setData('fieldLabel', label);
    e.dataTransfer.effectAllowed = 'copy';
}

function setupCanvasDrop() {
    const container = document.getElementById('docContainer');
    if (!container) return;
    container.ondragover = e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; container.style.outline = '2px dashed var(--primary)'; };
    container.ondragleave = () => { container.style.outline = 'none'; };
    container.ondrop = e => {
        e.preventDefault();
        container.style.outline = 'none';
        const type = e.dataTransfer.getData('fieldType');
        const label = e.dataTransfer.getData('fieldLabel');
        if (!type) return;

        const rect = container.getBoundingClientRect();
        const zoom = DM._zoom || 1;
        const dropX = (e.clientX - rect.left) / zoom;
        const dropY = (e.clientY - rect.top) / zoom;

        const defaultW = type === 'signature' ? 160 : type === 'checkbox' ? 26 : type === 'file' ? 140 : 120;
        const defaultH = type === 'signature' ? 80 : type === 'checkbox' ? 26 : 28;
        const assignee = DM.recipients.find(r => r.id === DM.activeRecipientId) || DM.recipients[0];

        const autoValue = type === 'date_auto' ? new Date().toLocaleDateString('he-IL') : '';
        const f = {
            id: Date.now() + Math.random(),
            type, label, value: autoValue,
            x: Math.max(0, dropX - defaultW / 2),
            y: Math.max(0, dropY - defaultH / 2),
            w: defaultW, h: defaultH,
            required: true,
            assigneeId: assignee ? assignee.id : null,
            fixed: DM.isTemplate ? (DM._fieldFixed || false) : false,
            defaultChecked: false
        };
        DM.fields.push(f);
        DM.selectedFieldId = f.id;
        render();
    };
}

function onDocImageLoad() {
    const img = document.getElementById('docImage');
    if (img) { DM._docW = img.offsetWidth; DM._docH = img.offsetHeight; }
}

function renderFieldProps(f) {
    return `<div class="field-props">
        <div class="field-props-header">
            <h3 style="font-weight:700;font-size:1em;">הגדרות שדה</h3>
            <label style="display:flex;align-items:center;gap:6px;font-size:0.82em;cursor:pointer;">
                <input type="checkbox" ${f.required ? 'checked' : ''} onchange="updateField(${f.id},'required',this.checked)"> חובה
            </label>
        </div>
        <div class="field-props-body">
            <div class="form-group">
                <label class="form-label">תיאור השדה</label>
                <input type="text" class="form-input" value="${esc(f.label)}" oninput="updateFieldLive(${f.id},'label',this.value)" onchange="updateField(${f.id},'label',this.value)" style="font-weight:600;">
            </div>
            <div class="form-group">
                <label class="form-label">סוג שדה</label>
                <select class="form-input" onchange="updateField(${f.id},'type',this.value)">
                    <option value="text" ${f.type === 'text' ? 'selected' : ''}>טקסט חופשי</option>
                    <option value="signature" ${f.type === 'signature' ? 'selected' : ''}>חתימה</option>
                    <option value="date_auto" ${f.type === 'date_auto' || f.type === 'date' ? 'selected' : ''}>תאריך אוטומטי</option>
                    <option value="date_manual" ${f.type === 'date_manual' ? 'selected' : ''}>בחירת תאריך</option>
                    <option value="number" ${f.type === 'number' ? 'selected' : ''}>מספר</option>
                    <option value="fullname" ${f.type === 'fullname' ? 'selected' : ''}>שם מלא</option>
                    <option value="id_number" ${f.type === 'id_number' ? 'selected' : ''}>תעודת זהות</option>
                    <option value="checkbox" ${f.type === 'checkbox' ? 'selected' : ''}>תיבת סימון</option>
                    <option value="file" ${f.type === 'file' ? 'selected' : ''}>צירוף קובץ</option>
                </select>
            </div>
            ${f.type === 'checkbox' ? `
            <div class="form-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:0.85em;cursor:pointer;">
                    <input type="checkbox" ${f.defaultChecked ? 'checked' : ''} onchange="updateField(${f.id},'defaultChecked',this.checked)">
                    <strong>מסומן כברירת מחדל</strong>
                </label>
            </div>` : ''}
            ${DM.isTemplate ? `<div class="form-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:0.85em;cursor:pointer;">
                    <input type="checkbox" ${f.fixed ? 'checked' : ''} onchange="updateField(${f.id},'fixed',this.checked)">
                    <strong>שדה קבוע</strong> (ערך לא ישתנה)
                </label>
            </div>` : ''}
            <div class="form-group">
                <label class="form-label">${f.type === 'file' ? 'הנחיה לחותם (סוג קובץ)' : f.fixed ? 'ערך קבוע' : 'ערך ברירת מחדל'}</label>
                <input type="text" class="form-input" value="${esc(f.value || '')}" onchange="updateField(${f.id},'value',this.value)" placeholder="${f.type === 'file' ? 'לדוגמה: צלם תעודת זהות...' : f.fixed ? 'הזן ערך שימולא אוטומטית...' : 'מה יוצג בשדה...'}">
            </div>
        </div>
        <div style="padding:12px;border-top:1px solid var(--border);background:var(--bg);">
            <button class="btn btn-outline" style="width:100%;" onclick="DM.selectedFieldId=null;render();">סיום עריכה</button>
        </div>
    </div>`;
}

// ==================== FIELD RENDERING ON CANVAS ====================
function renderFieldOnCanvas(f) {
    const assignee = DM.recipients.find(r => r.id === f.assigneeId) || DM.recipients[0];
    const ci = f.fixed ? 3 : (assignee ? assignee.colorIndex : 2);
    const c = DM.fieldColors[ci % DM.fieldColors.length];
    const selected = DM.selectedFieldId === f.id;
    const typeLabels = { signature: 'חתימה', date: 'תאריך', date_auto: 'תאריך', date_manual: 'תאריך', fullname: 'שם מלא', id_number: 'ת.ז.', checkbox: '☑', stamp: '✓', file: 'קובץ', text: 'שדה טקסט', number: 'מספר' };
    const typeIcons = { signature: ICO.sign, file: ICO.doc, date_auto: ICO.calendar, date_manual: ICO.calendar, fullname: ICO.user, id_number: ICO.id, checkbox: ICO.checkbox };
    const displayText = esc(f.value || typeLabels[f.type] || f.label || 'טקסט');
    const fieldIcon = typeIcons[f.type] || '';

    return `<div class="field-box ${selected ? 'selected' : ''}" data-fid="${f.id}"
        style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;z-index:${selected ? 20 : 10};"
        onmousedown="fieldMouseDown(event,${f.id})" ontouchstart="fieldTouchStart(event,${f.id})"
        onclick="event.stopPropagation();selectField(${f.id})" ondblclick="event.stopPropagation();editFieldInline(${f.id})">
        ${selected ? (() => {
            const rcptName = assignee ? (assignee.name || 'נמען ' + (DM.recipients.indexOf(assignee) + 1)) : '';
            return `
            <div class="field-label-tag" style="background:${c.fill};">${esc(f.label)}${f.required ? ' *' : ''}</div>
            <div class="field-toolbar">
                <button onclick="event.stopPropagation();deleteField(${f.id})" title="מחק">${ICO.trash}</button>
                <button onclick="event.stopPropagation();duplicateField(${f.id})" title="שכפל">${ICO.copy}</button>
                <button onclick="event.stopPropagation();editFieldInline(${f.id})" title="ערוך">${ICO.edit}</button>
                <span class="toolbar-rcpt-badge" style="background:${c.fill};">${esc(rcptName)} <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c.bg};margin-right:4px;vertical-align:middle;"></span></span>
            </div>
            <div class="resize-handle" style="top:-4px;left:-4px;border-color:${c.fill};cursor:nw-resize;" onmousedown="resizeMouseDown(event,${f.id},'nw')"></div>
            <div class="resize-handle" style="top:-4px;right:-4px;border-color:${c.fill};cursor:ne-resize;" onmousedown="resizeMouseDown(event,${f.id},'ne')"></div>
            <div class="resize-handle" style="bottom:-4px;left:-4px;border-color:${c.fill};cursor:sw-resize;" onmousedown="resizeMouseDown(event,${f.id},'sw')"></div>
            <div class="resize-handle" style="bottom:-4px;right:-4px;border-color:${c.fill};cursor:se-resize;" onmousedown="resizeMouseDown(event,${f.id},'se')"></div>
        `; })() : ''}
        <div class="field-inner" style="background:${c.bg};border-color:${c.border};color:${c.text};border-radius:20px;${selected ? 'border-width:2px;border-style:solid;' : 'border-width:1.5px;border-style:dashed;'}" ${f.required ? 'title="שדה חובה"' : ''}>
            ${fieldIcon ? `<span class="field-type-icon" style="color:${c.fill};flex-shrink:0;margin-right:3px;display:flex;align-items:center;">${fieldIcon}</span>` : ''}
            <span style="padding:0 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:0.78em;">${displayText}</span>
            ${f.required ? `<span style="color:#dc2626;font-weight:800;font-size:1.1em;margin-right:2px;flex-shrink:0;">*</span>` : ''}
        </div>
    </div>`;
}

// ==================== FIELD ACTIONS ====================
// Store pending field type when user clicks a tool button
// Then place field at next click on the document canvas
DM._pendingFieldType = null;
DM._pendingFieldLabel = null;

function addField(type, label) {
    DM._pendingFieldType = type;
    DM._pendingFieldLabel = label;
    DM._lastFieldType = type;
    DM._lastFieldLabel = label;
    const container = document.getElementById('docContainer');
    if (container) container.style.cursor = 'crosshair';
    render();
}

function onCanvasClick(e) {
    // If no pending field type, use last used type (auto-repeat)
    if (!DM._pendingFieldType && DM._lastFieldType) {
        DM._pendingFieldType = DM._lastFieldType;
        DM._pendingFieldLabel = DM._lastFieldLabel;
    }
    if (!DM._pendingFieldType) return;
    // Don't place if clicking on an existing field
    if (e.target.closest && e.target.closest('.field-box')) return;

    const container = document.getElementById('docContainer');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const zoom = DM._zoom || 1;
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    const type = DM._pendingFieldType;
    const label = DM._pendingFieldLabel;
    const assignee = DM.recipients.find(r => r.id === DM.activeRecipientId) || DM.recipients[0];
    const defaultW = type === 'signature' ? 160 : type === 'checkbox' ? 26 : type === 'file' ? 140 : 120;
    const defaultH = type === 'signature' ? 80 : type === 'checkbox' ? 26 : 28;

    // Auto-set values for certain types
    const autoValue = type === 'date_auto' ? new Date().toLocaleDateString('he-IL') : '';
    const f = {
        id: Date.now() + Math.random(),
        type, label, value: autoValue,
        x: Math.max(0, clickX - defaultW / 2),
        y: Math.max(0, clickY - defaultH / 2),
        w: defaultW, h: defaultH,
        required: true,
        assigneeId: assignee ? assignee.id : null,
        fixed: DM.isTemplate ? (DM._fieldFixed || false) : false,
        defaultChecked: false
    };
    DM.fields.push(f);
    DM.selectedFieldId = f.id;

    // Keep pending type for auto-repeat (user can Esc to stop)
    DM._lastFieldType = type;
    DM._lastFieldLabel = label;

    e.stopPropagation();
    render();
}

function selectField(id) { DM.selectedFieldId = id; render(); }
function deselectField(e) {
    if (e.target.id === 'canvasArea') {
        DM.selectedFieldId = null;
        DM._pendingFieldType = null;
        DM._pendingFieldLabel = null;
        render();
    }
}
// Live update field overlay while typing (no full re-render)
function updateFieldLive(id, key, val) {
    const f = DM.fields.find(x => x.id === id);
    if (!f) return;
    f[key] = val;
    const box = document.querySelector(`.field-box[data-fid="${id}"]`);
    if (!box) return;
    if (key === 'label') {
        const tag = box.querySelector('.field-label-tag');
        if (tag) tag.textContent = val + (f.required ? ' *' : '');
    }
}

function updateField(id, key, val) {
    const f = DM.fields.find(x => x.id === id);
    if (f) {
        // Auto-update label when type changes (if label was still the default)
        const _defaultLabels = { text: 'טקסט', signature: 'חתימה', date_auto: 'תאריך אוטומטי', date_manual: 'בחירת תאריך', number: 'מספר', fullname: 'שם מלא', id_number: 'ת.ז.', checkbox: 'סימון', file: 'צירוף קובץ' };
        if (key === 'type') {
            const oldDefault = _defaultLabels[f.type];
            if (!f.label || f.label === oldDefault) {
                f.label = _defaultLabels[val] || val;
            }
        }
        f[key] = val;
        // Auto-set values when type changes
        if (key === 'type' && val === 'date_auto' && !f.value) {
            f.value = new Date().toLocaleDateString('he-IL');
        }
        // אם משנים את defaultChecked, מעדכנים את הערך בהתאם
        if (key === 'defaultChecked' && f.type === 'checkbox') {
            f.value = val ? '✓' : '';
        }
        render();
    }
}
function deleteField(id) { DM.fields = DM.fields.filter(f => f.id !== id); DM.selectedFieldId = null; render(); }
function duplicateField(id) {
    const f = DM.fields.find(x => x.id === id);
    if (!f) return;
    DM.fields.push({ ...f, id: Date.now() + Math.random(), x: f.x + 15, y: f.y + 15 });
    render();
}

function editFieldInline(id) {
    const f = DM.fields.find(x => x.id === id);
    if (!f) return;

    // Checkbox - toggle immediately
    if (f.type === 'checkbox') { f.value = f.value ? '' : '✓'; render(); return; }
    // Date auto - set current date immediately
    if (f.type === 'date' || f.type === 'date_auto') { f.value = new Date().toLocaleDateString('he-IL'); render(); return; }
    // Signature - open signature canvas for drawing
    if (f.type === 'signature') { openEditorSignature(id); return; }

    // For all other types: show inline input inside the field on the canvas
    const fieldEl = document.querySelector(`.field-box[data-fid="${id}"]`);
    if (!fieldEl) return;

    const inner = fieldEl.querySelector('.field-inner');
    if (!inner) return;

    if (f.type === 'date_manual') {
        // Date picker input
        inner.innerHTML = `<input type="date" class="inline-edit-input" value="${esc(f.value || '')}" style="width:100%;height:100%;border:none;background:transparent;font-family:var(--font);font-size:0.85em;font-weight:600;text-align:center;outline:none;cursor:text;">`;
        const inp = inner.querySelector('input');
        inp.focus();
        inp.onchange = () => { f.value = inp.value ? new Date(inp.value).toLocaleDateString('he-IL') : ''; render(); };
        inp.onblur = () => render();
    } else {
        // Text input for: text, number, fullname, id_number, file
        const placeholder = f.type === 'file' ? 'סוג קובץ נדרש...' : esc(f.label || 'הזן ערך...');
        inner.innerHTML = `<input type="${f.type === 'number' ? 'number' : 'text'}" class="inline-edit-input" value="${esc(f.value || '')}" placeholder="${placeholder}" style="width:100%;height:100%;border:none;background:transparent;font-family:var(--font);font-size:0.85em;font-weight:600;text-align:center;outline:none;padding:0 4px;color:#1e293b;">`;
        const inp = inner.querySelector('input');
        inp.focus();
        inp.select();
        inp.onkeydown = e => {
            if (e.key === 'Enter') { f.value = inp.value; render(); }
            if (e.key === 'Escape') render();
        };
        inp.onblur = () => { f.value = inp.value; render(); };
    }
}

// ==================== EDITOR SIGNATURE CANVAS ====================
function openEditorSignature(fieldId) {
    const f = DM.fields.find(x => x.id === fieldId);
    if (!f) return;
    window._editorSignActiveTab = 'draw';
    window._editorSignUploadData = null;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'editorSignModal';
    overlay.innerHTML = `<div class="modal-card" style="width:500px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <h3 style="font-weight:700;margin:0;">חתימה דיגיטלית</h3>
            <button class="btn btn-ghost btn-sm" onclick="cancelEditorSignCanvas()" style="font-size:1.1em;">✕</button>
        </div>
        <div class="sign-tabs" style="display:flex;border-bottom:2px solid var(--border);margin-bottom:14px;">
            <button class="sign-tab active" data-tab="draw" onclick="switchEditorSignTab('draw')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
                ציור
            </button>
            <button class="sign-tab" data-tab="type" onclick="switchEditorSignTab('type')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                הקלדה
            </button>
            <button class="sign-tab" data-tab="upload" onclick="switchEditorSignTab('upload')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                העלאה
            </button>
        </div>
        <div class="sign-tab-content" id="editorSignTabDraw">
            <p style="font-size:0.82em;color:var(--text-light);margin-bottom:8px;">חתום בתוך המסגרת:</p>
            <canvas id="editorSignCanvas" class="sign-canvas" width="400" height="180"></canvas>
            <button class="btn btn-ghost btn-sm" onclick="clearEditorSignCanvas()" style="margin-top:6px;font-size:0.78em;">נקה ציור</button>
        </div>
        <div class="sign-tab-content" id="editorSignTabType" style="display:none;">
            <p style="font-size:0.82em;color:var(--text-light);margin-bottom:8px;">הקלד את שמך:</p>
            <input type="text" id="editorSignNameInput" class="form-input" placeholder="השם המלא שלך" style="font-size:1.1em;padding:12px;text-align:center;margin-bottom:10px;" oninput="updateEditorSignNamePreview()">
            <div style="font-size:0.78em;color:var(--text-light);margin-bottom:6px;">בחר סגנון:</div>
            <div id="editorSignFontOptions" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <button class="sign-font-btn active" data-font="'Segoe Script', 'Dancing Script', cursive" onclick="selectEditorSignFont(this)" style="font-family:'Segoe Script','Dancing Script',cursive;">חתימה</button>
                <button class="sign-font-btn" data-font="'Brush Script MT', 'Satisfy', cursive" onclick="selectEditorSignFont(this)" style="font-family:'Brush Script MT','Satisfy',cursive;">חתימה</button>
                <button class="sign-font-btn" data-font="'Comic Sans MS', 'Caveat', cursive" onclick="selectEditorSignFont(this)" style="font-family:'Comic Sans MS','Caveat',cursive;">חתימה</button>
                <button class="sign-font-btn" data-font="'Georgia', serif" onclick="selectEditorSignFont(this)" style="font-family:Georgia,serif;font-style:italic;">חתימה</button>
            </div>
            <div style="border:2px solid var(--border);border-radius:8px;background:white;min-height:80px;display:flex;align-items:center;justify-content:center;padding:12px;">
                <span id="editorSignNamePreview" style="font-size:2em;color:#1e293b;font-family:'Segoe Script','Dancing Script',cursive;"></span>
            </div>
        </div>
        <div class="sign-tab-content" id="editorSignTabUpload" style="display:none;">
            <p style="font-size:0.82em;color:var(--text-light);margin-bottom:8px;">העלה תמונת חתימה:</p>
            <div id="editorSignUploadArea" style="border:2px dashed var(--border);border-radius:8px;padding:30px;text-align:center;cursor:pointer;background:var(--bg);min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;" onclick="document.getElementById('editorSignUploadInput').click()">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span style="font-size:0.85em;color:var(--text-light);margin-top:8px;">לחץ או גרור תמונה לכאן</span>
                <input type="file" id="editorSignUploadInput" accept="image/*" style="display:none;" onchange="handleEditorSignUpload(event)">
            </div>
            <div id="editorSignUploadPreview" style="display:none;margin-top:10px;text-align:center;">
                <img id="editorSignUploadImg" style="max-width:100%;max-height:150px;border:1px solid var(--border);border-radius:8px;">
                <button class="btn btn-ghost btn-sm" onclick="clearEditorSignUpload()" style="margin-top:6px;font-size:0.78em;">הסר תמונה</button>
            </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
            <button class="btn btn-outline" style="flex:1;" onclick="cancelEditorSignCanvas()">ביטול</button>
            <button class="btn btn-primary" style="flex:1;" onclick="confirmEditorSignCanvas(${fieldId})">אשר חתימה</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) cancelEditorSignCanvas(); };

    const canvas = document.getElementById('editorSignCanvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function pos(e) {
        const r = canvas.getBoundingClientRect();
        const cx = (e.clientX || e.touches?.[0]?.clientX || 0) - r.left;
        const cy = (e.clientY || e.touches?.[0]?.clientY || 0) - r.top;
        return { x: cx * (canvas.width / r.width), y: cy * (canvas.height / r.height) };
    }
    canvas.onmousedown = canvas.ontouchstart = e => { e.preventDefault(); drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    canvas.onmousemove = canvas.ontouchmove = e => { if (!drawing) return; e.preventDefault(); const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    canvas.onmouseup = canvas.ontouchend = () => { drawing = false; };
    canvas.onmouseleave = () => { drawing = false; };
    window._editorSignCanvas = canvas;
    window._editorSignFieldId = fieldId;

    // Upload drag & drop
    const uploadArea = document.getElementById('editorSignUploadArea');
    if (uploadArea) {
        uploadArea.ondragover = e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--primary)'; };
        uploadArea.ondragleave = e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--border)'; };
        uploadArea.ondrop = e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--border)'; if (e.dataTransfer.files[0]) processEditorSignUploadFile(e.dataTransfer.files[0]); };
    }
}

function switchEditorSignTab(tab) {
    window._editorSignActiveTab = tab;
    document.querySelectorAll('#editorSignModal .sign-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('editorSignTabDraw').style.display = tab === 'draw' ? '' : 'none';
    document.getElementById('editorSignTabType').style.display = tab === 'type' ? '' : 'none';
    document.getElementById('editorSignTabUpload').style.display = tab === 'upload' ? '' : 'none';
}

function selectEditorSignFont(btn) {
    document.querySelectorAll('#editorSignModal .sign-font-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window._editorSignFont = btn.dataset.font;
    updateEditorSignNamePreview();
}

function updateEditorSignNamePreview() {
    const input = document.getElementById('editorSignNameInput');
    const preview = document.getElementById('editorSignNamePreview');
    if (input && preview) {
        preview.textContent = input.value || '';
        preview.style.fontFamily = window._editorSignFont || "'Segoe Script','Dancing Script',cursive";
    }
}

function handleEditorSignUpload(e) { if (e.target.files[0]) processEditorSignUploadFile(e.target.files[0]); }
function processEditorSignUploadFile(file) {
    if (!file.type.startsWith('image/')) { toast('יש להעלות קובץ תמונה בלבד', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
        window._editorSignUploadData = ev.target.result;
        const preview = document.getElementById('editorSignUploadPreview');
        const img = document.getElementById('editorSignUploadImg');
        const area = document.getElementById('editorSignUploadArea');
        if (preview && img) { img.src = ev.target.result; preview.style.display = ''; }
        if (area) area.style.display = 'none';
    };
    reader.readAsDataURL(file);
}
function clearEditorSignUpload() {
    window._editorSignUploadData = null;
    const preview = document.getElementById('editorSignUploadPreview');
    const area = document.getElementById('editorSignUploadArea');
    if (preview) preview.style.display = 'none';
    if (area) area.style.display = '';
}

function clearEditorSignCanvas() {
    const c = window._editorSignCanvas;
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

function cancelEditorSignCanvas() {
    const m = document.getElementById('editorSignModal');
    if (m) m.remove();
    delete window._editorSignCanvas;
    delete window._editorSignFieldId;
    window._editorSignUploadData = null;
}

function confirmEditorSignCanvas(fieldId) {
    const tab = window._editorSignActiveTab || 'draw';
    let signatureData = null;

    if (tab === 'draw') {
        const c = window._editorSignCanvas;
        if (!c) return;
        const ctx = c.getContext('2d');
        const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
        let hasContent = false;
        for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] > 0) { hasContent = true; break; } }
        if (!hasContent) { toast('יש לצייר חתימה', 'error'); return; }
        signatureData = c.toDataURL();
    } else if (tab === 'type') {
        const input = document.getElementById('editorSignNameInput');
        const name = input ? input.value.trim() : '';
        if (!name) { toast('יש להקליד שם', 'error'); return; }
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = 400; tmpCanvas.height = 120;
        const ctx = tmpCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 120);
        ctx.fillStyle = '#1e293b';
        const font = window._editorSignFont || "'Segoe Script','Dancing Script',cursive";
        ctx.font = `36px ${font}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(name, 200, 60, 380);
        signatureData = tmpCanvas.toDataURL();
    } else if (tab === 'upload') {
        if (!window._editorSignUploadData) { toast('יש להעלות תמונת חתימה', 'error'); return; }
        signatureData = window._editorSignUploadData;
    }

    const f = DM.fields.find(x => x.id === fieldId);
    if (f && signatureData) {
        f.value = 'חתום';
        f.signatureData = signatureData;
    }
    cancelEditorSignCanvas();
    render();
}

// ==================== DRAG & RESIZE ====================
function fieldMouseDown(e, id) {
    if (e.target && e.target.closest && e.target.closest('.resize-handle')) return;
    if (e.stopPropagation) e.stopPropagation();
    const container = document.getElementById('docContainer');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const zoom = DM._zoom || 1;
    const f = DM.fields.find(x => x.id === id);
    if (!f) return;
    DM.dragItem = f;
    DM.dragOffset = { x: (e.clientX - rect.left) / zoom - f.x, y: (e.clientY - rect.top) / zoom - f.y };
    DM.isDragging = true;
    DM.selectedFieldId = id;
    // Listen on document so mouseup fires even outside the canvas area
    document.addEventListener('mouseup', _globalMouseUp, { once: true });
}

function fieldTouchStart(e, id) {
    e.preventDefault();
    fieldMouseDown(e.touches[0], id);
}

function resizeMouseDown(e, id, handle) {
    if (e.stopPropagation) e.stopPropagation();
    const f = DM.fields.find(x => x.id === id);
    if (!f) return;
    DM.dragItem = f;
    DM.resizeHandle = handle;
    DM.resizeStart = { x: e.clientX, y: e.clientY, w: f.w, h: f.h, fx: f.x, fy: f.y };
    DM.isResizing = true;
    DM.selectedFieldId = id;
    document.addEventListener('mouseup', _globalMouseUp, { once: true });
}

function handleMouseMove(e) {
    const container = document.getElementById('docContainer');
    if (!container) return;
    const rect = container.getBoundingClientRect();

    if (DM.isResizing && DM.dragItem) {
        const zoom = DM._zoom || 1;
        const dx = (e.clientX - DM.resizeStart.x) / zoom;
        const dy = (e.clientY - DM.resizeStart.y) / zoom;
        let w = DM.resizeStart.w, h = DM.resizeStart.h, x = DM.resizeStart.fx, y = DM.resizeStart.fy;
        const hdl = DM.resizeHandle;
        if (hdl.includes('e')) w += dx;
        if (hdl.includes('w')) { w -= dx; x += dx; }
        if (hdl.includes('s')) h += dy;
        if (hdl.includes('n')) { h -= dy; y += dy; }
        if (w < 20) w = 20; if (h < 16) h = 16;
        const f = DM.fields.find(fld => fld.id === DM.dragItem.id);
        if (f) { f.w = w; f.h = h; f.x = x; f.y = y; }
        rerenderDragField();
    } else if (DM.isDragging && DM.dragItem) {
        const zoom = DM._zoom || 1;
        const nx = Math.max(0, Math.min((e.clientX - rect.left) / zoom - DM.dragOffset.x, rect.width / zoom - 20));
        const ny = Math.max(0, Math.min((e.clientY - rect.top) / zoom - DM.dragOffset.y, rect.height / zoom - 20));
        const f = DM.fields.find(fld => fld.id === DM.dragItem.id);
        if (f) { f.x = nx; f.y = ny; }
        rerenderDragField();
    }
}

function rerenderDragField() {
    if (!DM.dragItem) return;
    const el = document.querySelector(`[data-fid="${DM.dragItem.id}"]`);
    if (el) {
        el.style.left = DM.dragItem.x + 'px';
        el.style.top = DM.dragItem.y + 'px';
        el.style.width = DM.dragItem.w + 'px';
        el.style.height = DM.dragItem.h + 'px';
    }
}

function handleMouseUp() {
    DM.isDragging = false;
    DM.isResizing = false;
    DM.resizeHandle = null;
    DM.dragItem = null;
}

function _globalMouseUp() {
    if (DM.isDragging || DM.isResizing) handleMouseUp();
}

// ==================== STEP 4: SEND ====================
if (!DM._sendCopyMethod) DM._sendCopyMethod = 'none';
if (!DM._sendInstructions) DM._sendInstructions = '';
if (!DM._showInstructions) DM._showInstructions = false;

function renderSend(el) {
    el.innerHTML = `<div class="send-area">
        <h2 style="font-size:1.3em;font-weight:700;margin-bottom:20px;">הכנה לשליחה</h2>
        <div class="send-grid">
            <!-- Right: Document details -->
            <div class="send-card">
                <div class="form-group">
                    <label class="form-label">שם המסמך</label>
                    <input type="text" class="form-input" value="${esc(DM.fileName || 'מסמך ללא שם')}" onchange="DM.fileName=this.value" style="font-weight:600;">
                </div>
                <div class="form-group">
                    <label class="form-label">הודעה לחותם בשליחת דוא"ל</label>
                    <textarea class="form-input" rows="3" placeholder="הזן הודעה..." id="sendMessage" style="resize:none;"></textarea>
                </div>
                ${DM._showInstructions ? `
                <div class="form-group">
                    <label class="form-label">הנחיות למילוי</label>
                    <textarea class="form-input" rows="2" placeholder="הזן הנחיות למילוי המסמך..." id="sendInstructions" style="resize:none;" onchange="DM._sendInstructions=this.value">${esc(DM._sendInstructions)}</textarea>
                </div>` : `
                <div style="text-align:left;">
                    <button class="btn-link" onclick="DM._showInstructions=true;render();" style="font-size:0.82em;color:var(--primary);background:none;border:none;cursor:pointer;font-weight:600;font-family:var(--font);">+ הוסף הנחיות למילוי</button>
                </div>`}
                <div style="margin-top:12px;">
                    ${DM.recipients.length > 0 ? `
                    <label class="form-label" style="margin-bottom:8px;">נמענים:</label>
                    ${DM.recipients.map(r => {
                        const c = DM.fieldColors[r.colorIndex % DM.fieldColors.length];
                        const rfc = DM.fields.filter(f => f.assigneeId === r.id).length;
                        const fc = rfc > 0 ? rfc : DM.fields.filter(f => !f.fixed).length;
                        return `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:8px;margin-bottom:6px;">
                            <span style="width:8px;height:8px;border-radius:50%;background:${c.fill};flex-shrink:0;"></span>
                            <span style="font-weight:600;font-size:0.88em;">${esc(r.name || 'ללא שם')}</span>
                            <span style="font-size:0.78em;color:var(--text-light);direction:ltr;">${esc(r.phone || '')}</span>
                            <span style="margin-right:auto;font-size:0.72em;background:var(--card);padding:2px 8px;border-radius:10px;">${fc} שדות</span>
                        </div>`;
                    }).join('')}
                    ` : `
                    <div style="padding:12px;background:var(--primary-light);border-radius:8px;text-align:center;">
                        <span style="font-size:0.85em;color:var(--primary);font-weight:600;">ללא נמענים - יופץ כקישור לכל מי שמקבל אותו</span>
                    </div>
                    `}
                </div>
            </div>

            <!-- Left: Additional options -->
            <div>
                <div class="send-card">
                    <h3 style="font-weight:700;font-size:0.9em;margin-bottom:14px;">אפשרויות נוספות</h3>
                    <div class="form-group">
                        <label class="form-label">שליחת העתק לנמען</label>
                        <select class="form-input" onchange="DM._sendCopyMethod=this.value" style="font-size:0.88em;">
                            <option value="none" ${DM._sendCopyMethod === 'none' ? 'selected' : ''}>אל תשלח עותק לנמען</option>
                            <option value="email" ${DM._sendCopyMethod === 'email' ? 'selected' : ''}>שלח העתק בדוא"ל בסיום המילוי</option>
                            <option value="whatsapp" ${DM._sendCopyMethod === 'whatsapp' ? 'selected' : ''}>שלח העתק של המסמך החתום בוואצאפ</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">תאריך תפוגה (אופציונלי)</label>
                        <input type="date" class="form-input" id="docExpiry" style="direction:ltr;text-align:right;">
                    </div>
                </div>
                ${DM.recipients.length > 0 ? `<div style="margin-top:12px;text-align:center;">
                    <button class="btn-link" onclick="createLinkOnly()" style="font-size:0.85em;color:var(--primary);background:none;border:none;cursor:pointer;font-weight:600;font-family:var(--font);">צור קישור לשיתוף ללא שליחה</button>
                </div>` : ''}
            </div>
        </div>
    </div>`;
}

function createLinkOnly() {
    try {
        if (DM.fields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }
        if (!DM.docImage) { toast('יש להעלות מסמך קודם', 'error'); return; }
        const now = new Date().toISOString();
        const doc = {
            id: 'dm_' + Date.now(),
            fileName: DM.fileName || 'מסמך ללא שם',
            docImage: DM.docImage,
            docPages: DM.docPages || [],
            pageHeights: DM.pageHeights || [],
            pageWidth: DM.pageWidth || 0,
            recipients: JSON.parse(JSON.stringify(DM.recipients)),
            fields: JSON.parse(JSON.stringify(DM.fields)),
            status: 'sent',
            createdAt: now,
            createdBy: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser) ? smoovCurrentUser.email : '',
            ownerUid: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser) ? smoovCurrentUser.uid : '',
            _fromTemplate: !!DM._fromTemplate,
            templateId: DM._templateId || null,
            audit: [{ action: 'created', time: now, detail: 'המסמך נוצר (קישור ללא שליחה)' }]
        };
        DM.docs.push(doc);
        save();
        if (typeof firebaseSaveDoc === 'function') {
            firebaseSaveDoc(doc).then(ok => { if (ok) console.log('Document saved to Firebase'); });
        }
        resetEditor();
        showLinkSuccess(doc);
    } catch (err) {
        console.error('createLinkOnly error:', err);
        toast('שגיאה ביצירת קישור: ' + friendlyError(err), 'error');
    }
}

function showLinkSuccess(doc) {
    const baseUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;
    const hasTpl = !!(doc.templateId || doc._fromTemplate);
    const fillUrl = doc.templateId ? `${location.origin}${location.pathname}#fill/${doc.templateId}` : '';
    const main = document.getElementById('mainContent');
    main.innerHTML = `<div class="link-success-screen">
        <button class="close-btn" onclick="resetEditor();DM.view='home';render();" style="position:absolute;top:16px;left:16px;background:none;border:none;font-size:1.5em;cursor:pointer;color:var(--text-light);">✕</button>
        <div class="link-success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#16a34a"/><polyline points="7 12 10 15 17 9" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h2 style="font-size:1.5em;font-weight:800;margin:16px 0 6px;">המסמך מוכן לחתימה!</h2>
        <p style="color:var(--text-light);font-size:0.9em;margin-bottom:24px;">עדכון ישלח אליך כאשר המסמך יחתם</p>
        ${hasTpl && fillUrl ? `
        <div style="width:100%;max-width:500px;margin-bottom:24px;padding:20px;background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:2px solid #93c5fd;border-radius:14px;text-align:center;">
            <div style="font-size:0.95em;font-weight:700;color:var(--primary);margin-bottom:8px;">🔗 קישור למילוי חוזר (תבנית)</div>
            <p style="font-size:0.82em;color:var(--text-light);margin-bottom:14px;">שתף קישור זה — כל מי שיפתח אותו יקבל <strong>עותק נפרד</strong> למילוי</p>
            <button class="btn btn-primary" onclick="copySignLink(this,'${fillUrl}')" style="display:inline-flex;align-items:center;gap:8px;padding:10px 24px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                העתק קישור תבנית
            </button>
            <div style="margin-top:10px;font-size:0.75em;color:var(--text-light);direction:ltr;word-break:break-all;">${fillUrl}</div>
        </div>
        ` : ''}
        ${hasTpl ? `<details style="width:100%;max-width:500px;margin-top:8px;">
            <summary style="font-size:0.82em;color:var(--text-muted,#94a3b8);cursor:pointer;text-align:center;">(קישור ישיר למסמך יחיד זה בלבד)</summary>
            <div style="display:flex;flex-direction:column;gap:8px;margin-top:10px;padding:12px;background:var(--bg);border-radius:10px;">
            ${(doc.recipients || []).length > 0 ? doc.recipients.map((r, i) => {
                const signUrl = baseUrl;
                return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-weight:600;color:var(--text-light);font-size:0.85em;">${i + 1}. ${esc(r.name || 'נמען ' + (i + 1))}</span>
                    </div>
                    <button class="btn btn-sm btn-ghost" onclick="copySignLink(this,'${signUrl}')" style="font-size:0.78em;color:var(--text-light);border:1px solid var(--border);">
                        העתק
                    </button>
                </div>`;
            }).join('') : `<div style="text-align:center;">
                <button class="btn btn-sm btn-ghost" onclick="copySignLink(this,'${baseUrl}')" style="color:var(--text-light);border:1px solid var(--border);display:inline-flex;align-items:center;gap:6px;font-size:0.82em;">
                    העתק קישור ישיר
                </button>
            </div>`}
            </div>
        </details>` : `
        <div style="font-size:0.88em;color:var(--text-light);margin-bottom:16px;">${(doc.recipients || []).length > 0 ? 'נתיב מסמך:' : 'קישור לחתימה:'}</div>
        <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:500px;">
            ${(doc.recipients || []).length > 0 ? doc.recipients.map((r, i) => {
                const signUrl = baseUrl;
                return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--bg);border-radius:10px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-weight:700;color:var(--primary);font-size:0.9em;">${i + 1}</span>
                        <span style="font-weight:600;">${esc(r.name || 'נמען ' + (i + 1))}</span>
                    </div>
                    <button class="btn btn-sm" onclick="copySignLink(this,'${signUrl}')" style="background:var(--primary-light);color:var(--primary);border:1px solid #93c5fd;display:flex;align-items:center;gap:6px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                        העתק קישור
                    </button>
                </div>`;
            }).join('') : `<div style="display:flex;align-items:center;justify-content:center;padding:12px 16px;background:var(--bg);border-radius:10px;">
                <button class="btn btn-primary" onclick="copySignLink(this,'${baseUrl}')" style="display:flex;align-items:center;gap:8px;padding:10px 24px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    העתק קישור לשיתוף
                </button>
            </div>`}
        </div>`}
        ${!hasTpl ? `<div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--border);width:100%;max-width:500px;text-align:center;">
            <h3 style="font-weight:700;margin-bottom:6px;">צור תבנית</h3>
            <p style="font-size:0.82em;color:var(--text-light);margin-bottom:12px;">שלחת מסמך שאינו תבנית. חסוך זמן בפעם הבאה על ידי יצירת תבנית ממנו.</p>
            <button class="btn btn-outline" onclick="saveAsTemplateFromDoc('${doc.id}')">שמור כתבנית</button>
        </div>` : ''}
        <div style="margin-top:20px;">
            <button class="btn btn-primary" onclick="resetEditor();DM.view='home';render();">חזור לראשי</button>
        </div>
    </div>`;
}

function copySignLink(btn, url) {
    _clipboardCopy(url).then(() => {
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> הועתק!';
        btn.style.background = '#dcfce7';
        btn.style.color = '#16a34a';
        btn.style.borderColor = '#16a34a';
        setTimeout(() => {
            btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> העתק קישור';
            btn.style.background = 'var(--primary-light)';
            btn.style.color = 'var(--primary)';
            btn.style.borderColor = '#93c5fd';
        }, 2000);
    }).catch(() => toast('שגיאה בהעתקת הקישור', 'error'));
}

function saveAsTemplateFromDoc(docId) {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) return;
    const tpl = {
        id: 'tpl_' + Date.now(),
        name: doc.fileName,
        fileName: doc.fileName,
        docImage: doc.docImage,
        docPages: doc.docPages || [],
        pageHeights: doc.pageHeights || [],
        pageWidth: doc.pageWidth || 0,
        recipients: JSON.parse(JSON.stringify(doc.recipients)),
        fields: JSON.parse(JSON.stringify(doc.fields)),
        createdAt: new Date().toISOString(),
        createdBy: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser && smoovCurrentUser.email) || '',
        ownerUid: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser && smoovCurrentUser.uid) || ''
    };
    DM.templates.push(tpl);
    save();
    if (typeof firebaseSaveTemplate === 'function') firebaseSaveTemplate(tpl);
    toast('התבנית נשמרה בהצלחה!');
}

// ==================== SEND DOCUMENT ====================
let _sendingDoc = false;
function sendDocument() {
    if (_sendingDoc) return;
    if (DM.recipients.length === 0) { toast('יש להוסיף לפחות נמען אחד', 'error'); return; }
    const emptyNames = DM.recipients.filter(r => !r.name || !r.name.trim());
    if (emptyNames.length > 0) { toast('יש להזין שם לכל הנמענים', 'error'); return; }
    if (DM.fields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }
    _sendingDoc = true;
    const sendBtn = document.querySelector('.btn-success.btn-lg');
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'שולח...'; }
    try {
        const now = new Date().toISOString();
        const expiryInput = document.getElementById('docExpiry');
        const doc = {
            id: 'dm_' + Date.now(),
            fileName: DM.fileName || 'מסמך ללא שם',
            docImage: DM.docImage,
            docPages: DM.docPages || [],
            pageHeights: DM.pageHeights || [],
            pageWidth: DM.pageWidth || 0,
            recipients: JSON.parse(JSON.stringify(DM.recipients)),
            fields: JSON.parse(JSON.stringify(DM.fields)),
            status: 'sent',
            createdAt: now,
            createdBy: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser) ? smoovCurrentUser.email : '',
            ownerUid: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser) ? smoovCurrentUser.uid : '',
            expiresAt: expiryInput && expiryInput.value ? new Date(expiryInput.value).toISOString() : null,
            _fromTemplate: !!DM._fromTemplate,
            templateId: DM._templateId || null,
            audit: [{ action: 'created', time: now, detail: 'המסמך נוצר' }, { action: 'sent', time: now, detail: `נשלח ל-${DM.recipients.length} נמענים` }]
        };
        DM.docs.push(doc);
        save();

        // Save to Firebase for cross-browser signing
        if (typeof firebaseSaveDoc === 'function') {
            firebaseSaveDoc(doc).then(ok => {
                if (ok) console.log('Document saved to Firebase');
            });
        }

        // WhatsApp notifications
        const msg = document.getElementById('sendMessage')?.value || '';
        DM.recipients.forEach(r => {
            if (r.phone) {
                const phone = r.phone.replace(/[^0-9]/g, '');
                if (phone.length >= 9) {
                    const intl = phone.startsWith('0') ? '972' + phone.substring(1) : phone;
                    const signUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;
                    const waMsg = `שלום ${r.name},\nנשלח אליך מסמך "${DM.fileName}" לחתימה דיגיטלית.\n${msg}\nקישור לחתימה: ${signUrl}`;
                    const opened = window.open(`https://wa.me/${intl}?text=${encodeURIComponent(waMsg)}`, '_blank');
                    if (!opened) toast('חלון WhatsApp נחסם - שלח ידנית את הקישור', 'error');
                }
            }
        });

        toast('המסמך נשלח בהצלחה!');
        resetEditor();
        showLinkSuccess(doc);
    } catch (err) {
        console.error('Send document error:', err);
        toast('שגיאה בשליחת המסמך: ' + friendlyError(err), 'error');
    } finally {
        _sendingDoc = false;
        if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'שלח מסמך'; }
    }
}

// ==================== SAVE TEMPLATE ====================
async function saveTemplate() {
    if (!DM.docImage) { toast('יש להעלות מסמך קודם', 'error'); return; }
    if (DM.fields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }

    // Show saving indicator
    const saveBtn = document.querySelector('.wizard-footer .btn-success');
    const origText = saveBtn ? saveBtn.textContent : '';
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'שומר...'; }

    try {
        const tpl = {
            id: DM.editingTemplateId || 'tpl_' + Date.now(),
            name: DM.fileName || 'תבנית ללא שם',
            docImage: DM.docImage,
            docPages: DM.docPages || [],
            pageHeights: DM.pageHeights || [],
            pageWidth: DM.pageWidth || 0,
            fields: JSON.parse(JSON.stringify(DM.fields)),
            fixedFields: DM.fields.filter(f => f.fixed),
            createdAt: new Date().toISOString(),
            createdBy: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser && smoovCurrentUser.email) || '',
            ownerUid: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser && smoovCurrentUser.uid) || ''
        };

        if (DM.editingTemplateId) {
            const idx = DM.templates.findIndex(t => t.id === DM.editingTemplateId);
            if (idx >= 0) DM.templates[idx] = tpl;
        } else {
            DM.templates.push(tpl);
        }
        save();

        // Save to Firebase so external users can load via #fill/ link
        if (typeof firebaseSaveTemplate === 'function') {
            const saved = await firebaseSaveTemplate(tpl);
            if (!saved) toast('התבנית נשמרה מקומית, אך לא הועלתה לענן', 'error');
        }

        showTemplateLinkSuccess(tpl);
    } catch (err) {
        console.error('saveTemplate error:', err);
        toast('שגיאה בשמירת התבנית: ' + friendlyError(err), 'error');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = origText; }
    }
}

function showTemplateLinkSuccess(tpl) {
    const fillUrl = `${location.origin}${location.pathname}#fill/${tpl.id}`;
    resetEditor();
    const main = document.getElementById('mainContent');
    document.body.classList.remove('fullscreen-view');
    renderSidebar();
    main.innerHTML = `<div class="link-success-screen">
        <button class="close-btn" onclick="switchView('templates')" style="position:absolute;top:16px;left:16px;background:none;border:none;font-size:1.5em;cursor:pointer;color:var(--text-light);">✕</button>
        <div class="link-success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#16a34a"/><polyline points="7 12 10 15 17 9" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <h2 style="font-size:1.5em;font-weight:800;margin:16px 0 6px;">התבנית נשמרה!</h2>
        <p style="color:var(--text-light);font-size:0.9em;margin-bottom:24px;">שתף את הקישור - כל מי שיפתח אותו יקבל עותק נפרד למילוי</p>
        <div style="font-size:0.88em;color:var(--text-light);margin-bottom:16px;">קישור למילוי תבנית:</div>
        <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:500px;">
            <div style="display:flex;align-items:center;justify-content:center;padding:12px 16px;background:var(--bg);border-radius:10px;">
                <button class="btn btn-primary" onclick="copySignLink(this,'${fillUrl}')" style="display:flex;align-items:center;gap:8px;padding:10px 24px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    העתק קישור למילוי
                </button>
            </div>
            <div style="text-align:center;font-size:0.78em;color:var(--text-light);direction:ltr;word-break:break-all;">${fillUrl}</div>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;">
            <button class="btn btn-outline" onclick="switchView('templates')">חזור לתבניות</button>
            <button class="btn btn-primary" onclick="switchView('home')">חזור לראשי</button>
        </div>
    </div>`;
}

function copyTemplateFillLink(btn, tplId) {
    const url = `${location.origin}${location.pathname}#fill/${tplId}`;
    _clipboardCopy(url).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> הועתק!';
        btn.style.color = '#16a34a';
        btn.style.borderColor = '#16a34a';
        setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 2000);
    }).catch(() => toast('שגיאה בהעתקת הקישור', 'error'));
}

// ==================== SIGNING VIEW ====================
async function openSign(docId, opts = {}) {
    DM.signDocId = docId;
    DM._signFieldIdx = -1; // Reset field navigation index for new document
    if (!opts.keepSigner) {
        DM._currentSigner = null; // Reset signer identity for new document
        DM._currentSignerEmail = null;
    }
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) { toast('המסמך לא נמצא', 'error'); switchView('home'); return; }

    // Ensure doc images are loaded (IDB first, then Firestore chunks)
    if (!doc.docImage) {
        const imgs = await idbLoadImages(docId);
        if (imgs && imgs.docImage) { doc.docImage = imgs.docImage; doc.docPages = imgs.docPages || []; }
        else if (typeof _loadImageChunks === 'function') {
            const chunks = await _loadImageChunks(doc.templateId || docId);
            if (chunks && chunks.docImage) { doc.docImage = chunks.docImage; doc.docPages = chunks.docPages || []; }
        }
    }

    const isSignLink = location.hash.startsWith('#sign/');
    const isLoggedIn = !!(typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser);
    console.log('[openSign]', { docId, opts, isSignLink, isLoggedIn, hasImage: !!doc.docImage, signer: DM._currentSigner });

    // If user is logged in - check if they're the owner or a signer
    if (isLoggedIn) {
        const isOwner = (doc.ownerUid && doc.ownerUid === smoovCurrentUser.uid) || (!doc.ownerUid && doc.createdBy && doc.createdBy === smoovCurrentUser.email);
        if (isOwner && !opts.keepSigner) {
            // Owner view - full access (but not when coming from fill link)
            DM._currentSigner = null;
            DM.view = 'sign';
            render();
            return;
        }
        // Logged-in signer (from #fill/ or #sign/ link) - set signer identity from Google account
        if (!DM._currentSigner) {
            DM._currentSigner = smoovCurrentUser.displayName || smoovCurrentUser.email || 'חותם';
            DM._currentSignerEmail = smoovCurrentUser.email || '';
        }
        DM.view = 'sign';
        render();
        return;
    }

    // External signer via link - show identity verification if not yet verified
    if (isSignLink && !DM._currentSigner && doc.status !== 'completed') {
        DM.view = 'sign';
        showSignerVerification(doc);
        return;
    }

    DM.view = 'sign';
    render();
}

function showSignerVerification(doc) {
    const main = document.getElementById('mainContent');
    main.innerHTML = `<div class="verify-screen">
        <div class="verify-card" style="padding:24px 28px;">
            <div class="verify-icon" style="margin-bottom:10px;">
                <div class="login-logo-wrap" style="width:52px;height:52px;margin:0 auto;border-radius:14px;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="1.5"/><polyline points="14 2 14 8 20 8" fill="none" stroke="white" stroke-width="1.5"/><path d="M8 15c2-3 4 1 5-1s2-4 3-1" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
                </div>
            </div>
            <h2 style="font-size:1.2em;margin-bottom:4px;">אימות זהות</h2>
            <p style="color:var(--text-light);margin-bottom:4px;font-size:0.88em;">נא להזדהות לפני חתימה על</p>
            <p style="color:var(--text);font-weight:700;margin-bottom:14px;font-size:0.92em;">"${esc(doc.fileName)}"</p>
            <button class="google-signin-btn" onclick="googleSignForSigner('${doc.id}')" style="width:100%;margin-bottom:12px;justify-content:center;">
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                התחבר עם Google
            </button>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div style="flex:1;height:1px;background:var(--border);"></div>
                <span style="font-size:0.75em;color:var(--text-light);">או הזדהות ידנית</span>
                <div style="flex:1;height:1px;background:var(--border);"></div>
            </div>
            <div class="form-group" style="margin-bottom:8px;">
                <label class="form-label" style="font-size:0.82em;">שם מלא</label>
                <input type="text" class="form-input" id="verifyName" placeholder="הזן את שמך המלא..." style="padding:8px 10px;">
            </div>
            <div class="form-group" style="margin-bottom:8px;">
                <label class="form-label" style="font-size:0.82em;">אימייל (לקבלת העתק)</label>
                <input type="email" class="form-input" id="verifyEmail" placeholder="name@email.com" style="direction:ltr;text-align:right;padding:8px 10px;">
            </div>
            <button class="btn btn-primary btn-lg" style="width:100%;margin-top:4px;" onclick="verifySigner('${doc.id}')">כניסה לחתימה</button>
        </div>
    </div>`;
}

async function googleSignForSigner(docId) {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await smoovAuth.signInWithPopup(provider);
        const user = result.user;
        DM._currentSigner = user.displayName || user.email || 'חותם';
        DM._currentSignerEmail = user.email || '';
        const doc = DM.docs.find(d => d.id === docId);
        if (doc) {
            // Update signer identity on doc so onAuthStateChanged filter keeps it
            doc.signerUid = user.uid;
            doc.signerEmail = user.email || '';
            doc.signerName = DM._currentSigner;
            addAudit(doc, 'verified', `${DM._currentSigner} אומת/ה עם Google`);
            save(); syncDocToFirebase(doc);
        }
        render();
    } catch (err) {
        if (err.code === 'auth/popup-closed-by-user') return;
        console.error('Google sign-in for signer:', err);
        toast('שגיאה בהתחברות עם Google', 'error');
    }
}

function verifySigner(docId) {
    const name = document.getElementById('verifyName')?.value?.trim();
    if (!name) { toast('נא להזין שם מלא', 'error'); return; }
    DM._currentSigner = name;
    DM._currentSignerEmail = document.getElementById('verifyEmail')?.value?.trim() || '';
    const doc = DM.docs.find(d => d.id === docId);
    if (doc) {
        addAudit(doc, 'verified', `${name} אומת/ה`);
        save(); syncDocToFirebase(doc);
    }
    render();
}

// Track current field index for guided navigation
if (DM._signFieldIdx == null) DM._signFieldIdx = -1;

function renderSignView(el) {
  try {
    const doc = DM.docs.find(d => d.id === DM.signDocId);
    if (!doc) { switchView('home'); return; }
    console.log('[sign] Rendering sign view:', { docId: doc.id, signer: DM._currentSigner, fields: (doc.fields||[]).length, hasImage: !!doc.docImage });

    const isSignerView = !!DM._currentSigner;
    let signerRecipient = null;
    if (isSignerView) {
        signerRecipient = (doc.recipients || []).find(r => r.name && DM._currentSigner && r.name.trim() === DM._currentSigner.trim());
    }

    if (!doc._viewed) { doc._viewed = true; addAudit(doc, 'viewed', isSignerView ? `${DM._currentSigner} צפה במסמך` : 'המסמך נצפה'); save(); syncDocToFirebase(doc); }

    const isComplete = doc.status === 'completed';
    const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date();

    // Signer completion screen - clean dedicated page
    if (isComplete && isSignerView) {
        el.innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 50%,#f0f9ff 100%);padding:40px 20px;text-align:center;">
            <div style="background:white;border-radius:20px;padding:40px 32px;max-width:480px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
                <div style="width:72px;height:72px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 style="font-size:1.5em;font-weight:800;color:#1e293b;margin-bottom:8px;">המסמך נחתם בהצלחה!</h2>
                <p style="color:#64748b;font-size:0.92em;margin-bottom:6px;">${esc(doc.fileName || 'מסמך')}</p>
                <p style="color:#94a3b8;font-size:0.82em;margin-bottom:24px;">הושלם: ${doc.completedAt ? new Date(doc.completedAt).toLocaleString('he-IL') : ''}</p>
                <button class="btn btn-primary btn-lg" onclick="downloadSignedPDF('${doc.id}')" style="width:100%;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;">
                    ${ICO.download} הורד מסמך חתום
                </button>
                <div style="margin-top:28px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
                    <div style="font-size:0.78em;color:#94a3b8;">מערכת זו פותחה ע"י אלחי פיין <a href="https://www.daghazahav.com" target="_blank" style="color:#64748b;text-decoration:underline;">DAGHAZAHAV</a></div>
                    <div style="margin-top:8px;"><a href="https://api.whatsapp.com/send?phone=972542012000&text=%D7%A9%D7%9C%D7%95%D7%9D%20%D7%90%D7%9C%D7%97%D7%99%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A9%D7%9E%D7%95%D7%A2%20%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%A2%D7%9C%20%D7%91%D7%A0%D7%99%D7%99%D7%AA%20%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA%20%D7%9C%D7%97%D7%98%D7%99%D7%9E%D7%94%20%D7%93%D7%99%D7%92%D7%99%D7%98%D7%9C%D7%99%D7%AA" target="_blank" style="font-size:0.78em;color:#25D366;text-decoration:underline;">רוצה מערכת חתימות דיגיטלית משלך? דבר איתנו</a></div>
                </div>
            </div>
        </div>`;
        return;
    }

    const myFields = isSignerView && signerRecipient
        ? (doc.fields || []).filter(f => f.assigneeId === signerRecipient.id && !f.fixed)
        : (doc.fields || []).filter(f => !f.fixed);
    const mySignedFields = myFields.filter(f => f.signedValue || f.value).length;
    const pct = myFields.length > 0 ? Math.round((mySignedFields / myFields.length) * 100) : 0;
    const signUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;
    const hasFieldsToFill = myFields.length > 0;
    const allFilled = pct === 100;

    // Determine button text based on state
    let mainBtnText, mainBtnAction;
    if (isComplete) {
        mainBtnText = ''; mainBtnAction = '';
    } else if (!hasFieldsToFill) {
        mainBtnText = 'אישור קריאה';
        mainBtnAction = `completeSign('${doc.id}')`;
    } else if (allFilled) {
        mainBtnText = 'אשר חתימה';
        mainBtnAction = `completeSign('${doc.id}')`;
    } else if (DM._signFieldIdx === -1) {
        mainBtnText = 'התחל';
        mainBtnAction = `navigateSignField('${doc.id}', 'next')`;
    } else {
        mainBtnText = 'הבא';
        mainBtnAction = `navigateSignField('${doc.id}', 'next')`;
    }

    // Page info (use pageHeights for count, docPages may not be stored)
    const hasPages = doc.pageHeights && doc.pageHeights.length > 1;
    const numPages = hasPages ? doc.pageHeights.length : (doc.docImage ? 1 : 0);

    el.innerHTML = `<div class="wizard">
        <!-- Sign Header -->
        ${mainBtnText ? `<div style="position:fixed;bottom:24px;left:24px;z-index:1000;display:flex;flex-direction:column;gap:6px;align-items:flex-start;">
            <button class="btn btn-primary btn-lg sign-main-btn" onclick="${mainBtnAction}" style="padding:14px 32px;font-size:1em;border-radius:14px;box-shadow:0 4px 20px rgba(37,99,235,0.35);">${mainBtnText}</button>
            ${DM._signFieldIdx > 0 ? `<button class="btn btn-ghost" onclick="navigateSignField('${doc.id}','prev')" style="font-size:0.82em;">הקודם</button>` : ''}
        </div>` : ''}
        <div class="sign-header">
            <div class="sign-header-actions"></div>
            <div class="sign-header-tools">
                ${!isSignerView ? `<button class="btn btn-outline btn-sm" onclick="toggleAuditLog()" title="יומן">${ICO.log}</button>` : ''}
                <button class="btn btn-outline btn-sm" onclick="downloadSignedPDF('${doc.id}')" title="הורד">${ICO.download}</button>
                ${isSignerView ? `
                    <span class="sign-header-link" onclick="exitAndSave('${doc.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        <span class="hide-xs">צא ושמור</span>
                    </span>
                    <span class="sign-header-link sign-header-link-danger" onclick="refuseSign('${doc.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        <span class="hide-xs">סירוב חתימה</span>
                    </span>
                ` : `
                    <button class="btn btn-ghost btn-sm" onclick="switchView('home')">✕</button>
                `}
            </div>
        </div>
        <!-- Doc name + page info -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 20px;background:var(--bg);border-bottom:1px solid var(--border);font-size:0.85em;">
            <span style="color:var(--text-light);">עמוד ${DM._signActivePage || 1} מתוך ${numPages || 1}</span>
            <span style="font-weight:700;">${esc(doc.fileName || 'מסמך')}</span>
        </div>
        <!-- Progress bar -->
        <div class="sign-progress" style="height:4px;">
            <div class="sign-progress-fill" style="width:${pct}%;background:#2dd4a8;"></div>
        </div>
        ${isComplete ? `
        <div class="completion-banner">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div>
                <strong>המסמך נחתם בהצלחה!</strong>
                <div style="font-size:0.82em;opacity:0.9;">הושלם: ${doc.completedAt ? new Date(doc.completedAt).toLocaleString('he-IL') : ''}</div>
            </div>
        </div>
        ${isSignerView ? `
        <div style="padding:16px 24px;text-align:center;border-bottom:1px solid var(--border);">
            <div style="font-size:0.78em;color:#94a3b8;">מערכת זו פותחה ע"י אלחי פיין <a href="https://www.daghazahav.com" target="_blank" style="color:#64748b;text-decoration:underline;">DAGHAZAHAV</a></div>
            <div style="margin-top:8px;"><a href="https://api.whatsapp.com/send?phone=972542012000&text=%D7%A9%D7%9C%D7%95%D7%9D%20%D7%90%D7%9C%D7%97%D7%99%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A9%D7%9E%D7%95%D7%A2%20%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%A2%D7%9C%20%D7%91%D7%A0%D7%99%D7%99%D7%AA%20%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA%20%D7%9C%D7%97%D7%98%D7%99%D7%9E%D7%94%20%D7%93%D7%99%D7%92%D7%99%D7%98%D7%9C%D7%99%D7%AA" target="_blank" style="font-size:0.78em;color:#25D366;text-decoration:underline;">רוצה מערכת חתימות דיגיטלית משלך? דבר איתנו</a></div>
        </div>` : ''}` : ''}
        ${isExpired && !isComplete ? `<div class="expiry-banner">תוקף המסמך פג ב-${new Date(doc.expiresAt).toLocaleDateString('he-IL')}. לא ניתן לחתום.</div>` : ''}
        ${!isSignerView ? `
        <div class="audit-panel hidden" id="auditPanel">
            <div class="audit-header">
                <strong>יומן פעילות</strong>
                <button class="btn btn-ghost btn-sm" onclick="document.getElementById('auditPanel').classList.add('hidden')">✕</button>
            </div>
            <div class="audit-list">
                ${(doc.audit || []).slice().reverse().map(a => `
                    <div class="audit-item">
                        <span class="audit-icon">${a.action === 'created' ? ICO.doc : a.action === 'sent' ? ICO.send : a.action === 'viewed' ? ICO.eye : a.action === 'signed' || a.action === 'field_signed' ? ICO.pen : a.action === 'completed' ? ICO.check : a.action === 'reminder' ? ICO.bell : '•'}</span>
                        <div style="flex:1;">
                            <div style="font-size:0.85em;font-weight:600;">${esc(a.detail)}</div>
                            <div style="font-size:0.72em;color:var(--text-light);">${new Date(a.time).toLocaleString('he-IL')}</div>
                        </div>
                    </div>
                `).join('')}
                ${(!doc.audit || doc.audit.length === 0) ? '<div style="text-align:center;color:var(--text-light);padding:20px;font-size:0.85em;">אין פעילות עדיין</div>' : ''}
            </div>
        </div>` : ''}
        <div class="sign-body">
            <div class="sign-doc" id="signDocArea">
                <div class="doc-container sign-doc-container" id="signDocContainer">
                    ${doc.docImage ? `<img src="${doc.docImage}" alt="" onload="scaleSignDoc()">` : ''}
                    ${(doc.fields || []).map(f => {
                        const assignee = (doc.recipients || []).find(r => r.id === f.assigneeId);
                        const ci = assignee ? assignee.colorIndex : 0;
                        const c = DM.fieldColors[ci % DM.fieldColors.length];
                        const val = f.signedValue || f.value || '';
                        const isMyField = !isSignerView || !signerRecipient || f.assigneeId === signerRecipient.id;
                        const canSign = !val && !f.fixed && !isComplete && !isExpired && isMyField;
                        const showField = isMyField || val || f.fixed;
                        if (!showField) return '';
                        const typeLabels = { signature: 'שדה חתימה', date_auto: 'תאריך', date_manual: 'תאריך', fullname: 'שם מלא', id_number: 'תעודת זהות', text: 'שדה טקסט', number: 'מספר', file: 'קובץ', checkbox: '☐' };
                        return `<div class="sign-field ${canSign ? 'mine' : ''}" data-fid="${f.id}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;border-radius:8px;
                            ${val ? `background:${c.bg};border:1.5px solid ${c.border};` : canSign ? `background:${c.bg}80;border:2px solid ${c.border};` : `background:rgba(200,200,200,0.3);border:1px dashed #ccc;`}"
                            ${canSign ? `onclick="signField('${doc.id}',${JSON.stringify(f.id).replace(/"/g, '&quot;')})"` : ''}
                            ${f.required && canSign ? 'title="שדה חובה"' : ''}>
                            ${f.signatureData ? `<img src="${f.signatureData}" style="width:100%;height:100%;object-fit:contain;" alt="חתימה">` :
                              f.fileData ? `<img src="${f.fileData}" style="width:100%;height:100%;object-fit:contain;" alt="קובץ מצורף">` :
                              val ? `<span style="font-size:0.85em;font-weight:700;color:${c.text};padding:0 6px;text-align:center;width:100%;">${esc(val)}</span>` :
                              canSign ? `<span style="font-size:0.78em;color:${c.text};font-weight:700;text-align:center;width:100%;">${esc(f.label || typeLabels[f.type] || f.type)}${f.required ? ' <span style="color:#dc2626;font-weight:800;">*</span>' : ''}</span>` :
                              f.fixed && f.value ? `<span style="font-size:0.85em;font-weight:700;color:#1e293b;padding:0 6px;text-align:center;width:100%;">${esc(f.value)}</span>` :
                              `<span style="font-size:0.75em;color:#888;font-weight:600;text-align:center;width:100%;">${esc(f.label)}</span>`}
                        </div>`;
                    }).join('')}
                </div>
            </div>
            ${!isSignerView ? `<div class="sign-sidebar">` : '<div class="sign-sidebar" style="display:none;">'}
                ${isSignerView ? `` : `
                    <!-- Sender/owner view: show all recipients -->
                    <h3 style="font-weight:700;font-size:0.95em;margin-bottom:14px;">נמענים (${(doc.recipients || []).filter(r => r.signed).length}/${(doc.recipients || []).length})</h3>
                    ${(doc.recipients || []).map(r => {
                        const c = DM.fieldColors[(r.colorIndex || 0) % DM.fieldColors.length];
                        const rFields = (doc.fields || []).filter(f => f.assigneeId === r.id);
                        const allFields = rFields.length > 0 ? rFields : (doc.fields || []).filter(f => !f.fixed);
                        const signed = allFields.filter(f => f.signedValue).length;
                        const total = allFields.length;
                        const rpct = total > 0 ? Math.round((signed / total) * 100) : 0;
                        return `<div class="recipient-status-card">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <span style="width:8px;height:8px;border-radius:50%;background:${c.fill};"></span>
                                <span style="font-weight:600;font-size:0.88em;flex:1;">${esc(r.name || 'נמען')}</span>
                                ${r.signed ? '<span class="badge badge-success" style="font-size:0.65em;">חתם</span>' : `<span class="badge badge-warning" style="font-size:0.65em;">ממתין</span>`}
                            </div>
                            <div class="mini-progress"><div class="mini-progress-fill" style="width:${rpct}%;background:${c.fill};"></div></div>
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                                <span style="font-size:0.72em;color:var(--text-light);">${signed}/${total} שדות</span>
                                ${!r.signed && r.phone ? `<button class="btn btn-ghost" style="font-size:0.68em;padding:2px 6px;display:flex;align-items:center;gap:3px;" onclick="event.stopPropagation();sendReminder('${doc.id}','${r.id}')">${ICO.bell} תזכורת</button>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                    ${doc.expiresAt ? `<div style="margin-top:12px;padding:8px;background:var(--warning-light);border-radius:8px;font-size:0.78em;color:var(--warning);font-weight:600;">תוקף: ${new Date(doc.expiresAt).toLocaleDateString('he-IL')}</div>` : ''}
                    <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:8px;">
                        <div style="font-size:0.72em;color:var(--text-light);margin-bottom:4px;">קישור לחתימה:</div>
                        <div style="display:flex;gap:4px;">
                            <input type="text" class="form-input" value="${signUrl}" readonly style="font-size:0.72em;padding:6px;direction:ltr;" onclick="this.select()">
                            <button class="btn btn-outline btn-sm" onclick="_clipboardCopy('${signUrl}').then(()=>toast('הקישור הועתק!')).catch(()=>toast('שגיאה בהעתקה','error'))">העתק</button>
                        </div>
                    </div>
                    ${!isComplete && !isExpired ? `<button class="btn btn-success" style="width:100%;margin-top:12px;" onclick="completeSign('${doc.id}')">אשר חתימה</button>` : ''}
                    ${isComplete ? `<button class="btn btn-primary" style="width:100%;margin-top:12px;" onclick="downloadSignedPDF('${doc.id}')">${ICO.download} הורד PDF חתום</button>` : ''}
                `}
            </div>
        </div>
    </div>`;
    console.log('[sign] innerHTML set OK, auto-highlighting...');
    // Auto-highlight first unsigned field only on initial load (not after navigation)
    if (!isComplete && !isExpired && DM._signFieldIdx === -1) {
        if (isSignerView && signerRecipient) {
            const nextField = (doc.fields || []).find(f => f.assigneeId === signerRecipient.id && f.required && !f.fixed && !f.signedValue && !f.value);
            if (nextField) highlightNextFieldById(nextField.id);
        } else {
            highlightNextField(doc);
        }
    }
  } catch (err) {
    console.error('[sign] renderSignView ERROR:', err, err.stack);
    el.innerHTML = '<div style="padding:40px;text-align:center;color:red;"><h2>שגיאה בהצגת המסמך</h2><p>' + String(err.message || err) + '</p></div>';
  }
}

// Scale the sign doc container on mobile to fit fields correctly
function scaleSignDoc() {
    const container = document.getElementById('signDocContainer');
    const area = document.getElementById('signDocArea');
    if (!container || !area) return;
    const areaW = area.clientWidth - 20; // padding
    const docW = 800;
    if (areaW < docW) {
        const scale = areaW / docW;
        container.style.width = docW + 'px';
        container.style.transform = `scale(${scale})`;
        container.style.transformOrigin = 'top center';
        container.style.marginBottom = `-${container.scrollHeight * (1 - scale)}px`;
    } else {
        container.style.transform = '';
        container.style.width = '';
        container.style.marginBottom = '';
    }
}
window.addEventListener('resize', () => {
    if (DM.view === 'sign') scaleSignDoc();
});

function highlightNextFieldById(fieldId) {
    setTimeout(() => {
        const el = document.querySelector(`.sign-field[data-fid="${fieldId}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('pulse');
            setTimeout(() => el.classList.remove('pulse'), 2000);
        }
    }, 300);
}

function toggleAuditLog() {
    const panel = document.getElementById('auditPanel');
    if (panel) panel.classList.toggle('hidden');
}

// ==================== GUIDED FIELD NAVIGATION ====================
function navigateSignField(docId, direction) {
    console.log('[nav] navigateSignField called:', docId, direction);
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) { console.warn('[nav] doc not found:', docId); return; }

    const isSignerView = !!DM._currentSigner;
    let signerRecipient = null;
    if (isSignerView) {
        signerRecipient = (doc.recipients || []).find(r => r.name && DM._currentSigner && r.name.trim() === DM._currentSigner.trim());
    }

    // Get ALL relevant fields (including signed) - stable index that doesn't shift
    const allMyFields = (doc.fields || []).filter(f => {
        if (f.fixed) return false;
        if (isSignerView && signerRecipient && f.assigneeId !== signerRecipient.id) return false;
        return true;
    });

    if (allMyFields.length === 0) return;

    // Clamp index to valid range
    if (DM._signFieldIdx < 0) DM._signFieldIdx = -1;

    if (direction === 'next') {
        // Find the next unsigned field after current index
        let startIdx = DM._signFieldIdx + 1;
        let found = false;
        for (let i = startIdx; i < allMyFields.length; i++) {
            if (!allMyFields[i].signedValue && !allMyFields[i].value) {
                DM._signFieldIdx = i;
                found = true;
                break;
            }
        }
        if (!found) {
            // No more unsigned fields - stay at current position
            updateSignNavButton(docId);
            return;
        }
    } else {
        // Find previous unsigned field before current index
        let startIdx = Math.min(DM._signFieldIdx - 1, allMyFields.length - 1);
        let found = false;
        for (let i = startIdx; i >= 0; i--) {
            if (!allMyFields[i].signedValue && !allMyFields[i].value) {
                DM._signFieldIdx = i;
                found = true;
                break;
            }
        }
        if (!found) return;
    }

    const targetField = allMyFields[DM._signFieldIdx];
    if (targetField) {
        highlightNextFieldById(targetField.id);
    }
    // Update button text without full re-render
    updateSignNavButton(docId);
}

function updateSignNavButton(docId) {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) return;
    const mainBtn = document.querySelector('.sign-main-btn');
    if (!mainBtn) return;

    const isSignerView = !!DM._currentSigner;
    const signerRecipient = isSignerView ? (doc.recipients || []).find(r => r.name && DM._currentSigner && r.name.trim() === DM._currentSigner.trim()) : null;
    const myFields = isSignerView && signerRecipient
        ? (doc.fields || []).filter(f => f.assigneeId === signerRecipient.id && !f.fixed)
        : (doc.fields || []).filter(f => !f.fixed);
    const allFilled = myFields.length > 0 && myFields.every(f => f.signedValue || f.value);

    if (allFilled) {
        mainBtn.textContent = 'אשר חתימה';
        mainBtn.setAttribute('onclick', `completeSign('${docId}')`);
    } else {
        mainBtn.textContent = 'הבא';
        mainBtn.setAttribute('onclick', `navigateSignField('${docId}', 'next')`);
    }

    // Update progress bar
    const filled = myFields.filter(f => f.signedValue || f.value).length;
    const pct = myFields.length > 0 ? Math.round((filled / myFields.length) * 100) : 0;
    const progressFill = document.querySelector('.sign-progress-fill');
    if (progressFill) progressFill.style.width = pct + '%';
}

function exitAndSave(docId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'exitSaveModal';
    overlay.innerHTML = `<div class="modal-card" style="text-align:center;max-width:440px;">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('exitSaveModal').remove()" style="position:absolute;top:12px;left:12px;font-size:1.1em;">✕</button>
        <div style="margin:10px 0 16px;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
        </div>
        <h3 style="font-weight:700;margin-bottom:10px;font-size:1.15em;">טופס מולא חלקית</h3>
        <p style="font-size:0.88em;color:var(--text-light);line-height:1.6;margin-bottom:20px;">
            יציאה מתהליך המילוי תשמור את המידע והנתונים שהזנת. שים לב, ניתן לחזור ולמלא את שארית המסמך באמצעות הקישור המקורי בו השתמשת.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;">
            <button class="btn btn-outline" onclick="document.getElementById('exitSaveModal').remove()">ביטול</button>
            <button class="btn btn-primary" onclick="document.getElementById('exitSaveModal').remove();toast('המסמך נשמר.');switchView('home');">צא ושמור טופס</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

function refuseSign(docId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'refuseSignModal';
    overlay.innerHTML = `<div class="modal-card" style="max-width:460px;">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('refuseSignModal').remove()" style="position:absolute;top:12px;left:12px;font-size:1.1em;">✕</button>
        <h3 style="font-weight:700;margin-bottom:10px;font-size:1.15em;">סירוב לחתימה על מסמך</h3>
        <p style="font-size:0.88em;color:var(--text-light);margin-bottom:14px;">מדוע אינך מעוניין לחתום על המסמך?</p>
        <textarea id="refuseReasonInput" class="form-input" rows="4" placeholder="כתוב סיבה קצרה" style="resize:vertical;margin-bottom:16px;"></textarea>
        <div style="display:flex;justify-content:center;">
            <button class="btn" style="background:#f87171;color:white;border:none;min-width:120px;padding:10px 24px;" onclick="confirmRefuseSign('${docId}')">שלח</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

function confirmRefuseSign(docId) {
    const reason = (document.getElementById('refuseReasonInput') || {}).value || '';
    const doc = DM.docs.find(d => d.id === docId);
    if (doc) {
        const detail = reason.trim()
            ? `${DM._currentSigner || 'נמען'} סירב לחתום. סיבה: ${reason.trim()}`
            : `${DM._currentSigner || 'נמען'} סירב לחתום`;
        addAudit(doc, 'refused', detail);
        save();
        syncDocToFirebase(doc);
    }
    const modal = document.getElementById('refuseSignModal');
    if (modal) modal.remove();
    toast('סירוב החתימה נרשם.');
    switchView('home');
}

function sendReminder(docId, recipientId) {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) return;
    const r = (doc.recipients || []).find(x => String(x.id) === String(recipientId));
    if (!r || !r.phone) { toast('אין מספר טלפון', 'error'); return; }
    const phone = r.phone.replace(/[^0-9]/g, '');
    const intl = phone.startsWith('0') ? '972' + phone.substring(1) : phone;
    const signUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;
    const waMsg = `תזכורת: שלום ${r.name}, ממתין לחתימתך על "${doc.fileName}".\nקישור: ${signUrl}`;
    const opened = window.open(`https://wa.me/${intl}?text=${encodeURIComponent(waMsg)}`, '_blank');
    if (!opened) toast('חלון WhatsApp נחסם - שלח ידנית את הקישור', 'error');
    addAudit(doc, 'reminder', `תזכורת נשלחה ל-${r.name}`);
    save(); syncDocToFirebase(doc);
    toast(`תזכורת נשלחה ל-${r.name}`);
}

// Download signed document as PDF (html2pdf.js - pixel-perfect DOM rendering with RTL support)
async function downloadSignedPDF(docId) {
    console.log('[PDF] downloadSignedPDF called:', docId);
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) { console.log('[PDF] doc not found'); toast('אין מסמך להורדה', 'error'); return; }

    // Ensure images are loaded (may have been stripped from memory)
    if (!doc.docImage || (doc.pageHeights && doc.pageHeights.length > 1 && (!doc.docPages || doc.docPages.length < 2))) {
        const imgs = await idbLoadImages(docId);
        if (imgs && imgs.docImage) { doc.docImage = imgs.docImage; doc.docPages = imgs.docPages || []; }
        else if (typeof _loadImageChunks === 'function') {
            const chunks = await _loadImageChunks(doc.templateId || docId);
            if (chunks && chunks.docImage) { doc.docImage = chunks.docImage; doc.docPages = chunks.docPages || []; }
        }
    }
    if (!doc.docImage) { console.log('[PDF] no docImage after load attempt'); toast('אין מסמך להורדה', 'error'); return; }
    console.log('[PDF] starting generation, pages:', doc.docPages ? doc.docPages.length : 0, 'pageHeights:', (doc.pageHeights || []).length, 'docImage length:', doc.docImage.length);
    toast('מכין PDF להורדה...', 'info');

    try {
        const EDITOR_W = 800;
        const hasMultiPage = doc.docPages && doc.docPages.length > 1;
        const pageHeights = doc.pageHeights || [];

        // Helper: load image
        function _loadImg(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = src;
            });
        }

        // Load page images — split combined image into pages if needed
        let pageImgs;
        if (hasMultiPage) {
            pageImgs = await Promise.all(doc.docPages.map(src => _loadImg(src)));
        } else if (pageHeights.length > 1) {
            // Combined image but multiple pages — split into individual canvases
            const combinedImg = await _loadImg(doc.docImage);
            pageImgs = [];
            let yNat = 0;
            for (const pH of pageHeights) {
                const c = document.createElement('canvas');
                c.width = combinedImg.naturalWidth;
                c.height = pH;
                c.getContext('2d').drawImage(combinedImg, 0, yNat, combinedImg.naturalWidth, pH, 0, 0, combinedImg.naturalWidth, pH);
                pageImgs.push(c);
                yNat += pH;
            }
            console.log('[PDF] Split combined image into', pageImgs.length, 'pages');
        } else {
            pageImgs = [await _loadImg(doc.docImage)];
        }
        console.log('[PDF] pages:', pageImgs.length, 'hasMultiPage:', hasMultiPage,
            'dims:', pageImgs.map(img => (img.naturalWidth || img.width) + 'x' + (img.naturalHeight || img.height)));

        // Get jsPDF constructor (with dynamic fallback load)
        let jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!jsPDF) {
            console.log('[PDF] jsPDF not found, attempting dynamic load...');
            try {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
                    s.onload = resolve;
                    s.onerror = reject;
                    document.head.appendChild(s);
                });
                jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            } catch (e) { console.error('[PDF] dynamic jsPDF load failed:', e); }
        }
        if (!jsPDF) { console.error('[PDF] jsPDF not found after fallback!'); toast('ספריית PDF לא נטענה - נסה לרענן את הדף', 'error'); return; }

        let pdf = null;
        let yAccum = 0;

        for (let i = 0; i < pageImgs.length; i++) {
            const img = pageImgs[i];
            const natW = img.naturalWidth || img.width;
            const natH = img.naturalHeight || img.height;
            const scale = EDITOR_W / natW;

            // Create canvas at natural image size (or reuse if already a canvas)
            let canvas, ctx;
            if (img instanceof HTMLCanvasElement) {
                canvas = img;
                ctx = canvas.getContext('2d');
            } else {
                canvas = document.createElement('canvas');
                canvas.width = natW;
                canvas.height = natH;
                ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, natW, natH);
            }

            // Draw field overlays — use actual image height for boundary
            const pgH_editor = natH * scale;
            const yStart = yAccum;
            const yEnd = yStart + pgH_editor;

            for (const f of (doc.fields || [])) {
                const val = f.signedValue || f.value || '';
                if (!val && !f.signatureData && !f.fileData) continue;
                if (f.y + f.h < yStart || f.y >= yEnd) continue;

                // Convert from editor space to natural image space
                const fx = f.x / scale;
                const fy = (f.y - yStart) / scale;
                const fw = f.w / scale;
                const fh = f.h / scale;

                if (f.signatureData || f.fileData) {
                    try {
                        const fImg = await _loadImg(f.signatureData || f.fileData);
                        const ratio = Math.min(fw / fImg.naturalWidth, fh / fImg.naturalHeight);
                        const drawW = fImg.naturalWidth * ratio;
                        const drawH = fImg.naturalHeight * ratio;
                        ctx.drawImage(fImg, fx + (fw - drawW) / 2, fy + (fh - drawH) / 2, drawW, drawH);
                    } catch (e) { console.warn('[PDF] field image error:', e.message); }
                } else if (val) {
                    const fontSize = Math.max(12, Math.round(14 / scale));
                    ctx.font = `bold ${fontSize}px Heebo, Segoe UI, Arial, sans-serif`;
                    ctx.fillStyle = '#1e293b';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(val, fx + fw / 2, fy + fh / 2, fw);
                }
            }

            // Add page to PDF (use canvas data URL)
            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            console.log('[PDF] page', i, ':', natW + 'x' + natH, 'jpeg:', imgData.length, 'chars');

            if (i === 0) {
                pdf = new jsPDF({ unit: 'px', format: [natW, natH], orientation: natW > natH ? 'landscape' : 'portrait', hotfixes: ['px_scaling'] });
            } else {
                pdf.addPage([natW, natH], natW > natH ? 'landscape' : 'portrait');
            }
            pdf.addImage(imgData, 'JPEG', 0, 0, natW, natH);
            yAccum += pgH_editor;
        }

        if (pdf) {
            pdf.save((doc.fileName || 'signed-document').replace(/\.pdf$/i, '') + '.pdf');
            toast('ה-PDF הורד בהצלחה!');
        }
    } catch (err) {
        console.error('[PDF] generation error:', err);
        toast('שגיאה בהורדת הקובץ: ' + (err.message || err), 'error');
    }
}

// Fallback: jsPDF with manual canvas drawing (used if html2pdf.js not loaded)
async function _downloadPdfCanvasFallback(doc) {
    const jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDF) { toast('ספריית PDF לא נטענה', 'error'); return; }

    const sigImages = {}, fileImages = {};
    await Promise.all((doc.fields || []).filter(f => f.signatureData).map(async f => {
        try { sigImages[f.id] = await loadImage(f.signatureData); } catch(e) {}
    }));
    await Promise.all((doc.fields || []).filter(f => f.fileData).map(async f => {
        try { fileImages[f.id] = await loadImage(f.fileData); } catch(e) {}
    }));

    function drawFields(ctx, scale, yOffset, pageH) {
        (doc.fields || []).forEach(f => {
            const val = f.signedValue || f.value || '';
            if (!val && !f.signatureData && !f.fileData) return;
            const fx = f.x * scale, fy = f.y * scale, fw = f.w * scale, fh = f.h * scale;
            if (fy + fh < yOffset || fy > yOffset + pageH) return;
            const adjY = fy - yOffset;
            if (f.signatureData && sigImages[f.id]) {
                ctx.drawImage(sigImages[f.id], fx, adjY, fw, fh);
            } else if (f.fileData && fileImages[f.id]) {
                ctx.drawImage(fileImages[f.id], fx, adjY, fw, fh);
            } else if (val) {
                ctx.fillStyle = '#1e293b';
                ctx.font = `bold ${14 * scale}px Heebo, Segoe UI, Arial, sans-serif`;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText(val, fx + fw / 2, adjY + fh / 2, fw - 4);
            }
        });
    }

    const mainImg = await loadImage(doc.docImage);
    const editorScale = mainImg.width / 800;
    const hasPages = doc.docPages && doc.docPages.length > 1 && doc.pageHeights && doc.pageHeights.length > 1;

    if (hasPages) {
        const pageImgs = [];
        for (const pgSrc of doc.docPages) pageImgs.push(await loadImage(pgSrc));
        const first = pageImgs[0];
        const pdf = new jsPDF({ orientation: first.width > first.height ? 'l' : 'p', unit: 'px', format: [first.width, first.height], compress: true });
        let yOff = 0;
        for (let i = 0; i < pageImgs.length; i++) {
            const pg = pageImgs[i];
            if (i > 0) pdf.addPage([pg.width, pg.height], pg.width > pg.height ? 'l' : 'p');
            const c = document.createElement('canvas'); c.width = pg.width; c.height = pg.height;
            const cx = c.getContext('2d'); cx.drawImage(pg, 0, 0);
            drawFields(cx, editorScale, yOff, pg.height);
            pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pg.width, pg.height);
            yOff += pg.height;
        }
        pdf.save(`${doc.fileName || 'signed-document'}.pdf`);
    } else {
        const c = document.createElement('canvas'); c.width = mainImg.width; c.height = mainImg.height;
        const cx = c.getContext('2d'); cx.drawImage(mainImg, 0, 0);
        drawFields(cx, editorScale, 0, c.height);
        const pdf = new jsPDF({ orientation: c.width > c.height ? 'l' : 'p', unit: 'px', format: [c.width, c.height], compress: true });
        pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, c.width, c.height);
        pdf.save(`${doc.fileName || 'signed-document'}.pdf`);
    }
}

// Helper: load an image and return a promise
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (src && !src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = src;
    });
}

function addAudit(doc, action, detail) {
    if (!doc.audit) doc.audit = [];
    doc.audit.push({ action, time: new Date().toISOString(), detail });
}

function signField(docId, fieldId) {
    console.log('[signField] called:', docId, fieldId);
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) { console.warn('[signField] doc not found:', docId); return; }
    // Check expiration
    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
        toast('תוקף המסמך פג', 'error'); return;
    }
    const field = (doc.fields || []).find(f => f.id === fieldId);
    if (!field) return;
    // Checkbox toggle - allow un-ticking
    if (field.type === 'checkbox') {
        field.signedValue = field.signedValue ? '' : '✓';
        addAudit(doc, 'field_signed', `שדה "${field.label}" ${field.signedValue ? 'סומן' : 'בוטל'}`);
        save(); syncDocToFirebase(doc); render();
        highlightNextField(doc);
        return;
    }
    if (field.signedValue) return; // Already signed

    if (field.type === 'signature') {
        openSignatureCanvas(docId, fieldId);
    } else if (field.type === 'date_auto' || field.type === 'date') {
        // Auto date - fill with today's date
        field.signedValue = new Date().toLocaleDateString('he-IL');
        addAudit(doc, 'field_signed', `שדה "${field.label}" מולא`);
        save(); syncDocToFirebase(doc); render();
    } else if (field.type === 'date_manual') {
        // Manual date - show date picker
        openDatePicker(docId, fieldId);
    } else if (field.type === 'file') {
        // File attachment - open file/camera picker
        openFilePicker(docId, fieldId);
    } else {
        // Inline editing inside the field on the document
        const fieldEl = document.querySelector(`.sign-field[data-fid="${fieldId}"]`);
        if (!fieldEl) return;
        fieldEl.onclick = null; // prevent re-triggering
        fieldEl.style.zIndex = '100';
        fieldEl.style.borderStyle = 'solid';
        const inputType = field.type === 'number' ? 'number' : 'text';
        fieldEl.innerHTML = `<input type="${inputType}" class="sign-inline-input" placeholder="${esc(field.label || 'הזן ערך...')}" style="width:100%;height:100%;border:none;background:transparent;font-family:var(--font);font-size:0.85em;font-weight:700;text-align:center;outline:none;padding:0 6px;color:#1e293b;direction:rtl;">`;
        const inp = fieldEl.querySelector('input');
        inp.focus();
        let committed = false;
        const commitValue = () => {
            if (committed) return;
            committed = true;
            const val = inp.value.trim();
            if (val) {
                field.signedValue = val;
                addAudit(doc, 'field_signed', `שדה "${field.label}" מולא`);
                save(); syncDocToFirebase(doc);
            }
            render();
            highlightNextField(doc);
        };
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); commitValue(); }
            if (e.key === 'Escape') { committed = true; render(); }
        });
        inp.addEventListener('blur', () => { if (!committed) setTimeout(commitValue, 150); });
        return; // don't call highlightNextField yet - wait for commit
    }
    // Move to next unsigned field
    highlightNextField(doc);
}

function syncDocToFirebase(doc) {
    if (typeof firebaseUpdateDoc === 'function') {
        firebaseUpdateDoc(doc).catch(() => {});
    }
}

async function syncOwnerDocsFromFirebase(ownerEmail) {
    if (!smoovFirestoreReady || !smoovDb || !ownerEmail) return;
    try {
        const snapshot = await smoovDb.collection('smoov_docs')
            .where('createdBy', '==', ownerEmail)
            .get();
        let added = 0;
        snapshot.forEach(docSnap => {
            const remoteDoc = docSnap.data();
            // Skip templates (tpl_ prefix) - they're stored in same collection but belong in DM.templates
            if (remoteDoc.id && remoteDoc.id.startsWith('tpl_')) return;
            const localIdx = DM.docs.findIndex(d => d.id === remoteDoc.id);
            if (localIdx < 0) {
                DM.docs.push(remoteDoc);
                added++;
            } else if (remoteDoc.status === 'completed' && DM.docs[localIdx].status !== 'completed') {
                // Preserve locally-loaded images (Firebase docs don't have docImage/docPages)
                const localDoc = DM.docs[localIdx];
                DM.docs[localIdx] = {
                    ...remoteDoc,
                    docImage: localDoc.docImage || remoteDoc.docImage,
                    docPages: (localDoc.docPages && localDoc.docPages.length > 0) ? localDoc.docPages : remoteDoc.docPages
                };
                added++;
            }
        });
        if (added > 0) { save(); render(); }
    } catch (err) {
        console.warn('Sync owner docs error:', err);
    }
}

function openSignatureCanvas(docId, fieldId) {
    window._signActiveTab = 'draw';
    window._signUploadData = null;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'signModal';
    overlay.innerHTML = `<div class="modal-card" style="width:500px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <h3 style="font-weight:700;margin:0;">חתימה דיגיטלית</h3>
            <button class="btn btn-ghost btn-sm" onclick="cancelSignCanvas()" style="font-size:1.1em;">✕</button>
        </div>
        <!-- Tabs -->
        <div class="sign-tabs" style="display:flex;border-bottom:2px solid var(--border);margin-bottom:14px;">
            <button class="sign-tab active" data-tab="draw" onclick="switchSignTab('draw')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
                ציור
            </button>
            <button class="sign-tab" data-tab="type" onclick="switchSignTab('type')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                הקלדה
            </button>
            <button class="sign-tab" data-tab="upload" onclick="switchSignTab('upload')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                העלאה
            </button>
        </div>
        <!-- Tab: Draw -->
        <div class="sign-tab-content" id="signTabDraw">
            <!-- Drawing Controls -->
            <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
                <span style="font-size:0.75em;color:var(--text-light);">צבע:</span>
                <input type="color" id="signColor" value="#2563eb" onchange="updateSignColor()" style="width:30px;height:22px;border:none;border-radius:4px;cursor:pointer;">
            </div>
            <p style="font-size:0.82em;color:var(--text-light);margin-bottom:8px;">חתום בתוך המסגרת:</p>
            <canvas id="signCanvas" class="sign-canvas" width="800" height="360" style="width:100%;max-width:460px;height:180px;border:2px solid var(--border);border-radius:8px;background:white;touch-action:none;"></canvas>
            <div style="display:flex;gap:6px;margin-top:6px;justify-content:center;flex-wrap:wrap;">
                <button class="btn btn-ghost btn-sm" onclick="undoSignCanvas()" id="undoBtn" style="font-size:0.78em;" disabled>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
                    בטל
                </button>
                <button class="btn btn-ghost btn-sm" onclick="clearSignCanvas()" style="font-size:0.78em;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
                    נקה
                </button>
            </div>
        </div>
        <!-- Tab: Type name -->
        <div class="sign-tab-content" id="signTabType" style="display:none;">
            <p style="font-size:0.82em;color:var(--text-light);margin-bottom:8px;">הקלד את שמך:</p>
            <input type="text" id="signNameInput" class="form-input" placeholder="השם המלא שלך" style="font-size:1.1em;padding:12px;text-align:center;margin-bottom:10px;" oninput="updateSignNamePreview()">
            <div style="font-size:0.78em;color:var(--text-light);margin-bottom:6px;">בחר סגנון:</div>
            <div id="signFontOptions" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <button class="sign-font-btn active" data-font="'Segoe Script', 'Dancing Script', cursive" onclick="selectSignFont(this)" style="font-family:'Segoe Script','Dancing Script',cursive;">חתימה</button>
                <button class="sign-font-btn" data-font="'Brush Script MT', 'Satisfy', cursive" onclick="selectSignFont(this)" style="font-family:'Brush Script MT','Satisfy',cursive;">חתימה</button>
                <button class="sign-font-btn" data-font="'Comic Sans MS', 'Caveat', cursive" onclick="selectSignFont(this)" style="font-family:'Comic Sans MS','Caveat',cursive;">חתימה</button>
                <button class="sign-font-btn" data-font="'Georgia', serif" onclick="selectSignFont(this)" style="font-family:Georgia,serif;font-style:italic;">חתימה</button>
            </div>
            <div style="border:2px solid var(--border);border-radius:8px;background:white;min-height:80px;display:flex;align-items:center;justify-content:center;padding:12px;">
                <span id="signNamePreview" style="font-size:2em;color:#2563eb;font-family:'Segoe Script','Dancing Script',cursive;"></span>
            </div>
        </div>
        <!-- Tab: Upload -->
        <div class="sign-tab-content" id="signTabUpload" style="display:none;">
            <p style="font-size:0.82em;color:var(--text-light);margin-bottom:8px;">העלה תמונת חתימה:</p>
            <div id="signUploadArea" style="border:2px dashed var(--border);border-radius:8px;padding:30px;text-align:center;cursor:pointer;background:var(--bg);min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;" onclick="document.getElementById('signUploadInput').click()">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span style="font-size:0.85em;color:var(--text-light);margin-top:8px;">לחץ או גרור תמונה לכאן</span>
                <input type="file" id="signUploadInput" accept="image/*" style="display:none;" onchange="handleSignUpload(event)">
            </div>
            <div id="signUploadPreview" style="display:none;margin-top:10px;text-align:center;">
                <img id="signUploadImg" style="max-width:100%;max-height:150px;border:1px solid var(--border);border-radius:8px;">
                <button class="btn btn-ghost btn-sm" onclick="clearSignUpload()" style="margin-top:6px;font-size:0.78em;">הסר תמונה</button>
            </div>
        </div>
        <!-- Actions -->
        <div style="display:flex;gap:8px;margin-top:14px;">
            <button class="btn btn-outline" style="flex:1;" onclick="cancelSignCanvas()">ביטול</button>
            <button class="btn btn-primary" style="flex:1;" onclick="confirmSignCanvas('${docId}',${JSON.stringify(fieldId).replace(/"/g, '&quot;')})">אשר חתימה</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) cancelSignCanvas(); };

    // Setup draw canvas with enhanced drawing
    const canvas = document.getElementById('signCanvas');
    const ctx = canvas.getContext('2d');

    // High-DPI setup for crisp signatures
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Store original dimensions before scaling
    window._signCanvasScale = dpr;

    // Enhanced anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Drawing state
    let drawing = false;
    let lastPos = null;
    let strokeHistory = [];
    let currentStroke = [];

    // Drawing settings
    window._signColor = '#2563eb';
    const LINE_WIDTH = 5;

    ctx.strokeStyle = window._signColor;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function pos(e) {
        const r = canvas.getBoundingClientRect();
        const cx = (e.clientX || e.touches?.[0]?.clientX || 0) - r.left;
        const cy = (e.clientY || e.touches?.[0]?.clientY || 0) - r.top;
        return {
            x: cx * (canvas.width / r.width),
            y: cy * (canvas.height / r.height)
        };
    }

    function startDrawing(e) {
        e.preventDefault();
        drawing = true;
        const p = pos(e);
        lastPos = p;
        currentStroke = [p];
        ctx.strokeStyle = window._signColor;
        ctx.lineWidth = LINE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    }

    function continueDrawing(e) {
        if (!drawing) return;
        e.preventDefault();
        const p = pos(e);
        currentStroke.push(p);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        lastPos = p;
    }

    function stopDrawing() {
        if (!drawing) return;
        drawing = false;
        if (currentStroke.length > 0) {
            strokeHistory.push([...currentStroke]);
        }
        currentStroke = [];
        lastPos = null;
        updateUndoButton();
    }

    // Event listeners
    canvas.onmousedown = startDrawing;
    canvas.onmousemove = continueDrawing;
    canvas.onmouseup = stopDrawing;
    canvas.onmouseleave = stopDrawing;

    // Enhanced touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        continueDrawing(e);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopDrawing(e);
    }, { passive: false });

    // Prevent scrolling on mobile while drawing
    canvas.addEventListener('touchcancel', stopDrawing, { passive: false });

    window._signCanvas = canvas;
    window._signStrokeHistory = strokeHistory;

    // Setup upload drag & drop
    const uploadArea = document.getElementById('signUploadArea');
    if (uploadArea) {
        uploadArea.ondragover = e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--primary)'; uploadArea.style.background = 'rgba(37,99,235,0.05)'; };
        uploadArea.ondragleave = e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--border)'; uploadArea.style.background = 'var(--bg)'; };
        uploadArea.ondrop = e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--border)'; uploadArea.style.background = 'var(--bg)'; if (e.dataTransfer.files[0]) processSignUploadFile(e.dataTransfer.files[0]); };
    }
}

function switchSignTab(tab) {
    window._signActiveTab = tab;
    document.querySelectorAll('.sign-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('signTabDraw').style.display = tab === 'draw' ? '' : 'none';
    document.getElementById('signTabType').style.display = tab === 'type' ? '' : 'none';
    document.getElementById('signTabUpload').style.display = tab === 'upload' ? '' : 'none';
}

function selectSignFont(btn) {
    document.querySelectorAll('.sign-font-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    window._signFont = btn.dataset.font;
    updateSignNamePreview();
}

function updateSignNamePreview() {
    const input = document.getElementById('signNameInput');
    const preview = document.getElementById('signNamePreview');
    if (input && preview) {
        preview.textContent = input.value || '';
        preview.style.fontFamily = window._signFont || "'Segoe Script','Dancing Script',cursive";
    }
}

function handleSignUpload(e) {
    const file = e.target.files[0];
    if (file) processSignUploadFile(file);
}

function processSignUploadFile(file) {
    if (!file.type.startsWith('image/')) { toast('יש להעלות קובץ תמונה בלבד', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
        window._signUploadData = ev.target.result;
        const preview = document.getElementById('signUploadPreview');
        const img = document.getElementById('signUploadImg');
        const area = document.getElementById('signUploadArea');
        if (preview && img) { img.src = ev.target.result; preview.style.display = ''; }
        if (area) area.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function clearSignUpload() {
    window._signUploadData = null;
    const preview = document.getElementById('signUploadPreview');
    const area = document.getElementById('signUploadArea');
    if (preview) preview.style.display = 'none';
    if (area) area.style.display = '';
}

// Enhanced signature functions
function updateSignThickness() {
    const slider = document.getElementById('signThickness');
    const value = document.getElementById('thicknessValue');
    if (slider && value) {
        value.textContent = slider.value;
        window._signBaseWidth = parseFloat(slider.value);
    }
}

function updateSignColor() {
    const colorPicker = document.getElementById('signColor');
    if (colorPicker) {
        window._signColor = colorPicker.value;
        const canvas = window._signCanvas;
        if (canvas) {
            canvas.getContext('2d').strokeStyle = colorPicker.value;
        }
    }
}

function updateUndoButton() {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn && window._signStrokeHistory) {
        undoBtn.disabled = window._signStrokeHistory.length === 0;
    }
}

function redrawCanvas() {
    const canvas = window._signCanvas;
    const strokeHistory = window._signStrokeHistory;
    if (!canvas || !strokeHistory) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = window._signColor || '#2563eb';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokeHistory.forEach(stroke => {
        if (stroke.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
    });
}

function undoSignCanvas() {
    if (window._signStrokeHistory && window._signStrokeHistory.length > 0) {
        window._signStrokeHistory.pop();
        redrawCanvas();
        updateUndoButton();
    }
}

function clearSignCanvas() {
    const c = window._signCanvas;
    if (c) {
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
        if (window._signStrokeHistory) {
            window._signStrokeHistory.length = 0;
            updateUndoButton();
        }
    }
}
function cancelSignCanvas() { const m = document.getElementById('signModal'); if (m) m.remove(); delete window._signCanvas; window._signUploadData = null; }
function confirmSignCanvas(docId, fieldId) {
    const doc = DM.docs.find(d => d.id === docId);
    const tab = window._signActiveTab || 'draw';
    let signatureData = null;

    if (tab === 'draw') {
        const c = window._signCanvas;
        if (!c) return;
        // Check if canvas is blank
        const ctx = c.getContext('2d');
        const pixels = ctx.getImageData(0, 0, c.width, c.height).data;
        let hasContent = false;
        for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] > 0) { hasContent = true; break; } }
        if (!hasContent) { toast('יש לצייר חתימה', 'error'); return; }

        // Export with higher quality and compression
        signatureData = c.toDataURL('image/png', 0.9);
    } else if (tab === 'type') {
        const input = document.getElementById('signNameInput');
        const name = input ? input.value.trim() : '';
        if (!name) { toast('יש להקליד שם', 'error'); return; }
        // Render name to canvas
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = 400; tmpCanvas.height = 120;
        const ctx = tmpCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 120);
        ctx.fillStyle = window._signColor || '#2563eb';
        const font = window._signFont || "'Segoe Script','Dancing Script',cursive";
        ctx.font = `36px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, 200, 60, 380);
        signatureData = tmpCanvas.toDataURL();
    } else if (tab === 'upload') {
        if (!window._signUploadData) { toast('יש להעלות תמונת חתימה', 'error'); return; }
        signatureData = window._signUploadData;
    }

    if (doc && signatureData) {
        const f = (doc.fields || []).find(x => x.id === fieldId);
        if (f) {
            f.signedValue = 'חתום';
            f.signatureData = signatureData;
            addAudit(doc, 'signed', `חתימה בשדה "${f.label}"`);
            save(); syncDocToFirebase(doc);
        }
    }
    cancelSignCanvas(); render();
    if (doc) highlightNextField(doc);
}

// ==================== DATE PICKER ====================
function openDatePicker(docId, fieldId) {
    const doc = DM.docs.find(d => d.id === docId);
    const field = doc ? (doc.fields || []).find(f => f.id === fieldId) : null;
    const hint = field && field.value ? esc(field.value) : '';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'dateModal';
    overlay.innerHTML = `<div class="modal-card">
        <h3 style="font-weight:700;margin-bottom:12px;">בחירת תאריך</h3>
        ${hint ? `<p style="font-size:0.82em;color:var(--text-light);margin-bottom:12px;">${hint}</p>` : ''}
        <input type="date" id="datePickerInput" class="form-input" style="font-size:1.1em;padding:12px;text-align:center;">
        <div style="display:flex;gap:8px;margin-top:14px;">
            <button class="btn btn-outline" style="flex:1;" onclick="closeDatePicker()">ביטול</button>
            <button class="btn btn-primary" style="flex:1;" onclick="confirmDatePicker('${docId}',${JSON.stringify(fieldId).replace(/"/g, '&quot;')})">אישור</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) closeDatePicker(); };
    // Set default to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('datePickerInput').value = today;
}

function closeDatePicker() {
    const m = document.getElementById('dateModal');
    if (m) m.remove();
}

function confirmDatePicker(docId, fieldId) {
    const input = document.getElementById('datePickerInput');
    if (!input || !input.value) { toast('בחר תאריך', 'error'); return; }
    const doc = DM.docs.find(d => d.id === docId);
    if (doc) {
        const f = (doc.fields || []).find(x => x.id === fieldId);
        if (f) {
            const d = new Date(input.value);
            f.signedValue = d.toLocaleDateString('he-IL');
            addAudit(doc, 'field_signed', `שדה "${f.label}" מולא`);
            save(); syncDocToFirebase(doc);
        }
    }
    closeDatePicker(); render();
    if (doc) highlightNextField(doc);
}

// ==================== FILE PICKER ====================
function openFilePicker(docId, fieldId) {
    const doc = DM.docs.find(d => d.id === docId);
    const field = doc ? (doc.fields || []).find(f => f.id === fieldId) : null;
    const hint = field && field.value ? esc(field.value) : 'צלם או בחר קובץ תמונה';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'fileModal';
    overlay.innerHTML = `<div class="modal-card">
        <h3 style="font-weight:700;margin-bottom:8px;">צירוף קובץ</h3>
        <p style="font-size:0.85em;color:var(--text-light);margin-bottom:14px;">${hint}</p>
        <div id="filePreviewArea" style="display:none;margin-bottom:12px;text-align:center;">
            <img id="filePreviewImg" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid var(--border);">
        </div>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
            <label class="btn btn-outline" style="flex:1;justify-content:center;cursor:pointer;">
                <input type="file" accept="image/*" capture="environment" style="display:none;" onchange="previewFileAttachment(this)">
                📷 צלם תמונה
            </label>
            <label class="btn btn-outline" style="flex:1;justify-content:center;cursor:pointer;">
                <input type="file" accept="image/*,.pdf" style="display:none;" onchange="previewFileAttachment(this)">
                📁 בחר קובץ
            </label>
        </div>
        <div style="display:flex;gap:8px;">
            <button class="btn btn-outline" style="flex:1;" onclick="closeFilePicker()">ביטול</button>
            <button class="btn btn-primary" style="flex:1;" id="confirmFileBtn" disabled onclick="confirmFilePicker('${docId}',${JSON.stringify(fieldId).replace(/"/g, '&quot;')})">אישור</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) closeFilePicker(); };
}

function previewFileAttachment(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    // Check file size - max 2MB
    if (file.size > 2 * 1024 * 1024) {
        toast('הקובץ גדול מדי (מקסימום 2MB)', 'error');
        return;
    }
    if (file.type.startsWith('image/')) {
        // Compress image before storing
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const maxDim = 800;
                let w = img.width, h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
                    else { w = Math.round(w * maxDim / h); h = maxDim; }
                }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                window._pendingFileData = canvas.toDataURL('image/jpeg', 0.7);
                window._pendingFileName = file.name;
                const preview = document.getElementById('filePreviewArea');
                const previewImg = document.getElementById('filePreviewImg');
                if (previewImg) previewImg.src = window._pendingFileData;
                if (preview) preview.style.display = 'block';
                const btn = document.getElementById('confirmFileBtn');
                if (btn) btn.disabled = false;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        // Non-image file - just show filename
        const reader = new FileReader();
        reader.onload = function(e) {
            window._pendingFileData = e.target.result;
            window._pendingFileName = file.name;
            const preview = document.getElementById('filePreviewArea');
            if (preview) {
                preview.style.display = 'block';
                preview.innerHTML = `<div style="padding:16px;background:var(--bg);border-radius:8px;font-size:0.88em;font-weight:600;">${esc(file.name)}</div>`;
            }
            const btn = document.getElementById('confirmFileBtn');
            if (btn) btn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

function closeFilePicker() {
    const m = document.getElementById('fileModal');
    if (m) m.remove();
    delete window._pendingFileData;
    delete window._pendingFileName;
}

function confirmFilePicker(docId, fieldId) {
    if (!window._pendingFileData) { toast('בחר קובץ', 'error'); return; }
    const doc = DM.docs.find(d => d.id === docId);
    if (doc) {
        const f = (doc.fields || []).find(x => x.id === fieldId);
        if (f) {
            f.signedValue = window._pendingFileName || 'קובץ מצורף';
            f.fileData = window._pendingFileData;
            addAudit(doc, 'field_signed', `קובץ "${window._pendingFileName}" צורף לשדה "${f.label}"`);
            save(); syncDocToFirebase(doc);
        }
    }
    closeFilePicker(); render();
    if (doc) highlightNextField(doc);
}

// Guided signing: scroll to next unsigned required field
function highlightNextField(doc) {
    const isSignerView = !!DM._currentSigner;
    const signerRecipient = isSignerView ? (doc.recipients || []).find(r => r.name && DM._currentSigner && r.name.trim() === DM._currentSigner.trim()) : null;
    const unsigned = (doc.fields || []).find(f => {
        if (f.fixed || f.signedValue || f.value || !f.required) return false;
        if (isSignerView && signerRecipient && f.assigneeId !== signerRecipient.id) return false;
        return true;
    });
    if (!unsigned) return;
    highlightNextFieldById(unsigned.id);
}

function completeSign(docId) {
  console.log('[complete] completeSign called:', docId);
  try {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) { console.warn('[complete] doc not found:', docId); toast('המסמך לא נמצא', 'error'); return; }
    // Check expiration
    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
        toast('תוקף המסמך פג', 'error'); return;
    }
    const isSignerView = !!DM._currentSigner;
    let signerRecipient = isSignerView ? (doc.recipients || []).find(r => r.name && DM._currentSigner && r.name.trim() === DM._currentSigner.trim()) : null;

    // If signer name doesn't match any recipient, match to first unsigned or create one
    if (isSignerView && !signerRecipient) {
        const recipients = doc.recipients || [];
        signerRecipient = recipients.find(r => !r.signed) || recipients[0];
        if (!signerRecipient) {
            // No predefined recipients (template link) - create from signer info
            signerRecipient = {
                id: Date.now(),
                name: DM._currentSigner || 'חותם',
                phone: '',
                email: DM._currentSignerEmail || '',
                colorIndex: 0,
                type: 'signer',
                signed: false
            };
            doc.recipients = doc.recipients || [];
            doc.recipients.push(signerRecipient);
        }
        if (signerRecipient) signerRecipient.name = DM._currentSigner;
    }

    if (isSignerView && signerRecipient) {
        // Signer view: check assigned fields, or all non-fixed if none assigned
        const assignedFields = (doc.fields || []).filter(f => f.assigneeId === signerRecipient.id && !f.fixed);
        const myFields = assignedFields.length > 0 ? assignedFields : (doc.fields || []).filter(f => !f.fixed);
        const myUnfilled = myFields.filter(f => f.required && !f.signedValue && !f.value);
        if (myUnfilled.length > 0) { toast(`נותרו ${myUnfilled.length} שדות חובה`, 'error'); return; }
        signerRecipient.signed = true;
        signerRecipient.signedAt = new Date().toISOString();
        addAudit(doc, 'signed', `${DM._currentSigner} חתם/ה על המסמך`);
        const allSigned = doc.recipients.length > 0 && doc.recipients.every(r => r.signed);
        if (allSigned) {
            doc.status = 'completed';
            doc.completedAt = new Date().toISOString();
            addAudit(doc, 'completed', 'כל הנמענים חתמו - המסמך הושלם');
        }
    } else {
        // Sender/owner view: check all required fields
        const unfilled = (doc.fields || []).filter(f => f.required && !f.fixed && !f.signedValue && !f.value);
        if (unfilled.length > 0) {
            console.log('Unfilled required fields:', unfilled.map(f => ({label: f.label, type: f.type, signedValue: f.signedValue, value: f.value})));
            toast(`נותרו ${unfilled.length} שדות חובה למילוי`, 'error');
            // Highlight first unfilled field
            highlightNextField(doc);
            return;
        }
        (doc.recipients || []).forEach(r => { r.signed = true; r.signedAt = new Date().toISOString(); });
        doc.status = 'completed';
        doc.completedAt = new Date().toISOString();
        addAudit(doc, 'completed', 'המסמך נחתם');
    }
    save();
    syncDocToFirebase(doc);
    toast('החתימה אושרה!');

    // Send email notifications
    if (typeof emailNotifyOwner === 'function') {
        const totalF = (doc.fields || []).filter(f => !f.fixed).length;
        const signedF = (doc.fields || []).filter(f => f.signedValue).length;
        const allDone = doc.status === 'completed';
        const sName = isSignerView ? DM._currentSigner : 'בעל המסמך';
        console.log('[email-debug] Sending owner email:', { createdBy: doc.createdBy, signer: sName, filled: signedF, total: totalF, allDone });
        emailNotifyOwner(doc, sName, { filled: signedF, total: totalF, allDone }).then(ok => {
            console.log('[email-debug] emailNotifyOwner result:', ok);
        }).catch(err => {
            console.error('[email-debug] emailNotifyOwner error:', err);
        });
    } else {
        console.warn('[email-debug] emailNotifyOwner function not found');
    }
    if (isSignerView && DM._currentSignerEmail && typeof emailNotifySigner === 'function') {
        emailNotifySigner(doc, DM._currentSigner, DM._currentSignerEmail);
    }

    // Webhook: POST completed form data to external endpoint (Google Apps Script, etc.)
    if (doc.webhookUrl && doc.status === 'completed') {
        _fireWebhook(doc).catch(err => console.warn('[webhook] error:', err));
    }

    if (isSignerView) {
        // Stay on the sign view to show completion
        render();
    } else {
        DM._currentSigner = null;
        DM._currentSignerEmail = null;
        switchView('home');
    }
  } catch (err) {
    console.error('completeSign error:', err);
    toast('שגיאה באישור החתימה: ' + friendlyError(err), 'error');
  }
}

// ==================== WEBHOOK ====================
async function _fireWebhook(doc) {
    if (!doc.webhookUrl) return;
    try {
        // Collect field values
        const fieldData = {};
        (doc.fields || []).forEach(f => {
            const key = f.label || f.type || f.id;
            if (f.signatureData) fieldData[key] = f.signatureData; // base64 signature image
            else if (f.fileData) fieldData[key] = f.fileData;
            else fieldData[key] = f.signedValue || f.value || '';
        });

        // Build payload
        const payload = {
            docId: doc.id,
            fileName: doc.fileName,
            completedAt: doc.completedAt || new Date().toISOString(),
            recipients: (doc.recipients || []).map(r => ({
                name: r.name, email: r.email || '', phone: r.phone || '',
                signedAt: r.signedAt || ''
            })),
            fields: fieldData,
            prefillData: doc.prefillData || {},
            meta: doc.webhookMeta || {},
            signUrl: `${location.origin}${location.pathname}#sign/${doc.id}`
        };

        console.log('[webhook] Sending to:', doc.webhookUrl);
        const resp = await fetch(doc.webhookUrl, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script requires no-cors from browser
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        console.log('[webhook] Sent successfully');
        addAudit(doc, 'webhook', 'נתונים נשלחו ל-webhook');
        save(); syncDocToFirebase(doc);
    } catch (err) {
        console.error('[webhook] Failed:', err);
        addAudit(doc, 'webhook_error', 'שגיאה בשליחת webhook: ' + (err.message || err));
        save(); syncDocToFirebase(doc);
    }
}

// ==================== SHARE DOCUMENT ====================
function openShareModal(docId) {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) {
        toast('המסמך לא נמצא', 'error');
        return;
    }

    const shareUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'shareModal';
    overlay.innerHTML = `
        <div class="modal-card" style="max-width:480px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <h3 style="font-weight:700;margin:0;">שיתוף מסמך</h3>
                <button class="btn btn-ghost btn-sm" onclick="closeShareModal()" style="font-size:1.1em;">✕</button>
            </div>

            <div style="margin-bottom:20px;">
                <div style="color:var(--text-light);font-size:0.9em;margin-bottom:8px;">שם המסמך:</div>
                <div style="font-weight:600;margin-bottom:15px;">${esc(doc.fileName || 'מסמך ללא שם')}</div>

                <div style="color:var(--text-light);font-size:0.9em;margin-bottom:8px;">קישור ציבורי לצפייה וחתימה:</div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <input type="text" id="shareUrlInput" class="form-input" value="${shareUrl}"
                           readonly style="font-size:0.8em;padding:8px;direction:ltr;flex:1;"
                           onclick="this.select()">
                    <button class="btn btn-primary btn-sm" onclick="copyShareUrl()" title="העתק">
                        ${ICO.copy}
                    </button>
                </div>

                <div style="background:var(--bg-light);padding:12px;border-radius:8px;margin-top:15px;font-size:0.85em;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        ${ICO.link}
                        <span style="font-weight:600;">כיצד זה עובד?</span>
                    </div>
                    <div style="color:var(--text-light);line-height:1.4;">
                        • הקישור מאפשר לכל מי שיש לו גישה לצפות במסמך ולחתום עליו<br>
                        • לא נדרשת הרשמה או התחברות<br>
                        • ניתן לשלוח את הקישור באימייל, WhatsApp או כל אפליקציה אחרת
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-ghost" onclick="closeShareModal()">סגור</button>
                <button class="btn btn-success" onclick="copyAndClose()">העתק וסגור</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) closeShareModal(); };

    // Focus on URL input for easy copying
    setTimeout(() => {
        const input = document.getElementById('shareUrlInput');
        if (input) input.select();
    }, 100);
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.remove();
}

function _clipboardCopy(text) {
    return navigator.clipboard.writeText(text).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { throw e; }
        finally { ta.remove(); }
    });
}

function copyShareUrl() {
    const input = document.getElementById('shareUrlInput');
    if (input) {
        input.select();
        _clipboardCopy(input.value).then(() => {
            toast('הקישור הועתק!', 'success');
        }).catch(() => {
            toast('שגיאה בהעתקת הקישור', 'error');
        });
    }
}

function copyAndClose() {
    copyShareUrl();
    setTimeout(() => closeShareModal(), 300);
}

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
    const sb = document.getElementById('appSidebar');
    const bd = document.getElementById('sidebarBackdrop');
    if (!sb) return;
    const isOpen = sb.classList.contains('open');
    sb.classList.toggle('open', !isOpen);
    if (bd) bd.classList.toggle('show', !isOpen);
}

function closeMobileMenu() {
    const sb = document.getElementById('appSidebar');
    const bd = document.getElementById('sidebarBackdrop');
    if (sb) sb.classList.remove('open');
    if (bd) bd.classList.remove('show');
}

// Escape key to cancel field placement mode
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && DM._pendingFieldType) {
        DM._pendingFieldType = null;
        DM._pendingFieldLabel = null;
        DM._lastFieldType = null;
        DM._lastFieldLabel = null;
        render();
    }
});

// ==================== INIT ====================
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// CSS animation for spinner
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);

// Check URL hash for direct document signing link (e.g. #sign/dm_123456)
let _fillingTemplate = false;

async function loadAndCloneTemplate(tplId) {
    if (_fillingTemplate) return;
    _fillingTemplate = true;
    console.log('[fill] Loading template:', tplId);
    try {
        const main = document.getElementById('mainContent');
        main.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;"><div style="text-align:center;"><div style="width:32px;height:32px;border:3px solid var(--primary);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>טוען תבנית...</div></div>';

        // Try local first (owner testing their own link)
        let tpl = DM.templates.find(t => t.id === tplId);
        console.log('[fill] Local template:', tpl ? 'found' : 'not found', tpl ? { hasImage: !!tpl.docImage, fields: (tpl.fields||[]).length } : '');

        // If local template has no images, try loading from Firebase chunks
        if (tpl && !tpl.docImage && typeof _loadImageChunks === 'function') {
            console.log('[fill] Loading images from chunks...');
            const imgs = await _loadImageChunks(tplId);
            if (imgs) { tpl.docImage = imgs.docImage; tpl.docPages = imgs.docPages || []; }
            console.log('[fill] Chunks loaded:', !!imgs);
        }

        // If not found locally, load from Firebase
        if (!tpl && typeof firebaseLoadTemplate === 'function') {
            console.log('[fill] Loading from Firebase...');
            tpl = await firebaseLoadTemplate(tplId);
            console.log('[fill] Firebase result:', tpl ? 'found' : 'not found');
        }

        if (!tpl) {
            main.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;"><div style="text-align:center;"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><h2 style="margin-top:12px;">התבנית לא נמצאה</h2><p style="color:var(--text-light);">ייתכן שהתבנית נמחקה או שהקישור שגוי</p></div></div>';
            return;
        }

        // Clone template into a NEW document
        const docId = 'dm_' + Date.now();
        const now = new Date().toISOString();
        const signerName = (smoovCurrentUser && smoovCurrentUser.displayName) || '';
        const signerEmail = (smoovCurrentUser && smoovCurrentUser.email) || '';
        const signerUid = (smoovCurrentUser && smoovCurrentUser.uid) || '';
        const newDoc = {
            id: docId,
            fileName: tpl.name || tpl.fileName || 'מסמך מתבנית',
            docImage: tpl.docImage,
            docPages: tpl.docPages || [],
            pageHeights: tpl.pageHeights || [],
            pageWidth: tpl.pageWidth || 0,
            recipients: [],
            fields: (tpl.fields || []).map(f => ({
                ...f,
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                signedValue: (!f.fixed && f.type === 'date_auto') ? new Date().toLocaleDateString('he-IL') : null,
                signatureData: null,
                fileData: null,
                value: f.fixed ? f.value : ''
            })),
            status: 'sent',
            templateId: tplId,
            templateName: tpl.name || '',
            createdBy: tpl.createdBy || '',
            ownerUid: tpl.ownerUid || '',
            signerName: signerName,
            signerEmail: signerEmail,
            signerUid: signerUid,
            createdAt: now,
            audit: [{ action: 'created', detail: 'נוצר מתבנית: ' + (tpl.name || '') + (signerName ? ' ע"י ' + signerName : ''), time: now }]
        };

        // Set signer identity from Google account (only if logged in)
        if (smoovCurrentUser) {
            DM._currentSigner = signerName || signerEmail || 'חותם';
            DM._currentSignerEmail = signerEmail;
        } else {
            // Not logged in - let openSign trigger identity verification
            DM._currentSigner = null;
            DM._currentSignerEmail = null;
        }

        console.log('[fill] New doc created:', docId, { hasImage: !!newDoc.docImage, fields: newDoc.fields.length, signer: DM._currentSigner });
        console.log('[fill] Template fields:', (tpl.fields||[]).map(f => ({type: f.type, label: f.label, fixed: f.fixed})));
        console.log('[fill] Cloned fields:', newDoc.fields.map(f => ({type: f.type, label: f.label, value: f.value, signedValue: f.signedValue})));
        DM.docs.push(newDoc);
        save();
        if (typeof firebaseSaveDoc === 'function') firebaseSaveDoc(newDoc);

        // Update hash to the new doc (prevents re-cloning on refresh)
        // Set flag to prevent duplicate openSign from hashchange
        window._skipNextHashSign = docId;
        location.hash = '#sign/' + docId;
        openSign(docId, { keepSigner: !!smoovCurrentUser });
    } catch (err) {
        console.error('Error cloning template:', err);
        toast('שגיאה בטעינת התבנית', 'error');
    } finally {
        setTimeout(() => { _fillingTemplate = false; }, 500);
    }
}

function checkUrlHash() {
    const hash = location.hash;

    // Check for shared document links (e.g. #share/sh_123456)
    if (hash.startsWith('#share/')) {
        const linkId = hash.substring(7);
        openSharedDocument(linkId);
        return true;
    }

    // Check for template fill links (e.g. #fill/tpl_123456)
    if (hash.startsWith('#fill/')) {
        if (_fillingTemplate) return true;
        const tplId = hash.substring(6);
        loadAndCloneTemplate(tplId);
        return true;
    }

    if (hash.startsWith('#sign/')) {
        const docId = hash.substring(6);
        // Skip if loadAndCloneTemplate just set this hash (prevents double openSign)
        if (window._skipNextHashSign === docId) {
            window._skipNextHashSign = null;
            return true;
        }
        const doc = DM.docs.find(d => d.id === docId);
        if (doc) {
            openSign(docId);
            return true;
        }
        // Document not in localStorage - try loading from Firebase
        if (typeof firebaseLoadDoc === 'function') {
            const main = document.getElementById('mainContent');
            if (main) main.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:60px 20px;"><div style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;"></div><p style="color:var(--text-light);font-size:0.9em;">טוען מסמך...</p></div>';
            firebaseLoadDoc(docId).then(remoteDoc => {
                if (remoteDoc) {
                    // Add to local docs so it renders
                    DM.docs.push(remoteDoc);
                    save();
                    openSign(docId);
                } else {
                    toast('המסמך לא נמצא', 'error');
                    render();
                }
            }).catch(() => {
                toast('שגיאה בטעינת המסמך', 'error');
                render();
            });
            return true; // async - will render when done
        }
    }
    return false;
}

// ==================== SHARED DOCUMENT VIEWING ====================
function openSharedDocument(linkId) {
    // First check localStorage for existing shared doc
    const cachedDoc = localStorage.getItem(`shared_doc_${linkId}`);
    if (cachedDoc) {
        try {
            const sharedDoc = JSON.parse(cachedDoc);
            if (isValidSharedDocument(sharedDoc)) {
                renderSharedDocument(sharedDoc);
                return;
            }
        } catch (e) {
            localStorage.removeItem(`shared_doc_${linkId}`);
        }
    }

    // Load from Firebase
    if (typeof smoovDb !== 'undefined' && smoovDb) {
        smoovDb.collection('shared_documents').doc(linkId).get()
            .then(doc => {
                if (doc.exists) {
                    const sharedDoc = doc.data();
                    if (isValidSharedDocument(sharedDoc)) {
                        // Cache locally - replace actual password with boolean flag for security
                        const hasPass = !!sharedDoc.settings.password;
                        const cacheData = { ...sharedDoc, settings: { ...sharedDoc.settings, password: hasPass ? '__protected__' : '' } };
                        localStorage.setItem(`shared_doc_${linkId}`, JSON.stringify(cacheData));
                        renderSharedDocument(sharedDoc);
                        return;
                    }
                }
                // Document not found or invalid
                renderSharedDocumentError('המסמך לא נמצא או שפג תוקפו');
            })
            .catch(error => {
                console.error('Error loading shared document:', error);
                renderSharedDocumentError('שגיאה בטעינת המסמך');
            });
    } else {
        renderSharedDocumentError('שירות השיתוף אינו זמין');
    }
}

function isValidSharedDocument(sharedDoc) {
    if (!sharedDoc || !sharedDoc.settings) return false;

    const settings = sharedDoc.settings;

    // Check if still active
    if (!settings.isActive) return false;

    // Check expiry
    if (settings.expiresAt && new Date(settings.expiresAt) < new Date()) return false;

    // Check view limit
    if (settings.maxViews && settings.viewCount >= settings.maxViews) return false;

    return true;
}

function renderSharedDocument(sharedDoc) {
    const needsPassword = sharedDoc.settings.password && !sessionStorage.getItem(`share_auth_${sharedDoc.linkId}`);

    if (needsPassword) {
        renderPasswordPrompt(sharedDoc);
        return;
    }

    // Increment view count
    incrementViewCount(sharedDoc.linkId);

    // Switch to public view mode
    DM.view = 'shared';
    DM.sharedDoc = sharedDoc;

    // Hide topbar and sidebar for public view
    document.body.classList.add('public-view');

    render();
}

function renderPasswordPrompt(sharedDoc) {
    const main = document.getElementById('mainContent');
    const topbar = document.getElementById('appTopbar');
    const sidebar = document.getElementById('appSidebar');

    // Hide main UI elements
    if (topbar) topbar.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';

    main.innerHTML = `
        <div class="public-password-screen">
            <div class="public-password-card">
                <div class="logo" style="margin-bottom: 24px;">
                    <svg width="40" height="40" viewBox="0 0 100 100">
                        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs>
                        <rect width="100" height="100" rx="20" fill="url(#lg)"/>
                        <path d="M58 16H36a8 8 0 00-8 8v52a8 8 0 008 8h28a8 8 0 008-8V42l-14-26z" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="3.5"/>
                        <polyline points="58 16 58 42 72 42" fill="none" stroke="white" stroke-width="3.5"/>
                        <path d="M36 60c8-12 14 4 18-4s8-14 12-4" stroke="white" stroke-width="5" stroke-linecap="round" fill="none"/>
                    </svg>
                    <h1>SmoovSign</h1>
                </div>

                <h2>מסמך מוגן בסיסמה</h2>
                <p>המסמך "${esc(sharedDoc.docData.fileName)}" מוגן בסיסמה</p>

                <div class="form-group">
                    <input type="password" class="form-input" id="sharePassword" placeholder="הזן סיסמה..." style="text-align: center;" onkeypress="if(event.key==='Enter') verifySharePassword('${sharedDoc.linkId}')">
                </div>

                <button class="btn btn-primary btn-lg" onclick="verifySharePassword('${sharedDoc.linkId}')" style="width: 100%;">
                    צפייה במסמך
                </button>

                <div id="passwordError" class="error-message" style="display: none; margin-top: 12px; color: var(--danger);"></div>
            </div>
        </div>
    `;

    setTimeout(() => document.getElementById('sharePassword').focus(), 100);
}

function verifySharePassword(linkId) {
    const password = document.getElementById('sharePassword').value;
    const errorDiv = document.getElementById('passwordError');

    if (!password) {
        errorDiv.textContent = 'יש להזין סיסמה';
        errorDiv.style.display = 'block';
        return;
    }

    // Always verify password against Firebase (cache only stores a flag, not the actual password)
    if (typeof smoovDb !== 'undefined' && smoovDb) {
        errorDiv.style.display = 'none';
        smoovDb.collection('shared_documents').doc(linkId).get().then(doc => {
            if (doc.exists && doc.data().settings.password === password) {
                sessionStorage.setItem(`share_auth_${linkId}`, 'true');
                const sharedDocData = localStorage.getItem(`shared_doc_${linkId}`);
                const sharedDoc = sharedDocData ? JSON.parse(sharedDocData) : doc.data();
                renderSharedDocument(sharedDoc);
            } else {
                errorDiv.textContent = 'סיסמה שגויה';
                errorDiv.style.display = 'block';
            }
        }).catch(() => {
            errorDiv.textContent = 'שגיאה באימות הסיסמה, נסה שוב';
            errorDiv.style.display = 'block';
        });
    } else {
        errorDiv.textContent = 'שגיאה בטעינת המסמך, נסה לרענן את הדף';
        errorDiv.style.display = 'block';
    }
}

function incrementViewCount(linkId) {
    if (typeof smoovDb === 'undefined' || !smoovDb) return;

    smoovDb.collection('shared_documents').doc(linkId).update({
        'settings.viewCount': firebase.firestore.FieldValue.increment(1)
    }).catch(error => {
        console.error('Error updating view count:', error);
    });
}

function renderSharedDocumentError(message) {
    const main = document.getElementById('mainContent');
    const topbar = document.getElementById('appTopbar');
    const sidebar = document.getElementById('appSidebar');

    // Hide main UI elements
    if (topbar) topbar.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';

    main.innerHTML = `
        <div class="public-error-screen">
            <div class="public-error-card">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <h2>${message}</h2>
                <p>הקישור עשוי להיות שגוי, פג תוקף, או שהגיע למגבלת הצפיות.</p>
            </div>
        </div>
    `;
}

function renderSharedDocumentView(el) {
    if (!DM.sharedDoc) {
        renderSharedDocumentError('שגיאה בטעינת המסמך');
        return;
    }

    const doc = DM.sharedDoc.docData;
    const settings = DM.sharedDoc.settings;
    const docImage = doc.docImage || (doc.docPages && doc.docPages[0]);

    if (!docImage) {
        renderSharedDocumentError('המסמך לא נמצא');
        return;
    }

    el.innerHTML = `
        <div class="shared-document-viewer">
            <div class="shared-header">
                <div class="shared-logo">
                    <svg width="24" height="24" viewBox="0 0 100 100">
                        <defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs>
                        <rect width="100" height="100" rx="20" fill="url(#lg2)"/>
                        <path d="M58 16H36a8 8 0 00-8 8v52a8 8 0 008 8h28a8 8 0 008-8V42l-14-26z" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="3.5"/>
                        <polyline points="58 16 58 42 72 42" fill="none" stroke="white" stroke-width="3.5"/>
                        <path d="M36 60c8-12 14 4 18-4s8-14 12-4" stroke="white" stroke-width="5" stroke-linecap="round" fill="none"/>
                    </svg>
                    <span>SmoovSign</span>
                </div>

                <div class="shared-doc-info">
                    <h1>${esc(doc.fileName || 'מסמך משותף')}</h1>
                    <div class="shared-meta">
                        ${settings.viewCount ? `נצפה ${settings.viewCount} פעמים` : ''}
                        ${settings.maxViews ? `• מתוך ${settings.maxViews} מקסימום` : ''}
                        ${settings.expiresAt ? `• פג תוקף ב-${new Date(settings.expiresAt).toLocaleDateString('he-IL')}` : ''}
                    </div>
                </div>

                <div class="shared-actions">
                    <button class="btn btn-outline" onclick="downloadSharedPDF()">
                        ${ICO.download} הורדה
                    </button>
                </div>
            </div>

            <div class="shared-document-container">
                ${doc.docPages && doc.docPages.length > 1 ? renderSharedMultiPageDocument(doc) : renderSharedSinglePageDocument(doc)}
            </div>

            ${doc.fields && doc.fields.length > 0 ? `
                <div class="shared-fields-panel">
                    <h3>שדות במסמך</h3>
                    <div class="shared-fields-list">
                        ${doc.fields.map(field => `
                            <div class="shared-field-item">
                                <strong>${esc(field.label || field.type)}:</strong>
                                <span>${esc(field.value || '(ריק)')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderSharedSinglePageDocument(doc) {
    const image = doc.docImage || (doc.docPages && doc.docPages[0]);
    return `
        <div class="shared-page">
            <div class="shared-page-image">
                <img src="${image}" alt="מסמך" style="max-width: 100%; height: auto;" />
                ${renderSharedFields(doc.fields || [])}
            </div>
        </div>
    `;
}

function renderSharedMultiPageDocument(doc) {
    return `
        <div class="shared-multi-page">
            ${doc.docPages.map((page, index) => `
                <div class="shared-page">
                    <div class="shared-page-header">
                        <h4>עמוד ${index + 1}</h4>
                    </div>
                    <div class="shared-page-image">
                        <img src="${page}" alt="עמוד ${index + 1}" style="max-width: 100%; height: auto;" />
                        ${renderSharedFields(doc.fields ? doc.fields.filter(f => f.page === index) : [])}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderSharedFields(fields) {
    return fields.map(field => {
        const style = `
            position: absolute;
            left: ${field.x}px;
            top: ${field.y}px;
            width: ${field.w || field.width || 120}px;
            height: ${field.h || field.height || 30}px;
            border: 2px solid #2563eb;
            background: rgba(37, 99, 235, 0.1);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #2563eb;
            font-weight: 600;
            pointer-events: none;
        `;

        return `<div style="${style}" title="${esc((field.label || field.type) + ': ' + (field.value || '(ריק)'))}">${esc(field.value || field.type)}</div>`;
    }).join('');
}

function downloadSharedPDF() {
    if (!DM.sharedDoc) return;

    const doc = DM.sharedDoc.docData;
    // Build a temporary doc object compatible with _downloadPdfCanvasFallback
    const tmpDoc = {
        id: 'shared_' + Date.now(),
        fileName: doc.fileName || 'shared-document',
        docImage: doc.docImage,
        docPages: doc.docPages || [],
        pageHeights: doc.pageHeights || [],
        pageWidth: doc.pageWidth || 0,
        fields: doc.fields || [],
        recipients: doc.recipients || [],
        status: 'completed'
    };
    toast('מכין PDF להורדה...', 'info');
    _downloadPdfCanvasFallback(tmpDoc).then(() => {
        toast('ה-PDF הורד בהצלחה!');
    }).catch(() => {
        toast('שגיאה בהורדת הקובץ', 'error');
    });
}

// ==================== AUTH STATE ====================
function onAuthStateChanged(user) {
    const loginScreen = document.getElementById('loginScreen');
    const topbar = document.getElementById('appTopbar');
    const appLayout = document.getElementById('appLayout');
    const userMenu = document.getElementById('userMenu');

    // Signing/fill links should work without auth
    const hash = window.location.hash;
    const isSignLink = hash.startsWith('#sign/') || hash.startsWith('#fill/');

    if (user) {
        // User is logged in
        smoovCurrentUser = user;
        loginScreen.style.display = 'none';
        appLayout.style.display = '';

        // Filter docs/templates to only show current user's data
        // Keep docs owned by this user OR docs they signed via fill links
        const uid = user.uid;
        const email = user.email;
        DM.docs = DM.docs.filter(d =>
            d.id === DM.signDocId || // Always keep the currently active doc
            !d.ownerUid || d.ownerUid === uid || d.signerUid === uid ||
            d.signerEmail === email || d.createdBy === email
        );
        DM.templates = DM.templates.filter(t =>
            !t.ownerUid || t.ownerUid === uid || t.createdBy === email
        );
        save(); // Persist filtered data so localStorage stays in sync

        const isFillLink = hash.startsWith('#fill/');
        if (isFillLink) {
            // Fill-link signer: hide dashboard navigation, show only signing view
            topbar.style.display = 'none';
            userMenu.style.display = 'none';
            const sidebar = document.getElementById('appSidebar');
            if (sidebar) sidebar.style.display = 'none';
        } else {
            topbar.style.display = '';
            userMenu.style.display = '';
        }

        // Update user menu
        const avatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userNameTopbar = document.getElementById('userNameTopbar');
        avatar.src = user.photoURL || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%232563eb"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>');
        userName.textContent = user.displayName || 'משתמש';
        userEmail.textContent = user.email || '';
        if (userNameTopbar) userNameTopbar.textContent = user.displayName || user.email || '';

        // Load user profile (trial/full plan)
        if (typeof ensureUserProfile === 'function') {
            ensureUserProfile(user).then(profile => {
                DM._userProfile = profile;
                render(); // re-render with profile info (trial badge, template visibility)
            });
        }

        // Restore images from IndexedDB before first render
        restoreImagesFromIDB().then(() => {
            if (!checkUrlHash()) render();
        });
        if (!isFillLink) syncOwnerDocsFromFirebase(user.email);
    } else if (isSignLink) {
        // Allow signing without login
        loginScreen.style.display = 'none';
        topbar.style.display = 'none';
        appLayout.style.display = '';
        userMenu.style.display = 'none';
        checkUrlHash();
    } else {
        // Not logged in - show login screen
        loginScreen.style.display = 'flex';
        topbar.style.display = 'none';
        appLayout.style.display = 'none';
        userMenu.style.display = 'none';

        // Show fill-link hint if opening a template fill link
        if (hash.startsWith('#fill/')) {
            const card = loginScreen.querySelector('.login-card');
            if (card && !card.querySelector('.fill-link-hint')) {
                const hint = document.createElement('div');
                hint.className = 'fill-link-hint';
                hint.style.cssText = 'background:var(--bg-light,#f1f5f9);padding:12px;border-radius:8px;margin-bottom:16px;font-size:0.85em;color:var(--text-light,#64748b);text-align:center;';
                hint.innerHTML = 'נא להתחבר עם חשבון Google כדי למלא את המסמך.<br>כל משתמש מקבל עותק אישי למילוי.';
                const btn = card.querySelector('.google-signin-btn');
                if (btn) card.insertBefore(hint, btn);
            }
        }
    }
}

// Init: hide app until auth resolves
document.getElementById('appTopbar').style.display = 'none';
document.getElementById('appLayout').style.display = 'none';

// Convert email-safe query params (?sign=ID) to hash format (#sign/ID)
(function convertQueryToHash() {
    const params = new URLSearchParams(window.location.search);
    const signId = params.get('sign') || params.get('fill') || params.get('share');
    const type = params.get('sign') ? 'sign' : params.get('fill') ? 'fill' : params.get('share') ? 'share' : null;
    if (signId && type) {
        window.location.replace(`${location.pathname}#${type}/${signId}`);
    }
})();

// For sign/share links: show content immediately without waiting for auth
const _initHash = window.location.hash;
if (_initHash.startsWith('#sign/') || _initHash.startsWith('#share/') || _initHash.startsWith('#fill/')) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appLayout').style.display = '';
    document.getElementById('mainContent').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;"><div style="text-align:center;"><div style="width:32px;height:32px;border:3px solid var(--primary);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>טוען מסמך...</div></div>';
}

// ==================== FORM BUILDER ====================

function startFormBuilder() {
    DM.step = 1;
    DM.formTitle = '';
    DM.formDescription = '';
    DM.formLogo = null;
    DM.formFields = [];
    DM.recipients = [];
    DM.isTemplate = false;
    DM._isFormBuilder = true;
    DM._formSheetsUrl = '';
    DM._formMakeUrl = '';
    switchView('create_form');
}

function renderFormBuilder(el) {
    const steps = [
        { id: 1, label: 'פרטי הטופס' },
        { id: 2, label: 'שדות הטופס' },
        { id: 3, label: 'שליחה' }
    ];

    el.innerHTML = `<div class="wizard">
        <div class="wizard-header">
            <button class="btn btn-ghost" onclick="resetEditor();switchView('home')">✕ סגור</button>
            <span style="font-weight:700;">יצירת טופס חדש</span>
            <div style="width:80px;"></div>
        </div>
        <div class="wizard-stepper">
            ${steps.map((s, i) => `
                ${i > 0 ? `<div class="step-line ${s.id <= DM.step ? 'done' : ''}"></div>` : ''}
                <div style="display:flex;flex-direction:column;align-items:center;${s.id < DM.step ? 'cursor:pointer;' : ''}" ${s.id < DM.step ? `onclick="goFormStep(${s.id})"` : ''}>
                    <div class="step-dot ${s.id === DM.step ? 'active' : s.id < DM.step ? 'done' : ''}">${s.id < DM.step ? '✓' : s.id === DM.step ? '●' : s.id}</div>
                    <span class="step-label ${s.id === DM.step ? 'active' : ''}">${s.label}</span>
                </div>
            `).join('')}
        </div>
        <div class="wizard-body" id="wizardBody"></div>
        <div class="wizard-footer">
            <div>${DM.step > 1 ? `<button class="btn btn-outline" onclick="goFormStep(${DM.step - 1})">הקודם</button>` : ''}</div>
            <div id="wizardNextBtn"></div>
        </div>
    </div>`;

    renderFormStep();
    renderFormNextBtn();
}

function goFormStep(s) {
    if (s === 2 && !DM.formTitle.trim()) { toast('יש להזין כותרת לטופס', 'error'); return; }
    if (s === 3 && DM.formFields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }
    DM.step = s;
    render();
}

function renderFormNextBtn() {
    const el = document.getElementById('wizardNextBtn');
    if (!el) return;
    if (DM.step < 3) {
        const disabled = DM.step === 1 && !DM.formTitle.trim() ? 'disabled' : '';
        el.innerHTML = `<button class="btn btn-primary btn-lg" onclick="goFormStep(${DM.step + 1})" ${disabled}>הבא</button>`;
    } else {
        el.innerHTML = `<button class="btn btn-success btn-lg" onclick="sendForm()">שלח טופס</button>`;
    }
}

function renderFormStep() {
    const el = document.getElementById('wizardBody');
    if (!el) return;
    if (DM.step === 1) renderFormDetails(el);
    else if (DM.step === 2) renderFormFieldEditor(el);
    else if (DM.step === 3) renderFormSend(el);
}

// ---- Step 1: Form Details ----
function renderFormDetails(el) {
    el.innerHTML = `<div class="upload-area">
        <h2 style="font-size:1.3em;font-weight:700;margin-bottom:6px;">פרטי הטופס</h2>
        <p style="color:var(--text-light);margin-bottom:24px;">הזן את פרטי הטופס הבסיסיים</p>
        <div style="max-width:560px;margin:0 auto;">
            <div class="form-group">
                <label class="form-label">כותרת הטופס *</label>
                <input type="text" class="form-input" value="${esc(DM.formTitle)}" oninput="DM.formTitle=this.value;renderFormNextBtn();" placeholder="לדוגמה: טופס הרשמה, סקר שביעות רצון..." autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">תיאור (אופציונלי)</label>
                <textarea class="form-input" rows="3" oninput="DM.formDescription=this.value" placeholder="הסבר קצר על הטופס...">${esc(DM.formDescription)}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">לוגו (אופציונלי)</label>
                ${DM.formLogo ? `
                    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border-radius:10px;">
                        <img src="${DM.formLogo}" alt="logo" style="max-height:60px;max-width:120px;border-radius:8px;">
                        <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="DM.formLogo=null;render();">הסר</button>
                    </div>
                ` : `
                    <label class="form-logo-upload">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span style="font-size:0.88em;color:var(--text-light);margin-top:6px;">לחץ להעלאת לוגו</span>
                        <input type="file" style="display:none;" accept="image/*" onchange="uploadFormLogo(this)">
                    </label>
                `}
            </div>
        </div>
    </div>`;
}

function uploadFormLogo(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { DM.formLogo = e.target.result; render(); };
    reader.readAsDataURL(file);
}

// ---- Step 2: Field Editor ----
function renderFormFieldEditor(el) {
    el.innerHTML = `<div style="max-width:640px;margin:0 auto;">
        <h2 style="font-size:1.3em;font-weight:700;margin-bottom:6px;">שדות הטופס</h2>
        <p style="color:var(--text-light);margin-bottom:20px;">הוסף את השדות שהנמען ימלא</p>
        <div class="form-fields-list" id="formFieldsList">
            ${DM.formFields.map((f, idx) => renderFormFieldCard(f, idx)).join('')}
        </div>
        <button class="btn btn-outline" style="margin-top:14px;width:100%;padding:12px;border-style:dashed;" onclick="showFormFieldPicker()">
            + הוסף שדה
        </button>
    </div>`;
    initFormFieldDragDrop();
}

function showFormFieldPicker() {
    const existing = document.getElementById('fieldPickerModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'fieldPickerModal';
    modal.className = 'field-picker-modal';
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `<div class="field-picker-content">
        <h3 style="font-weight:700;margin-bottom:16px;text-align:center;">בחר סוג שדה</h3>
        <div class="field-picker-grid">
            ${FORM_FIELD_TYPES.map(ft => `
                <div class="field-picker-item" onclick="addFormField('${ft.type}');document.getElementById('fieldPickerModal').remove();">
                    <span style="font-size:1.4em;">${ICO[ft.icon] || ''}</span>
                    <span>${ft.label}</span>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-ghost" style="width:100%;margin-top:12px;" onclick="document.getElementById('fieldPickerModal').remove()">ביטול</button>
    </div>`;
    document.body.appendChild(modal);
}

function addFormField(type) {
    const ftDef = FORM_FIELD_TYPES.find(t => t.type === type);
    const field = {
        id: 'ff_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        type: type,
        label: ftDef ? ftDef.label : type,
        required: false,
        placeholder: '',
    };
    // Type-specific defaults
    if (type === 'dropdown') field.options = ['אפשרות 1', 'אפשרות 2'];
    if (type === 'heading') { field.content = 'כותרת'; field.required = false; }
    if (type === 'paragraph') { field.content = ''; field.required = false; }
    DM.formFields.push(field);
    render();
}

function renderFormFieldCard(f, idx) {
    const ftDef = FORM_FIELD_TYPES.find(t => t.type === f.type);
    const icon = ftDef ? (ICO[ftDef.icon] || '') : '';
    const isDecorative = f.type === 'heading' || f.type === 'paragraph';

    let extra = '';
    // Placeholder for non-decorative fields
    if (!isDecorative) {
        extra += `<div style="padding:4px 0 0 0;margin-top:4px;">
            <input type="text" class="form-input" style="font-size:0.82em;padding:6px 10px;" placeholder="טקסט עזרה (placeholder)" value="${esc(f.placeholder || '')}" oninput="DM.formFields[${idx}].placeholder=this.value">
        </div>`;
    }
    // Content for heading/paragraph
    if (f.type === 'heading') {
        extra += `<div style="padding:4px 0 0 0;margin-top:4px;">
            <input type="text" class="form-input" style="font-size:0.95em;font-weight:700;padding:6px 10px;" placeholder="טקסט הכותרת" value="${esc(f.content || '')}" oninput="DM.formFields[${idx}].content=this.value">
        </div>`;
    }
    if (f.type === 'paragraph') {
        extra += `<div style="padding:4px 0 0 0;margin-top:4px;">
            <textarea class="form-input" style="font-size:0.85em;padding:6px 10px;resize:vertical;" rows="2" placeholder="טקסט הפסקה / הסבר" oninput="DM.formFields[${idx}].content=this.value">${esc(f.content || '')}</textarea>
        </div>`;
    }
    // Options for dropdown
    if (f.type === 'dropdown') {
        extra += `<div style="padding:6px 0 0 0;margin-top:4px;">
            <div style="font-size:0.82em;color:var(--text-light);margin-bottom:6px;">אפשרויות:</div>
            ${(f.options || []).map((opt, oi) => `
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <input type="text" class="form-input" style="font-size:0.82em;padding:4px 8px;flex:1;" value="${esc(opt)}" oninput="updateFormFieldOption(${idx},${oi},this.value)">
                    <button class="btn btn-ghost btn-sm ff-delete" onclick="removeFormFieldOption(${idx},${oi})" title="הסר">&times;</button>
                </div>
            `).join('')}
            <button class="btn btn-ghost btn-sm" style="font-size:0.78em;color:var(--primary);margin-top:2px;" onclick="addFormFieldOption(${idx})">+ הוסף אפשרות</button>
        </div>`;
    }

    return `<div class="ff-card" draggable="true" data-idx="${idx}">
        <div class="ff-card-header">
            <span class="ff-drag-handle" title="גרור לשינוי סדר">⠿</span>
            <span class="ff-type-icon">${icon}</span>
            <input type="text" class="ff-label-input" value="${esc(f.label)}" oninput="DM.formFields[${idx}].label=this.value" placeholder="שם השדה">
            ${!isDecorative ? `
                <label class="ff-required-toggle">
                    <input type="checkbox" ${f.required ? 'checked' : ''} onchange="DM.formFields[${idx}].required=this.checked">
                    <span style="font-size:0.75em;color:var(--text-light);">חובה</span>
                </label>
            ` : ''}
            <button class="btn btn-ghost btn-sm ff-delete" onclick="removeFormField(${idx})" title="מחק שדה">${ICO.trash}</button>
        </div>
        ${extra}
    </div>`;
}

function removeFormField(idx) {
    DM.formFields.splice(idx, 1);
    render();
}

function addFormFieldOption(idx) {
    if (!DM.formFields[idx].options) DM.formFields[idx].options = [];
    DM.formFields[idx].options.push('אפשרות ' + (DM.formFields[idx].options.length + 1));
    render();
}

function removeFormFieldOption(idx, optIdx) {
    DM.formFields[idx].options.splice(optIdx, 1);
    render();
}

function updateFormFieldOption(idx, optIdx, val) {
    DM.formFields[idx].options[optIdx] = val;
}

function initFormFieldDragDrop() {
    const list = document.getElementById('formFieldsList');
    if (!list) return;
    let dragIdx = null;

    list.querySelectorAll('.ff-card').forEach(card => {
        card.addEventListener('dragstart', e => {
            dragIdx = parseInt(card.dataset.idx);
            card.classList.add('ff-dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('ff-dragging');
            dragIdx = null;
        });
        card.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        card.addEventListener('drop', e => {
            e.preventDefault();
            const dropIdx = parseInt(card.dataset.idx);
            if (dragIdx !== null && dragIdx !== dropIdx) {
                const item = DM.formFields.splice(dragIdx, 1)[0];
                DM.formFields.splice(dropIdx, 0, item);
                render();
            }
        });
    });
}

// ---- Step 3: Send ----
function renderFormSend(el) {
    el.innerHTML = `<div class="send-area">
        <h2 style="font-size:1.3em;font-weight:700;margin-bottom:20px;">שליחת הטופס</h2>
        <div class="send-grid">
            <div class="send-card">
                <div style="margin-bottom:16px;">
                    <h3 style="font-weight:700;font-size:0.95em;margin-bottom:4px;">${esc(DM.formTitle)}</h3>
                    ${DM.formDescription ? `<p style="font-size:0.85em;color:var(--text-light);">${esc(DM.formDescription)}</p>` : ''}
                    <div style="font-size:0.82em;color:var(--text-muted);margin-top:6px;">${DM.formFields.length} שדות</div>
                </div>
                <div class="form-group">
                    <label class="form-label">נמענים</label>
                    <p style="font-size:0.82em;color:var(--text-light);margin-bottom:8px;">הוסף נמענים שיקבלו את הטופס למילוי</p>
                    <div id="formRecipientsList">
                        ${DM.recipients.map((r, i) => `
                            <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:8px;margin-bottom:6px;">
                                <span style="font-weight:700;color:var(--primary);font-size:0.85em;min-width:20px;">${i + 1}</span>
                                <input type="text" class="form-input" style="flex:2;font-size:0.88em;padding:6px 10px;" placeholder="שם" value="${esc(r.name || '')}" oninput="DM.recipients[${i}].name=this.value">
                                <input type="text" class="form-input" style="flex:2;font-size:0.88em;padding:6px 10px;direction:ltr;" placeholder="טלפון" value="${esc(r.phone || '')}" oninput="DM.recipients[${i}].phone=this.value">
                                <button class="btn btn-ghost btn-sm ff-delete" onclick="DM.recipients.splice(${i},1);render();">${ICO.trash}</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-ghost btn-sm" style="color:var(--primary);font-size:0.85em;margin-top:4px;" onclick="DM.recipients.push({id:Date.now(),name:'',phone:'',colorIndex:DM.recipients.length});render();">+ הוסף נמען</button>
                </div>
                <div class="form-group" style="margin-top:16px;">
                    <label class="form-label">הודעת וואטסאפ (אופציונלי)</label>
                    <textarea class="form-input" rows="2" id="formWhatsAppMsg" placeholder="הודעה שתצורף לקישור בוואטסאפ..." style="resize:none;"></textarea>
                </div>
            </div>
            <div>
                <div class="send-card">
                    <h3 style="font-weight:700;font-size:0.9em;margin-bottom:14px;">אינטגרציות (אופציונלי)</h3>
                    <div class="form-group">
                        <label class="form-label">Google Sheets Webhook URL</label>
                        <input type="url" class="form-input" style="direction:ltr;font-size:0.85em;" placeholder="https://script.google.com/..." value="${esc(DM._formSheetsUrl)}" oninput="DM._formSheetsUrl=this.value">
                        <small style="font-size:0.75em;color:var(--text-muted);margin-top:4px;display:block;">נתוני הטופס ישלחו לגיליון אלקטרוני</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Make.com Webhook URL</label>
                        <input type="url" class="form-input" style="direction:ltr;font-size:0.85em;" placeholder="https://hook.make.com/..." value="${esc(DM._formMakeUrl)}" oninput="DM._formMakeUrl=this.value">
                        <small style="font-size:0.75em;color:var(--text-muted);margin-top:4px;display:block;">הפעלת אוטומציה עם מילוי הטופס</small>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

function sendForm() {
    if (DM.formFields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }
    if (!DM.formTitle.trim()) { toast('יש להזין כותרת לטופס', 'error'); return; }

    const now = new Date().toISOString();
    const doc = {
        id: 'fm_' + Date.now(),
        type: 'form',
        fileName: DM.formTitle,
        formTitle: DM.formTitle,
        formDescription: DM.formDescription,
        formLogo: DM.formLogo,
        formFields: JSON.parse(JSON.stringify(DM.formFields)),
        recipients: JSON.parse(JSON.stringify(DM.recipients.filter(r => r.name && r.name.trim()))),
        webhookUrl: DM._formSheetsUrl || null,
        makeWebhookUrl: DM._formMakeUrl || null,
        status: 'sent',
        createdAt: now,
        createdBy: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser) ? smoovCurrentUser.email : '',
        ownerUid: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser) ? smoovCurrentUser.uid : '',
        audit: [
            { action: 'created', time: now, detail: 'הטופס נוצר' },
            { action: 'sent', time: now, detail: `נשלח ל-${DM.recipients.filter(r => r.name && r.name.trim()).length} נמענים` }
        ]
    };

    DM.docs.push(doc);
    save();

    // Save to Firebase
    if (typeof firebaseSaveDoc === 'function') {
        firebaseSaveDoc(doc).then(ok => {
            if (ok) console.log('Form saved to Firebase');
        });
    }

    // WhatsApp notifications
    const msg = document.getElementById('formWhatsAppMsg')?.value || '';
    doc.recipients.forEach(r => {
        if (r.phone) {
            const phone = r.phone.replace(/[^0-9]/g, '');
            if (phone.length >= 9) {
                const intl = phone.startsWith('0') ? '972' + phone.substring(1) : phone;
                const formUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;
                const waMsg = `שלום ${r.name},\nנשלח אליך טופס "${DM.formTitle}" למילוי.\n${msg}\nקישור למילוי: ${formUrl}`;
                const opened = window.open(`https://wa.me/${intl}?text=${encodeURIComponent(waMsg)}`, '_blank');
                if (!opened) toast('חלון WhatsApp נחסם - שלח ידנית את הקישור', 'error');
            }
        }
    });

    toast('הטופס נוצר בהצלחה!');
    resetEditor();
    showLinkSuccess(doc);
}

// Migrate images from localStorage to IndexedDB (one-time on upgrade)
(function migrateImages() {
    const hasImages = DM.docs.some(d => d.docImage) || DM.templates.some(t => t.docImage);
    if (hasImages) {
        // Old format: images are in localStorage. Save them to IndexedDB and re-save stripped.
        save(); // This saves images to IDB and strips from localStorage
        console.log('Migrated images from localStorage to IndexedDB');
    }
})();

// Initialize Firebase (auth listener will handle the rest)
if (typeof initSmoovFirebase === 'function') initSmoovFirebase();
if (typeof initSmoovEmail === 'function') initSmoovEmail();

window.addEventListener('hashchange', () => { checkUrlHash(); });
