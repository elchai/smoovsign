/**
 * SmoovSign Webhook -> Google Sheets
 *
 * הוראות התקנה:
 * 1. פתח Google Sheet חדש (או קיים)
 * 2. Extensions > Apps Script
 * 3. העתק את הקוד הזה לתוך Code.gs
 * 4. שנה את SHEET_ID למטה
 * 5. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. העתק את ה-URL שמתקבל ושים אותו כ-webhookUrl ב-SDK
 *
 * מה זה עושה:
 * - מקבל POST מ-SmoovSign כשמסמך נחתם
 * - מוסיף שורה לגיליון עם כל הנתונים
 * - שומר חתימות כתמונות ב-Google Drive ומקשר אליהן
 */

// ========== הגדרות ==========
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // שנה לID של הגיליון שלך
const SHEET_NAME = 'תוצאות'; // שם הטאב בגיליון
const SIGNATURES_FOLDER_NAME = 'SmoovSign Signatures'; // תיקייה בדרייב לחתימות

// ========== קוד ==========

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME)
      || SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

    // Create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = buildHeaders(data);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }

    // Build data row
    const row = buildRow(data, sheet);
    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('Error: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Also handle GET for testing
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'SmoovSign webhook is active. Send POST to submit data.'
  })).setMimeType(ContentService.MimeType.JSON);
}

function buildHeaders(data) {
  const headers = ['תאריך השלמה', 'מזהה מסמך', 'שם קובץ', 'שם חותם', 'אימייל', 'טלפון', 'קישור'];

  // Add prefill data columns
  if (data.prefillData) {
    Object.keys(data.prefillData).forEach(key => {
      if (!headers.includes(key)) headers.push(key);
    });
  }

  // Add field columns
  if (data.fields) {
    Object.keys(data.fields).forEach(key => {
      const colName = key.includes('חתימה') || key === 'signature' ? key + ' (קישור)' : key;
      if (!headers.includes(colName)) headers.push(colName);
    });
  }

  // Add meta columns
  if (data.meta) {
    Object.keys(data.meta).forEach(key => {
      if (!headers.includes(key)) headers.push(key);
    });
  }

  return headers;
}

function buildRow(data, sheet) {
  const recipient = (data.recipients && data.recipients[0]) || {};
  const row = [
    data.completedAt ? new Date(data.completedAt) : new Date(),
    data.docId || '',
    data.fileName || '',
    recipient.name || '',
    recipient.email || '',
    recipient.phone || '',
    data.signUrl || ''
  ];

  // Add prefill data values
  if (data.prefillData) {
    Object.values(data.prefillData).forEach(val => row.push(val || ''));
  }

  // Add field values (save signatures as images)
  if (data.fields) {
    Object.entries(data.fields).forEach(([key, val]) => {
      if (val && typeof val === 'string' && val.startsWith('data:image')) {
        // Save signature/image to Google Drive and put link in sheet
        const url = saveSignatureImage(val, data.docId, key);
        row.push(url);
      } else {
        row.push(val || '');
      }
    });
  }

  // Add meta values
  if (data.meta) {
    Object.values(data.meta).forEach(val => row.push(val || ''));
  }

  return row;
}

function saveSignatureImage(base64Data, docId, fieldName) {
  try {
    // Get or create signatures folder
    const folders = DriveApp.getFoldersByName(SIGNATURES_FOLDER_NAME);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(SIGNATURES_FOLDER_NAME);

    // Extract mime type and data
    const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return 'Invalid image data';

    const mimeType = match[1];
    const ext = mimeType.split('/')[1] || 'png';
    const decoded = Utilities.base64Decode(match[2]);
    const blob = Utilities.newBlob(decoded, mimeType, `${docId}_${fieldName}.${ext}`);

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log('Save signature error: ' + err.message);
    return 'Error saving image';
  }
}

/**
 * Optional: Generate a PDF from the signed document data
 * Call this manually or add to doPost if you want automatic PDF generation
 */
function generateSignedPDF(data) {
  try {
    const folders = DriveApp.getFoldersByName(SIGNATURES_FOLDER_NAME);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(SIGNATURES_FOLDER_NAME);

    const recipient = (data.recipients && data.recipients[0]) || {};
    const html = buildPdfHtml(data, recipient);

    const blob = HtmlService.createHtmlOutput(html).getBlob().setName(
      `${data.fileName || 'document'}_${recipient.name || 'signed'}.pdf`
    );
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log('PDF generation error: ' + err.message);
    return null;
  }
}

function buildPdfHtml(data, recipient) {
  let fieldsHtml = '';
  if (data.fields) {
    Object.entries(data.fields).forEach(([key, val]) => {
      if (val && typeof val === 'string' && val.startsWith('data:image')) {
        fieldsHtml += `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${key}</td>
          <td style="padding:8px;border:1px solid #ddd;"><img src="${val}" style="max-height:80px;"></td></tr>`;
      } else {
        fieldsHtml += `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${key}</td>
          <td style="padding:8px;border:1px solid #ddd;">${val || '-'}</td></tr>`;
      }
    });
  }

  let prefillHtml = '';
  if (data.prefillData) {
    Object.entries(data.prefillData).forEach(([key, val]) => {
      prefillHtml += `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${key}</td>
        <td style="padding:8px;border:1px solid #ddd;">${val || '-'}</td></tr>`;
    });
  }

  return `<!DOCTYPE html>
<html dir="rtl">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; direction: rtl; padding: 40px; }
  h1 { color: #2563eb; font-size: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
</style></head>
<body>
  <h1>${data.fileName || 'מסמך חתום'}</h1>
  <div class="meta">
    <div>חותם: ${recipient.name || '-'}</div>
    <div>תאריך: ${data.completedAt ? new Date(data.completedAt).toLocaleDateString('he-IL') : '-'}</div>
    <div>מזהה: ${data.docId || '-'}</div>
  </div>
  ${prefillHtml ? '<h2>פרטים</h2><table>' + prefillHtml + '</table>' : ''}
  <h2>שדות שמולאו</h2>
  <table>${fieldsHtml}</table>
</body></html>`;
}
