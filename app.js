// ==================== Smoov - Digital Signature App ====================
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
        { bg: '#dbeafe', border: '#3b82f6', text: '#2563eb', fill: '#3b82f6' },
        { bg: '#f3e8ff', border: '#a855f7', text: '#9333ea', fill: '#a855f7' },
        { bg: '#dcfce7', border: '#22c55e', text: '#16a34a', fill: '#22c55e' },
        { bg: '#ffedd5', border: '#f97316', text: '#ea580c', fill: '#f97316' }
    ]
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
    const main = document.getElementById('mainContent');
    if (DM.view === 'dashboard') renderDashboard(main);
    else if (DM.view === 'templates') renderTemplates(main);
    else if (DM.view === 'create') renderWizard(main);
    else if (DM.view === 'sign') renderSignView(main);
}

// ==================== DASHBOARD ====================
function renderDashboard(el) {
    const docs = DM.docs.slice().reverse();
    const total = docs.length;
    const completed = docs.filter(d => (d.recipients || []).every(r => r.signed)).length;
    const pending = total - completed;

    el.innerHTML = `<div class="dashboard">
        <div class="dashboard-header">
            <h1>המסמכים שלי</h1>
        </div>
        <div class="dashboard-stats">
            <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">סה"כ מסמכים</div></div>
            <div class="stat-card"><div class="stat-num" style="color:var(--warning)">${pending}</div><div class="stat-label">ממתינים</div></div>
            <div class="stat-card"><div class="stat-num" style="color:var(--success)">${completed}</div><div class="stat-label">הושלמו</div></div>
            <div class="stat-card"><div class="stat-num" style="color:var(--primary)">${DM.templates.length}</div><div class="stat-label">תבניות</div></div>
        </div>
        ${docs.length === 0 ? `
            <div class="empty-state">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h2>אין מסמכים עדיין</h2>
                <p>צור מסמך חדש או השתמש בתבנית קיימת</p>
                <button class="btn btn-primary btn-lg" onclick="newDocument()">+ צור מסמך חדש</button>
            </div>
        ` : `<div class="doc-list">${docs.map(d => renderDocCard(d)).join('')}</div>`}
    </div>`;
}

