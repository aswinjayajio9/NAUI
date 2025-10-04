import { generateGetDataPayload } from './payloadGenerator';
import { parseMetaDataPayload } from './o9Interfacehelper';
import { getItemAssociationPayload } from './payloads';

// Constants
const VERSION = "Version.[Version Name]";
const LOCATION = "Location.[Location]";
const ACTIVITY1 = "Activity1.[Activity1]";
const ITEM = "Item.[Item]";
const ERP_BOM = "ERP BOM Association";
const ERP_BOM_CONSUMED = "ERP BOM Consumed Item Association";
export default function NetworkDefinitionPage({
  srcVersion,
  level = 5,
  attribute = ITEM,
}) {

  // Get payload from API/query
  const payload = generateGetDataPayload(getItemAssociationPayload(srcVersion)?.Query);
  // Parse payload
  const {
    rows,
    dimensions,
    measures,
    nestedData,
    colsDisplayNameMapping,
  } = parseMetaDataPayload(payload);

  // Build BOM hierarchy in parseMetaDataPayload format
  const bomHierarchy = buildBomBottomUpSorted(rows, level);

  // Return BOM hierarchy, but use dimensions, measures, nestedData, colsDisplayNameMapping from parseMetaDataPayload
  return {
    ...bomHierarchy,
    dimensions,
    measures,
    nestedData,
    colsDisplayNameMapping: bomHierarchy.colsDisplayNameMapping,
  };
}



/**
 * Build bottom-up BOM (L1 = leaf, L2 = parent, ...) and sort from highest to lowest level
 * @param {Array<Object>} rows - Array of row objects from parseMetaDataPayload
 * @param {number} maxLevel - Maximum BOM level (default 5)
 * @returns {Array<Object>} - Array of BOM rows in the same format
 */

export function buildBomBottomUpSorted(rows, maxLevel = 5) {
  maxLevel = Math.max(2, maxLevel);

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

  // Build cols, dimensions, measures, colsDisplayNameMapping
  const cols = [];
  const dimensions = [];
  const measures = [];
  const colsDisplayNameMapping = {};

  // Add Item L1..LmaxLevel as dimensions
  for (let i = 1; i <= maxLevel; i++) {
    const colName = `Item L${i}`;
    cols.push({ dataIndex: colName, title: colName, key: colName, isDimension: true });
    dimensions.push({ alias: colName, header: colName, meta: { DimensionName: `Item L${i}`, Name: colName } });
    colsDisplayNameMapping[colName] = colName;
  }
  // Add Version and Location as dimensions
  cols.push({ dataIndex: VERSION, title: VERSION, key: VERSION, isDimension: true });
  dimensions.push({ alias: VERSION, header: VERSION, meta: { DimensionName: "Version", Name: "Version Name" } });
  colsDisplayNameMapping[VERSION] = VERSION;
  cols.push({ dataIndex: LOCATION, title: LOCATION, key: LOCATION, isDimension: true });
  dimensions.push({ alias: LOCATION, header: LOCATION, meta: { DimensionName: "Location", Name: "Location" } });
  colsDisplayNameMapping[LOCATION] = LOCATION;

  // No measures in this output

  // Use Item L1 as nestedData
  const nestedData = "Item L1";

  return {
    rows: uniqueResults,
    cols,
    dimensions,
    measures,
    nestedData,
    colsDisplayNameMapping,
  };
}