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
  Select,
  Checkbox,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import ChartComponent from "./chartComponent";
// Add import for parser functions from the helper
import { parseMetaDataPayload, parseGenericJson, parseCsv, createCellEditPayload } from "./o9Interfacehelper";
import o9Interface from "./o9Interface";

// Main component: Handles data loading, editing, filtering, and rendering in table/chart modes
export default function SheetComponent({ dataUrl, data, onFiltersChange }) {
  // State for data and UI
  const [originalData, setOriginalData] = useState([]); // Master copy for filtering
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for editing and autosave
  const [editedKeys, setEditedKeys] = useState([]); // Keys of edited rows
  const editedKeysRef = useRef(new Set());
  const initialDataRef = useRef([]); // Snapshot for edit detection
  const saveTimersRef = useRef({}); // Debounce timers for autosave
  const savingRef = useRef(false); // Flag to prevent multiple simultaneous saves

  // State for selection and modals
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewVisible, setViewVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({}); // Active filters per column
  const [viewMode, setViewMode] = useState("table"); // "table" or "chart"
  const [saveLoading, setSaveLoading] = useState(false);

  // Add state for O9 payload components (to avoid conflict with existing filters)
  const [o9OriginalPayload, setO9OriginalPayload] = useState(null);
  const [o9Measures, setO9Measures] = useState([]);
  const [o9Attributes, setO9Attributes] = useState([]);
  const [o9Filters, setO9Filters] = useState([]);

  // Refs for cell inputs (for keyboard navigation)
  const cellRefs = useRef({});

  // Effect: Load and parse data from dataUrl or data prop
  useEffect(() => {
    loadData();
  }, [dataUrl, data]);

  // Helper: Load data (supports JSON, CSV, or pre-parsed objects)
  const loadData = async () => {
    let mounted = true;
    setLoading(true);
    setError(null);

    try {
      let rows = [];
      let colsFromPayload = null;
      let payload = null;

      if (data && typeof data === "object") {
        if (data?.Meta && data?.Data) {
          payload = data;
          const parsed = parseMetaDataPayload(data);
          rows = parsed.rows;
          colsFromPayload = parsed.cols;
        } else {
          rows = parseGenericJson(data);
        }
      } else if (dataUrl && typeof dataUrl === "object") {
        if (dataUrl?.Meta && dataUrl?.Data) {
          payload = dataUrl;
          const parsed = parseMetaDataPayload(dataUrl);
          rows = parsed.rows;
          colsFromPayload = parsed.cols;
        } else {
          rows = parseGenericJson(dataUrl);
        }
      } else {
        if (!dataUrl) throw new Error("No dataUrl or data provided");
        const res = await fetch(dataUrl);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const contentType = res.headers.get("content-type")?.toLowerCase() || "";

        if (contentType.includes("json")) {
          const json = await res.json();
          if (json?.Meta && json?.Data) {
            payload = json;
            const parsed = parseMetaDataPayload(json);
            rows = parsed.rows;
            colsFromPayload = parsed.cols;
          } else {
            rows = parseGenericJson(json);
          }
        } else {
          rows = await parseCsv(res);
        }
      }

      if (!mounted) return;

      // Extract measures, attributes, filters from payload if available
      if (payload) {
        setO9OriginalPayload(payload);
        const modelDef = payload.ModelDefinition || {};
        setO9Measures(modelDef.RegularMeasures?.map(m => m.Name) || []);
        const levelAttrs = modelDef.LevelAttributes || [];
        const attrMap = {};
        payload.Meta?.forEach(meta => {
          attrMap[meta.Name] = meta;
        });
        const attrs = levelAttrs.filter(a => !a.IsFilter).map(a => ({
          ...a,
          DimensionValues: attrMap[a.Name]?.DimensionValues || [],
        }));
        setO9Attributes(attrs);
        setO9Filters(payload.Filters || []);
      } else {
        setO9OriginalPayload(null);
        setO9Measures([]);
        setO9Attributes([]);
        setO9Filters([]);
      }

      setOriginalData(rows);
      setDataSource(rows);
      setColumns(colsFromPayload ? buildColumnsFromPayload(colsFromPayload) : buildEditableColumns(rows));

      // Store snapshot for edit detection
      initialDataRef.current = rows.map((r) => ({ ...r }));
      editedKeysRef.current.clear();
      setEditedKeys([]);

      // Notify parent of initial filters
      const optionsMap = computeOptionsMap(rows);
      if (onFiltersChange) onFiltersChange({ activeFilters: {}, options: optionsMap });
    } catch (err) {
      if (mounted) setError(err.message || String(err));
    } finally {
      if (mounted) setLoading(false);
    }

    return () => { mounted = false; };
  };

  // Helper: Build columns from payload (editable with highlighting)
  const buildColumnsFromPayload = (colsFromPayload) => {
    return colsFromPayload.map((c) => ({
      title: String(c.title).toUpperCase(),
      dataIndex: c.dataIndex,
      key: c.key,
      render: (text, record) => renderEditableCell(text, record, c.dataIndex),
    }));
  };

  // Helper: Build editable columns from data keys
  const buildEditableColumns = (rows) => {
    const first = rows?.[0] || {};
    const keys = Object.keys(first).filter((k) => k !== "key");
    return keys.map((k) => ({
      title: String(k).toUpperCase(),
      dataIndex: k,
      key: k,
      render: (text, record) => renderEditableCell(text, record, k),
    }));
  };

  // Helper: Render editable cell (input or checkbox with edit highlighting)
  const renderEditableCell = (text, record, dataIndex) => {
    const value = text ?? "";
    const isNum = (v) => !Number.isNaN(Number(String(v).replace(/,/g, "")));
    const valueStr = String(value).toLowerCase();
    const isBool = value === true || value === false || valueStr === "true" || valueStr === "false";
    const initRow = initialDataRef.current.find((ir) => ir.key === record.key);
    const initVal = initRow?.[dataIndex];
    const cellEdited = String(initVal ?? "") !== String(value ?? "");
    const commonStyle = {
      border: "none",
      padding: 0,
      backgroundColor: cellEdited ? "#fff6d6" : "transparent",
      width: "100%",
      borderRadius: 2,
    };
    const id = `${record.key}:::${dataIndex}`;

    if (isBool) {
      const checked = value === true || valueStr === "true";
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Checkbox
            id={id}
            checked={checked}
            onChange={(e) => {
              const updatedRow = handleCellChange(e.target.checked, record.key, dataIndex);
              // Trigger save for checkbox (immediate, guarded by savingRef)
              if (!savingRef.current) {
                savingRef.current = true;
                saveRow(record.key, updatedRow).finally(() => savingRef.current = false);
              }
            }}
            style={commonStyle}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    return (
      <div style={{ display: "flex", justifyContent: isNum(value) ? "center" : "flex-start", alignItems: "center" }}>
        <Input
          ref={(el) => { cellRefs.current[id] = el; }}
          value={String(value)}
          onChange={(e) => handleCellChange(e.target.value, record.key, dataIndex)}
          onBlur={() => {
            // Save on focus change (blur) if not already saving
            if (!savingRef.current) {
              savingRef.current = true;
              saveRow(record.key).finally(() => savingRef.current = false);
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, record.key, dataIndex)}
          onFocus={(e) => e.target.select?.()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          bordered={false}
          style={{ ...commonStyle, textAlign: isNum(value) ? "center" : "left" }}
          size="small"
        />
      </div>
    );
  };

  // Handler: Update cell value and trigger autosave
  const handleCellChange = (value, key, dataIndex) => {
    const updateData = (prev) => prev.map((row) => (row.key === key ? { ...row, [dataIndex]: value } : row));
    setOriginalData(updateData);
    setDataSource(updateData);

    // Return the updated row for immediate use in saveRow
    const updatedRow = updateData(originalData).find((r) => r.key === key);

    const initRow = initialDataRef.current.find((r) => r.key === key);
    const initVal = initRow?.[dataIndex];
    const nowDifferent = String(initVal ?? "") !== String(value ?? "");

    if (nowDifferent) {
      if (!editedKeysRef.current.has(key)) {
        editedKeysRef.current.add(key);
        setEditedKeys(Array.from(editedKeysRef.current));
      }
      // Removed immediate save; now saves on blur for Input or onChange for Checkbox
    } else {
      // Check if row matches original
      const currentRow = updatedRow; // Use the updated row for accuracy
      const stillDifferent = Object.keys(currentRow).some((k) => {
        if (k === "key") return false;
        const a = String(initialDataRef.current.find((ir) => ir.key === key)?.[k] ?? "");
        const b = String(currentRow[k] ?? "");
        return a !== b;
      });
      if (!stillDifferent && editedKeysRef.current.has(key)) {
        editedKeysRef.current.delete(key);
        setEditedKeys(Array.from(editedKeysRef.current));
      }
    }

    return updatedRow; // Return for use in saveRow
  };

  // Handler: Keyboard navigation and escape to revert
  const handleKeyDown = (e, recordKey, dataIndex) => {
    const colIndex = columns.findIndex((c) => c.dataIndex === dataIndex);
    const rowIndex = dataSource.findIndex((r) => r.key === recordKey);
    const makeId = (rKey, dIdx) => `${rKey}:::${dIdx}`;

    const focusId = (rIdx, cIdx) => {
      if (rIdx < 0 || rIdx >= dataSource.length || cIdx < 0 || cIdx >= columns.length) return;
      const id = makeId(dataSource[rIdx].key, columns[cIdx].dataIndex);
      const ref = cellRefs.current[id];
      ref?.focus?.();
      ref?.select?.();
    };

    if (e.key === "Enter" || e.key === "ArrowRight") {
      e.preventDefault();
      colIndex < columns.length - 1 ? focusId(rowIndex, colIndex + 1) : focusId(rowIndex + 1, 0);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      colIndex > 0 ? focusId(rowIndex, colIndex - 1) : focusId(rowIndex - 1, columns.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusId(rowIndex - 1, colIndex);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusId(rowIndex + 1, colIndex);
    } else if (e.key === "Escape") {
      const origRow = originalData.find((r) => r.key === recordKey);
      if (origRow) {
        const revertValue = origRow[dataIndex] ?? "";
        setOriginalData((prev) => prev.map((r) => (r.key === recordKey ? { ...r, [dataIndex]: revertValue } : r)));
        setDataSource((prev) => prev.map((r) => (r.key === recordKey ? { ...r, [dataIndex]: revertValue } : r)));
      }
      const id = `${recordKey}:::${dataIndex}`;
      const ref = cellRefs.current[id];
      ref?.focus?.();
      ref?.select?.();
    }
  };

  // Handler: View selected rows in modal
  const onView = () => {
    if (selectedRowKeys.length === 0 && dataSource.length === 0) {
      message.info("No rows to view");
      return;
    }
    setViewVisible(true);
  };

  // Handler: Download CSV
  const onDownload = () => {
    const rows = selectedRowKeys.length ? dataSource.filter((r) => selectedRowKeys.includes(r.key)) : dataSource;
    downloadCSV(rows, "network_export.csv");
  };

  // Helper: Download CSV
  const downloadCSV = (rows, filename) => {
    if (!rows?.length) {
      message.info("No rows to download");
      return;
    }
    const cols = columns.map((c) => c.dataIndex);
    const header = cols.join(",");
    const lines = rows.map((r) => cols.map((c) => {
      const v = String(r[c] ?? "");
      return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
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

  // Handler: Open filter modal
  const openFilter = () => setFilterVisible(true);

  // Helper: Compute options map for filters
  const computeOptionsMap = (data = originalData) => {
    const map = {};
    columns.forEach((col) => {
      const set = new Set();
      data.forEach((r) => {
        const v = r[col.dataIndex];
        if (v != null && String(v).trim()) set.add(String(v));
      });
      map[col.dataIndex] = Array.from(set).sort();
    });
    return map;
  };

  // Handler: Apply filters
  const applyFilters = () => {
    let filtered = originalData.slice();
    Object.entries(filters).forEach(([col, q]) => {
      if (!q) return;
      const qq = String(q).toLowerCase();
      filtered = filtered.filter((r) => String(r[col] ?? "").toLowerCase().includes(qq));
    });
    setDataSource(filtered);
    setSelectedRowKeys([]);
    setFilterVisible(false);
    const activeFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v?.trim()));
    const optionsMap = computeOptionsMap();
    if (onFiltersChange) onFiltersChange({ activeFilters, options: optionsMap });
  };

  // Handler: Reset filters
  const resetFilters = () => {
    setFilters({});
    setDataSource(originalData);
    setFilterVisible(false);
    const optionsMap = computeOptionsMap();
    if (onFiltersChange) onFiltersChange({ activeFilters: {}, options: optionsMap });
  };

  // Helper: Build CSV string
  const buildCSV = (rows, cols) => {
    const header = cols.join(",");
    const lines = rows.map((r) => cols.map((c) => {
      const v = String(r[c] ?? "");
      return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(","));
    return [header, ...lines].join("\r\n");
  };

  // Helper: Generate unique filename
  const generateFilenameHash = async (prefix = "edited", ext = "csv") => {
    try {
      const seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const data = new TextEncoder().encode(seed);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      return `${prefix}_${hashHex.slice(0, 16)}.${ext}`;
    } catch {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    }
  };

  // Helper: Save single row
  const saveRow = async (key, updatedRow = null) => {
    const row = updatedRow || originalData.find((r) => r.key === key);
    if (!row) return;

    // Skip if no edits for this row
    if (!editedKeysRef.current.has(key)) return;

    // Only proceed if we have the necessary data from payload
    if (!o9OriginalPayload || !o9Measures.length || !o9Attributes.length) {
      // Fallback to original CSV save if no payload data
      const cols = columns.map((c) => c.dataIndex);
      const csv = buildCSV([row], cols);
      try {
        const filename = await generateFilenameHash("edited_network", "csv");
        const res = await fetch(`http://127.0.0.1:8998/write/${filename}`, {
          method: "POST",
          headers: { "Content-Type": "text/csv;charset=utf-8" },
          body: csv,
        });
        if (!res.ok) throw new Error(`Save failed: ${res.status} ${res.statusText}`);
        message.success(`Auto-saved ${filename}`);
      } catch (err) {
        message.error(String(err.message || err));
      } finally {
        // No timer to clear
      }
      return;
    }

    try {
      const payload = createCellEditPayload(row, o9Measures, o9Attributes, o9Filters);
      // Wrap o9Interface.cellEdit in a Promise for async/await
      const response = await new Promise((resolve, reject) => {
        o9Interface.cellEdit(payload, {}, (result) => {
          if (result && result.error) {
            reject(new Error(`Cell edit failed: ${result.error}`));
          } else {
            resolve(result);
          }
        });
      });

      // Assume response is a payload with updated data; parse and update sheet
      if (response?.Meta && response?.Data) {
        const parsed = parseMetaDataPayload(response);
        const updatedRows = parsed.rows;
        const updatedCols = parsed.cols;

        // Update dataSource and originalData with new rows
        setOriginalData(updatedRows);
        setDataSource(updatedRows);
        setColumns(updatedCols ? buildColumnsFromPayload(updatedCols) : buildEditableColumns(updatedRows));

        // Update snapshot
        initialDataRef.current = updatedRows.map((r) => ({ ...r }));

        // Clear edited state for this row
        if (editedKeysRef.current.has(key)) {
          editedKeysRef.current.delete(key);
          setEditedKeys(Array.from(editedKeysRef.current));
        }

        message.success("Cell edit saved and sheet updated");
      } else {
        throw new Error("Invalid response from cellEdit");
      }
    } catch (err) {
      message.error(`Cell edit failed: ${err.message || String(err)}`);
      // On error, the value remains as is, and yellow highlight stays
    } finally {
      // No timer to clear
    }
  };

  // Handler: Save all edited rows
  const onSaveEdits = async () => {
    const keys = Array.from(editedKeysRef.current);
    if (!keys.length) {
      message.info("No edits to save");
      return;
    }
    const rowsToSend = originalData.filter((r) => keys.includes(r.key));
    const cols = columns.map((c) => c.dataIndex);
    const csv = buildCSV(rowsToSend, cols);
    setSaveLoading(true);
    try {
      const filename = await generateFilenameHash("edited_network", "csv");
      const res = await fetch(`http://127.0.0.1:8998/write/${filename}`, {
        method: "POST",
        headers: { "Content-Type": "text/csv;charset=utf-8" },
        body: csv,
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status} ${res.statusText}`);
      initialDataRef.current = originalData.map((r) => ({ ...r }));
      editedKeysRef.current.clear();
      setEditedKeys([]);
      message.success(`Edits saved as ${filename}`);
    } catch (err) {
      message.error(String(err.message || err));
    } finally {
      setSaveLoading(false);
    }
  };

  // Helper: Prepare chart data
  const chartFromData = (rows, cols) => {
    if (!rows?.length || !cols?.length) return { series: [], categories: [] };
    const keys = Object.keys(rows[0]).filter((k) => k !== "key");
    const categoryKey = keys[0];
    const seriesKeys = keys.slice(1).filter((k) => rows.some((r) => !Number.isNaN(Number(r[k]))));
    const categories = rows.map((r) => r[categoryKey]);
    const series = seriesKeys.map((k) => ({
      name: k,
      data: rows.map((r) => {
        const n = Number(String(r[k]).replace(/,/g, ""));
        return Number.isFinite(n) ? n : null;
      }),
    }));
    return { categories, series, categoryKey };
  };

  // Render
  const selectedRows = selectedRowKeys.length ? dataSource.filter((r) => selectedRowKeys.includes(r.key)) : [dataSource[0]].filter(Boolean);
  const rowSelection = { selectedRowKeys, onChange: setSelectedRowKeys };

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
              setDataSource(q ? originalData.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))) : originalData);
            }}
            style={{ width: 260 }}
          />
          <Tooltip title="View selected (or first row)">
            <Button icon={<EyeOutlined />} onClick={onView} size="small" />
          </Tooltip>
          <Tooltip title="Download selected (or all)">
            <Button icon={<DownloadOutlined />} onClick={onDownload} size="small" />
          </Tooltip>
          <Tooltip title="Filters">
            <Button icon={<FilterOutlined />} onClick={openFilter} size="small" />
          </Tooltip>
        </Space>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Button size="small" onClick={() => setViewMode("table")} type={viewMode === "table" ? "primary" : "default"}>
          Table
        </Button>
        <Button size="small" onClick={() => setViewMode("chart")} type={viewMode === "chart" ? "primary" : "default"}>
          Chart
        </Button>
      </div>

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
        (() => {
          const { categories, series, categoryKey } = chartFromData(dataSource, columns);
          return (
            <div style={{ height: 360 }}>
              <ChartComponent categories={categories} series={series} xKey={categoryKey} data={dataSource} />
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
        {selectedRows.length ? (
          <Table
            size="small"
            bordered
            dataSource={selectedRows}
            columns={columns.map((c) => ({ ...c, render: (t) => t }))
            }
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
        {columns.map((col) => (
          <div key={col.dataIndex} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, marginBottom: 4 }}>{col.title}</div>
            <Input
              size="small"
              placeholder="contains..."
              value={filters[col.dataIndex] || ""}
              onChange={(e) => {
                const nf = { ...filters, [col.dataIndex]: e.target.value };
                setFilters(nf);
                const optionsMap = computeOptionsMap();
                if (onFiltersChange) onFiltersChange({ activeFilters: nf, options: optionsMap });
              }}
            />
          </div>
        ))}
      </Modal>
    </div>
  );
}