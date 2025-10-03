import { executeActionButton } from "./o9Interfacehelper";
import { Version,DMRule,NetworkPlanType,DataObject } from "./payloads";
// Function to compute row span map for dimension columns
export function computeRowSpanMap(dataSource, dimensions) {
  const map = {};
  const dimHeaders = dimensions.map((d) => d.header);
  dimHeaders.forEach((col) => {
    map[col] = {};
    let startKey = null;
    let startVal = null;
    let count = 0;
    dataSource.forEach((row, idx) => {
      const val = row[col] ?? "";
      const sval = String(val);
      if (idx === 0) {
        startKey = row.key;
        startVal = sval;
        count = 1;
        map[col][row.key] = 1;
        return;
      }
      if (sval === startVal) {
        count++;
        map[col][row.key] = 0;
        map[col][startKey] = count;
      } else {
        startKey = row.key;
        startVal = sval;
        count = 1;
        map[col][row.key] = 1;
      }
    });
  });
  return map;
}

// Function to compute filter options map
export function computeOptionsMap(data = [], dims = [], cols = []) {
  const colsToUse = dims.length
    ? dims.map((d) => d.header)
    : cols.length
    ? cols.map((c) => c.dataIndex)
    : Object.keys(data[0] || {}).filter((k) => k !== "key");

  const map = {};
  colsToUse.forEach((header) => {
    const setVals = new Set();
    data.forEach((r) => {
      const v = r[header];
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        setVals.add(String(v));
      }
    });
    map[header] = Array.from(setVals).sort((a, b) => a.localeCompare(b));
  });
  return map;
}

// Function to download data as CSV
export function downloadCSV(rows, columns, filename) {
  if (!rows?.length) {
    return;
  }
  const cols = columns.map((c) => c.dataIndex);
  const header = cols.join(",");
  const lines = rows.map((r) =>
    cols
      .map((c) => {
        const v = String(r[c] ?? "");
        return v.includes(",") || v.includes('"')
          ? `"${v.replace(/"/g, '""')}"`
          : v;
      })
      .join(",")
  );
  const csv = [header, ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Function to return styles for frozen dimension columns and hard divider
export function getSheetStyles() {
  return `
    /* Slightly darker measure column background */
    .naui-meas-col .ant-table-cell,
    .naui-meas-col.ant-table-cell {
      background: #f0dfb5ff; /* keep, but standard 6-digit hex */
    }

    /* Highlight for maximized (expanded group) rows in Nested View */
    .naui-expanded-row > td {
      background: #d7ecfaff !important;
    }

    /* Make vertical column separators visible across the table (header + body) */
    .ant-table-wrapper table {
      border-collapse: separate;
      border-spacing: 0;
    }
    .ant-table-thead > tr > th,
    .ant-table-tbody > tr > td {
      border-right: 1px solid #afafafff; /* stronger vertical grid line */
      background-clip: padding-box;     /* keep border visible over cell bg */
    }
    /* Do not draw a right border on the last column of each row */
    .ant-table-thead > tr > th:last-child,
    .ant-table-tbody > tr > td:last-child {
      border-right: none;
    }

    /* Strong vertical separator after the last dimension column (header + body) */
    .ant-table-thead > tr > th.naui-dim-last,
    .ant-table-tbody > tr > td.naui-dim-last {
      border-right: 3px solid #585858ff !important; /* make divider more visible */
    }

    /* Ensure fixed-left (dimension) columns render above scroll area so the divider stays visible */
    .ant-table-fixed-left .naui-dim-col .ant-table-cell,
    .naui-dim-col.ant-table-cell,
    .ant-table-thead > tr > th.naui-dim-col {
      z-index: 6;
      position: relative;
    }

    /* Give the last dimension header slightly higher stacking so its divider is clear */
    .ant-table-thead > tr > th.naui-dim-last {
      z-index: 8;
      position: relative;
    }

    /* Prevent the table's default cell shadow from interfering with the divider */
    .naui-dim-last .ant-table-cell {
      box-shadow: none;
    }

    /* Resizer handle */
    .naui-resizer {
      position: absolute;
      top: 0;
      right: -4px; /* centers the 8px wide handle over the border at right:0 */
      width: 8px;
      height: 100%;
      cursor: col-resize;
      z-index: 12;
      background: transparent;
      transition: background .12s ease;
      -webkit-user-select: none;
      user-select: none;
    }
    .ant-table-thead > tr > th:hover .naui-resizer,
    .ant-table-thead > tr > th .naui-resizer:hover {
      background: rgba(0,0,0,0.05);
    }
    .ant-table-fixed-left .naui-resizer {
      z-index: 20;
    }
  `;
}

/**
 * Converts a list or object of lists into the filter format {"", ""}
 * @param {Array|string|Object} input - The input to convert (array or object with arrays as values)
 * @returns {string|Object} - The formatted string or object
 */
export const convertListToFilterFormat = (input) => {
  if (Array.isArray(input)) {
    // If input is an array, convert it to {"", ""}
    return `{${input.map((item) => `"${item}"`).join(",")}}`;
  } else if (typeof input === "object" && input !== null) {
    // If input is an object, convert each value (array or string) to {"", ""}
    const formattedObject = {};
    Object.keys(input).forEach((key) => {
      const value = input[key];
      if (Array.isArray(value) && value.length > 0) {
        formattedObject[key] = `{${value.map((item) => `"${item}"`).join(",")}}`;
      } else if (typeof value === "string" && value.trim() !== "") {
        // Handle string values
        formattedObject[key] = `{"${value}"}`;
      } else {
        formattedObject[key] = "{}"; // Empty braces for invalid or empty values
      }
    });
    return formattedObject;
  } else if (typeof input === "string" && input.trim() !== "") {
    // Handle single string input
    return `{"${input}"}`;
  }
  return "{}"; // Return empty braces for invalid input
};

export const RowsToDelete = (rows_to_delete) => {
  if (!rows_to_delete?.length) return 0;

  const result = rows_to_delete.reduce(
    (acc, row) => {
      if (row["[DM Rule].[Rule]"]) {
        acc.Version = row["[Version].[Version Name]"] || acc.Version;
        acc.Data_Object = row["[Data Object].[Data Object]"] || acc.Data_Object;
        acc.PlanType = row["[o9NetworkAggregation Network Plan Type].[o9NetworkAggregation Network Plan Type]"] || acc.PlanType;
        acc.Rule.push(row["[DM Rule].[Rule]"]);
      }
      return acc;
    },
    { Version: "", Data_Object: "", PlanType: "", Rule: [] }
  );

  const actionMap = {
    "Exclude Material Node": "SupplyPlan0016DeleteAggregationMaterialSkipRule",
    "Exclude Resource Node": "SupplyPlan0019DeleteAggregationResourceSkipRule",
  };

  const actionButton = actionMap[result.Data_Object];
  if (actionButton) {
    try {
      executeActionButton({ actionButton, payload: result });
      return 1;
    } catch (e) {
      console.error(e);
      return 0;
    }
  }

  return 0;
};
