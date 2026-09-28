/**
 * PAYMINT FOUNDER GOOGLE APPS SCRIPT
 * Account: agarwalkrish400@gmail.com
 *
 * HOW TO SET UP (Takes 1 minute):
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Name the spreadsheet: "Paymint Master Founder Data"
 * 3. Click Extensions -> Apps Script
 * 4. Paste this ENTIRE code into the editor and click "Save" (Floppy disk icon)
 * 5. Click "Deploy" -> "New deployment" -> Select type: "Web app"
 * 6. Set Description: "Paymint Sync"
 * 7. Execute as: "Me (agarwalkrish400@gmail.com)"
 * 8. Who has access: "Anyone" (so Paymint backend can post transactions)
 * 9. Click "Deploy" and copy the Web App URL!
 * 10. Paste the Web App URL into the Paymint Founder Dashboard Export Hub.
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── 1. GOOGLE DRIVE FOLDER FOR SCREENSHOTS ──────────────────────────────
    let driveFolder;
    const folderName = "Paymint Beta Screenshots";
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      driveFolder = folders.next();
    } else {
      driveFolder = DriveApp.createFolder(folderName);
      driveFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    // ── 2. SHEET 1: LOGIN DATA ─────────────────────────────────────────────
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

    // ── 3. SHEET 2: TRANSACTIONAL DATA ─────────────────────────────────────
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
        if (t.screenshot_url && t.screenshot_url.startsWith("http")) {
          screenshotLink = t.screenshot_url;
        } else if (t.screenshot_url && t.screenshot_url.startsWith("data:image")) {
          try {
            // Save base64 image directly to Google Drive folder
            const parts = t.screenshot_url.split(",");
            const base64Data = parts[1];
            const mimeType = parts[0].split(";")[0].replace("data:", "");
            const decoded = Utilities.base64Decode(base64Data);
            const fileName = `paymint_${(t.payee_name || "txn").replace(/[^a-zA-Z0-9]/g, "_")}_${t.transaction_amount || 0}_${Date.now()}.jpg`;
            const blob = Utilities.newBlob(decoded, mimeType, fileName);
            const driveFile = driveFolder.createFile(blob);
            driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            screenshotLink = driveFile.getUrl();
          } catch (err) {
            screenshotLink = "Drive Upload Error: " + err.message;
          }
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
      message: "Synced to Google Sheets and Drive successfully!",
      usersCount: data.login_data ? data.login_data.length : 0,
      txnsCount: data.transactional_data ? data.transactional_data.length : 0,
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
  return ContentService.createTextOutput("Paymint Google Sheets & Drive Webhook is Active!").setMimeType(ContentService.MimeType.TEXT);
}