function renderDocCard(doc) {
    const signedCount = (doc.recipients || []).filter(r => r.signed).length;
    const totalR = (doc.recipients || []).length;
    const pct = totalR > 0 ? Math.round((signedCount / totalR) * 100) : 0;
    const statusClass = pct === 100 ? 'status-complete' : pct > 0 ? 'status-pending' : 'status-waiting';
    const statusText = pct === 100 ? 'הושלם' : pct > 0 ? 'בתהליך' : 'ממתין';
    const statusColor = pct === 100 ? 'var(--success)' : pct > 0 ? 'var(--warning)' : 'var(--text-muted)';
    const created = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('he-IL') : '';

    return `<div class="doc-card" onclick="openSign('${doc.id}')">
        <div class="doc-thumb">${doc.docImage ? `<img src="${doc.docImage}" alt="">` : ''}</div>
        <div class="doc-info">
            <h3>${doc.fileName || 'מסמך ללא שם'}</h3>
            <div class="doc-meta">${created}${doc.createdBy ? ' · ' + doc.createdBy : ''} · ${totalR} נמענים</div>
            <div class="doc-progress">
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${statusColor}"></div></div>
                <span class="doc-status ${statusClass}">${statusText} (${signedCount}/${totalR})</span>
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
                <p>צור תבנית עם שדות קבועים ודינמיים - חוסך זמן בכל שליחה!</p>
                <button class="btn btn-primary btn-lg" onclick="newTemplate()">+ צור תבנית</button>
            </div>
        ` : `<div class="doc-list">${DM.templates.map(t => `
            <div class="template-card">
                <div class="template-icon" style="background:var(--primary-light);">📄</div>
                <div class="doc-info">
                    <h3>${t.name || 'תבנית ללא שם'}</h3>
                    <div class="doc-meta">${t.fields ? t.fields.length + ' שדות' : ''} · ${t.fixedFields ? t.fixedFields.filter(f => f.value).length + ' שדות קבועים' : ''}</div>
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
        <p style="color:var(--text-light);margin-bottom:24px;">${DM.isTemplate ? 'העלה את המסמך שישמש כתבנית. שדות קבועים ימולאו מראש.' : 'העלה מסמך PDF או תמונה להחתמה'}</p>
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

function processFile(file) {
    DM.fileName = file.name.replace(/\.\w+$/, '');
    if (file.type === 'application/pdf') {
        if (!window.pdfjsLib) { toast('PDF.js לא נטען', 'error'); return; }
        const dz = document.getElementById('dropzone');
        if (dz) dz.innerHTML = '<div style="text-align:center"><div style="width:24px;height:24px;border:3px solid var(--primary);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 10px;"></div>טוען PDF...</div>';
        file.arrayBuffer().then(buf => window.pdfjsLib.getDocument({ data: buf }).promise)
            .then(pdf => pdf.getPage(1))
            .then(page => {
                const vp = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                canvas.width = vp.width; canvas.height = vp.height;
                return page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise.then(() => canvas);
            })
            .then(canvas => { DM.docImage = canvas.toDataURL(); render(); })
            .catch(() => { toast('שגיאה בטעינת PDF', 'error'); render(); });
    } else {
        const reader = new FileReader();
        reader.onload = ev => { DM.docImage = ev.target.result; render(); };
        reader.readAsDataURL(file);
    }
}

function clearDoc() { DM.docImage = null; DM.fileName = ''; DM.fields = []; render(); }

// ==================== STEP 2: RECIPIENTS ====================
function renderRecipients(el) {
    // Try to load soldiers from parent battalion-scheduler
    const parentState = JSON.parse(localStorage.getItem('battalionState_v2') || '{}');
    const soldiers = parentState.soldiers || [];

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
        ${soldiers.length > 0 ? `
            <div class="soldier-picker">
                <label class="form-label" style="font-size:0.88em;font-weight:700;">הוסף חיילים מהמערכת</label>
                <input type="text" class="form-input" placeholder="חפש חייל..." value="${DM.recipientSearch}" oninput="DM.recipientSearch=this.value;renderSoldierChips()">
                <div class="soldier-chips" id="soldierChips">
                    ${renderSoldierChipsHTML(soldiers)}
                </div>
            </div>` : ''}
    </div>`;
}

function renderSoldierChipsHTML(soldiers) {
    if (!soldiers) {
        const parentState = JSON.parse(localStorage.getItem('battalionState_v2') || '{}');
        soldiers = parentState.soldiers || [];
    }
    let filtered = soldiers;
    if (DM.recipientSearch) filtered = filtered.filter(s => s.name.includes(DM.recipientSearch));
    const existing = new Set(DM.recipients.filter(r => r.soldierId).map(r => r.soldierId));
    return filtered.slice(0, 30).map(s => {
        const added = existing.has(s.id);
        return `<span class="chip ${added ? 'added' : ''}" onclick="${added ? '' : `addSoldierRecipient('${s.id}')`}">${added ? '✓ ' : ''}${s.name}</span>`;
    }).join('') + (filtered.length > 30 ? `<span style="font-size:0.78em;color:var(--text-light);padding:4px;">...ועוד ${filtered.length - 30}</span>` : '');
}

function renderSoldierChips() {
    const el = document.getElementById('soldierChips');
    if (el) el.innerHTML = renderSoldierChipsHTML();
}

function addRecipient() {
    DM.recipients.push({ id: Date.now(), name: '', phone: '', colorIndex: DM.recipients.length % 4, type: 'other' });
    render();
}

function addSoldierRecipient(soldierId) {
    const parentState = JSON.parse(localStorage.getItem('battalionState_v2') || '{}');
    const sol = (parentState.soldiers || []).find(s => s.id === soldierId);
    if (!sol) return;
    if (DM.recipients.find(r => r.soldierId === soldierId)) { toast('נמען כבר קיים', 'error'); return; }
    DM.recipients.push({ id: Date.now(), name: sol.name, phone: sol.phone || '', colorIndex: DM.recipients.length % 4, type: 'soldier', soldierId });
    render();
    toast(`${sol.name} נוסף`);
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
function renderFieldEditor(el) {
    if (!DM.activeRecipientId && DM.recipients.length) DM.activeRecipientId = DM.recipients[0].id;
    const selField = DM.fields.find(f => f.id === DM.selectedFieldId);

    el.innerHTML = `<div class="editor">
        <!-- Left: Props or Thumbnail -->
        <div class="editor-sidebar">
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
            <div class="doc-container" id="docContainer">
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
                        <button class="btn btn-sm ${!DM._fieldFixed ? 'btn-primary' : 'btn-outline'}" onclick="DM._fieldFixed=false;" style="flex:1;">דינמי (לחייל)</button>
                        <button class="btn btn-sm ${DM._fieldFixed ? 'btn-primary' : 'btn-outline'}" onclick="DM._fieldFixed=true;" style="flex:1;">קבוע (מ"פ)</button>
                    </div>
                ` : `
                    <div class="form-label" style="margin-bottom:6px;">הוסף שדה עבור</div>
                    <select class="form-input" onchange="DM.activeRecipientId=Number(this.value)" style="font-weight:700;color:var(--primary);background:var(--primary-light);border-color:#93c5fd;">
                        ${DM.recipients.map(r => `<option value="${r.id}" ${r.id === DM.activeRecipientId ? 'selected' : ''}>${r.name || 'נמען ' + (DM.recipients.indexOf(r) + 1)}</option>`).join('')}
                    </select>`}
            </div>
            <div class="tools-grid">
                ${toolBtn('text', 'טקסט', 'T')}
                ${toolBtn('signature', 'חתימה', '✍')}
                ${toolBtn('date', 'תאריך', '📅')}
                ${toolBtn('number', 'מספר', '#')}
                ${toolBtn('fullname', 'שם מלא', '👤')}
                ${toolBtn('id_number', 'ת.ז.', '🪪')}
                ${toolBtn('checkbox', 'סימון', '☑')}
                ${toolBtn('stamp', 'חותמת', '✓')}
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
                    <option value="date" ${f.type === 'date' ? 'selected' : ''}>תאריך</option>
                    <option value="number" ${f.type === 'number' ? 'selected' : ''}>מספר</option>
                    <option value="fullname" ${f.type === 'fullname' ? 'selected' : ''}>שם מלא</option>
                    <option value="id_number" ${f.type === 'id_number' ? 'selected' : ''}>תעודת זהות</option>
                    <option value="checkbox" ${f.type === 'checkbox' ? 'selected' : ''}>תיבת סימון</option>
                </select>
            </div>
            ${DM.isTemplate ? `<div class="form-group">
                <label style="display:flex;align-items:center;gap:6px;font-size:0.85em;cursor:pointer;">
                    <input type="checkbox" ${f.fixed ? 'checked' : ''} onchange="updateField(${f.id},'fixed',this.checked)">
                    <strong>שדה קבוע</strong> (ערך לא ישתנה)
                </label>
            </div>` : ''}
            <div class="form-group">
                <label class="form-label">${f.fixed ? 'ערך קבוע' : 'ערך ברירת מחדל'}</label>
                <input type="text" class="form-input" value="${f.value || ''}" onchange="updateField(${f.id},'value',this.value)" placeholder="${f.fixed ? 'הזן ערך שימולא אוטומטית...' : 'מה יוצג בשדה...'}">
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
    const typeLabels = { signature: 'חתימה', date: 'תאריך', fullname: 'שם מלא', id_number: 'ת.ז.', checkbox: '☑', stamp: '✓' };
    const displayText = f.value || typeLabels[f.type] || f.label || 'טקסט';
    const fixedBadge = f.fixed ? ' 🔒' : '';

    return `<div class="field-box ${selected ? 'selected' : ''}" data-fid="${f.id}"
        style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;z-index:${selected ? 20 : 10};"
        onmousedown="fieldMouseDown(event,${f.id})" ontouchstart="fieldTouchStart(event,${f.id})"
        onclick="event.stopPropagation();selectField(${f.id})" ondblclick="event.stopPropagation();editFieldInline(${f.id})">
        ${selected ? `
            <div class="field-label-tag" style="background:${c.fill};">${f.label}${f.required ? ' *' : ''}${fixedBadge}</div>
            <div class="field-toolbar">
                <button onclick="event.stopPropagation();editFieldInline(${f.id})" title="ערוך">✏️</button>
                <button onclick="event.stopPropagation();deleteField(${f.id})" title="מחק">🗑️</button>
                <button onclick="event.stopPropagation();duplicateField(${f.id})" title="שכפל">📋</button>
            </div>
            <div class="resize-handle" style="top:-4px;left:-4px;border-color:${c.fill};cursor:nw-resize;" onmousedown="resizeMouseDown(event,${f.id},'nw')"></div>
            <div class="resize-handle" style="top:-4px;right:-4px;border-color:${c.fill};cursor:ne-resize;" onmousedown="resizeMouseDown(event,${f.id},'ne')"></div>
            <div class="resize-handle" style="bottom:-4px;left:-4px;border-color:${c.fill};cursor:sw-resize;" onmousedown="resizeMouseDown(event,${f.id},'sw')"></div>
            <div class="resize-handle" style="bottom:-4px;right:-4px;border-color:${c.fill};cursor:se-resize;" onmousedown="resizeMouseDown(event,${f.id},'se')"></div>
        ` : ''}
        <div class="field-inner" ${selected ? `style="background:${c.bg};border-color:${c.border};color:${c.text};"` : ''}>
            <span style="padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${displayText}${fixedBadge}</span>
        </div>
    </div>`;
}

// ==================== FIELD ACTIONS ====================
function addField(type, label) {
    const container = document.getElementById('docContainer');
    const cw = container ? container.offsetWidth : 800;
    const ch = container ? container.offsetHeight : 1130;
    const assignee = DM.recipients.find(r => r.id === DM.activeRecipientId) || DM.recipients[0];
    const defaultW = type === 'signature' ? 160 : type === 'checkbox' ? 30 : 140;
    const defaultH = type === 'signature' ? 50 : type === 'checkbox' ? 30 : 32;

    const f = {
        id: Date.now() + Math.random(),
        type, label, value: '',
        x: (cw * 0.3) + (DM.fields.length * 15) % 100,
        y: (ch * 0.15) + (DM.fields.length * 25) % 200,
        w: defaultW, h: defaultH,
        required: true,
        assigneeId: assignee ? assignee.id : null,
        fixed: DM.isTemplate ? (DM._fieldFixed || false) : false
    };
    DM.fields.push(f);
    DM.selectedFieldId = f.id;
    render();
}

function selectField(id) { DM.selectedFieldId = id; render(); }
function deselectField(e) {
    if (e.target.id === 'canvasArea' || e.target.classList.contains('doc-container') || e.target.tagName === 'IMG' || e.target.classList.contains('fields-layer')) {
        DM.selectedFieldId = null; render();
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
    if (f.type === 'date') { f.value = new Date().toLocaleDateString('he-IL'); render(); }
    else if (f.type === 'checkbox') { f.value = f.value ? '' : '✓'; render(); }
    else { const v = prompt(f.label || 'הזן ערך:', f.value || ''); if (v !== null) { f.value = v; render(); } }
}

// ==================== DRAG & RESIZE ====================
function fieldMouseDown(e, id) {
    if (e.target && e.target.closest && e.target.closest('.resize-handle')) return;
    if (e.stopPropagation) e.stopPropagation();
    const container = document.getElementById('docContainer');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const f = DM.fields.find(x => x.id === id);
    if (!f) return;
    DM.dragItem = f;
    DM.dragOffset = { x: e.clientX - (rect.left + f.x), y: e.clientY - (rect.top + f.y) };
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
        const dx = e.clientX - DM.resizeStart.x;
        const dy = e.clientY - DM.resizeStart.y;
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
        const nx = Math.max(0, Math.min(e.clientX - rect.left - DM.dragOffset.x, rect.width - 20));
        const ny = Math.max(0, Math.min(e.clientY - rect.top - DM.dragOffset.y, rect.height - 20));
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
    if (DM.fields.length === 0) { toast('יש להוסיף לפחות שדה אחד', 'error'); return; }
    const doc = {
        id: 'dm_' + Date.now(),
        fileName: DM.fileName,
        docImage: DM.docImage,
        recipients: JSON.parse(JSON.stringify(DM.recipients)),
        fields: JSON.parse(JSON.stringify(DM.fields)),
        status: 'sent',
        createdAt: new Date().toISOString(),
        createdBy: ''
    };
    DM.docs.push(doc);
    save();

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
    DM.view = 'sign';
    render();
}

function renderSignView(el) {
    const doc = DM.docs.find(d => d.id === DM.signDocId);
    if (!doc) { switchView('dashboard'); return; }

    el.innerHTML = `<div class="wizard">
        <div class="sign-header">
            <button class="btn btn-ghost" onclick="switchView('dashboard')">← חזרה</button>
            <h3 style="font-weight:700;">${doc.fileName || 'מסמך'}</h3>
            <div style="width:80px;"></div>
        </div>
        <div class="sign-body">
            <div class="sign-doc">
                <div class="doc-container" style="width:800px;">
                    ${doc.docImage ? `<img src="${doc.docImage}" alt="">` : ''}
                    ${(doc.fields || []).map(f => {
                        const assignee = (doc.recipients || []).find(r => r.id === f.assigneeId);
                        const ci = assignee ? assignee.colorIndex : 0;
                        const c = DM.fieldColors[ci % DM.fieldColors.length];
                        const val = f.signedValue || f.value || '';
                        const canSign = !val && !f.fixed;
                        return `<div class="sign-field ${canSign ? 'mine' : ''}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px;
                            ${val ? `background:${c.bg};border:1px solid ${c.border};` : canSign ? `background:${c.bg}80;border:2px solid ${c.border};` : `background:rgba(200,200,200,0.3);border:1px dashed #ccc;`}"
                            ${canSign ? `onclick="signField('${doc.id}',${JSON.stringify(f.id).replace(/"/g, '&quot;')})"` : ''}>
                            ${val ? `<span style="font-size:0.82em;font-weight:600;color:${c.text};padding:0 4px;">${val}</span>` :
                              canSign ? `<span style="font-size:0.75em;color:${c.text};font-weight:600;">לחץ למלא</span>` :
                              f.fixed && f.value ? `<span style="font-size:0.82em;color:${c.text};padding:0 4px;">${f.value}</span>` :
                              `<span style="font-size:0.75em;color:#aaa;">${f.label}</span>`}
                        </div>`;
                    }).join('')}
                </div>
            </div>
            <div class="sign-sidebar">
                <h3 style="font-weight:700;font-size:0.95em;margin-bottom:14px;">סטטוס</h3>
                ${(doc.recipients || []).map(r => {
                    const c = DM.fieldColors[(r.colorIndex || 0) % DM.fieldColors.length];
                    const myFields = (doc.fields || []).filter(f => f.assigneeId === r.id);
                    const signed = myFields.filter(f => f.signedValue).length;
                    return `<div style="padding:10px;background:var(--bg);border-radius:8px;margin-bottom:8px;border:1px solid var(--border);">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                            <span style="width:8px;height:8px;border-radius:50%;background:${c.fill};"></span>
                            <span style="font-weight:600;font-size:0.88em;">${r.name || 'נמען'}</span>
                            ${r.signed ? '<span style="color:var(--success);font-size:0.72em;font-weight:700;">✓ חתם</span>' : ''}
                        </div>
                        <div style="font-size:0.72em;color:var(--text-light);">שדות: ${signed}/${myFields.length}</div>
                    </div>`;
                }).join('')}
                <button class="btn btn-success" style="width:100%;margin-top:12px;" onclick="completeSign('${doc.id}')">אשר חתימה</button>
            </div>
        </div>
    </div>`;
}

function signField(docId, fieldId) {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) return;
    const field = (doc.fields || []).find(f => f.id === fieldId);
    if (!field) return;

    if (field.type === 'signature') {
        openSignatureCanvas(docId, fieldId);
    } else if (field.type === 'date') {
        field.signedValue = new Date().toLocaleDateString('he-IL');
        save(); render();
    } else if (field.type === 'checkbox') {
        field.signedValue = '✓';
        save(); render();
    } else {
        const val = prompt(field.label || 'הזן ערך:');
        if (val !== null && val.trim()) { field.signedValue = val.trim(); save(); render(); }
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
    if (doc) { const f = (doc.fields || []).find(x => x.id === fieldId); if (f) { f.signedValue = '✍ חתום'; save(); } }
    cancelSignCanvas(); render();
}

function completeSign(docId) {
    const doc = DM.docs.find(d => d.id === docId);
    if (!doc) return;
    // Check unfilled required fields
    const unfilled = (doc.fields || []).filter(f => f.required && !f.fixed && !f.signedValue && !f.value);
    if (unfilled.length > 0) { toast(`נותרו ${unfilled.length} שדות חובה`, 'error'); return; }
    // Mark all recipients as signed
    (doc.recipients || []).forEach(r => { r.signed = true; r.signedAt = new Date().toISOString(); });
    save();
    toast('החתימה אושרה!');
    switchView('dashboard');
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
    if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) {
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
    }
    return false;
}

if (!checkUrlHash()) render();
window.addEventListener('hashchange', () => { checkUrlHash(); });
