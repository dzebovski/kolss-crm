/**
 * KOLSS CRM — Meta Lead Ads import from Google Sheets.
 *
 * Setup:
 * 1. Extensions → Apps Script → paste this file.
 * 2. Project settings → Script properties:
 *    - CRM_WEBHOOK_URL  = https://your-crm.vercel.app/api/webhooks/import-lead
 *    - IMPORT_WEBHOOK_SECRET = same as CRM env
 *    - SOURCE_ID = uuid from lead_import_sources (Supabase)
 *    - SHEET_NAME = tab name (default Sheet1)
 *    - HEADER_ROW = 1
 *    - BATCH_SIZE = 20 (optional)
 * 3. Run installTrigger() once, then syncAllLeads() for backfill.
 */

var PROP = {
  WEBHOOK_URL: 'CRM_WEBHOOK_URL',
  SECRET: 'IMPORT_WEBHOOK_SECRET',
  SOURCE_ID: 'SOURCE_ID',
  SHEET_NAME: 'SHEET_NAME',
  HEADER_ROW: 'HEADER_ROW',
  LAST_ROW: 'LAST_ROW',
  BATCH_SIZE: 'BATCH_SIZE',
};

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty(PROP.WEBHOOK_URL);
  var secret = props.getProperty(PROP.SECRET);
  var sourceId = props.getProperty(PROP.SOURCE_ID);
  var sheetName = props.getProperty(PROP.SHEET_NAME) || 'Sheet1';
  var headerRow = parseInt(props.getProperty(PROP.HEADER_ROW) || '1', 10);
  var batchSize = parseInt(props.getProperty(PROP.BATCH_SIZE) || '20', 10);

  if (!webhookUrl || !secret || !sourceId) {
    throw new Error(
      'Missing Script properties: CRM_WEBHOOK_URL, IMPORT_WEBHOOK_SECRET, SOURCE_ID'
    );
  }

  return {
    webhookUrl: webhookUrl,
    secret: secret,
    sourceId: sourceId,
    sheetName: sheetName,
    headerRow: headerRow,
    batchSize: batchSize,
  };
}

function getSheet_(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  return sheet;
}

function rowToRecord_(headers, row) {
  var record = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || '').trim();
    if (!key) continue;
    record[key] = row[i] != null ? String(row[i]).trim() : '';
  }
  return record;
}

function isEmptyRow_(row) {
  for (var i = 0; i < row.length; i++) {
    if (String(row[i] || '').trim()) return false;
  }
  return true;
}

function postBatch_(config, rows) {
  if (!rows.length) return { ok: true, rowsProcessed: 0 };

  var payload = {
    source_id: config.sourceId,
    rows: rows,
  };

  var response = UrlFetchApp.fetch(config.webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + config.secret,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  var text = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('Webhook failed (' + code + '): ' + text);
  }

  return JSON.parse(text);
}

function collectRows_(sheet, headerRow, startRow, endRow) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];

  var headerValues = sheet
    .getRange(headerRow, 1, 1, lastCol)
    .getValues()[0];
  var headers = headerValues.map(function (h) {
    return String(h || '').trim();
  });

  var records = [];
  if (endRow < startRow) return records;

  var values = sheet
    .getRange(startRow, 1, endRow - startRow + 1, lastCol)
    .getValues();

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (isEmptyRow_(row)) continue;
    records.push(rowToRecord_(headers, row));
  }

  return records;
}

function sendInBatches_(config, records) {
  var summary = {
    batches: 0,
    rowsProcessed: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    rowsSkipped: 0,
  };

  for (var i = 0; i < records.length; i += config.batchSize) {
    var batch = records.slice(i, i + config.batchSize);
    var result = postBatch_(config, batch);
    summary.batches++;
    summary.rowsProcessed += result.rowsProcessed || batch.length;
    summary.rowsCreated += result.rowsCreated || 0;
    summary.rowsUpdated += result.rowsUpdated || 0;
    summary.rowsSkipped += result.rowsSkipped || 0;
  }

  return summary;
}

/**
 * Incremental sync — processes rows after LAST_ROW property.
 */
function syncNewLeads() {
  var config = getConfig_();
  var props = PropertiesService.getScriptProperties();
  var sheet = getSheet_(config.sheetName);

  var lastRowProp = parseInt(props.getProperty(PROP.LAST_ROW) || '0', 10);
  var dataStartRow = config.headerRow + 1;
  var sheetLastRow = sheet.getLastRow();

  if (sheetLastRow < dataStartRow) {
    Logger.log('No data rows');
    return;
  }

  var startRow = Math.max(dataStartRow, lastRowProp + 1);
  if (startRow > sheetLastRow) {
    Logger.log('No new rows since row ' + lastRowProp);
    return;
  }

  var records = collectRows_(sheet, config.headerRow, startRow, sheetLastRow);
  var summary = sendInBatches_(config, records);

  props.setProperty(PROP.LAST_ROW, String(sheetLastRow));
  Logger.log(JSON.stringify(summary));
}

/**
 * One-time backfill of all existing data rows.
 */
function syncAllLeads() {
  var config = getConfig_();
  var props = PropertiesService.getScriptProperties();
  var sheet = getSheet_(config.sheetName);

  var dataStartRow = config.headerRow + 1;
  var sheetLastRow = sheet.getLastRow();

  if (sheetLastRow < dataStartRow) {
    Logger.log('No data rows');
    return;
  }

  var records = collectRows_(
    sheet,
    config.headerRow,
    dataStartRow,
    sheetLastRow
  );
  var summary = sendInBatches_(config, records);

  props.setProperty(PROP.LAST_ROW, String(sheetLastRow));
  Logger.log(JSON.stringify(summary));
}

/**
 * Install time-driven trigger (every 5 minutes).
 */
function installTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncNewLeads') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('syncNewLeads')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Trigger installed: syncNewLeads every 5 minutes');
}

/**
 * Remove sync trigger.
 */
function removeTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncNewLeads') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log('Trigger removed');
}
