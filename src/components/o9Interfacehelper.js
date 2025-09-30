import o9Interface from "./o9Interface";
import { generatePayloadForDimensions } from "./payloads";
import { API_BASE_URL, tenantID } from "./HomePage"; // Import the constant
// Load API key from environment variable
const API_KEY = process.env.API_KEYGEN || "hkj7ja11.v37hrv9jxv6g38n7sp297gz";
// Helper: Parse Meta/Data payload into rows and columns

export const parseMetaDataPayload = (
  payload,
  levelConfig = {
    enabled: true,
    hideDimensions: [],
    levelDimension: "Level",
    targetDimension: "Item",
  }
) => {
  // Normalize config
  const cfg = {
    enabled: true,
    hideDimensions: [],
    levelDimension: "Level",
    targetDimension: "Item",
    ...(levelConfig || {}),
  };
  const hideSet = new Set((cfg.hideDimensions || []).map((v) => String(v)));

  if (!payload?.Meta || !payload?.Data)
    return {
      rows: [],
      cols: [],
      dimensions: [],
      measures: [],
      nestedData: cfg.targetDimension || "Item",
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
    if (m?.DimensionName) {
      // Format for dimensions: [Dimension].[Name]
      aliasHeader[a] = `[${m.DimensionName}].[${m.Name}]`;
    } else {
      // Format for measures: Name only
      aliasHeader[a] = m?.Name || `col_${a}`;
    }
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

  // Determine which aliases to keep based on hideDimensions
  const keepAliases = aliases.filter((a) => {
    const display = aliasHeader[a];
    const metaName = metaByAlias[a]?.DimensionName;
    if (hideSet.has(display)) return false;
    if (metaName && hideSet.has(metaName)) return false;
    return true;
  });

  const mapValue = (meta, raw) => {
    if (raw == null) return raw; // Return empty string for null or undefined values
    if (Array.isArray(raw) && raw.length > 0) raw = raw[0]; // Extract value from [value, metadata]
    if (meta?.DimensionValues) {
      // If raw is an integer and valid index, use it to access DimensionValues directly
      if (
        typeof raw === "number" &&
        Number.isInteger(raw) &&
        raw >= 0 &&
        raw < meta.DimensionValues.length
      ) {
        const dimensionValue = meta.DimensionValues[raw];
        return dimensionValue?.DisplayName || dimensionValue?.Name;
      }
      // If no match is found, return raw
      return raw;
    }

    // Always return raw if no DimensionValues are present
    return raw;
  };

  const rows = payload.Data.map((r, idx) => {
    // Detect if r is an object or array
    const isArray = Array.isArray(r);
    const obj = {};
    let hasNonNull = false;
    keepAliases.forEach((a) => {
      const raw = isArray ? r[a] : r[String(a)] || r[a]; // Handle both formats
      const value = mapValue(metaByAlias[a], raw);
      obj[aliasHeader[a]] = value;
      if (value != null) hasNonNull = true;
    });
    obj.key = String(idx + 1);
    return hasNonNull ? obj : null; // Skip empty rows
  }).filter(Boolean); // Remove nulls

  const cols = keepAliases.map((a) => ({
    dataIndex: aliasHeader[a],
    title: aliasHeader[a],
    key: aliasHeader[a],
    isDimension: !!metaByAlias[a]?.DimensionName, // Flag for UI
  }));

  // Build colsDisplayNameMapping: display name -> real column name
  const colsDisplayNameMapping = {};
  keepAliases.forEach((a) => {
    const meta = metaByAlias[a];
    if (meta?.DimensionName) {
      // For dimensions: [Dimension].[Name]
      colsDisplayNameMapping[aliasHeader[a]] = `[${meta.DimensionName}].[${meta.Name}]`;
    } else {
      // For measures: Name only
      colsDisplayNameMapping[aliasHeader[a]] = meta?.Name || aliasHeader[a];
    }
  });

  // Filter dimensions and measures lists to reflect hidden columns
  const filteredDimensions = dimensions.filter((d) =>
    keepAliases.includes(d.alias)
  );
  const filteredMeasures = measures.filter((m) =>
    keepAliases.includes(m.alias)
  );

  // Determine nestedData: if a levelDimension exists among kept dimensions, use targetDimension
  let nestedData = cfg.targetDimension || "Item";
  if (cfg.enabled && cfg.levelDimension) {
    const foundLevel = filteredDimensions.find(
      (d) =>
        d.meta?.DimensionName === cfg.levelDimension ||
        d.header === cfg.levelDimension
    );
    if (!foundLevel) {
      nestedData = "Item";
    }
  }

  return {
    rows,
    cols,
    dimensions: filteredDimensions,
    measures: filteredMeasures,
    nestedData,
    colsDisplayNameMapping,
  };
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

export const createCellEditPayload = (
  meta, // Meta passed as a parameter
  updatedRow, // Row data to update
  measures = [], // Measures metadata
  attributes = [], // Attributes metadata
  filters = [], // Filters metadata
  rowIndex = 0 // Row index
) => {
  // Initialize o9DataSource
  const dataSource = o9Interface.o9DataSource();
  dataSource.reset(); // Reset the data structure

  // Add Meta to o9DataSource
  meta.forEach((metaItem) => {
    if (metaItem.DimensionName) {
      // Add attribute column definitions
      dataSource.addAttributeColumnDef({
        DimensionName: metaItem.DimensionName,
        AttributeName: metaItem.Name,
        RelationshipType: metaItem.RelationshipType || null,
        EdgeDirection: metaItem.EdgeDirection || null,
        DimensionValues: metaItem.DimensionValues || [],
      });
    } else if (metaItem.MeasureId) {
      // Add measure column definitions
      dataSource.addMeasureColumnDef({
        Name: metaItem.Name,
        DataType: metaItem.DataType || "string",
        DisplayName: metaItem.Translation || metaItem.Name,
        FormatString: metaItem.FormatString || "#,##0;(#,##0)",
      });
    }
  });

  // Add Attribute Data to o9DataSource
  attributes.forEach((attr) => {
    const value = updatedRow[attr.Name];
    if (value != null) {
      const columnIndex = dataSource.getAttributeColumnIndex(
        attr.DimensionName,
        attr.Name,
        attr.RelationshipType || null,
        attr.EdgeDirection || null
      );
      if (columnIndex >= 0) {
        dataSource.addAttributeData(rowIndex, columnIndex, value);
      }
    }
  });

  // Add Measure Data to o9DataSource
  measures.forEach((measure) => {
    const value = updatedRow[measure.Name];
    if (value != null) {
      const columnIndex = dataSource.getMeasureColumnIndex(
        measure.Name,
        measure.RelationshipType || null
      );
      if (columnIndex >= 0) {
        dataSource.addMeasureData(rowIndex, columnIndex, value);
      }
    }
  });

  // Convert o9DataSource to JSON
  const payload = dataSource.toJson();

  // Add Filters to the payload
  payload.Filters = filters.map((filter) => ({
    IsFilter: true,
    Axis: "none",
    AllSelection: filter.AllSelection || false,
    SelectedMembers: filter.SelectedMembers || [],
    Name: filter.Name,
    DimensionName: filter.DimensionName,
  }));

  return payload;
};

// Generic HTTP request helper with o9Interface integration
const httpRequest = async ({ url, method = 'GET', payload = {}, headers = {}, apiKey = API_KEY, api_method = null }) => {
  try {

    // If api_method is provided, attempt to delegate the call to o9Interface
    if (api_method && typeof o9Interface[api_method] === 'function') {
      try {
        console.log(`Delegating to o9Interface.${api_method} with payload:`, payload);
        const data = o9Interface[api_method](payload, undefined);
        if (data?.Meta && data?.Data) {
          return Promise.resolve(data); // Return resolved data if valid
        } else {
          throw new Error(`o9Interface.${api_method} returned invalid data`);
        }
      } catch (error) {
        console.warn(`o9Interface.${api_method} failed, falling back to default HTTP request. Error:`, error);
      }
    }
    const defaultHeaders = {
      accept: 'application/json',
      'content-type': 'application/json',
    };

    if (apiKey) {
      defaultHeaders['Authorization'] = `ApiKey ${apiKey}`;
    }

    const options = {
      method,
      headers: { ...defaultHeaders, ...headers },
    };

    if (method === 'POST' || method === 'PUT') {
      options.body = JSON.stringify(payload);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in HTTP request to ${url}:`, error);
    throw error;
  }
};

// Refactored getPayloadFromUrl
export const getPayloadFromUrl = async ({
  url = `${API_BASE_URL}/getData`,
  payload = {},
  apiKey = API_KEY,
  api_method = "getData", // Default to "getData"
}) => {
  return await httpRequest({ url, method: 'POST', payload, apiKey, api_method });
};

// Refactored cellEditSubmit
export const cellEditSubmit = async ({
   url = `${API_BASE_URL}/updateCellEdit`,
   payload = {},
   apiKey = API_KEY,
   api_method = "cellEdit"
  }) => {
  return await httpRequest({ url, method: 'POST', payload, apiKey, api_method });
};

// Helper: Fetch payload from URL and return JSON
export const executeIBPL = (
  params = {
    url: `/api/ibplquery/${tenantID}/ExecuteCompactJsonQuery?traceDdl=true`,
    payload: {},
    apiKey: API_KEY,
    method: "POST",
  }
) => {
  const url = params.url || `/api/ibplquery/${tenantID}/ExecuteCompactJsonQuery?traceDdl=true`;
  const payload = params.payload && typeof params.payload === "object" ? params.payload : {};
  const apiKey = params.apiKey || API_KEY;
  const method = params.method || "POST";

  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    
  };

  if (apiKey) {
    headers["Authorization"] = `ApiKey ${apiKey}`;
  }

  const total_payload = {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(payload) : undefined,
  };

  return fetch(url, total_payload)
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(`HTTP error! status: ${response.status}, response: ${text}`);
        });
      }
      return response.json();
    })
    .catch((error) => {
      console.error("Error fetching payload:", error);
      throw error;
    });
};

const dropdownCache = {}; // Cache object to store fetched dropdowns

// Accepts a payload object (from payload.js) and returns dimension dropdown values
export const fetchDimensionDropdowns = async (colsDisplayNameMapping) => {
  try {
    const cacheKey = JSON.stringify(colsDisplayNameMapping); // Use mapping as the cache key
    if (dropdownCache[cacheKey]) {

      return dropdownCache[cacheKey]; // Return cached data if available
    }

    const dimension_dropdowns = {};
    const payload_for_dims = generatePayloadForDimensions(colsDisplayNameMapping);
    for (const [displayName, payload] of Object.entries(payload_for_dims)) {
      dimension_dropdowns[displayName] = [];
      const data = await getPayloadFromUrl({ payload: payload });
      
      if (typeof data === "string") {
        try {
          const parsedData = JSON.parse(data);
          const resultData = parsedData["Results"]["0"];
          const { rows, dimensions } = parseMetaDataPayload(resultData);

          dimension_dropdowns[displayName] = [
            ...new Set(rows.map((row) => row[displayName] || row[dimensions[0]?.header])),
          ];
        } catch (parseError) {
          throw new Error(
            "Failed to parse API response as JSON: " + parseError.message
          );
        }
      } else {
        // Assuming data is already an object
        try {
          const resultData = data
          const { rows, dimensions } = parseMetaDataPayload(resultData);

          dimension_dropdowns[displayName] = [
            ...new Set(rows.map((row) => row[displayName] || row[dimensions[0]?.header])),
          ];
        } catch (parseError) {
          throw new Error(
            "Failed to parse API response as JSON: " + parseError.message
          );
        }
      }
    }

    dropdownCache[cacheKey] = dimension_dropdowns; // Store fetched dropdowns in cache
    return dimension_dropdowns;
  } catch (err) {
    console.error("Failed to fetch dimension dropdowns:", err);
    return {};
  }
};
