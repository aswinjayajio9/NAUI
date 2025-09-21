import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  CaretUpOutlined,
  CaretDownOutlined,
} from "@ant-design/icons";
import ChartComponent from "./chartComponent";
// Add import for parser functions from the helper
import { parseMetaDataPayload, parseGenericJson, parseCsv, createCellEditPayload } from "./o9Interfacehelper";
import o9Interface from "./o9Interface";
  const CELL_MIN_HEIGHT = 5;
// Main component: Handles data loading, editing, filtering, and rendering in table/chart modes
export default function SheetComponent({ dataUrl, data, onFiltersChange, config, enableEdit = true }) {
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
  const [viewMode, setViewMode] = useState(enableEdit ? "table" : "chart"); // "table" | "chart" | "nested"; default to "chart" if !enableEdit
  // NEW: dimension group collapse state for Nested View
  const [dimGroupsMap, setDimGroupsMap] = useState({});      // { dimHeader: [{ id, value, rowKeys, firstKey }] }
  const [collapsedGroups, setCollapsedGroups] = useState({}); // { dimHeader: Set(groupId) }
  const [saveLoading, setSaveLoading] = useState(false);

  // Add sort state for header keyboard/controls
  const [sortConfig, setSortConfig] = useState({ col: null, order: null });

  // Add state for O9 payload components (to avoid conflict with existing filters)
  const [o9OriginalPayload, setO9OriginalPayload] = useState(null);
  const [o9Measures, setO9Measures] = useState([]);
  const [o9Attributes, setO9Attributes] = useState([]);
  const [o9Filters, setO9Filters] = useState([]);
  const [dimensions, setDimensions] = useState([]); // New: Dimension columns
  const [measures, setMeasures] = useState([]); // New: Measure columns
  const [treeData, setTreeData] = useState([]); // New: Tree structure
  // Map of { columnKey: { rowKey: rowSpanNumber | 0 } } used to merge repeated dimension cells vertically
  const [rowSpanMap, setRowSpanMap] = useState(computeRowSpanMap(dataSource, dimensions));

  // Refs for cell inputs (for keyboard navigation)
  const cellRefs = useRef({});
  // Ref used for drag-and-drop column reordering
  const dragIndexRef = useRef(null);
  // RAF throttle for mouse move updates (improves resize perf)
  const rafRef = useRef(null);
  // State & refs for column resizing
  const [columnWidths, setColumnWidths] = useState({});
  const resizingRef = useRef(null);
  const columnsRef = useRef(columns);
  useEffect(() => { columnsRef.current = columns; }, [columns]);
  
  // Initialize reasonable widths when columns change (preserve any manual widths)
  useEffect(() => {
    const next = { ...columnWidths };
    const dimHeaders = dimensions.map((d) => d.header);
    columns.forEach((c) => {
      if (!next[c.dataIndex]) {
        next[c.dataIndex] = c.width || (dimHeaders.includes(c.dataIndex) ? 180 : 140);
      }
    });
    setColumnWidths(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, dimensions]);

  // Mouse handlers for resizing
  const startResize = (dataIndex, e) => {
    e.preventDefault();
    const curWidth = columnWidths[dataIndex] ?? (columnsRef.current.find(c => c.dataIndex === dataIndex)?.width) ?? 140;
    resizingRef.current = { dataIndex, startX: e.clientX, startWidth: curWidth, pendingWidth: curWidth };
    // show resize cursor globally for better UX
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopResize);
  };

  const onMouseMove = (e) => {
    const r = resizingRef.current;
    if (!r) return;
    const delta = e.clientX - r.startX;
    const nextWidth = Math.max(40, Math.round(r.startWidth + delta));
    // store pending width and schedule a RAF update (throttles state updates)
    r.pendingWidth = nextWidth;
    if (rafRef.current == null) {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const cur = resizingRef.current;
        if (!cur) return;
        setColumnWidths(prev => {
          if (prev[cur.dataIndex] === cur.pendingWidth) return prev;
          return { ...prev, [cur.dataIndex]: cur.pendingWidth };
        });
      });
    }
  };

  const stopResize = () => {
    resizingRef.current = null;
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    document.body.style.cursor = ""; // restore
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", stopResize);
  };

  useEffect(() => () => {
    // cleanup on unmount
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", stopResize);
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Helper: Load data (supports JSON, CSV, or pre-parsed objects) - now wrapped in useCallback
  const loadData = useCallback(async () => {
    let mounted = true;
    setLoading(true);
    setError(null);

    try {
      let rows = [];
      let colsFromPayload = null;
      let payload = null;
      let dims = [];
      let meas = [];
      let tree = [];

      // Default config if not provided
      const finalConfig = config || { enabled: false };

      if (data && typeof data === "object") {
        if (data?.Meta && data?.Data) {
          payload = data;
          const parsed = parseMetaDataPayload(data, finalConfig);
          rows = parsed.rows;
          colsFromPayload = parsed.cols;
          dims = parsed.dimensions;
          meas = parsed.measures;
          tree = parsed.treeData;
        } else {
          rows = parseGenericJson(data);
        }
      } else if (dataUrl && typeof dataUrl === "object") {
        if (dataUrl?.Meta && dataUrl?.Data) {
          payload = dataUrl;
          const parsed = parseMetaDataPayload(dataUrl, finalConfig);
          rows = parsed.rows;
          colsFromPayload = parsed.cols;
          dims = parsed.dimensions;
          meas = parsed.measures;
          tree = parsed.treeData;
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
            const parsed = parseMetaDataPayload(json, finalConfig);
            rows = parsed.rows;
            colsFromPayload = parsed.cols;
            dims = parsed.dimensions;
            meas = parsed.measures;
            tree = parsed.treeData;
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
          attrMap[meta.Alias] = meta;  // Use Alias as key for mapping
        });
        const attrs = levelAttrs.filter(a => !a.IsFilter).map(a => ({
          ...a,
          DimensionValues: attrMap[a.Name]?.DimensionValues || [],  // Map by Name
        }));
        setO9Attributes(attrs);
        setO9Filters(payload.Filters || []);
        setDimensions(dims);
        setMeasures(meas);
        setTreeData(tree);
      } else {
        setO9OriginalPayload(null);
        setO9Measures([]);
        setO9Attributes([]);
        setO9Filters([]);
        setDimensions([]);
        setMeasures([]);
        setTreeData([]);
      }

      setOriginalData(rows);
      setDataSource(rows);
      setColumns(colsFromPayload ? buildColumnsFromPayload(colsFromPayload, dims, enableEdit) : buildEditableColumns(rows, enableEdit));

      // Store snapshot for edit detection
      initialDataRef.current = rows.map((r) => ({ ...r }));
      editedKeysRef.current.clear();
      setEditedKeys([]);

      // Set row counter for new row keys
      const maxKey = rows.length > 0 ? Math.max(...rows.map(r => parseInt(r.key) || 0)) : 0;
      setRowCounter(maxKey);

      // Notify parent of initial filters (only dimensions)
      const optionsMap = computeOptionsMap(rows, dims);
      if (onFiltersChange) onFiltersChange({ activeFilters: {}, options: optionsMap });
    } catch (err) {
      if (mounted) setError(err.message || String(err));
    } finally {
      if (mounted) setLoading(false);
    }

    return () => { mounted = false; };
  }, [dataUrl, data, onFiltersChange, config, enableEdit]);  // Add dependencies: re-create loadData only when these change

  // Effect: Load and parse data from dataUrl or data prop
  useEffect(() => {
    loadData();
  }, [loadData]);  // Now depend on loadData (stable due to useCallback)

  // Add state for hovered cell
  const [hoveredCell, setHoveredCell] = useState(null);

  // Add state for row counter to generate unique keys for new rows
  const [rowCounter, setRowCounter] = useState(0);

  // Helper: Build columns from payload (editable with highlighting and sticky dimensions)
  const buildColumnsFromPayload = (colsFromPayload, dims, enableEdit) => {
    const dimHeaders = dims.map(d => d.header); // Extract dimension headers
    const measureHeaders = measures.map(m => m.header); // Extract measure headers

    return colsFromPayload.map((c, idx) => {
      const isDimension = dimHeaders.includes(c.dataIndex);
      const editable = measureHeaders.includes(c.dataIndex) && enableEdit; // Only measures editable/draggable if enableEdit

      // store header text and flags; actual title node will be rendered at render-time so it can reflect current sort state
      return {
        headerText: String(c.title).toUpperCase(),
        dataIndex: c.dataIndex,
        key: c.key,
        editable,
        isDimension,
        // preserve render and onCell behavior; render a fixed-height placeholder for duplicate dimension rows
        render: (text, record) => {
          const isDuplicate = isDimension && (rowSpanMap[c.dataIndex]?.[record.key] === 0);
          const children = isDuplicate ? <div style={{ minHeight: CELL_MIN_HEIGHT }} /> : renderEditableCell(text, record, c.dataIndex, editable);
          return { children };
        },
        onCell: (record) => ({
          onMouseEnter: () => setHoveredCell(`${record.key}-${c.dataIndex}`),
          onMouseLeave: () => setHoveredCell(null),
        }),
      };
    });
  };

  // Helper: Build editable columns from data keys (assume all are measures for non-O9 data)
  const buildEditableColumns = (rows, enableEdit) => {
    const first = rows?.[0] || {};
    const keys = Object.keys(first).filter((k) => k !== "key");
    const dimHeaders = dimensions.map(d => d.header);

    return keys.map((k, idx) => {
      const isDimension = dimHeaders.includes(k);
      // store headerText and flags; actual title node will be rendered at render-time
      return {
        headerText: String(k).toUpperCase(),
        dataIndex: k,
        key: k,
        editable: !isDimension && enableEdit, // dimensions non-editable; only if enableEdit
        isDimension,
        render: (text, record) => {
          const isDuplicate = isDimension && (rowSpanMap[k]?.[record.key] === 0);
          const children = isDuplicate ? <div style={{ minHeight: CELL_MIN_HEIGHT }} /> : renderEditableCell(text, record, k, !isDimension && enableEdit);
          return { children };
        },
        onCell: (record) => ({
          onMouseEnter: () => setHoveredCell(`${record.key}-${k}`),
          onMouseLeave: () => setHoveredCell(null),
        }),
      };
    });
  };

  // New: header renderer that attaches sort icons (dimension-only), drag handlers and keyboard support
  const renderHeader = (text, dataIndex, isDimension, idx) => {
    const activeAsc = sortConfig.col === dataIndex && sortConfig.order === "asc";
    const activeDesc = sortConfig.col === dataIndex && sortConfig.order === "desc";
    const currentWidth = columnWidths[dataIndex];

    const onSort = (order, e) => {
      e?.stopPropagation();
      // apply sort
      handleSort(dataIndex, order);
    };

    return (
      <div
        tabIndex={0}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none", position: "relative" }}
        onKeyDown={(e) => {
          if (!isDimension) return;
          if (e.key === "ArrowUp") {
            e.preventDefault();
            handleSort(dataIndex, "asc");
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            handleSort(dataIndex, "desc");
          }
        }}
        // allow dragging for all column types (improves UX); swapping happens on drop
        draggable={true}
        onDragStart={(e) => {
          dragIndexRef.current = idx;
          e.dataTransfer.effectAllowed = "move";
          // use empty image to avoid dragging snapshot cost in some browsers
          try { e.dataTransfer.setDragImage(new Image(), 0, 0); } catch {}
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const from = dragIndexRef.current;
          const to = idx;
          if (from == null || from === to) return;
          setColumns((prevCols) => {
            const next = [...prevCols];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
          });
          dragIndexRef.current = null;
        }}
      >
        <div style={{ flex: 1, paddingRight: 8 }}>{text}</div>
        {/* Only show sort icons for dimensions, placed on rightmost side */}
        {isDimension ? (
          <div style={{ display: "flex", gap: 6 }}>
            <CaretUpOutlined
              onClick={(e) => onSort("asc", e)}
              style={{ color: activeAsc ? "#1890ff" : undefined, cursor: "pointer" }}
            />
            <CaretDownOutlined
              onClick={(e) => onSort("desc", e)}
              style={{ color: activeDesc ? "#1890ff" : undefined, cursor: "pointer" }}
            />
          </div>
        ) : null}
        {/* Resizer handle (visible on hover) */}
        <div
         className="naui-resizer"
          onMouseDown={(e) => startResize(dataIndex, e)}
          aria-hidden="true"
        />
      </div>
    );
  };

  // New: perform sort and update dataSource (simple localeCompare; numeric-aware)
  const handleSort = (col, order) => {
    setSortConfig({ col, order });
    const arr = [...dataSource];
    arr.sort((a, b) => {
      const av = a[col] ?? "";
      const bv = b[col] ?? "";
      // numeric-aware comparison when both look numeric
      const aNum = Number(String(av).replace(/,/g, ""));
      const bNum = Number(String(bv).replace(/,/g, ""));
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
    });
    if (order === "desc") arr.reverse();
    setDataSource(arr);
  };



  // Helper: Render editable cell (input or checkbox with edit highlighting and hover)
  const renderEditableCell = (text, record, dataIndex, editable = true) => {
    const value = text ?? "";
    const isNum = (v) => !Number.isNaN(Number(String(v).replace(/,/g, "")));
    const valueStr = String(value).toLowerCase();
    const isBool = value === true || value === false || valueStr === "true" || valueStr === "false";
    const initRow = initialDataRef.current.find((ir) => ir.key === record.key);
    const initVal = initRow?.[dataIndex];
    const cellEdited = String(initVal ?? "") !== String(value ?? "");
    const isHovered = hoveredCell === `${record.key}-${dataIndex}`;
    const commonStyle = {
      border: "none",
      padding: 6,
      backgroundColor: cellEdited ? "#fff6d6" : isHovered ? "#f0f0f0" : "transparent",
      width: "100%",
      borderRadius: 2,
      boxSizing: "border-box",
      minHeight: CELL_MIN_HEIGHT,
      height: "100%",
      display: "flex",
      alignItems: "center",
    };
    const id = `${record.key}:::${dataIndex}`;

    // If not editable (dimension or !enableEdit), render plain text with same wrapper so height stays consistent
    if (!editable) {
      return (
        <div style={commonStyle}>
          <div style={{ paddingTop: 0, width: "100%", textAlign: isNum(value) ? "center" : "left" }}>
            {String(value)}
          </div>
        </div>
      );
    }

    // Editable (measure): render input or checkbox
    if (isBool) {
      const checked = value === true || valueStr === "true";
      return (
        <div style={{ ...commonStyle, justifyContent: "center" }}>
          <Checkbox
            id={id}
            checked={checked}
            onChange={(e) => {
              handleCellChange(e.target.checked, record.key, dataIndex);
            }}
            style={{ margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    return (
      <div style={commonStyle}>
        <Input
          ref={(el) => { cellRefs.current[id] = el; }}
          value={String(value)}
          onChange={(e) => handleCellChange(e.target.value, record.key, dataIndex)}
          onKeyDown={(e) => handleKeyDown(e, record.key, dataIndex)}
          onFocus={(e) => e.target.select?.()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          bordered={false}
          style={{ height: "100%", padding: "0 6px", textAlign: isNum(value) ? "center" : "left" }}
          size="small"
        />
      </div>
    );
  };

  // Handler: Update cell value and trigger autosave
  const handleCellChange = (value, key, dataIndex) => {
    if (!enableEdit) return; // Prevent changes if editing disabled
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
    if (!enableEdit) return; // Prevent navigation if editing disabled
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

  // Helper: Compute options map for filters (only dimensions)
  const computeOptionsMap = (data = originalData, dims = dimensions) => {
    const map = {};
    dims.forEach((dim) => {
      const set = new Set();
      data.forEach((r) => {
        const v = r[dim.header];
        if (v != null && String(v).trim()) set.add(String(v));
      });
      map[dim.header] = Array.from(set).sort();
    });
    return map;
  };

  // Handler: Apply filters (only on dimensions)
  const applyFilters = () => {
    let filtered = originalData.slice();
    Object.entries(filters).forEach(([col, q]) => {
      if (!q || !dimensions.some(d => d.header === col)) return;  // Only filter dimensions
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
    const lines = rows.map((r) => 
      cols.map((c) => {
        const v = String(r[c] ?? "");
        return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(",")
    );
    return [header, ...lines].join("\r\n");
  };

  // Handler: Save a row (manual save for edited rows)
  const saveRow = async (key, updatedRow = null) => {
    if (!updatedRow) {
      updatedRow = dataSource.find((r) => r.key === key);
    }
    if (!updatedRow) return;

    try {
      const payload = createCellEditPayload(
        updatedRow,
        o9Measures,
        o9Attributes,
        o9Filters,
        parseInt(key)
      );

      const response = await fetch('https://your-o9-endpoint.com/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Save failed: ${response.status}`);

      // On success, remove from edited keys and update initial snapshot
      editedKeysRef.current.delete(key);
      setEditedKeys(Array.from(editedKeysRef.current));
      initialDataRef.current = initialDataRef.current.map((r) =>
        r.key === key ? { ...updatedRow } : r
      );

      message.success(`Row ${key} saved successfully`);
    } catch (error) {
      console.error('Save error:', error);
      message.error(`Save failed for row ${key}: ${error.message}`);
    }
  };

  // Handler: Save all edited rows
  const saveAllEdited = async () => {
    if (editedKeys.length === 0) {
      message.info('No changes to save');
      return;
    }

    setSaveLoading(true);
    try {
      const promises = editedKeys.map((key) => saveRow(key));
      await Promise.all(promises);
      message.success('All changes saved successfully');
    } catch (error) {
      message.error('Some saves failed');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handler: Add a new row
  const addRow = () => {
    if (!enableEdit) return; // Prevent adding if editing disabled
    const newKey = rowCounter + 1;
    setRowCounter(newKey);
    const newRow = { key: newKey };
    columns.forEach((col) => {
      newRow[col.dataIndex] = ""; // Default empty value
    });
    setDataSource((prev) => [...prev, newRow]);
    setOriginalData((prev) => [...prev, newRow]);
    // Add to initial snapshot
    initialDataRef.current.push({ ...newRow });
  };

  // Handler: Delete selected rows
  const deleteRows = () => {
    if (!enableEdit) return; // Prevent deleting if editing disabled
    if (selectedRowKeys.length === 0) {
      message.info("No rows selected to delete");
      return;
    }
    setDataSource((prev) => prev.filter((r) => !selectedRowKeys.includes(r.key)));
    setOriginalData((prev) => prev.filter((r) => !selectedRowKeys.includes(r.key)));
    // Remove from edited keys
    editedKeysRef.current = new Set(Array.from(editedKeysRef.current).filter((k) => !selectedRowKeys.includes(k)));
    setEditedKeys(Array.from(editedKeysRef.current));
    // Remove from initial snapshot
    initialDataRef.current = initialDataRef.current.filter((r) => !selectedRowKeys.includes(r.key));
    setSelectedRowKeys([]);
    message.success(`${selectedRowKeys.length} row(s) deleted`);
  };

  // Build / refresh dimension group metadata whenever dimensions or dataSource change
  useEffect(() => {
    if (!dimensions.length || !dataSource.length) {
      setDimGroupsMap({});
      setCollapsedGroups({});
      return;
    }
    const nextMap = {};
    const nextCollapsed = {};
    dimensions.forEach((d) => {
      const header = d.header;
      const groups = [];
      let curVal = null;
      let curGroup = null;
      dataSource.forEach((row, idx) => {
        const v = row[header];
        if (idx === 0 || String(v) !== String(curVal)) {
          // start new group
            curVal = v;
            curGroup = { id: row.key, value: v, rowKeys: [row.key], firstKey: row.key };
            groups.push(curGroup);
        } else {
          curGroup.rowKeys.push(row.key);
        }
      });
      nextMap[header] = groups;
      // DEFAULT: collapsed (show only first row) when group size > 1
      nextCollapsed[header] = new Set(groups.filter(g => g.rowKeys.length > 1).map(g => g.id));
    });
    setDimGroupsMap(nextMap);
    setCollapsedGroups(nextCollapsed);
  }, [dimensions, dataSource]);

  // Toggle a single dimension group (expand / collapse)
  const toggleDimGroup = (dimHeader, groupId) => {
    setCollapsedGroups(prev => {
      const setCopy = new Set(prev[dimHeader] || []);
      if (setCopy.has(groupId)) setCopy.delete(groupId); else setCopy.add(groupId);
      return { ...prev, [dimHeader]: setCopy };
    });
  };

  // Rows for Nested View:
  // For each row, if it belongs to ANY collapsed group (for ANY dimension) and is NOT that group's first row -> hide.
  const nestedViewRows = useMemo(() => {
    if (viewMode !== "nested") return dataSource;
    if (!dimensions.length) return dataSource;
    const collapsed = collapsedGroups;
    const dimGroupIndex = {}; // dim -> rowKey -> { group, isFirst }
    Object.entries(dimGroupsMap).forEach(([dim, groups]) => {
      const map = {};
      groups.forEach(g => {
        g.rowKeys.forEach((rk, i) => {
          map[rk] = { group: g, isFirst: i === 0 };
        });
      });
      dimGroupIndex[dim] = map;
    });

    return dataSource.filter(row => {
      // if any dimension group is collapsed and row not first in that group => filter out
      for (const dim of dimensions.map(d => d.header)) {
        const info = dimGroupIndex[dim]?.[row.key];
        if (info && collapsed[dim]?.has(info.group.id) && !info.isFirst) {
          return false;
        }
      }
      return true;
    });
  }, [viewMode, dataSource, dimensions, collapsedGroups, dimGroupsMap]);

  // Helper: quick lookup to know if a cell is first of its group & group size
  const dimGroupCellMeta = useMemo(() => {
    const meta = {};
    Object.entries(dimGroupsMap).forEach(([dim, groups]) => {
      const map = {};
      groups.forEach(g => {
        g.rowKeys.forEach((rk, idx) => {
          map[rk] = { isFirst: idx === 0, size: g.rowKeys.length, groupId: g.id };
        });
      });
      meta[dim] = map;
    });
    return meta;
  }, [dimGroupsMap]);

  // NEW: Compute set of row keys that belong to any expanded (maximized) group in nested view
  const expandedRowKeySet = useMemo(() => {
    if (viewMode !== "nested") return new Set();
    const set = new Set();
    Object.entries(dimGroupsMap).forEach(([dim, groups]) => {
      const collapsed = collapsedGroups[dim] || new Set();
      groups.forEach(g => {
        const isCollapsed = collapsed.has(g.id);
        if (!isCollapsed && g.rowKeys.length > 1) {
          g.rowKeys.forEach(rk => set.add(rk));
        }
      });
    });
    return set;
  }, [viewMode, dimGroupsMap, collapsedGroups]);

  // Before rendering the table, build columns with dynamic header nodes so sort icons reflect current sortConfig
  const columnsWithTitles = useMemo(() => {
    return columns.map((c, idx) => {
      const isDim = !!c.isDimension;
      const nextIsDim = !!columns[idx + 1]?.isDimension;
      let className;
      if (isDim) {
        className = nextIsDim ? "naui-dim-col" : "naui-dim-col naui-dim-last";
      } else {
        className = "naui-meas-col";
      }
      return {
        ...c,
        title: renderHeader(c.headerText ?? String(c.title ?? ""), c.dataIndex, isDim, idx),
        className,
        fixed: isDim ? "left" : undefined,
        width: columnWidths[c.dataIndex] || (isDim ? 180 : c.width),
        render: (text, record) => {
          // NORMAL table/chart view: keep original rowSpan blank behavior
          const duplicateInStandard = viewMode !== "nested" && isDim && (rowSpanMap[c.dataIndex]?.[record.key] === 0);
          if (!isDim) {
            const children = duplicateInStandard
              ? <div style={{ minHeight: CELL_MIN_HEIGHT }} />
              : renderEditableCell(text, record, c.dataIndex, c.editable);
            return { children };
          }

          // Dimension column:
          if (viewMode !== "nested") {
            const children = duplicateInStandard
              ? <div style={{ minHeight: CELL_MIN_HEIGHT }} />
              : (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span>{String(text ?? "")}</span>
                </div>
              );
            return { children };
          }

          // Nested view custom +/- per group with suppression of repeated values
          const cellMeta = dimGroupCellMeta[c.dataIndex]?.[record.key];
          const isFirst = cellMeta?.isFirst;
          const size = cellMeta?.size || 1;
          const groupId = cellMeta?.groupId;
          const isCollapsed = groupId && collapsedGroups[c.dataIndex]?.has(groupId);

          if (!isFirst) {
            // Group expanded: hide repeated dimension value (show blank placeholder)
            return { children: <div style={{ minHeight: CELL_MIN_HEIGHT }} /> };
          }

          const showToggle = size > 1;
          const toggleBtn = showToggle ? (
            <span
              onClick={(e) => { e.stopPropagation(); toggleDimGroup(c.dataIndex, groupId); }}
              style={{
                cursor: "pointer",
                display: "inline-flex",
                width: 16,
                justifyContent: "center",
                marginRight: 4,
                fontWeight: 600,
                userSelect: "none",
              }}
            >
              {isCollapsed ? "+" : "-"}
            </span>
          ) : <span style={{ width: 16, display: "inline-block" }} />;

          return {
            children: (
              <div style={{ display: "flex", alignItems: "center" }}>
                {toggleBtn}
                <span>{String(text ?? "")}</span>
              </div>
            ),
          };
        },
      };
    });
  }, [columns, rowSpanMap, sortConfig, hoveredCell, columnWidths, viewMode, collapsedGroups, dimGroupCellMeta]);

  // Build nested tree WITHOUT mutating the base dataSource (so table view shows no +/-)
  const nestedTreeData = useMemo(() => {
    if (!dimensions.length || !dataSource.length) return dataSource;
    const dimHeaders = dimensions.map(d => d.header);
    const groups = new Map();
    dataSource.forEach(r => {
      const key = dimHeaders.map(h => String(r[h] ?? "")).join("||");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
    const tree = [];
    groups.forEach((rows) => {
      if (rows.length === 1) {
        // single row: clone so we never attach children to original
        tree.push({ ...rows[0] });
      } else {
        const parentOrig = rows[0];
        const parent = { ...parentOrig }; // clone parent
        parent.children = rows.slice(1).map((r, i) => {
          // clone child; ensure unique key if same as parent
          return r.key === parentOrig.key
            ? { ...r, key: `${r.key}::c${i + 1}` }
            : { ...r };
        });
        tree.push(parent);
      }
    });
    return tree;
  }, [dataSource, dimensions]);

  // Recompute vertical rowSpan map for dimension columns whenever dataSource or dimensions change
  useEffect(() => {
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
    setRowSpanMap(map);
  }, [dataSource, dimensions]);

  // Render section
  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" showIcon />;

  const commonTableProps = {
    rowKey: "key",
    pagination: false,
    size: "small",
    scroll: { x: "max-content", y: 500 },
    rowSelection: {
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys),
    },
    // Removed onRow to prevent row click selection; only checkbox selects
  };

  return (
    <div style={{ padding: 16, backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
      {/* Styles for frozen dimension columns and hard divider after last dimension */}
      <style>{`
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
        /* subtle visible hover to show the user the shrink/expand area */
        .ant-table-thead > tr > th:hover .naui-resizer,
        .ant-table-thead > tr > th .naui-resizer:hover {
          background: rgba(0,0,0,0.05);
        }

        /* when columns are fixed-left ensure the header resizer remains clickable above the body */
        .ant-table-fixed-left .naui-resizer {
          z-index: 20;
        }
      `}</style>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<DownloadOutlined />} onClick={onDownload}>
          Download CSV
        </Button>
        <Button type="default" icon={<EyeOutlined />} onClick={onView} disabled={selectedRowKeys.length === 0}>
          View
        </Button>
        <Button type="default" icon={<FilterOutlined />} onClick={openFilter}>
          Filter
        </Button>
        {enableEdit && (
          <Button type="default" onClick={addRow}>
            Add Row
          </Button>
        )}
        {enableEdit && (
          <Button type="default" onClick={deleteRows} disabled={selectedRowKeys.length === 0}>
            Delete Row
          </Button>
        )}
        {enableEdit && (
          <Button
            type="primary"
            onClick={saveAllEdited}
            loading={saveLoading}
            disabled={editedKeys.length === 0}
          >
            Save Changes ({editedKeys.length})
          </Button>
        )}
        <Select
          value={viewMode}
          onChange={setViewMode}
          options={enableEdit ? [
            { label: "Table View", value: "table" },
            { label: "Chart View", value: "chart" },
            { label: "Nested View", value: "nested" },
          ] : [
            { label: "Chart View", value: "chart" },
            { label: "Nested View", value: "nested" },
          ]}
          style={{ width: 200 }}
        />
      </Space>
      {viewMode === "table" ? (
        <Table
          {...commonTableProps}
          dataSource={dataSource}
          columns={columnsWithTitles}
        />
      ) : viewMode === "chart" ? (
        <ChartComponent
          data={dataSource}
          dimensions={dimensions}
          measures={measures}
          treeData={treeData}
          onDataChange={(newData) => {
            setDataSource(newData);
            setOriginalData(newData);
          }}
        />
      ) : (
        <Table
          {...commonTableProps}
          dataSource={nestedViewRows}
          columns={columnsWithTitles}
          pagination={false}
          rowClassName={(record) =>
            expandedRowKeySet.has(record.key) ? "naui-expanded-row" : ""
          }
          // no default expand icon; we handle +/- per cell
          expandable={undefined}
        />
      )}
      <Modal
        visible={viewVisible}
        title="View Rows"
        onCancel={() => setViewVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          rowKey="key"
          pagination={false}
          size="small"
          scroll={{ x: "max-content", y: 400 }}
          dataSource={dataSource.filter((r) => selectedRowKeys.includes(r.key))}
          columns={columnsWithTitles}
        />
      </Modal>
      <Modal
        visible={filterVisible}
        title="Apply Filters"
        onCancel={() => setFilterVisible(false)}
        footer={
          <Space>
            <Button onClick={resetFilters}>
              Reset
            </Button>
            <Button type="primary" onClick={applyFilters}>
              Apply
            </Button>
          </Space>
        }
        width={600}
      >
        {dimensions.map((dim) => (
          <div key={dim.header} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>{dim.header}</div>
            <Input
              value={filters[dim.header]}
              onChange={(e) => setFilters({ ...filters, [dim.header]: e.target.value })}
              placeholder={`Filter ${dim.header}`}
            />
          </div>
        ))}
      </Modal>
    </div>
  );
}

// New: computeRowSpanMap function to calculate vertical rowSpan for dimension columns
function computeRowSpanMap(dataSource, dimensions) {
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