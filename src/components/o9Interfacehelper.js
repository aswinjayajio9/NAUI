import o9Interface from "./o9Interface";

// Helper: Parse Meta/Data payload into rows and columns

export const parseMetaDataPayload = (payload) => {
  if (!payload?.Meta || !payload?.Data) return { rows: [], cols: [] };

  const metaByAlias = {};
  payload.Meta.forEach((m) => {
    metaByAlias[Number(m.Alias)] = m;
  });

  const aliases = Object.keys(metaByAlias).map(Number).sort((a, b) => a - b);

  const aliasHeader = {};
  aliases.forEach((a) => {
    const m = metaByAlias[a];
    aliasHeader[a] = m?.Translation || m?.Name || `col_${a}`;
  });

  const mapValue = (meta, raw) => {
    if (raw == null) return raw;
    if (Array.isArray(raw) && raw.length > 0) raw = raw[0];
    if (meta?.DimensionValues) {
      if (typeof raw === "number" && Number.isInteger(raw)) {
        return meta.DimensionValues[raw]?.DisplayName || meta.DimensionValues[raw]?.Name || raw;
      }
      const found = meta.DimensionValues.find((dv) => String(dv.Key) === String(raw) || String(dv.Name) === String(raw));
      return found?.DisplayName || found?.Name || found?.Key;
    }
    return raw;
  };

  const rows = payload.Data.map((r, idx) => {
    const obj = {};
    aliases.forEach((a) => {
      obj[aliasHeader[a]] = mapValue(metaByAlias[a], r[a]);
    });
    obj.key = String(idx + 1);
    return obj;
  });

  const cols = aliases.map((a) => ({ dataIndex: aliasHeader[a], title: aliasHeader[a], key: aliasHeader[a] }));

  return { rows, cols };
};

// Helper: Parse generic JSON into rows
export const parseGenericJson = (json) => {
  if (Array.isArray(json)) {
    return json.map((r, i) => ({ key: r.key || r.id || String(i + 1), ...r }));
  }
  if (json?.data) {
    return json.data.map((r, i) => ({ key: r.key || r.id || String(i + 1), ...r }));
  }
  const arr = Array.isArray(Object.values(json)) ? Object.values(json) : [];
  return arr.map((r, i) => ({ key: r.key || r.id || String(i + 1), ...r }));
};

// Helper: Parse CSV response into rows
export const parseCsv = async (res) => {
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("Invalid CSV format");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((ln, i) => {
    const cells = ln.split(",").map((c) => c.trim());
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = cells[idx] || ""));
    obj.key = obj.key || String(i + 1);
    return obj;
  });
};

// Helper: Create a payload object for O9 queries
export const createPayload = (regularMeasures = [], levelAttributes = [], dataProperties = {}) => {
  // Default data properties if not provided
  const defaultDataProperties = {
    IncludeInactiveMembers: false,
    IncludeNulls: false,
    NullsForFinerGrainSelect: false,
    NullsForUnrelatedAttrSelect: false,
    RequireEditValidation: false,
    SubTotalsType: "NoSubtotals",
    IncludeNullsForSeries: "",
    MaxRecordLimit: "2000",
    ...dataProperties, // Merge with provided overrides
  };

  // Build RegularMeasures
  const measures = regularMeasures.map((name) => ({ Name: name }));

  // Build LevelAttributes (includes both regular attributes and filters)
  const attributes = levelAttributes.map((attr) => ({
    Name: attr.Name,
    DimensionName: attr.DimensionName,
    Axis: attr.Axis || "row", // Default to "row" if not specified
    ...(attr.IsFilter && {
      IsFilter: true,
      AllSelection: attr.AllSelection || false,
      SelectedMembers: attr.SelectedMembers || [],
    }),
  }));

  return {
    RegularMeasures: measures,
    LevelAttributes: attributes,
    DataProperties: defaultDataProperties,
  };
};

