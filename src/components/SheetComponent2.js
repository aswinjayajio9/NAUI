import React, { useState, useLayoutEffect, useRef } from "react";
import { message, Button, Space, Modal, Input } from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import { parseMetaDataPayload } from "./o9Interfacehelper";
import Grid from "@toast-ui/react-grid";
import "tui-grid/dist/tui-grid.css";

export default function SheetComponent2({ data, onFiltersChange }) {
  const [gridData, setGridData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [viewVisible, setViewVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [frozenColumnIndex, setFrozenColumnIndex] = useState(3);
  const [treeColumnName, setTreeColumnName] = useState('');
  const [headerConfig, setHeaderConfig] = useState(undefined); // moved/added before effect
  const gridRef = useRef(null);

  // Initialize data and columns using parseMetaDataPayload
  useLayoutEffect(() => {
    if (data && typeof data === "object" && data.Meta && data.Data) {
      const parsed = parseMetaDataPayload(data);

      // map columns and set sensible defaults
      const mappedCols = parsed.cols.map((col) => ({
        name: col.dataIndex,
        header: col.title,
        width: col.width || 140,
        align: col.align || "left",
        editor: col.editable ? "text" : undefined,
      }));

      // detect grouped header (Detail Info) by header text
      const detailNames = mappedCols
        .filter((c) =>
          ["type", "genre", "release"].includes(String(c.header).toLowerCase())
        )
        .map((c) => c.name);

      const headerOption =
        detailNames.length > 0
          ? { height: 56, complexColumns: [{ header: "Detail Info", childNames: detailNames }] }
          : undefined;

      // determine tree column name
      if (typeof parsed.dimensions === "string") {
        setTreeColumnName(parsed.dimensions);
      } else if (parsed.dimensions && typeof parsed.dimensions === "object" && parsed.dimensions.treeColumnName) {
        setTreeColumnName(parsed.dimensions.treeColumnName);
      } else {
        setTreeColumnName('');
      }

      // determine frozen columns from dimensions:
      // support: array of column names, object with .columns/.frozenColumns array,
      // numeric frozenColumnIndex, or fallback default
      let computedFrozenIndex = 3; // fallback

      if (Array.isArray(parsed.dimensions)) {
        // treat array as list of column names to freeze
        const frozenNames = parsed.dimensions.map((s) => String(s).toLowerCase());
        let lastIdx = -1;
        mappedCols.forEach((c, idx) => {
          if (frozenNames.includes(String(c.name).toLowerCase()) || frozenNames.includes(String(c.header).toLowerCase())) {
            lastIdx = idx;
          }
        });
        if (lastIdx >= 0) computedFrozenIndex = lastIdx + 1;
      } else if (parsed.dimensions && typeof parsed.dimensions === "object") {
        const obj = parsed.dimensions;
        const namesArr = Array.isArray(obj.columns) ? obj.columns
                          : Array.isArray(obj.frozenColumns) ? obj.frozenColumns
                          : null;
        if (namesArr && namesArr.length) {
          const frozenNames = namesArr.map((s) => String(s).toLowerCase());
          let lastIdx = -1;
          mappedCols.forEach((c, idx) => {
            if (frozenNames.includes(String(c.name).toLowerCase()) || frozenNames.includes(String(c.header).toLowerCase())) {
              lastIdx = idx;
            }
          });
          if (lastIdx >= 0) computedFrozenIndex = lastIdx + 1;
        } else if (Number.isInteger(obj.frozenColumnIndex)) {
          computedFrozenIndex = obj.frozenColumnIndex;
        } else if (typeof obj === "number") {
          computedFrozenIndex = obj;
        }
      } else if (typeof parsed.dimensions === "number") {
        computedFrozenIndex = parsed.dimensions;
      }

      setGridData(parsed.rows);
      setFilteredData(parsed.rows);
      setColumns(mappedCols);
      setHeaderConfig(headerOption);
      setFrozenColumnIndex(computedFrozenIndex);
      setIsReady(true);

      // refresh layout after DOM updates
      setTimeout(() => {
        if (gridRef.current) gridRef.current.getInstance().refreshLayout();
      }, 0);
    } else {
      message.error("Invalid data provided");
      setIsReady(false);
    }
  }, [data]);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...gridData];
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((row) =>
          String(row[key] || "").toLowerCase().includes(value.toLowerCase())
        );
      }
    });
    setFilteredData(filtered);
    setViewVisible(false);
    if (onFiltersChange) {
      onFiltersChange({ activeFilters: filters });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setFilteredData(gridData);
    if (onFiltersChange) {
      onFiltersChange({ activeFilters: {} });
    }
  };

  // Download CSV using Grid's export method
  const downloadCSV = () => {
    if (gridRef.current) {
      gridRef.current.getInstance().export('csv');
    } else {
      message.info("Grid not ready");
    }
  };

  return (
    <div className="naui-sheet-root">
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<DownloadOutlined />} onClick={downloadCSV}>
          Download CSV
        </Button>
        <Button type="default" icon={<EyeOutlined />} onClick={() => setViewVisible(true)}>
          Filter
        </Button>
      </Space>

      {isReady && columns.length > 0 ? (
        <Grid
          ref={gridRef}
          data={filteredData}
          columns={columns}
          rowHeaders={["rowNum", "checkbox"]}
          header={headerConfig}
          bodyHeight={500}
          style={{ width: "100%" }}
          columnOptions={{
            resizable: true,
            frozenBorderWidth: 1,
            minWidth: 100,
            scrollX: true,
          }}
          frozenColumnIndex={frozenColumnIndex}
          treeColumnName={treeColumnName || undefined}
        />
      ) : (
        <div>Loading grid...</div>
      )}

      <Modal open={viewVisible} title="Apply Filters" onCancel={() => setViewVisible(false)} footer={
        <Space>
          <Button onClick={resetFilters}>Reset</Button>
          <Button type="primary" onClick={applyFilters}>Apply</Button>
        </Space>
      }>
        {columns.map((col) => (
          <div key={col.name} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>{col.header}</div>
            <Input value={filters[col.name] || ""} onChange={(e) => setFilters({ ...filters, [col.name]: e.target.value })} placeholder={`Filter ${col.header}`} />
          </div>
        ))}
      </Modal>
    </div>
  );
}