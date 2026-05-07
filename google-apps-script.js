// Google Apps Script code for FieldExpense Tracker (PettyCash Pro)
// To use this:
// 1. Go to sheets.google.com and create a new Google Sheet.
// 2. Go to Extensions -> Apps Script.
// 3. Paste this code into the editor, replacing any existing code.
// 4. Click Deploy -> New Deployment.
// 5. Select "Web App".
// 6. Set "Execute as" to "Me" and "Who has access" to "Anyone".
// 7. Click Deploy, authorize the app, and copy the Web App URL.
// 8. Paste the Web App URL in the FieldExpense Tracker settings page.

const SHEET_NAME = 'Data';

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Setup headers
    sheet.appendRow(['Data', 'Last Updated']);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    if (action === 'push') {
      const data = payload.data; // Array of tasks
      
      // Since it's a JSON array, we can store it beautifully or as a JSON string.
      // To ensure data safety logic (append only), we will just append the full JSON snapshot on each sync 
      // or we can sync row by row. Given the complex nested structure (Task -> Expenses/TopUps)
      // storing the whole JSON blob as a robust "source of truth" in a row is safest and easiest,
      // keeping a historical record of all syncs (Append only).
      
      const now = new Date().toISOString();
      sheet.appendRow([JSON.stringify(data), now]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Data safely appended to sheet.'
      })).setMimeType(ContentService.MimeType.JSON);
    } 
    else if (action === 'pull') {
      // Pull gets the most recent row's data
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
         return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            data: []
         })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const dataString = sheet.getRange(lastRow, 1).getValue();
      const data = JSON.parse(dataString);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: data
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handling pre-flight OPTIONS request for CORS
function doOptions(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}
