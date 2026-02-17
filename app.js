// ==================== SmoovSign - Digital Signature App ====================
// Standalone signature system

// ==================== STATE ====================
const DM = {
    view: 'dashboard', // dashboard, templates, create, sign
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
    isTemplate: false, // true when creating a template
    editingTemplateId: null,
    signDocId: null,
    recipientSearch: '',
    fieldColors: [
        { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8', fill: '#2563eb' },
        { bg: '#f3e8ff', border: '#7c3aed', text: '#6d28d9', fill: '#7c3aed' },
        { bg: '#dcfce7', border: '#16a34a', text: '#15803d', fill: '#16a34a' },
        { bg: '#ffedd5', border: '#ea580c', text: '#c2410c', fill: '#ea580c' }
    ]
};

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
};

function save() {
    localStorage.setItem('smoov_docs', JSON.stringify(DM.docs));
    localStorage.setItem('smoov_templates', JSON.stringify(DM.templates));
}

function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type}`;
    setTimeout(() => el.className = 'toast hidden', 3000);
}

// ==================== NAVIGATION ====================
function switchView(view) {
    DM.view = view;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    render();
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

    const main = document.getElementById('mainContent');
    if (DM.view === 'dashboard') renderDashboard(main);
    else if (DM.view === 'templates') renderTemplates(main);
    else if (DM.view === 'create') renderWizard(main);
    else if (DM.view === 'sign') renderSignView(main);

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

// ==================== DASHBOARD ====================
function renderDashboard(el) {
    const allDocs = DM.docs.slice().reverse();
    const total = allDocs.length;
    const completed = allDocs.filter(d => d.status === 'completed' || (d.recipients || []).every(r => r.signed)).length;
    const expired = allDocs.filter(d => d.expiresAt && new Date(d.expiresAt) < new Date() && d.status !== 'completed').length;
    const pending = total - completed - expired;
    const filter = DM._dashFilter || 'all';
    const search = DM._dashSearch || '';

    let docs = allDocs;
    if (filter === 'pending') docs = docs.filter(d => d.status !== 'completed' && !(d.expiresAt && new Date(d.expiresAt) < new Date()));
    else if (filter === 'completed') docs = docs.filter(d => d.status === 'completed');
    else if (filter === 'expired') docs = docs.filter(d => d.expiresAt && new Date(d.expiresAt) < new Date() && d.status !== 'completed');
    if (search) docs = docs.filter(d => (d.fileName || '').includes(search) || (d.recipients || []).some(r => (r.name || '').includes(search)));

    el.innerHTML = `<div class="dashboard">
        <div class="dashboard-header">
            <h1>המסמכים שלי</h1>
        </div>
        <div class="dashboard-stats">
            <div class="stat-card clickable ${filter === 'all' ? 'stat-active' : ''}" onclick="DM._dashFilter='all';render()"><div class="stat-num">${total}</div><div class="stat-label">סה"כ מסמכים</div></div>
            <div class="stat-card clickable ${filter === 'pending' ? 'stat-active' : ''}" onclick="DM._dashFilter='pending';render()"><div class="stat-num" style="color:var(--warning)">${pending}</div><div class="stat-label">ממתינים</div></div>
            <div class="stat-card clickable ${filter === 'completed' ? 'stat-active' : ''}" onclick="DM._dashFilter='completed';render()"><div class="stat-num" style="color:var(--success)">${completed}</div><div class="stat-label">הושלמו</div></div>
            <div class="stat-card clickable ${filter === 'expired' ? 'stat-active' : ''}" onclick="DM._dashFilter='expired';render()"><div class="stat-num" style="color:var(--danger)">${expired}</div><div class="stat-label">פג תוקף</div></div>
        </div>
        <div class="dashboard-search">
            <input type="text" class="form-input" placeholder="חפש מסמך או נמען..." value="${search}" oninput="DM._dashSearch=this.value;render()" style="max-width:400px;">
        </div>
        ${docs.length === 0 ? `
            <div class="empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h2>${search || filter !== 'all' ? 'לא נמצאו מסמכים' : 'אין מסמכים עדיין'}</h2>
                <p>${search || filter !== 'all' ? 'נסה לשנות את הסינון או החיפוש' : 'צור מסמך חדש או השתמש בתבנית קיימת'}</p>
                ${!search && filter === 'all' ? `<button class="btn btn-primary btn-lg" onclick="newDocument()">+ צור מסמך חדש</button>` : ''}
            </div>
        ` : `<div class="doc-list">${docs.map(d => renderDocCard(d)).join('')}</div>`}
    </div>`;
}

function renderDocCard(doc) {
    const signedCount = (doc.recipients || []).filter(r => r.signed).length;
    const totalR = (doc.recipients || []).length;
    const pct = totalR > 0 ? Math.round((signedCount / totalR) * 100) : 0;
    const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date() && doc.status !== 'completed';
    const statusClass = doc.status === 'completed' ? 'status-complete' : isExpired ? 'status-expired' : pct > 0 ? 'status-pending' : 'status-waiting';
    const statusText = doc.status === 'completed' ? 'הושלם' : isExpired ? 'פג תוקף' : pct > 0 ? 'בתהליך' : 'ממתין';
    const statusColor = doc.status === 'completed' ? 'var(--success)' : isExpired ? 'var(--danger)' : pct > 0 ? 'var(--warning)' : 'var(--text-muted)';
    const created = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('he-IL') : '';

    return `<div class="doc-card" onclick="openSign('${doc.id}')">
        <div class="doc-thumb">${doc.docImage ? `<img src="${doc.docImage}" alt="">` : ''}</div>
        <div class="doc-info">
            <div style="display:flex;align-items:center;gap:6px;">
                <h3>${doc.fileName || 'מסמך ללא שם'}</h3>
                <span class="badge ${doc.status === 'completed' ? 'badge-success' : isExpired ? 'badge-danger' : 'badge-warning'}" style="font-size:0.65em;">${statusText}</span>
            </div>
            <div class="doc-meta">${created}${doc.createdBy ? ' · ' + doc.createdBy : ''} · ${totalR} נמענים${doc.expiresAt ? ' · תוקף: ' + new Date(doc.expiresAt).toLocaleDateString('he-IL') : ''}</div>
            <div class="doc-progress">
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${statusColor}"></div></div>
                <span class="doc-status ${statusClass}">${signedCount}/${totalR} חתמו</span>
            </div>
        </div>
        <div class="doc-actions" onclick="event.stopPropagation()">
            <button class="btn btn-sm btn-outline" onclick="deleteDoc('${doc.id}')">מחק</button>
        </div>
    </div>`;
}

function deleteDoc(id) {
    if (!confirm('למחוק מסמך זה?')) return;
    DM.docs = DM.docs.filter(d => d.id !== id);
    save();
    render();
}

// ==================== TEMPLATES ====================
function renderTemplates(el) {
    el.innerHTML = `<div class="dashboard">
        <div class="dashboard-header">
            <h1>תבניות מסמכים</h1>
            <button class="btn btn-primary" onclick="newTemplate()">+ תבנית חדשה</button>
        </div>
        ${DM.templates.length === 0 ? `
            <div class="empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                <h2>אין תבניות עדיין</h2>
                <p>צור תבנית עם שדות מוכנים ושדות למילוי - חוסך זמן בכל שליחה!</p>
                <button class="btn btn-primary btn-lg" onclick="newTemplate()">+ צור תבנית</button>
            </div>
        ` : `<div class="doc-list">${DM.templates.map(t => `
            <div class="template-card">
                <div class="template-icon" style="background:var(--primary-light);color:var(--primary);">${ICO.doc}</div>
                <div class="doc-info">
                    <h3>${t.name || 'תבנית ללא שם'}</h3>
                    <div class="doc-meta">${t.fields ? t.fields.length + ' שדות' : ''} · ${t.fixedFields ? t.fixedFields.filter(f => f.value).length + ' שדות מוכנים' : ''}</div>
                </div>
                <div class="doc-actions">
                    <button class="btn btn-sm btn-primary" onclick="useTemplate('${t.id}')">שלח מתבנית</button>
                    <button class="btn btn-sm btn-outline" onclick="editTemplate('${t.id}')">ערוך</button>
                    <button class="btn btn-sm btn-ghost" style="color:var(--danger)" onclick="deleteTemplate('${t.id}')">מחק</button>
                </div>
            </div>
        `).join('')}</div>`}
    </div>`;
}

function deleteTemplate(id) {
    if (!confirm('למחוק תבנית זו?')) return;
    DM.templates = DM.templates.filter(t => t.id !== id);
    save();
    render();
}

function useTemplate(id) {
    const tpl = DM.templates.find(t => t.id === id);
    if (!tpl) return;
    resetEditor();
    DM.docImage = tpl.docImage;
    DM.fileName = tpl.name;
    // Copy template fields - fixed ones keep their value, dynamic ones are empty
    DM.fields = (tpl.fields || []).map(f => ({
        ...f, id: Date.now() + Math.random(),
        value: f.fixed ? f.value : ''
    }));
    DM.isTemplate = false;
    DM.step = 2; // skip upload, go to recipients
    DM.view = 'create';
    render();
}

function editTemplate(id) {
    const tpl = DM.templates.find(t => t.id === id);
    if (!tpl) return;
    resetEditor();
    DM.docImage = tpl.docImage;
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
}

// ==================== WIZARD ====================
function renderWizard(el) {
    if (DM.recipients.length === 0 && !DM.isTemplate) {
        DM.recipients = [{ id: 1, name: '', phone: '', colorIndex: 0, type: 'sender' }];
        DM.activeRecipientId = 1;
    }

    const steps = DM.isTemplate
        ? [{ id: 1, label: 'העלאת מסמך' }, { id: 2, label: 'הגדרת שדות' }]
        : [{ id: 1, label: 'העלאת מסמך' }, { id: 2, label: 'נמענים' }, { id: 3, label: 'הגדרת שדות' }, { id: 4, label: 'שליחה' }];

    el.innerHTML = `<div class="wizard">
        <div class="wizard-header">
            <button class="btn btn-ghost" onclick="switchView('dashboard')">✕ סגור</button>
            <span style="font-weight:700;">${DM.isTemplate ? 'יצירת תבנית' : 'מסמך חדש'}</span>
            <div style="width:80px;"></div>
        </div>
        <div class="wizard-stepper">
            ${steps.map((s, i) => `
                ${i > 0 ? `<div class="step-line ${s.id <= DM.step ? 'done' : ''}"></div>` : ''}
                <div style="display:flex;flex-direction:column;align-items:center;" ${s.id < DM.step ? `onclick="goStep(${s.id})" style="cursor:pointer;"` : ''}>
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
        el.innerHTML = `<button class="btn btn-success btn-lg" onclick="sendDocument()">שלח מסמך</button>`;
    }
}

function goStep(s) {
    if (s === 2 && !DM.docImage && !DM.isTemplate) { toast('יש להעלות מסמך קודם', 'error'); return; }
    if (DM.isTemplate && s === 2 && !DM.docImage) { toast('יש להעלות מסמך קודם', 'error'); return; }
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
                        <span style="font-weight:600;">${DM.fileName}</span>
                    </div>
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="clearDoc()">מחק</button>
                </div>
                ${DM.isTemplate ? `<div class="form-group">
                    <label class="form-label">שם התבנית</label>
                    <input type="text" class="form-input" value="${DM.fileName}" onchange="DM.fileName=this.value" placeholder="הזן שם לתבנית...">
                </div>` : ''}
                <div class="doc-preview-img"><img src="${DM.docImage}" alt="preview"></div>
            ` : `
                <label class="upload-dropzone" id="dropzone">
                    <div class="upload-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <span style="font-size:1.1em;font-weight:700;">הוספת מסמך</span>
                    <span style="font-size:0.82em;color:var(--text-light);margin-top:4px;">PDF, JPG, PNG - גרור או לחץ</span>
                    <input type="file" style="display:none;" accept=".pdf,image/*" onchange="handleFileUpload(event)" id="fileInput">
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
    DM.fileName = file.name.replace(/\.\w+$/, '');
    if (file.type === 'application/pdf') {
        if (!window.pdfjsLib) { toast('PDF.js לא נטען', 'error'); return; }
        const dz = document.getElementById('dropzone');
        if (dz) dz.innerHTML = '<div style="text-align:center"><div style="width:24px;height:24px;border:3px solid var(--primary);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 10px;"></div>טוען PDF...</div>';
        try {
            const buf = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
            const numPages = pdf.numPages;

            // Render all pages and combine into one tall image
            const pageCanvases = [];
            let totalH = 0;
            let maxW = 0;
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const vp = page.getViewport({ scale: 2 });
                const c = document.createElement('canvas');
                c.width = vp.width; c.height = vp.height;
                await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                pageCanvases.push(c);
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
            if (numPages > 1) toast(`${numPages} דפים נטענו בהצלחה`);
            render();
        } catch (err) {
            console.error('PDF load error:', err);
            toast('שגיאה בטעינת PDF', 'error');
            render();
        }
    } else {
        const reader = new FileReader();
        reader.onload = ev => { DM.docImage = ev.target.result; render(); };
        reader.readAsDataURL(file);
    }
}

function clearDoc() { DM.docImage = null; DM.fileName = ''; DM.fields = []; render(); }

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
                        <input type="text" value="${r.name}" placeholder="שם הנמען" onchange="updateRecipient(${r.id},'name',this.value)">
                        <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div class="input-wrap">
                        <input type="tel" value="${r.phone || ''}" placeholder="מספר טלפון" onchange="updateRecipient(${r.id},'phone',this.value)" style="direction:ltr;text-align:right;">
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

    el.innerHTML = `<div class="editor">
        <!-- Left: Props or Thumbnail -->
        <div class="editor-sidebar ${selField ? '' : 'sidebar-mini'}">
            ${selField ? renderFieldProps(selField) : `
                <div style="padding:12px;">
                    <div style="font-size:0.72em;color:var(--text-light);margin-bottom:8px;">תצוגה מקדימה</div>
                    <div style="border:2px solid var(--primary);border-radius:8px;overflow:hidden;">
                        ${DM.docImage ? `<img src="${DM.docImage}" style="width:100%;display:block;opacity:0.8;" alt="">` : ''}
                    </div>
                    <div style="margin-top:12px;font-size:0.78em;color:var(--text-light);">שדות: ${DM.fields.length}</div>
                </div>`}
        </div>

        <!-- Center: Canvas -->
        <div class="editor-canvas" onclick="deselectField(event)" id="canvasArea">
            <!-- Zoom Controls -->
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
            </div>
        </div>

        <!-- Right: Tools -->
        <div class="editor-tools">
            <div class="tools-header">
                ${DM.isTemplate ? `
                    <div class="form-label" style="margin-bottom:6px;">סוג שדה</div>
                    <div style="display:flex;gap:4px;margin-bottom:8px;">
                        <button class="btn btn-sm ${!DM._fieldFixed ? 'btn-primary' : 'btn-outline'}" onclick="DM._fieldFixed=false;" style="flex:1;">דינמי (למילוי)</button>
                        <button class="btn btn-sm ${DM._fieldFixed ? 'btn-primary' : 'btn-outline'}" onclick="DM._fieldFixed=true;" style="flex:1;">קבוע (מוכן)</button>
                    </div>
                ` : `
                    <div class="form-label" style="margin-bottom:6px;">הוסף שדה עבור</div>
                    <select class="form-input" onchange="DM.activeRecipientId=Number(this.value)" style="font-weight:700;color:var(--primary);background:var(--primary-light);border-color:#93c5fd;">
                        ${DM.recipients.map(r => `<option value="${r.id}" ${r.id === DM.activeRecipientId ? 'selected' : ''}>${r.name || 'נמען ' + (DM.recipients.indexOf(r) + 1)}</option>`).join('')}
                    </select>`}
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
    </div>`;

    // Attach drag listeners
    const area = document.getElementById('canvasArea');
    if (area) {
        area.onmousemove = handleMouseMove;
        area.onmouseup = handleMouseUp;
        area.onmouseleave = handleMouseUp;
        area.ontouchmove = e => { if (DM.isDragging || DM.isResizing) { e.preventDefault(); handleMouseMove(e.touches[0]); } };
        area.ontouchend = handleMouseUp;
    }
    // Set cursor based on pending field mode
    const docCont = document.getElementById('docContainer');
    if (docCont) docCont.style.cursor = DM._pendingFieldType ? 'crosshair' : 'default';
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
    return `<button class="tool-btn" onclick="addField('${type}','${label}')">
        <span class="tool-icon">${icon}</span>${label}
    </button>`;
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
                <input type="text" class="form-input" value="${f.label}" onchange="updateField(${f.id},'label',this.value)" style="font-weight:600;">
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
            ${DM.isTemplate ? `<div class="form-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:0.85em;cursor:pointer;">
                    <input type="checkbox" ${f.fixed ? 'checked' : ''} onchange="updateField(${f.id},'fixed',this.checked)">
                    <strong>שדה קבוע</strong> (ערך לא ישתנה)
                </label>
            </div>` : ''}
            <div class="form-group">
                <label class="form-label">${f.type === 'file' ? 'הנחיה לחותם (סוג קובץ)' : f.fixed ? 'ערך קבוע' : 'ערך ברירת מחדל'}</label>
                <input type="text" class="form-input" value="${f.value || ''}" onchange="updateField(${f.id},'value',this.value)" placeholder="${f.type === 'file' ? 'לדוגמה: צלם תעודת זהות...' : f.fixed ? 'הזן ערך שימולא אוטומטית...' : 'מה יוצג בשדה...'}">
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
    const ci = assignee ? assignee.colorIndex : (f.fixed ? 2 : 0);
    const c = DM.fieldColors[ci % DM.fieldColors.length];
    const selected = DM.selectedFieldId === f.id;
    const typeLabels = { signature: 'חתימה', date: 'תאריך', date_auto: 'תאריך אוטומטי', date_manual: 'בחירת תאריך', fullname: 'שם מלא', id_number: 'ת.ז.', checkbox: '☑', stamp: '✓', file: 'צירוף קובץ' };
    const displayText = f.value || typeLabels[f.type] || f.label || 'טקסט';

    return `<div class="field-box ${selected ? 'selected' : ''}" data-fid="${f.id}"
        style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;z-index:${selected ? 20 : 10};"
        onmousedown="fieldMouseDown(event,${f.id})" ontouchstart="fieldTouchStart(event,${f.id})"
        onclick="event.stopPropagation();selectField(${f.id})" ondblclick="event.stopPropagation();editFieldInline(${f.id})">
        ${selected ? `
            <div class="field-label-tag" style="background:${c.fill};">${f.label}${f.required ? ' *' : ''}</div>
            <div class="field-toolbar">
                <button onclick="event.stopPropagation();editFieldInline(${f.id})" title="ערוך">${ICO.edit}</button>
                <button onclick="event.stopPropagation();deleteField(${f.id})" title="מחק">${ICO.trash}</button>
                <button onclick="event.stopPropagation();duplicateField(${f.id})" title="שכפל">${ICO.copy}</button>
            </div>
            <div class="resize-handle" style="top:-4px;left:-4px;border-color:${c.fill};cursor:nw-resize;" onmousedown="resizeMouseDown(event,${f.id},'nw')"></div>
            <div class="resize-handle" style="top:-4px;right:-4px;border-color:${c.fill};cursor:ne-resize;" onmousedown="resizeMouseDown(event,${f.id},'ne')"></div>
            <div class="resize-handle" style="bottom:-4px;left:-4px;border-color:${c.fill};cursor:sw-resize;" onmousedown="resizeMouseDown(event,${f.id},'sw')"></div>
            <div class="resize-handle" style="bottom:-4px;right:-4px;border-color:${c.fill};cursor:se-resize;" onmousedown="resizeMouseDown(event,${f.id},'se')"></div>
        ` : ''}
        <div class="field-inner" ${selected ? `style="background:${c.bg};border-color:${c.border};color:${c.text};"` : ''}>
            <span style="padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${displayText}</span>
        </div>
    </div>`;
}

// ==================== FIELD ACTIONS ====================
// Store pending field type when user clicks a tool button
// Then place field at next click on the document canvas
DM._pendingFieldType = null;
DM._pendingFieldLabel = null;

function addField(type, label) {
    // Set pending - next click on document will place the field
    DM._pendingFieldType = type;
    DM._pendingFieldLabel = label;
    // Change cursor to crosshair on canvas
    const container = document.getElementById('docContainer');
    if (container) container.style.cursor = 'crosshair';
    toast('לחץ על המסמך למיקום השדה', 'info');
}

function onCanvasClick(e) {
    // If there's a pending field, place it at click position
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
    const defaultW = type === 'signature' ? 160 : type === 'checkbox' ? 30 : type === 'file' ? 160 : 140;
    const defaultH = type === 'signature' ? 50 : type === 'checkbox' ? 30 : type === 'file' ? 50 : 32;

    // Place field centered on click position
    const f = {
        id: Date.now() + Math.random(),
        type, label, value: '',
        x: Math.max(0, clickX - defaultW / 2),
        y: Math.max(0, clickY - defaultH / 2),
        w: defaultW, h: defaultH,
        required: true,
        assigneeId: assignee ? assignee.id : null,
        fixed: DM.isTemplate ? (DM._fieldFixed || false) : false
    };
    DM.fields.push(f);
    DM.selectedFieldId = f.id;

    // Clear pending
    DM._pendingFieldType = null;
    DM._pendingFieldLabel = null;

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
function updateField(id, key, val) { const f = DM.fields.find(x => x.id === id); if (f) { f[key] = val; render(); } }
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
    if (f.type === 'date' || f.type === 'date_auto') { f.value = new Date().toLocaleDateString('he-IL'); render(); }
    else if (f.type === 'date_manual') { const v = prompt('הזן תאריך:', f.value || ''); if (v !== null) { f.value = v; render(); } }
    else if (f.type === 'checkbox') { f.value = f.value ? '' : '✓'; render(); }
    else if (f.type === 'file') { const v = prompt('הנחיה לחותם (סוג קובץ נדרש):', f.value || ''); if (v !== null) { f.value = v; render(); } }
    else { const v = prompt(f.label || 'הזן ערך:', f.value || ''); if (v !== null) { f.value = v; render(); } }
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

// ==================== STEP 4: SEND ====================
function renderSend(el) {
    el.innerHTML = `<div class="send-area">
        <h2 style="font-size:1.3em;font-weight:700;margin-bottom:20px;">הכנה לשליחה</h2>
        <div class="send-grid">
            <div>
                <div class="send-card">
                    <h3 style="font-weight:700;font-size:0.9em;margin-bottom:12px;">סיכום</h3>
                    <div style="font-size:0.85em;color:var(--text-light);display:flex;flex-direction:column;gap:8px;">
                        <div style="display:flex;justify-content:space-between;"><span>מסמך:</span><strong style="color:var(--text);">${DM.fileName || 'ללא שם'}</strong></div>
                        <div style="display:flex;justify-content:space-between;"><span>נמענים:</span><strong style="color:var(--text);">${DM.recipients.length}</strong></div>
                        <div style="display:flex;justify-content:space-between;"><span>שדות:</span><strong style="color:var(--text);">${DM.fields.length}</strong></div>
                    </div>
                </div>
            </div>
            <div class="send-card">
                <div class="form-group">
                    <label class="form-label">שם המסמך</label>
                    <input type="text" class="form-input" value="${DM.fileName || 'מסמך ללא שם'}" onchange="DM.fileName=this.value" style="font-weight:600;">
                </div>
                <div class="form-group">
                    <label class="form-label">הודעה לחותמים</label>
                    <textarea class="form-input" rows="3" placeholder="הזן הודעה שתישלח לנמענים..." id="sendMessage" style="resize:none;"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">תאריך תפוגה (אופציונלי)</label>
                    <input type="date" class="form-input" id="docExpiry" style="direction:ltr;text-align:right;">
                </div>
                <div>
                    <label class="form-label" style="margin-bottom:8px;">נמענים:</label>
                    ${DM.recipients.map(r => {
                        const c = DM.fieldColors[r.colorIndex % DM.fieldColors.length];
                        const fc = DM.fields.filter(f => f.assigneeId === r.id).length;
                        return `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:8px;margin-bottom:6px;">
                            <span style="width:8px;height:8px;border-radius:50%;background:${c.fill};"></span>
                            <span style="font-weight:600;font-size:0.88em;">${r.name || 'ללא שם'}</span>
                            <span style="font-size:0.78em;color:var(--text-light);direction:ltr;">${r.phone || ''}</span>
                            <span style="margin-right:auto;font-size:0.72em;background:var(--card);padding:2px 8px;border-radius:10px;">${fc} שדות</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    </div>`;
}

// ==================== SEND DOCUMENT ====================
function sendDocument() {
    if (DM.recipients.length === 0) { toast('יש להוסיף לפחות נמען אחד', 'error'); return; }
    const emptyNames = DM.recipients.filter(r => !r.name || !r.name.trim());
    if (emptyNames.length > 0) { toast('יש להזין שם לכל הנמענים', 'error'); return; }
    if (DM.fields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }
    const now = new Date().toISOString();
    const expiryInput = document.getElementById('docExpiry');
    const doc = {
        id: 'dm_' + Date.now(),
        fileName: DM.fileName,
        docImage: DM.docImage,
        recipients: JSON.parse(JSON.stringify(DM.recipients)),
        fields: JSON.parse(JSON.stringify(DM.fields)),
        status: 'sent',
        createdAt: now,
        createdBy: (typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser) ? smoovCurrentUser.email : '',
        expiresAt: expiryInput && expiryInput.value ? new Date(expiryInput.value).toISOString() : null,
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
                window.open(`https://wa.me/${intl}?text=${encodeURIComponent(waMsg)}`, '_blank');
            }
        }
    });

    toast('המסמך נשלח בהצלחה!');
    resetEditor();
    DM.view = 'dashboard';
    render();
}

// ==================== SAVE TEMPLATE ====================
function saveTemplate() {
    if (!DM.docImage) { toast('יש להעלות מסמך קודם', 'error'); return; }
    if (DM.fields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }

    const tpl = {
        id: DM.editingTemplateId || 'tpl_' + Date.now(),
        name: DM.fileName || 'תבנית ללא שם',
        docImage: DM.docImage,
        fields: JSON.parse(JSON.stringify(DM.fields)),
        fixedFields: DM.fields.filter(f => f.fixed),
        createdAt: new Date().toISOString()
    };

    if (DM.editingTemplateId) {
        const idx = DM.templates.findIndex(t => t.id === DM.editingTemplateId);
        if (idx >= 0) DM.templates[idx] = tpl;
    } else {
        DM.templates.push(tpl);
    }
    save();
    toast('התבנית נשמרה!');
    resetEditor();
    DM.view = 'templates';
    render();
}

// ==================== SIGNING VIEW ====================
function openSign(docId) {
    DM.signDocId = docId;
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) { toast('המסמך לא נמצא', 'error'); switchView('dashboard'); return; }

    const isSignLink = location.hash.startsWith('#sign/');
    const isLoggedIn = !!(typeof smoovCurrentUser !== 'undefined' && smoovCurrentUser);

    // If owner is logged in - go directly to owner view (no verification needed)
    if (isLoggedIn) {
        DM._currentSigner = null;
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
        <div class="verify-card">
            <div class="verify-icon">
                <div class="login-logo-wrap" style="width:64px;height:64px;margin:0 auto;border-radius:18px;">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="1.5"/><polyline points="14 2 14 8 20 8" fill="none" stroke="white" stroke-width="1.5"/><path d="M8 15c2-3 4 1 5-1s2-4 3-1" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
                </div>
            </div>
            <h2>אימות זהות</h2>
            <p style="color:var(--text-light);margin-bottom:20px;">נא להזדהות לפני חתימה על "${doc.fileName}"</p>
            <div class="form-group">
                <label class="form-label">שם מלא</label>
                <input type="text" class="form-input" id="verifyName" placeholder="הזן את שמך המלא..." autofocus>
            </div>
            <div class="form-group">
                <label class="form-label">אימייל (לקבלת העתק חתימה)</label>
                <input type="email" class="form-input" id="verifyEmail" placeholder="name@email.com" style="direction:ltr;text-align:right;">
            </div>
            <div class="form-group">
                <label class="form-label">מספר טלפון (אופציונלי)</label>
                <input type="tel" class="form-input" id="verifyPhone" placeholder="050-000-0000" style="direction:ltr;text-align:right;">
            </div>
            <button class="btn btn-primary btn-lg" style="width:100%;margin-top:8px;" onclick="verifySigner('${doc.id}')">כניסה לחתימה</button>
            <div style="font-size:0.72em;color:var(--text-light);margin-top:16px;text-align:center;">
                בלחיצה על "כניסה לחתימה" אתה מאשר את זהותך
            </div>
        </div>
    </div>`;
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

function renderSignView(el) {
    const doc = DM.docs.find(d => d.id === DM.signDocId);
    if (!doc) { switchView('dashboard'); return; }

    // Determine if this is a signer view (came via link) or sender/owner view
    const isSignerView = !!DM._currentSigner;
    // Match signer to a recipient by name
    let signerRecipient = null;
    if (isSignerView) {
        signerRecipient = (doc.recipients || []).find(r => r.name && DM._currentSigner && r.name.trim() === DM._currentSigner.trim());
    }

    // Add view audit on first render
    if (!doc._viewed) { doc._viewed = true; addAudit(doc, 'viewed', isSignerView ? `${DM._currentSigner} צפה במסמך` : 'המסמך נצפה'); save(); syncDocToFirebase(doc); }

    const isComplete = doc.status === 'completed';
    const isExpired = doc.expiresAt && new Date(doc.expiresAt) < new Date();

    // For signer view: only count their fields; for sender view: count all
    const myFields = isSignerView && signerRecipient
        ? (doc.fields || []).filter(f => f.assigneeId === signerRecipient.id && !f.fixed)
        : (doc.fields || []).filter(f => !f.fixed);
    const mySignedFields = myFields.filter(f => f.signedValue).length;
    const pct = myFields.length > 0 ? Math.round((mySignedFields / myFields.length) * 100) : 0;
    const signUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;

    el.innerHTML = `<div class="wizard">
        <div class="sign-header">
            <button class="btn btn-ghost" onclick="switchView('dashboard')">← ${isSignerView ? 'יציאה' : 'חזרה'}</button>
            <div style="display:flex;align-items:center;gap:10px;">
                <h3 style="font-weight:700;">${doc.fileName || 'מסמך'}</h3>
                ${isComplete ? '<span class="badge badge-success">הושלם</span>' : isExpired ? '<span class="badge badge-danger">פג תוקף</span>' : '<span class="badge badge-warning">ממתין לחתימה</span>'}
            </div>
            <div style="display:flex;gap:6px;">
                <button class="btn btn-outline btn-sm" onclick="downloadSignedPDF('${doc.id}')" title="הורד קובץ">${ICO.download} הורדה</button>
                ${!isSignerView ? `<button class="btn btn-outline btn-sm" onclick="toggleAuditLog('${doc.id}')" title="יומן פעילות">${ICO.log}</button>` : ''}
            </div>
        </div>
        <!-- Progress bar -->
        <div class="sign-progress">
            <div class="sign-progress-fill" style="width:${pct}%;"></div>
            <span class="sign-progress-label">${isSignerView ? `${mySignedFields}/${myFields.length} שדות מולאו (${pct}%)` : `${mySignedFields}/${myFields.length} שדות מולאו (${pct}%)`}</span>
        </div>
        ${isComplete ? `
        <div class="completion-banner">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div>
                <strong>המסמך נחתם בהצלחה!</strong>
                <div style="font-size:0.82em;opacity:0.9;">הושלם: ${doc.completedAt ? new Date(doc.completedAt).toLocaleString('he-IL') : ''}</div>
            </div>
        </div>` : ''}
        ${isExpired && !isComplete ? `<div class="expiry-banner">תוקף המסמך פג ב-${new Date(doc.expiresAt).toLocaleDateString('he-IL')}. לא ניתן לחתום.</div>` : ''}
        ${!isSignerView ? `<!-- Audit Log Panel (hidden by default) -->
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
                            <div style="font-size:0.85em;font-weight:600;">${a.detail}</div>
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
                        // In signer view: only allow signing own fields
                        const isMyField = !isSignerView || !signerRecipient || f.assigneeId === signerRecipient.id;
                        const canSign = !val && !f.fixed && !isComplete && !isExpired && isMyField;
                        // In signer view: hide other people's unsigned empty fields
                        const showField = isMyField || val || f.fixed;
                        if (!showField) return '';
                        return `<div class="sign-field ${canSign ? 'mine' : ''}" data-fid="${f.id}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;
                            ${val ? `background:${c.bg};border:1.5px solid ${c.border};` : canSign ? `background:${c.bg}80;border:2px solid ${c.border};` : `background:rgba(200,200,200,0.3);border:1px dashed #ccc;`}"
                            ${canSign ? `onclick="signField('${doc.id}',${JSON.stringify(f.id).replace(/"/g, '&quot;')})"` : ''}>
                            ${f.signatureData ? `<img src="${f.signatureData}" style="width:100%;height:100%;object-fit:contain;" alt="חתימה">` :
                              f.fileData ? `<img src="${f.fileData}" style="width:100%;height:100%;object-fit:contain;" alt="קובץ מצורף">` :
                              val ? `<span style="font-size:0.85em;font-weight:700;color:${c.text};padding:0 6px;">${val}</span>` :
                              canSign && f.type === 'file' ? `<span style="font-size:0.75em;color:${c.text};font-weight:700;">📎 ${f.value || 'לחץ לצרף קובץ'}</span>` :
                              canSign ? `<span style="font-size:0.78em;color:${c.text};font-weight:700;">לחץ למלא</span>` :
                              f.fixed && f.value ? `<span style="font-size:0.85em;font-weight:700;color:#1e293b;padding:0 6px;">${f.value}</span>` :
                              `<span style="font-size:0.75em;color:#888;font-weight:600;">${f.label}</span>`}
                        </div>`;
                    }).join('')}
                </div>
            </div>
            <div class="sign-sidebar">
                ${isSignerView ? `
                    <!-- Signer view: compact progress + confirm -->
                    <div style="display:flex;align-items:center;gap:12px;padding:8px 0;">
                        <div style="flex:1;">
                            <div style="font-size:0.82em;color:var(--text-light);">שלום, ${DM._currentSigner}</div>
                            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                                <div class="mini-progress" style="flex:1;height:6px;"><div class="mini-progress-fill" style="width:${pct}%;background:var(--primary);"></div></div>
                                <span style="font-size:0.82em;font-weight:700;color:var(--primary);">${mySignedFields}/${myFields.length}</span>
                            </div>
                        </div>
                        ${!isComplete && !isExpired && pct === 100 ? `<button class="btn btn-success btn-sm" onclick="completeSign('${doc.id}')">אשר חתימה</button>` : ''}
                        ${!isComplete && !isExpired && pct < 100 ? `<span style="font-size:0.75em;color:var(--warning);font-weight:600;">לחץ על השדות במסמך</span>` : ''}
                    </div>
                    ${isComplete ? `<div style="text-align:center;color:var(--success);font-weight:700;padding:8px;">המסמך נחתם בהצלחה!</div>` : ''}
                ` : `
                    <!-- Sender/owner view: show all recipients -->
                    <h3 style="font-weight:700;font-size:0.95em;margin-bottom:14px;">נמענים (${(doc.recipients || []).filter(r => r.signed).length}/${(doc.recipients || []).length})</h3>
                    ${(doc.recipients || []).map(r => {
                        const c = DM.fieldColors[(r.colorIndex || 0) % DM.fieldColors.length];
                        const rFields = (doc.fields || []).filter(f => f.assigneeId === r.id);
                        const signed = rFields.filter(f => f.signedValue).length;
                        const rpct = rFields.length > 0 ? Math.round((signed / rFields.length) * 100) : 0;
                        return `<div class="recipient-status-card">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <span style="width:8px;height:8px;border-radius:50%;background:${c.fill};"></span>
                                <span style="font-weight:600;font-size:0.88em;flex:1;">${r.name || 'נמען'}</span>
                                ${r.signed ? '<span class="badge badge-success" style="font-size:0.65em;">חתם</span>' : `<span class="badge badge-warning" style="font-size:0.65em;">ממתין</span>`}
                            </div>
                            <div class="mini-progress"><div class="mini-progress-fill" style="width:${rpct}%;background:${c.fill};"></div></div>
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
                                <span style="font-size:0.72em;color:var(--text-light);">${signed}/${rFields.length} שדות</span>
                                ${!r.signed && r.phone ? `<button class="btn btn-ghost" style="font-size:0.68em;padding:2px 6px;display:flex;align-items:center;gap:3px;" onclick="event.stopPropagation();sendReminder('${doc.id}','${r.id}')">${ICO.bell} תזכורת</button>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                    ${doc.expiresAt ? `<div style="margin-top:12px;padding:8px;background:var(--warning-light);border-radius:8px;font-size:0.78em;color:var(--warning);font-weight:600;">תוקף: ${new Date(doc.expiresAt).toLocaleDateString('he-IL')}</div>` : ''}
                    <div style="margin-top:8px;padding:8px;background:var(--bg);border-radius:8px;">
                        <div style="font-size:0.72em;color:var(--text-light);margin-bottom:4px;">קישור לחתימה:</div>
                        <div style="display:flex;gap:4px;">
                            <input type="text" class="form-input" value="${signUrl}" readonly style="font-size:0.72em;padding:6px;direction:ltr;" onclick="this.select()">
                            <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${signUrl}');toast('הקישור הועתק!')">העתק</button>
                        </div>
                    </div>
                    ${!isComplete && !isExpired ? `<button class="btn btn-success" style="width:100%;margin-top:12px;" onclick="completeSign('${doc.id}')">אשר חתימה</button>` : ''}
                    ${isComplete ? `<button class="btn btn-primary" style="width:100%;margin-top:12px;" onclick="downloadSignedPDF('${doc.id}')">${ICO.download} הורד קובץ חתום</button>` : ''}
                `}
            </div>
        </div>
    </div>`;
    // Auto-highlight first unsigned field for signer
    if (!isComplete && !isExpired) {
        if (isSignerView && signerRecipient) {
            // Highlight first unsigned field of THIS signer
            const nextField = (doc.fields || []).find(f => f.assigneeId === signerRecipient.id && f.required && !f.fixed && !f.signedValue && !f.value);
            if (nextField) highlightNextFieldById(nextField.id);
        } else {
            highlightNextField(doc);
        }
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
        container.style.marginBottom = `-${docW * (1 - scale) * (container.scrollHeight / docW)}px`;
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

function sendReminder(docId, recipientId) {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) return;
    const r = (doc.recipients || []).find(x => String(x.id) === String(recipientId));
    if (!r || !r.phone) { toast('אין מספר טלפון', 'error'); return; }
    const phone = r.phone.replace(/[^0-9]/g, '');
    const intl = phone.startsWith('0') ? '972' + phone.substring(1) : phone;
    const signUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;
    const waMsg = `תזכורת: שלום ${r.name}, ממתין לחתימתך על "${doc.fileName}".\nקישור: ${signUrl}`;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(waMsg)}`, '_blank');
    addAudit(doc, 'reminder', `תזכורת נשלחה ל-${r.name}`);
    save(); syncDocToFirebase(doc);
    toast(`תזכורת נשלחה ל-${r.name}`);
}

// Download signed document as PDF
async function downloadSignedPDF(docId) {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc || !doc.docImage) { toast('אין מסמך להורדה', 'error'); return; }
    toast('מכין מסמך להורדה...', 'info');

    try {
        // Load main document image
        const img = await loadImage(doc.docImage);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Scale factor from displayed size (800px) to actual image size
        const scale = img.width / 800;

        // Pre-load all signature images first
        const sigFields = (doc.fields || []).filter(f => f.signatureData);
        const sigImages = {};
        await Promise.all(sigFields.map(async f => {
            try {
                sigImages[f.id] = await loadImage(f.signatureData);
            } catch(e) { /* skip failed loads */ }
        }));

        // Pre-load all file attachment images
        const fileFields = (doc.fields || []).filter(f => f.fileData);
        const fileImages = {};
        await Promise.all(fileFields.map(async f => {
            try {
                fileImages[f.id] = await loadImage(f.fileData);
            } catch(e) { /* skip failed loads */ }
        }));

        // Draw all field values on canvas - NO colored backgrounds, clean output
        (doc.fields || []).forEach(f => {
            const val = f.signedValue || f.value || '';
            if (!val && !f.signatureData && !f.fileData) return;
            const fx = f.x * scale, fy = f.y * scale, fw = f.w * scale, fh = f.h * scale;
            if (f.signatureData && sigImages[f.id]) {
                ctx.drawImage(sigImages[f.id], fx, fy, fw, fh);
            } else if (f.fileData && fileImages[f.id]) {
                ctx.drawImage(fileImages[f.id], fx, fy, fw, fh);
            } else if (val) {
                // Clean text without colored background
                ctx.fillStyle = '#1e293b';
                ctx.font = `bold ${14 * scale}px Heebo, Segoe UI, Arial, sans-serif`;
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'center';
                ctx.fillText(val, fx + fw / 2, fy + fh / 2, fw - 4);
            }
        });

        // Add completion watermark if completed
        if (doc.status === 'completed') {
            ctx.save();
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = '#16a34a';
            ctx.font = `bold ${80 * scale}px Arial`;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(-Math.PI / 6);
            ctx.textAlign = 'center';
            ctx.fillText('SIGNED', 0, 0);
            ctx.restore();
        }

        // Download as PNG
        const link = document.createElement('a');
        link.download = `${doc.fileName || 'signed-document'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast('הקובץ הורד!');
    } catch (err) {
        console.error('Download error:', err);
        toast('שגיאה בהורדת הקובץ', 'error');
    }
}

// Helper: load an image and return a promise
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
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
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) return;
    // Check expiration
    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
        toast('תוקף המסמך פג', 'error'); return;
    }
    const field = (doc.fields || []).find(f => f.id === fieldId);
    if (!field) return;

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
    } else if (field.type === 'checkbox') {
        field.signedValue = '✓';
        addAudit(doc, 'field_signed', `שדה "${field.label}" סומן`);
        save(); syncDocToFirebase(doc); render();
    } else {
        const val = prompt(field.label || 'הזן ערך:');
        if (val !== null && val.trim()) {
            field.signedValue = val.trim();
            addAudit(doc, 'field_signed', `שדה "${field.label}" מולא`);
            save(); syncDocToFirebase(doc); render();
        }
    }
    // Move to next unsigned field
    highlightNextField(doc);
}

function syncDocToFirebase(doc) {
    if (typeof firebaseUpdateDoc === 'function') {
        firebaseUpdateDoc(doc).catch(() => {});
    }
}

function openSignatureCanvas(docId, fieldId) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'signModal';
    overlay.innerHTML = `<div class="modal-card">
        <h3 style="font-weight:700;margin-bottom:12px;">חתימה דיגיטלית</h3>
        <p style="font-size:0.82em;color:var(--text-light);margin-bottom:12px;">חתום בתוך המסגרת:</p>
        <canvas id="signCanvas" class="sign-canvas" width="400" height="180"></canvas>
        <div style="display:flex;gap:8px;margin-top:14px;">
            <button class="btn btn-outline" style="flex:1;" onclick="clearSignCanvas()">נקה</button>
            <button class="btn btn-outline" style="flex:1;" onclick="cancelSignCanvas()">ביטול</button>
            <button class="btn btn-primary" style="flex:1;" onclick="confirmSignCanvas('${docId}',${JSON.stringify(fieldId)})">אשר</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);

    const canvas = document.getElementById('signCanvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

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
    window._signCanvas = canvas;
}

function clearSignCanvas() { const c = window._signCanvas; if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); }
function cancelSignCanvas() { const m = document.getElementById('signModal'); if (m) m.remove(); delete window._signCanvas; }
function confirmSignCanvas(docId, fieldId) {
    const c = window._signCanvas; if (!c) return;
    const doc = DM.docs.find(d => d.id === docId);
    if (doc) {
        const f = (doc.fields || []).find(x => x.id === fieldId);
        if (f) {
            f.signedValue = 'חתום';
            f.signatureData = c.toDataURL();
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
    const hint = field && field.value ? field.value : '';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'dateModal';
    overlay.innerHTML = `<div class="modal-card">
        <h3 style="font-weight:700;margin-bottom:12px;">בחירת תאריך</h3>
        ${hint ? `<p style="font-size:0.82em;color:var(--text-light);margin-bottom:12px;">${hint}</p>` : ''}
        <input type="date" id="datePickerInput" class="form-input" style="font-size:1.1em;padding:12px;text-align:center;">
        <div style="display:flex;gap:8px;margin-top:14px;">
            <button class="btn btn-outline" style="flex:1;" onclick="closeDatePicker()">ביטול</button>
            <button class="btn btn-primary" style="flex:1;" onclick="confirmDatePicker('${docId}',${JSON.stringify(fieldId)})">אישור</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
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
    const hint = field && field.value ? field.value : 'צלם או בחר קובץ תמונה';
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
            <button class="btn btn-primary" style="flex:1;" id="confirmFileBtn" disabled onclick="confirmFilePicker('${docId}',${JSON.stringify(fieldId)})">אישור</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
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
                preview.innerHTML = `<div style="padding:16px;background:var(--bg);border-radius:8px;font-size:0.88em;font-weight:600;">${file.name}</div>`;
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
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) return;
    // Check expiration
    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
        toast('תוקף המסמך פג', 'error'); return;
    }
    const isSignerView = !!DM._currentSigner;
    const signerRecipient = isSignerView ? (doc.recipients || []).find(r => r.name && DM._currentSigner && r.name.trim() === DM._currentSigner.trim()) : null;

    if (isSignerView && signerRecipient) {
        // Signer view: only check THIS signer's required fields
        const myUnfilled = (doc.fields || []).filter(f => f.assigneeId === signerRecipient.id && f.required && !f.fixed && !f.signedValue && !f.value);
        if (myUnfilled.length > 0) { toast(`נותרו ${myUnfilled.length} שדות חובה`, 'error'); return; }
        // Mark only this recipient as signed
        signerRecipient.signed = true;
        signerRecipient.signedAt = new Date().toISOString();
        addAudit(doc, 'signed', `${DM._currentSigner} חתם/ה על המסמך`);
        // Check if ALL recipients have signed
        const allSigned = (doc.recipients || []).every(r => r.signed);
        if (allSigned) {
            doc.status = 'completed';
            doc.completedAt = new Date().toISOString();
            addAudit(doc, 'completed', 'כל הנמענים חתמו - המסמך הושלם');
        }
    } else {
        // Sender/owner view: check all required fields
        const unfilled = (doc.fields || []).filter(f => f.required && !f.fixed && !f.signedValue && !f.value);
        if (unfilled.length > 0) { toast(`נותרו ${unfilled.length} שדות חובה`, 'error'); return; }
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
        emailNotifyOwner(doc, sName, { filled: signedF, total: totalF, allDone });
    }
    if (isSignerView && DM._currentSignerEmail && typeof emailNotifySigner === 'function') {
        emailNotifySigner(doc, DM._currentSigner, DM._currentSignerEmail);
    }

    if (isSignerView) {
        // Stay on the sign view to show completion
        render();
    } else {
        DM._currentSigner = null;
        DM._currentSignerEmail = null;
        switchView('dashboard');
    }
}

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('hidden');
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.add('hidden');
}

