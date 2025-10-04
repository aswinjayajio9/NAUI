import { generateGetDataPayload } from './payloadGenerator';
import { parseMetaDataPayload } from './o9Interfacehelper';
import { getItemAssociationPayload } from './payloads';
// Constants kept for compatibility with buildBomBottomUpSorted (if used externally)
const VERSION = "Version.[Version Name]";
const LOCATION = "Location.[Location]";
const ACTIVITY1 = "Activity1.[Activity1]";
const ITEM = "Item.[Item]";
const ERP_BOM = "ERP BOM Association";
const ERP_BOM_CONSUMED = "ERP BOM Consumed Item Association";

// Helper to normalize null/empty consistently
function isNull(v) {
  if (v == null) return true;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return true;
    const tokens = new Set(['null', 'none', 'nan', 'n/a', 'na']);
    return tokens.has(s.toLowerCase());
  }
  return false;
}

// Keep only Item-* columns and drop Item columns that are all-null across rows
function keepOnlyItemColumns(rows = []) {
  if (!rows || rows.length === 0) return [];

  const allKeys = Object.keys(rows[0] || {});
  const itemCols = allKeys.filter((k) => k.startsWith('Item'));

  // Identify valid item columns (not all null)
  const validItemCols = itemCols.filter((col) => rows.some((r) => !isNull(r[col])));
  if (validItemCols.length === 0) return [];

  // Project and drop fully-empty rows
  const projected = rows
    .map((r) => {
      const o = {};
      validItemCols.forEach((c) => { o[c] = r[c] ?? ''; });
      return o;
    })
    .filter((r) => validItemCols.some((c) => !isNull(r[c])));

  return projected;
}

// Default export: rows in, rows out (already has all details per backend)
export default function ItemHierarchy({ srcVersion, level = 5 }) {
  // Fetch rows using srcVersion
  const payload = generateGetDataPayload(getItemAssociationPayload(srcVersion)?.Query);
  const { rows } = parseMetaDataPayload(payload);

  // Return only Item-* columns and drop all-null Item columns
  return keepOnlyItemColumns(rows);
}



/**
 * Build bottom-up BOM (L1 = leaf, L2 = parent, ...) and sort from highest to lowest level
 * @param {Array<Object>} rows - Array of row objects from parseMetaDataPayload
 * @param {number} maxLevel - Maximum BOM level (default 5)
 * @returns {Array<Object>} - Array of BOM rows in the same format
 */

export function buildBomBottomUpSorted(rows, maxLevel = 5) {
  maxLevel = Math.max(2, maxLevel);
  console.log(`Building BOM bottom-up sorted with maxLevel=${maxLevel}`, rows);
  const activityToParent = {};
  const activityToChildren = {};

  rows.forEach(row => {
    const act = row[ACTIVITY1];
    const item = row[ITEM];
    const assoc = String(row[ERP_BOM] ?? "").trim();
    const consumed = String(row[ERP_BOM_CONSUMED] ?? "").trim();

    if (assoc === "1") {
      activityToParent[act] = {
        item,
        version: row[VERSION],
        location: row[LOCATION]
      };
    }
    if (consumed === "1") {
      if (!activityToChildren[act]) activityToChildren[act] = [];
      activityToChildren[act].push(item);
    }
  });

  // Build child → parent mapping
  const childToParent = {};
  Object.entries(activityToParent).forEach(([act, parent]) => {
    (activityToChildren[act] || []).forEach(child => {
      childToParent[child] = parent.item;
    });
  });

  const results = [];

  // Build path bottom-up
  Array.from(new Set(Object.keys(childToParent))).forEach(leaf => {
    const path = [leaf];
    let current = leaf;
    while (path.length < maxLevel) {
      const parent = childToParent[current];
      if (!parent) break;
      path.push(parent);
      current = parent;
    }
    while (path.length < maxLevel) {
      path.push(null);
    }
    const row = { [VERSION]: "", [LOCATION]: "" };
    path.forEach((val, i) => {
      row[`Item L${i + 1}`] = val;
    });
    results.push(row);
  });

  // Fill version/location from parent if possible
  results.forEach(row => {
    const leafItem = row["Item L1"];
    for (const [act, parent] of Object.entries(activityToParent)) {
      if (parent.item === (childToParent[leafItem] || leafItem)) {
        row[VERSION] = parent.version;
        row[LOCATION] = parent.location;
        break;
      }
    }
  });

  // Remove duplicates
  const seen = new Set();
  const uniqueResults = [];
  results.forEach(r => {
    const key = Array.from({ length: maxLevel }, (_, i) => r[`Item L${i + 1}`]).join("|");
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(r);
    }
  });

  // Sort rows: highest ancestor first
  uniqueResults.sort((a, b) => {
    for (let i = maxLevel; i >= 1; i--) {
      const ai = a[`Item L${i}`] || "";
      const bi = b[`Item L${i}`] || "";
      if (ai < bi) return -1;
      if (ai > bi) return 1;
    }
    return 0;
  });

  // Return only rows; consumers can derive metadata as needed
  return uniqueResults;
}