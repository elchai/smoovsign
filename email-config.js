// ==================== SMOOVSIGN EMAIL NOTIFICATIONS (EmailJS) ====================
// Send email notifications when documents are signed
//
// SETUP INSTRUCTIONS:
// 1. Go to https://www.emailjs.com and create a free account
// 2. Add an Email Service (Gmail recommended) - get your SERVICE_ID
// 3. Create 2 Email Templates (see template content below) - get TEMPLATE_IDs
// 4. Copy your Public Key from Account > API Keys
// 5. Fill in the 4 values below

const SMOOV_EMAIL = {
    enabled: false, // ← Change to true after setup
    publicKey: '',   // ← Your EmailJS Public Key
    serviceId: '',   // ← Your EmailJS Service ID
    templateOwner: '', // ← Template ID for owner notification
    templateSigner: '', // ← Template ID for signer copy
    ownerEmail: '',  // ← Your email (document owner)
    ownerName: 'SmoovSign', // ← Your name
};

// ==================== EMAIL TEMPLATE CONTENT ====================
// Create these 2 templates at: https://dashboard.emailjs.com/admin/templates
//
// --- TEMPLATE 1: Owner Notification (templateOwner) ---
// Subject: חתימה חדשה על "{{doc_name}}"
// Content:
//   שלום {{owner_name}},
//
//   {{signer_name}} חתם/ה על המסמך "{{doc_name}}".
//
//   שדות שמולאו: {{fields_filled}}/{{fields_total}}
//   סטטוס: {{status}}
//   זמן: {{time}}
//
//   לצפייה במסמך: {{doc_link}}
//
//   SmoovSign - חתימה דיגיטלית
//
// To: {{owner_email}}
//
// --- TEMPLATE 2: Signer Copy (templateSigner) ---
// Subject: העתק חתימתך - "{{doc_name}}"
// Content:
//   שלום {{signer_name}},
//
//   חתימתך על המסמך "{{doc_name}}" נקלטה בהצלחה.
//
//   שדות שמולאו: {{fields_filled}}/{{fields_total}}
//   זמן: {{time}}
//
//   לצפייה במסמך: {{doc_link}}
//
//   SmoovSign - חתימה דיגיטלית
//
// To: {{signer_email}}

// ==================== INIT ====================
function initSmoovEmail() {
    if (!SMOOV_EMAIL.enabled || !SMOOV_EMAIL.publicKey) return false;
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS SDK not loaded');
        return false;
    }
    try {
        emailjs.init(SMOOV_EMAIL.publicKey);
        console.log('SmoovSign EmailJS initialized');
        return true;
    } catch (err) {
        console.warn('EmailJS init failed:', err);
        return false;
    }
}

// Send notification to document owner when someone signs
async function emailNotifyOwner(doc, signerName, fieldsInfo) {
    if (!SMOOV_EMAIL.enabled || !SMOOV_EMAIL.ownerEmail) return false;
    try {
        const signUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;
        await emailjs.send(SMOOV_EMAIL.serviceId, SMOOV_EMAIL.templateOwner, {
            owner_name: SMOOV_EMAIL.ownerName,
            owner_email: SMOOV_EMAIL.ownerEmail,
            signer_name: signerName,
            doc_name: doc.fileName || 'מסמך',
            fields_filled: fieldsInfo.filled,
            fields_total: fieldsInfo.total,
            status: fieldsInfo.allDone ? 'הושלם' : 'בתהליך',
            time: new Date().toLocaleString('he-IL'),
            doc_link: signUrl,
        });
        console.log('Owner email sent');
        return true;
    } catch (err) {
        console.warn('Owner email failed:', err);
        return false;
    }
}

// Send copy to signer after they complete signing
async function emailNotifySigner(doc, signerName, signerEmail) {
    if (!SMOOV_EMAIL.enabled || !signerEmail) return false;
    try {
        const totalFields = (doc.fields || []).filter(f => !f.fixed).length;
        const signedFields = (doc.fields || []).filter(f => f.signedValue).length;
        const signUrl = `${location.origin}${location.pathname}#sign/${doc.id}`;
        await emailjs.send(SMOOV_EMAIL.serviceId, SMOOV_EMAIL.templateSigner, {
            signer_name: signerName,
            signer_email: signerEmail,
            doc_name: doc.fileName || 'מסמך',
            fields_filled: signedFields,
            fields_total: totalFields,
            time: new Date().toLocaleString('he-IL'),
            doc_link: signUrl,
        });
        console.log('Signer email sent');
        return true;
    } catch (err) {
        console.warn('Signer email failed:', err);
        return false;
    }
}