// Close mobile menu when clicking outside
document.addEventListener('click', e => {
    const menu = document.getElementById('mobileMenu');
    const btn = document.getElementById('mobileMenuBtn');
    if (menu && btn && !menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.add('hidden');
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
function checkUrlHash() {
    const hash = location.hash;
    if (hash.startsWith('#sign/')) {
        const docId = hash.substring(6);
        const doc = DM.docs.find(d => d.id === docId);
        if (doc) {
            openSign(docId);
            return true;
        }
        // Document not in localStorage - try loading from Firebase
        if (typeof firebaseLoadDoc === 'function') {
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

// ==================== AUTH STATE ====================
function onAuthStateChanged(user) {
    const loginScreen = document.getElementById('loginScreen');
    const topbar = document.querySelector('.topbar');
    const mainContent = document.getElementById('mainContent');
    const userMenu = document.getElementById('userMenu');

    // Signing links should work without auth
    const hash = window.location.hash;
    const isSignLink = hash.startsWith('#sign/');

    if (user) {
        // User is logged in
        smoovCurrentUser = user;
        loginScreen.style.display = 'none';
        topbar.style.display = '';
        mainContent.style.display = '';

        // Update user menu
        const avatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        avatar.src = user.photoURL || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%232563eb"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>');
        userName.textContent = user.displayName || 'משתמש';
        userEmail.textContent = user.email || '';
        userMenu.style.display = '';

        if (!checkUrlHash()) render();
    } else if (isSignLink) {
        // Allow signing without login
        loginScreen.style.display = 'none';
        topbar.style.display = 'none';
        mainContent.style.display = '';
        userMenu.style.display = 'none';
        checkUrlHash();
    } else {
        // Not logged in - show login screen
        loginScreen.style.display = 'flex';
        topbar.style.display = 'none';
        mainContent.style.display = 'none';
        userMenu.style.display = 'none';
    }
}

// Init: hide app until auth resolves
document.querySelector('.topbar').style.display = 'none';
document.getElementById('mainContent').style.display = 'none';

// Initialize Firebase (auth listener will handle the rest)
if (typeof initSmoovFirebase === 'function') initSmoovFirebase();
if (typeof initSmoovEmail === 'function') initSmoovEmail();

window.addEventListener('hashchange', () => { checkUrlHash(); });
