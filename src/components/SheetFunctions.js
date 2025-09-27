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
    /* subtle background for all measure columns (reversed coloring) */
    .naui-meas-col .ant-table-cell,
    .naui-meas-col.ant-table-cell {
      background: #fffaf0;
    }
    /* NEW: highlight for maximized (expanded group) rows in Nested View */
    .naui-expanded-row > td {
      background: #e6f7ff !important;
    }
    /* strong vertical separator after the last dimension column (header + body) */
    .ant-table-thead > tr > th.naui-dim-last,
    .ant-table-tbody > tr > td.naui-dim-last {
      border-right: 3px solid #d9d9d9 !important;
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

    /* Resizer handle: narrow vertical hit area centered on the column edge.
       Right is negative so the handle sits exactly over the divider line for precise dragging. */
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
    /* subtle visible hover to show the shrink/expand area */
    .ant-table-thead > tr > th:hover .naui-resizer,
    .ant-table-thead > tr > th .naui-resizer:hover {
      background: rgba(0,0,0,0.05);
    }

    /* when columns are fixed-left ensure the header resizer remains clickable above the body */
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
    return `{${input.map((item) => `"${item}"`).join(',')}}`;
  } else if (typeof input === 'object' && input !== null) {
    // If input is an object, convert each value (array) to {"", ""}
    const formattedObject = {};
    Object.keys(input).forEach((key) => {
      const value = input[key];
      if (Array.isArray(value) && value.length > 0) {
        formattedObject[key] = `{${value.map((item) => `"${item}"`).join(',')}}`;
      } else {
        formattedObject[key] = '{}'; // Empty braces for invalid or empty arrays
      }
    });
    return formattedObject;
  }
  return '{}'; // Return empty braces for invalid input
};