/**
 * Creates a cell edit payload for O9 based on an updated row.
 * @param {object} updatedRow - The updated row object (e.g., { ProductLine: "PG_1000", SCPBaseForecastQty: 1000 }).
 * @param {string[]} measures - Array of measure names (e.g., ["SCPBaseForecastQty"]).
 * @param {object[]} attributes - Array of attribute objects with Name, DimensionName, DimensionValues (array of { Name, MemberIndex }).
 * @param {object[]} filters - Array of filter objects with Name, DimensionName, SelectedMembers, etc.
 * @param {number} rowIndex - The index of the row being updated (default: 0).
 * @returns {object} The constructed cell edit payload.
 * 
 * @example
 * const payload = createCellEditPayload(
 *   { ProductLine: "PG_1000", Item: "P_1000_1", Location: "ShipTo_1", FiscalQuarter: "Q2-2019", FiscalMonth: "M05-2019", SCPBaseForecastQty: 1000 },
 *   ["SCPBaseForecastQty"],
 *   [
 *     { Name: "ProductLine", DimensionName: "SCSItem", DimensionValues: [{ Name: "PG_1000", MemberIndex: 0 }] },
 *     { Name: "Item", DimensionName: "SCSItem", DimensionValues: [{ Name: "P_1000_1", MemberIndex: 0 }] },
 *     { Name: "Location", DimensionName: "SCSLocation", DimensionValues: [{ Name: "ShipTo_1", MemberIndex: 0 }] },
 *     { Name: "FiscalQuarter", DimensionName: "Time", DimensionValues: [{ Name: "Q2-2019", MemberIndex: 0 }] },
 *     { Name: "FiscalMonth", DimensionName: "Time", DimensionValues: [{ Name: "M05-2019", MemberIndex: 0 }] }
 *   ],
 *   [
 *     { Name: "ProductLine", DimensionName: "SCSItem", SelectedMembers: [{ Name: "PG_1000" }] },
 *     { Name: "Version Name", DimensionName: "Version", SelectedMembers: [{ Name: "CurrentWorkingView" }] }
 *   ],
 *   0
 * );
 */
export const createCellEditPayload = (updatedRow, measures = [], attributes = [], filters = [], rowIndex = 0) => {
  const meta = [];
  let aliasCounter = 0;

  // Build Meta for attributes
  attributes.forEach((attr) => {
    meta.push({
      DimensionName: attr.DimensionName,
      Alias: String(aliasCounter++),
      Name: attr.Name,
      DimensionValues: attr.DimensionValues || [],
    });
  });

  // Build Meta for measures
  measures.forEach((measure) => {
    meta.push({
      DataType: "number", // Assume number; adjust if needed
      Name: measure,
      Alias: String(aliasCounter++),
    });
  });

  // Build UpdatedRows
  const memberCells = [];
  const dataCells = [];

  // Map attributes to MemberCells
  attributes.forEach((attr, idx) => {
    const value = updatedRow[attr.Name];
    if (value != null) {
      const dimensionValue = attr.DimensionValues?.find((dv) => dv.Name === value);
      const memberIndex = dimensionValue?.MemberIndex ?? 0; // Default to 0 if not found
      memberCells.push({
        Alias: String(idx),
        MemberIndex: memberIndex,
      });
    }
  });

  // Map measures to DataCells
  measures.forEach((measure, idx) => {
    const value = updatedRow[measure];
    if (value != null) {
      dataCells.push({
        Alias: String(attributes.length + idx),
        Value: value,
      });
    }
  });

  const updatedRows = [
    {
      MemberCells: memberCells,
      DataCells: dataCells,
    },
  ];

  // Build ModelDefinition using createPayload logic
  const modelDefinition = createPayload(measures, attributes.map((attr) => ({
    Name: attr.Name,
    DimensionName: attr.DimensionName,
    Axis: attr.Axis || "row", // Default axis
  })), {});

  // Build Filters
  const filtersArray = filters.map((filter) => ({
    IsFilter: true,
    Axis: "none",
    AllSelection: filter.AllSelection || false,
    SelectedMembers: filter.SelectedMembers || [],
    Name: filter.Name,
    DimensionName: filter.DimensionName,
  }));

  return {
    Meta: meta,
    UpdatedRows: updatedRows,
    ModelDefinition: modelDefinition,
    Filters: filtersArray,
  };
};

// // In saveRow function, replace the CSV logic with:
// const payload = createCellEditPayload(row, measures, attributes, filters);
// await o9Interface.cellEdit(payload);
// // Then update initialDataRef and editedKeys as before