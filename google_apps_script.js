/**
 * PAYMINT FOUNDER GOOGLE APPS SCRIPT
 * Target Drive Folder: https://drive.google.com/drive/folders/11xVnc72QGhOO0IeTmJFe7HJ0xxuxVqnb
 * Folder ID: 11xVnc72QGhOO0IeTmJFe7HJ0xxuxVqnb
 *
 * This script AUTOMATICALLY:
 * 1. Creates/locates "Paymint Master Founder Data" multi-sheet Google Sheet inside your Drive folder.
 * 2. Populates Sheet 1 ("Login Data") with all user metrics & spend.
 * 3. Populates Sheet 2 ("Transactional Data") with all transaction records.
 * 4. Decodes each transaction screenshot into a real .jpg file in the SAME Drive folder.
 * 5. Inserts direct Google Drive links to each screenshot in Sheet 2.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ── 1. TARGET GOOGLE DRIVE FOLDER ──────────────────────────────────────
    const TARGET_FOLDER_ID = "11xVnc72QGhOO0IeTmJFe7HJ0xxuxVqnb";
    let driveFolder;
    try {
      driveFolder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    } catch(err) {
      const folders = DriveApp.getFoldersByName("Paymint Beta Screenshots");
      driveFolder = folders.hasNext() ? folders.next() : DriveApp.createFolder("Paymint Beta Screenshots");
      try { driveFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e){}
    }

    // ── 2. GET OR CREATE MULTI-SHEET GOOGLE SHEET INSIDE DRIVE FOLDER ──────
    let ss;
    const SHEET_NAME = "Paymint Master Founder Data";
    const existingSheets = driveFolder.getFilesByName(SHEET_NAME);
    
    if (existingSheets.hasNext()) {
      ss = SpreadsheetApp.open(existingSheets.next());
    } else {
      // Check if bound to an active spreadsheet
      try {
        const active = SpreadsheetApp.getActiveSpreadsheet();
        if (active) ss = active;
      } catch(e) {}

      // If standalone or not in folder yet, create spreadsheet in target folder
      if (!ss) {
        ss = SpreadsheetApp.create(SHEET_NAME);
        const file = DriveApp.getFileById(ss.getId());
        driveFolder.addFile(file);
        try { DriveApp.getRootFolder().removeFile(file); } catch(e){}
      }
    }

    // Ensure spreadsheet is accessible with link
    try {
      const sheetFile = DriveApp.getFileById(ss.getId());
      sheetFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch(e) {}

    // ── 3. SHEET 1: LOGIN DATA ─────────────────────────────────────────────
    let sheet1 = ss.getSheetByName("Login Data");
    if (!sheet1) {
      sheet1 = ss.insertSheet("Login Data", 0);
    }
    sheet1.clear();

    const sheet1Headers = [
      "Name",
      "Age",
      "Occupation",
      "Mail ID",
      "Total Spend (₹)",
      "Top Spent Area",
      "Total Transactions",
      "Coins Balance",
      "Joined Date"
    ];
    sheet1.appendRow(sheet1Headers);
    sheet1.getRange(1, 1, 1, sheet1Headers.length)
      .setFontWeight("bold")
      .setBackground("#1A5FC8")
      .setFontColor("#FFFFFF");

    if (data.login_data && data.login_data.length > 0) {
      const uRows = data.login_data.map(u => [
        u.name || "Anonymous",
        u.age || "N/A",
        u.occupation || "N/A",
        u.email || "",
        Number(u.total_spend || 0).toFixed(2),
        u.top_spent_area || "None",
        u.total_transactions || (u.total_spend > 0 ? "Active" : 0),
        Number(u.coins_balance || 0).toFixed(1),
        u.joined_at ? new Date(u.joined_at).toLocaleDateString() : "N/A"
      ]);
      sheet1.getRange(2, 1, uRows.length, sheet1Headers.length).setValues(uRows);
    }

    // ── 4. SHEET 2: TRANSACTIONAL DATA ─────────────────────────────────────
    let sheet2 = ss.getSheetByName("Transactional Data");
    if (!sheet2) {
      sheet2 = ss.insertSheet("Transactional Data", 1);
    }
    sheet2.clear();

    const sheet2Headers = [
      "Date Uploaded",
      "Time",
      "Payer Name",
      "Payee Name",
      "Transaction ID",
      "Transaction Amount (₹)",
      "Coins Earned",
      "Extra Coins Earned",
      "Details Provided",
      "Platform Used",
      "Bank Name",
      "Screenshot Link"
    ];
    sheet2.appendRow(sheet2Headers);
    sheet2.getRange(1, 1, 1, sheet2Headers.length)
      .setFontWeight("bold")
      .setBackground("#107C41")
      .setFontColor("#FFFFFF");

    if (data.transactional_data && data.transactional_data.length > 0) {
      const tRows = data.transactional_data.map(t => {
        let screenshotLink = "None";
        const rawSs = t.screenshot_base64 || (t.screenshot_url && t.screenshot_url.startsWith("data:") ? t.screenshot_url : null);

        if (rawSs) {
          try {
            // Save base64 image directly to Google Drive folder
            const commaIdx = rawSs.indexOf(",");
            const base64Data = commaIdx !== -1 ? rawSs.slice(commaIdx + 1) : rawSs;
            const mimeType = (rawSs.match(/data:([^;]+)/) || [])[1] || "image/jpeg";
            const decoded = Utilities.base64Decode(base64Data);
            const safePayee = (t.payee_name || "txn").replace(/[^a-zA-Z0-9]/g, "_");
            const safeTxnId = (t.transaction_id || t.id || "tx").replace(/[^a-zA-Z0-9]/g, "_");
            const fileName = `Paymint_${safePayee}_${t.transaction_amount || 0}_${safeTxnId}.jpg`;

            // Avoid duplicate files if synced multiple times
            const existing = driveFolder.getFilesByName(fileName);
            let driveFile;
            if (existing.hasNext()) {
              driveFile = existing.next();
            } else {
              const blob = Utilities.newBlob(decoded, mimeType, fileName);
              driveFile = driveFolder.createFile(blob);
              try {
                driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              } catch(e) {}
            }
            screenshotLink = driveFile.getUrl();
          } catch (err) {
            screenshotLink = t.screenshot_url || ("Drive Upload Error: " + err.message);
          }
        } else if (t.screenshot_url) {
          screenshotLink = t.screenshot_url;
        }

        return [
          t.date_uploaded || "",
          t.time_uploaded || "",
          t.payer_name || "Unknown",
          t.payee_name || "",
          t.transaction_id || "N/A",
          Number(t.transaction_amount || 0).toFixed(2),
          Number(t.coins_earned || 0).toFixed(1),
          Number(t.extra_coins_earned || 0).toFixed(1),
          t.details_provided || "None",
          t.platform_used || "UPI",
          t.bank_name || "UPI Bank",
          screenshotLink
        ];
      });

      sheet2.getRange(2, 1, tRows.length, sheet2Headers.length).setValues(tRows);
    }

    // Auto-resize columns
    sheet1.autoResizeColumns(1, sheet1Headers.length);
    sheet2.autoResizeColumns(1, sheet2Headers.length);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Multi-sheet Google Sheet created and synced in Drive folder successfully!",
      usersCount: data.login_data ? data.login_data.length : 0,
      txnsCount: data.transactional_data ? data.transactional_data.length : 0,
      sheetUrl: ss.getUrl(),
      driveFolderUrl: driveFolder.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Paymint Google Sheets & Drive Webhook is Active! Target Folder: 11xVnc72QGhOO0IeTmJFe7HJ0xxuxVqnb").setMimeType(ContentService.MimeType.TEXT);
}
