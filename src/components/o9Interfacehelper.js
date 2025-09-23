import o9Interface from "./o9Interface";
import { generatePayloadForDimensions } from "./payloads";
// Load API key from environment variable
const API_KEY = process.env.API_KEYGEN || "hkj7ja11.v37hrv9jxv6g38n7sp297gz";
// Helper: Parse Meta/Data payload into rows and columns

export const parseMetaDataPayload = (
  payload,
  levelConfig = {
    enabled: true,
    levelDimension: "Level",
    targetDimension: "Item",
  }
) => {
  if (!payload?.Meta || !payload?.Data)
    return {
      rows: [],
      cols: [],
      dimensions: [],
      measures: [],
      nestedData: "Item",
      colsDisplayNameMapping: {},
    };

  const metaByAlias = {};
  payload.Meta.forEach((m) => {
    metaByAlias[Number(m.Alias)] = m;
  });

  const aliases = Object.keys(metaByAlias)
    .map(Number)
    .sort((a, b) => a - b);

  const aliasHeader = {};
  aliases.forEach((a) => {
    const m = metaByAlias[a];
    aliasHeader[a] = m?.DimensionName || m?.Translation || m?.Name || `col_${a}`;
  });

  // Classify dimensions and measures
  const dimensions = [];
  const measures = [];
  aliases.forEach((a) => {
    const m = metaByAlias[a];
    const header = aliasHeader[a];
    if (m?.DimensionName) {
      dimensions.push({ alias: a, header, meta: m });
    } else {
      measures.push({ alias: a, header, meta: m });
    }
  });

  const mapValue = (meta, raw) => {
    if (raw == null) return raw;
    if (Array.isArray(raw) && raw.length > 0) raw = raw[0]; // Extract value from [value, metadata]
    if (meta?.DimensionValues) {
      // First, try string-based search for Key or Name (more robust)
      const found = meta.DimensionValues.find(
        (dv) =>
          String(dv.Key) === String(raw) || String(dv.Name) === String(raw)
      );
      if (found) return found?.DisplayName || found?.Name || found?.Key;
      // Fallback: if raw is integer, use as index
      if (
        typeof raw === "number" &&
        Number.isInteger(raw) &&
        raw >= 0 &&
        raw < meta.DimensionValues.length
      ) {
        return (
          meta.DimensionValues[raw]?.DisplayName ||
          meta.DimensionValues[raw]?.Name ||
          raw
        );
      }
      return raw; // Default to raw if no match
    }
    return raw;
  };

  const rows = payload.Data.map((r, idx) => {
    // Detect if r is an object or array
    const isArray = Array.isArray(r);
    const obj = {};
    let hasNonNull = false;
    aliases.forEach((a) => {
      const raw = isArray ? r[a] : r[String(a)] || r[a]; // Handle both formats
      const value = mapValue(metaByAlias[a], raw);
      obj[aliasHeader[a]] = value;
      if (value != null) hasNonNull = true;
    });
    obj.key = String(idx + 1);
    return hasNonNull ? obj : null; // Skip empty rows
  }).filter(Boolean); // Remove nulls

  const cols = aliases.map((a) => ({
    dataIndex: aliasHeader[a],
    title: aliasHeader[a],
    key: aliasHeader[a],
    isDimension: !!metaByAlias[a]?.DimensionName, // Flag for UI
  }));

  // Build colsDisplayNameMapping: display name -> real column name
  const colsDisplayNameMapping = {};
  aliases.forEach((a) => {
    const displayName = aliasHeader[a];
    const meta = metaByAlias[a];
    if (meta?.DimensionName) {
      // For dimensions: [DimensionName] if spaces, else DimensionName . [Name] if spaces
      const namePart = meta.Name.includes(' ') ? `[${meta.Name}]` : meta.Name;
      colsDisplayNameMapping[displayName] = `${meta.DimensionName}.${namePart}`;
    } else {
      // For measures: just the display name
      colsDisplayNameMapping[displayName] = displayName;
    }
  });
  return { rows, cols, dimensions, measures, nestedData: "Item", colsDisplayNameMapping };
};

