import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Input,
  Spin,
  Alert,
  Button,
  Space,
  Tooltip,
  Modal,
  message,
  Select, // added
  Checkbox, // added
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
  // SaveOutlined, // removed — auto-save now
} from "@ant-design/icons";
import ChartComponent from "./chartComponent"; // added

/*
  SheetComponent
  - Pass dataUrl (JSON records from pandas.DataFrame.to_dict(orient='records'))
  - Toolbar buttons (View / Download / Filters) are on the right, outside the table
  - Cells are visually simple (no tags/brackets) and editable (Input with no border)
  - Selection enabled; View/Download operate on selected rows (or all if none selected)
  - Simple filter modal: per-column "contains" text matching
*/

export default function SheetComponent({ dataUrl, onFiltersChange }) {
  const [originalData, setOriginalData] = useState([]); // master copy for filtering
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // new: track edited rows
  const [editedKeys, setEditedKeys] = useState([]); // array of keys that were edited
  const editedKeysRef = useRef(new Set());
  const initialDataRef = useRef([]); // snapshot of data as loaded (used to detect edits)

  // new: timers for per-row debounce autosave
  const saveTimersRef = useRef({});

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewVisible, setViewVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({}); // { col: 'text' }

  // view mode: "table" | "chart"
  const [viewMode, setViewMode] = useState("table");

  // load data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        if (!dataUrl) throw new Error("No dataUrl provided");
        const res = await fetch(dataUrl);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const ct = (res.headers.get("content-type") || "").toLowerCase();

        let rows = [];
        if (ct.includes("application/json") || ct.includes("text/json")) {
          const json = await res.json();
          if (Array.isArray(json)) {
            rows = json.map((r, i) => ({ key: r.key ?? r.id ?? String(i + 1), ...r }));
          } else if (json.data) {
            rows = (json.data || []).map((r, i) => ({ key: r.key ?? r.id ?? String(i + 1), ...r }));
          } else {
            const arr = Array.isArray(Object.values(json)) ? Object.values(json) : [];
            rows = arr.map((r, i) => ({ key: r.key ?? r.id ?? String(i + 1), ...r }));
          }
        } else {
          // small CSV fallback (shouldn't be necessary per your comment)
          const text = await res.text();
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length > 1) {
            const headers = lines[0].split(",").map(h => h.trim());
            rows = lines.slice(1).map((ln, i) => {
              const cells = ln.split(",").map(c => c.trim());
              const obj = {};
              headers.forEach((h, idx) => (obj[h] = cells[idx] ?? ""));
              obj.key = obj.key ?? String(i + 1);
              return obj;
            });
          } else {
            throw new Error("Unsupported response type (not JSON and not CSV)");
          }
        }

        if (!mounted) return;
        setOriginalData(rows);
        setDataSource(rows);
        setColumns(buildEditableColumns(rows));

        // store snapshot for edit detection
        initialDataRef.current = rows.map(r => ({ ...r }));
        editedKeysRef.current = new Set();
        setEditedKeys([]);

        // compute options map (unique values per column) from loaded rows
        const optionsMap = {};
        if (rows && rows.length > 0) {
          const rowKeys = Object.keys(rows[0]).filter(k => k !== "key");
          rowKeys.forEach(k => {
            const set = new Set();
            rows.forEach(r => {
              const v = r[k];
              if (v !== undefined && v !== null && String(v).trim() !== "") set.add(String(v));
            });
            optionsMap[k] = Array.from(set).sort();
          });
        } else {
          // ensure empty map
        }

        // notify parent that filters are currently empty (initial state)
        if (typeof onFiltersChange === "function") onFiltersChange({ activeFilters: {}, options: optionsMap });
      } catch (err) {
        if (mounted) setError(String(err.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [dataUrl]);

  // keep refs for inputs so we can move focus with keyboard (no visible change)
  const cellRefs = useRef({});

  // keyboard navigation and escape-to-revert
  const handleKeyDown = (e, recordKey, dataIndex) => {
    const key = e.key;
    if (!columns || columns.length === 0) return;

    const colIndex = columns.findIndex(c => c.dataIndex === dataIndex);
    const rowIndex = dataSource.findIndex(r => r.key === recordKey);
    const makeId = (rKey, dIdx) => `${rKey}:::${dIdx}`;

    const focusId = (rIdx, cIdx) => {
      if (rIdx < 0 || rIdx >= dataSource.length) return;
      if (cIdx < 0 || cIdx >= columns.length) return;
      const id = makeId(dataSource[rIdx].key, columns[cIdx].dataIndex);
      const ref = cellRefs.current[id];
      if (ref && typeof ref.focus === "function") {
        ref.focus();
        if (ref.select) ref.select();
      }
    };

    if (key === "Enter" || key === "ArrowRight") {
      e.preventDefault();
      // move to next column; if at end move to first column next row
      if (colIndex < columns.length - 1) focusId(rowIndex, colIndex + 1);
      else focusId(rowIndex + 1, 0);
      return;
    }

    if (key === "ArrowLeft") {
      e.preventDefault();
      if (colIndex > 0) focusId(rowIndex, colIndex - 1);
      else focusId(rowIndex - 1, columns.length - 1);
      return;
    }

    if (key === "ArrowUp") {
      e.preventDefault();
      focusId(rowIndex - 1, colIndex);
      return;
    }

    if (key === "ArrowDown") {
      e.preventDefault();
      focusId(rowIndex + 1, colIndex);
      return;
    }

    if (key === "Escape") {
      // revert to original value for that cell
      const origRow = originalData.find(r => r.key === recordKey);
      if (origRow) {
        const revertValue = origRow[dataIndex] ?? "";
        // update both states
        setOriginalData(prev => prev.map(r => (r.key === recordKey ? { ...r, [dataIndex]: revertValue } : r)));
        setDataSource(prev => prev.map(r => (r.key === recordKey ? { ...r, [dataIndex]: revertValue } : r)));
      }
      const id = `${recordKey}:::${dataIndex}`;
      const ref = cellRefs.current[id];
      if (ref && typeof ref.focus === "function") {
        ref.focus();
        if (ref.select) ref.select();
      }
      return;
    }
  };

  // build editable columns from data keys (keeps look: borderless small Inputs)
  const buildEditableColumns = (rows) => {
    const first = (rows && rows[0]) || {};
    const keys = Object.keys(first).filter(k => k !== "key");
    const cols = keys.map((k) => {
      const isNum = (v) => {
        if (v === null || v === undefined || v === "") return false;
        return !Number.isNaN(Number(String(v).replace(/,/g, "")));
      };

      return {
        title: String(k).toUpperCase(),
        dataIndex: k,
        key: k,
        render: (text, record) => {
          const value = text === undefined || text === null ? "" : text;
          const numeric = isNum(value);

          // detect boolean-like values (true/false or "true"/"false")
          const valueStr = String(value).toLowerCase();
          const isBool = value === true || value === false || valueStr === "true" || valueStr === "false";

          // determine whether this specific cell differs from the initial snapshot
          const initRow = initialDataRef.current.find(ir => ir.key === record.key);
          const initVal = initRow ? initRow[k] : undefined;
          const cellEdited = String(initVal ?? "") !== String(value ?? "");

          const commonStyle = {
            border: "none",
            padding: 0,
            backgroundColor: cellEdited ? "#fff6d6" : "transparent", // highlighted when edited
            width: "100%",
            borderRadius: 2,
          };

          const onChangeValue = (newVal) => {
            handleCellChange(newVal, record.key, k);
          };

          const id = `${record.key}:::${k}`;

          if (isBool) {
            const checked = value === true || valueStr === "true";
            return (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Checkbox
                  id={id}
                  checked={checked}
                  onChange={(e) => onChangeValue(e.target.checked)}
                  style={commonStyle}
                  // prevent row selection on click
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          }

          return (
            <div style={{ display: "flex", justifyContent: numeric ? "center" : "flex-start", alignItems: "center" }}>
              <Input
                ref={(el) => { cellRefs.current[id] = el; }}
                value={String(value ?? "")}                     // coerce to string so Input is controlled correctly
                onChange={(e) => onChangeValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, record.key, k)}
                onFocus={(e) => {
                  const target = e.target;
                  if (target && target.select) target.select();
                }}
                onMouseDown={(e) => e.stopPropagation()}       // prevent table row from stealing focus/click
                onClick={(e) => e.stopPropagation()}           // same for click
                bordered={false}
                style={{ ...commonStyle, textAlign: numeric ? "center" : "left" }}
                size="small"
              />
            </div>
          );
        },
      };
    });

    return cols;
  };

  // update both originalData and dataSource (so edits persist across filters)
  const handleCellChange = (value, key, dataIndex) => {
    setOriginalData(prev =>
      prev.map(row => (row.key === key ? { ...row, [dataIndex]: value } : row))
    );
    setDataSource(prev =>
      prev.map(row => (row.key === key ? { ...row, [dataIndex]: value } : row))
    );

    // detect if this row now differs from initial snapshot for this field -> mark edited
    const initRow = initialDataRef.current.find(r => r.key === key);
    const initVal = initRow ? initRow[dataIndex] : undefined;
    const nowDifferent = String(initVal ?? "") !== String(value ?? "");

    if (nowDifferent) {
      if (!editedKeysRef.current.has(key)) {
        editedKeysRef.current.add(key);
        setEditedKeys(Array.from(editedKeysRef.current));
      }
    } else {
      // if the field changed back to original, check if any other fields remain different
      const currentRow = (originalData.find(r => r.key === key) || {});
      const stillDifferent = Object.keys(currentRow).some(k => {
        if (k === "key") return false;
        const a = String(initialDataRef.current.find(ir => ir.key === key)?.[k] ?? "");
        const b = String(currentRow[k] ?? "");
        return a !== b;
      });
      if (!stillDifferent && editedKeysRef.current.has(key)) {
        editedKeysRef.current.delete(key);
        setEditedKeys(Array.from(editedKeysRef.current));
      }
    }

    // schedule autosave for this row (debounced)
    if (nowDifferent) {
      if (saveTimersRef.current[key]) clearTimeout(saveTimersRef.current[key]);
      saveTimersRef.current[key] = setTimeout(() => saveRow(key), 800);
    } else {
      // if row matches original, cancel pending save
      if (saveTimersRef.current[key]) {
        clearTimeout(saveTimersRef.current[key]);
        delete saveTimersRef.current[key];
      }
    }
  };

  // selection
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  // View selected rows (modal)
  const onView = () => {
    if (selectedRowKeys.length === 0) {
      // show single preview of first row if none selected
      if (dataSource.length === 0) {
        message.info("No rows to view");
        return;
      }
      setViewVisible(true);
      return;
    }
    setViewVisible(true);
  };

  const selectedRows = selectedRowKeys.length ? dataSource.filter(r => selectedRowKeys.includes(r.key)) : [dataSource[0]].filter(Boolean);

  // Download CSV of selected or all rows
  const downloadCSV = (rows, filename = "export.csv") => {
    if (!rows || rows.length === 0) {
      message.info("No rows to download");
      return;
    }
    const cols = columns.map(c => c.dataIndex);
    const header = cols.join(",");
    const lines = rows.map(r => cols.map(c => {
      const v = r[c] === undefined || r[c] === null ? "" : String(r[c]);
      // escape quotes and commas
      const escaped = v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      return escaped;
    }).join(","));
    const csv = [header, ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDownload = () => {
    const rows = selectedRowKeys.length ? dataSource.filter(r => selectedRowKeys.includes(r.key)) : dataSource;
    downloadCSV(rows, "network_export.csv");
  };

  // Filters: simple "contains" per column
  const openFilter = () => {
    setFilterVisible(true);
  };

  const computeOptionsMap = () => {
    const map = {};
    if (!columns || columns.length === 0) return map;
    columns.forEach(col => {
      const key = col.dataIndex;
      const set = new Set();
      originalData.forEach(r => {
        const v = r[key];
        if (v !== undefined && v !== null && String(v).trim() !== "") set.add(String(v));
      });
      map[key] = Array.from(set).sort();
    });
    return map;
  };

  const applyFilters = () => {
    let filtered = originalData.slice();
    Object.entries(filters).forEach(([col, q]) => {
      if (!q) return;
      const qq = String(q).toLowerCase();
      filtered = filtered.filter(r => {
        const v = r[col];
        return String(v ?? "").toLowerCase().includes(qq);
      });
    });
    setDataSource(filtered);
    setSelectedRowKeys([]); // clear selection
    setFilterVisible(false);

    // send only active (non-empty) filters to parent
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && String(v).trim() !== "")
    );
    const optionsMap = computeOptionsMap();
    if (typeof onFiltersChange === "function") onFiltersChange({ activeFilters, options: optionsMap });
  };

  const resetFilters = () => {
    const nf = {};
    setFilters(nf);
    const optionsMap = computeOptionsMap();
    if (typeof onFiltersChange === "function") onFiltersChange({ activeFilters: {}, options: optionsMap });
    setDataSource(originalData);
    setFilterVisible(false);
  };

  // helper: make CSV from rows and columns
  const buildCSV = (rowsToExport, cols) => {
    const header = cols.join(",");
    const lines = rowsToExport.map(r => cols.map(c => {
      const v = r[c] === undefined || r[c] === null ? "" : String(r[c]);
      const escaped = v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      return escaped;
    }).join(","));
    return [header, ...lines].join("\r\n");
  };

  // helper: generate unique filename using SHA-256 of timestamp+random
  const generateFilenameHash = async (prefix = "edited", ext = "csv") => {
    try {
      const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const data = new TextEncoder().encode(seed);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      return `${prefix}_${hashHex.slice(0, 16)}.${ext}`; // shortened for readability
    } catch (e) {
      // fallback
      const fallback = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      return fallback;
    }
  };

  // save a single row to write/{hash}.csv (used by autosave)
  const saveRow = async (key) => {
    const row = originalData.find(r => r.key === key);
    if (!row) return;

    const cols = columns.map(c => c.dataIndex);
    const csv = buildCSV([row], cols);

    try {
      const filename = await generateFilenameHash("edited_network", "csv");
      const url = `http://127.0.0.1:8998/write/${filename}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
        },
        body: csv,
      });

      if (!res.ok) {
        throw new Error(`Save failed: ${res.status} ${res.statusText}`);
      }

      // update initial snapshot for this row and clear edited mark
      const idx = initialDataRef.current.findIndex(r => r.key === key);
      if (idx >= 0) initialDataRef.current[idx] = { ...row };
      else initialDataRef.current.push({ ...row });

      if (editedKeysRef.current.has(key)) {
        editedKeysRef.current.delete(key);
        setEditedKeys(Array.from(editedKeysRef.current));
      }

      message.success(`Auto-saved ${filename}`);
    } catch (err) {
      message.error(String(err.message || err));
    } finally {
      if (saveTimersRef.current[key]) {
        clearTimeout(saveTimersRef.current[key]);
        delete saveTimersRef.current[key];
      }
    }
  };

  const [saveLoading, setSaveLoading] = useState(false);

  // send edited rows as CSV to write/{filename.csv}
  const onSaveEdits = async () => {
    const keys = Array.from(editedKeysRef.current);
    if (keys.length === 0) {
      message.info("No edits to save");
      return;
    }

    const rowsToSend = originalData.filter(r => keys.includes(r.key));
    if (rowsToSend.length === 0) {
      message.info("No edited rows to send");
      return;
    }

    const cols = columns.map(c => c.dataIndex);
    const csv = buildCSV(rowsToSend, cols);

    setSaveLoading(true);
    try {
      const filename = await generateFilenameHash("edited_network", "csv");
      const url = `http://127.0.0.1:8998/write/${filename}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
        },
        body: csv,
      });

      if (!res.ok) {
        throw new Error(`Save failed: ${res.status} ${res.statusText}`);
      }

      // success: clear edited marks and update initial snapshot to current data
      initialDataRef.current = originalData.map(r => ({ ...r }));
      editedKeysRef.current.clear();
      setEditedKeys([]);
      message.success(`Edits saved as ${filename}`);
    } catch (err) {
      message.error(String(err.message || err));
    } finally {
      setSaveLoading(false);
    }
  };

  // helper to derive columns for ChartComponent (simple x/y mapping)
  const chartFromData = (rows, cols) => {
    if (!rows || !rows.length || !cols || !cols.length) return { series: [], categories: [] };
    // pick first non-key column as category, next numeric columns as series
    const keys = Object.keys(rows[0]).filter(k => k !== "key");
    const categoryKey = keys[0];
    const seriesKeys = keys.slice(1).filter(k => rows.some(r => !Number.isNaN(Number(r[k]))));
    const categories = rows.map(r => r[categoryKey]);
    const series = seriesKeys.map(k => ({
      name: k,
      data: rows.map(r => {
        const v = r[k];
        const n = Number(String(v).replace(/,/g, ""));
        return Number.isFinite(n) ? n : null;
      })
    }));
    return { categories, series, categoryKey };
  };

  // when rendering the sheet, show toolbar with toggle and either Table or Chart
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Sheet</h3>

        <Space>
          <Input
            placeholder="Quick search..."
            prefix={<SearchOutlined />}
            size="small"
            onChange={(e) => {
              const q = e.target.value.trim().toLowerCase();
              if (!q) {
                setDataSource(originalData);
                return;
              }
              // simple global contains search
              const filtered = originalData.filter(r => Object.values(r).some(v => String(v ?? "").toLowerCase().includes(q)));
              setDataSource(filtered);
            }}
            style={{ width: 260 }}
          />

          <Tooltip title="View selected (or first row)">
            <Button icon={<EyeOutlined />} onClick={onView} size="small" />
          </Tooltip>
          <Tooltip title="Download selected (or all)">
            <Button icon={<DownloadOutlined />} onClick={onDownload} size="small" />
          </Tooltip>

          {/* Save button removed — edits are auto-saved on change */}

          <Tooltip title="Filters">
            <Button icon={<FilterOutlined />} onClick={openFilter} size="small" />
          </Tooltip>
        </Space>
      </div>

      {/* toggle buttons for view mode: table / chart */}
      <div style={{ marginBottom: 8 }}>
        <Button size="small" onClick={() => setViewMode("table")} type={viewMode === "table" ? "primary" : "default"}>
          Table
        </Button>
        <Button size="small" onClick={() => setViewMode("chart")} type={viewMode === "chart" ? "primary" : "default"}>
          Chart
        </Button>
      </div>

      {/* content: table or chart */}
      {viewMode === "table" ? (
        <Table
          rowKey="key"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          rowSelection={rowSelection}
          pagination={false}
          scroll={{ x: "max-content", y: 420 }}
          sticky
        />
      ) : (
        // simple ChartComponent usage — adapt props if your ChartComponent API differs
        (() => {
          const { categories, series, categoryKey } = chartFromData(dataSource, columns);
          // map to ChartComponent accepted shape; adjust if necessary
          return (
            <div style={{ height: 360 }}>
              <ChartComponent
                categories={categories}
                series={series}
                xKey={categoryKey}
                // optional: pass full data
                data={dataSource}
              />
            </div>
          );
        })()
      )}

      <Modal
        visible={viewVisible}
        title={selectedRowKeys.length ? `Viewing ${selectedRowKeys.length} row(s)` : "Viewing row"}
        footer={<Button onClick={() => setViewVisible(false)} size="small">Close</Button>}
        onCancel={() => setViewVisible(false)}
        width={800}
      >
        {selectedRows && selectedRows.length > 0 ? (
          <Table
            size="small"
            bordered
            dataSource={selectedRows}
            columns={columns.map(c => ({ ...c, render: (t) => (t) }))} // show raw values in view modal
            pagination={false}
            rowKey="key"
          />
        ) : (
          <div>No row selected</div>
        )}
      </Modal>

      <Modal
        visible={filterVisible}
        title="Filters"
        onCancel={() => setFilterVisible(false)}
        footer={[
          <Button key="reset" onClick={resetFilters} size="small">Reset</Button>,
          <Button key="apply" type="primary" onClick={applyFilters} size="small">Apply</Button>,
        ]}
      >
        {columns.map(col => (
          <div key={col.dataIndex} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>{col.title}</div>
            <Input
              size="small"
              placeholder={`contains...`}
              value={filters[col.dataIndex] || ""}
              onChange={(e) => {
                const nv = e.target.value;
                const nf = { ...filters, [col.dataIndex]: nv };
                setFilters(nf);
                // provide active filters + current options to parent
                const optionsMap = computeOptionsMap();
                if (typeof onFiltersChange === "function") onFiltersChange({ activeFilters: nf, options: optionsMap });
              }}
            />
          </div>
        ))}
      </Modal>
    </div>
  );
}