// Helper: Parse generic JSON into rows
export const parseGenericJson = (json) => {
  if (Array.isArray(json)) {
    return json.map((r, i) => ({ key: r.key || r.id || String(i + 1), ...r }));
  }
  if (json?.data) {
    return json.data.map((r, i) => ({
      key: r.key || r.id || String(i + 1),
      ...r,
    }));
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
export const createPayload = (
  regularMeasures = [],
  levelAttributes = [],
  dataProperties = {}
) => {
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
export const createCellEditPayload = (
  updatedRow,
  measures = [],
  attributes = [],
  filters = [],
  rowIndex = 0
) => {
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
      const dimensionValue = attr.DimensionValues?.find(
        (dv) => dv.Name === value
      );
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
  const modelDefinition = createPayload(
    measures,
    attributes.map((attr) => ({
      Name: attr.Name,
      DimensionName: attr.DimensionName,
      Axis: attr.Axis || "row", // Default axis
    })),
    {}
  );

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

// Helper: Fetch payload from URL and return JSON
export const getPayloadFromUrl = (
  params = {
    url: "/api/ibplquery/6760/ExecuteCompactJsonQuery?traceDdl=true",
    payload: {},
    apiKey: API_KEY
  }
) => {
  const url = params.url || "/api/ibplquery/6760/ExecuteCompactJsonQuery?traceDdl=true";
  const payload = params.payload || {};
  const apiKey = params.apiKey || API_KEY;
  const headers = {
    "accept": "application/json",
    "content-type": "application/json",
    // "o9-request-ttid": "6760",
    // "sec-fetch-mode": "cors",
    // "sec-fetch-site": "same-origin",
  };
  try {
    const data = o9Interface.getData(payload, undefined);
    console.log("Fetched data from O9 interface:", data);
    if (data?.Meta && data?.Data) {
      return Promise.resolve(data);
    }
  } catch (error) {
    console.error("Error fetching data from O9 interface:", error);
  }
  if (apiKey) {
    headers["Authorization"] = `ApiKey ${apiKey}`; // Adjust header name/format if needed for O9 API
  }
  console.log("API Key and payload used:", apiKey,payload);
  if (payload && Object.keys(payload).length > 0) {
    const total_payload = {
      method: "POST", // Assuming POST for fetching data
      headers: headers,
      body: JSON.stringify(payload),
    };
    console.log(
      "Fetching response from URL with payload:",
      url,
      payload,
      apiKey
    );

    return fetch(url, total_payload)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Error fetching payload:", error);
        throw error;
      });
  }
  else {
    console.log("Fetching response from local:", url);
    return fetch(url, {
    method: "GET", // Assuming GET for fetching data
    headers: headers,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching payload:", error);
      throw error;
    });
  }
  
};


// Accepts a payload object (from payload.js) and returns dimension dropdown values
export const fetchDimensionDropdowns = async (colsDisplayNameMapping) => {
  try {
    const dimension_dropdowns = {};
    const payload_for_dims = generatePayloadForDimensions(colsDisplayNameMapping);
    console.log("Generated payload for dimensions:", payload_for_dims);
    for (const [displayName, payload] of Object.entries(payload_for_dims)) {
      dimension_dropdowns[displayName] = [];
      console.log(`Fetched dropdown values for`, colsDisplayNameMapping,displayName);
      const data = await getPayloadFromUrl({ payload: payload });
      if (typeof data === 'string') {
        try {
          const parsedData = JSON.parse(data);
          const resultData = parsedData["Results"]["0"];
          const { rows } = parseMetaDataPayload(resultData);
          dimension_dropdowns[displayName] = [...new Set(rows.map(row => row[displayName]))];
          
        } catch (parseError) {
          throw new Error("Failed to parse API response as JSON: " + parseError.message);
        }
      } else {
        // Assuming data is already an object
        const resultData = data;
        const { rows } = parseMetaDataPayload(resultData);
        dimension_dropdowns[displayName] = [...new Set(rows.map(row => row[displayName]))];        
      }
    }
    
    return dimension_dropdowns;
  } catch (err) {
    console.error("Failed to fetch dimension dropdowns:", err);
    return {};
  }
};


