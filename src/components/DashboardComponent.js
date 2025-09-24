import React, { useState, useEffect } from "react";
import { SimpleGrid } from "@chakra-ui/react";
import { Spin, Alert } from "antd";
import StatusCard from "./StatusCard";
import TableCard from "./TableCard";
import TableComponent from "./TableComponent";
import { API_BASE_URL } from "./HomePage"; // Import the constant

// DashboardComponent fetches data and columns from a URL, renders dynamically, and supports loading/error states
// Pass dataUrl and (optionally) onFiltersChange as props
function DashboardComponent({ dataUrl = `${API_BASE_URL}/read/network_summary1.csv`, onFiltersChange }) {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          // fallback: treat as CSV (not expected)
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
        setData(rows);
        // Build columns dynamically from keys (except 'key')
        if (rows.length > 0) {
          const keys = Object.keys(rows[0]).filter(k => k !== "key");
          setColumns(keys.map(k => ({ header: k.charAt(0).toUpperCase() + k.slice(1), accessor: k })));
        } else {
          setColumns([]);
        }
        // Optionally notify parent
        if (typeof onFiltersChange === "function") {
          const optionsMap = {};
          if (rows.length > 0) {
            Object.keys(rows[0]).forEach(k => {
              if (k === "key") return;
              const set = new Set();
              rows.forEach(r => {
                const v = r[k];
                if (v !== undefined && v !== null && String(v).trim() !== "") set.add(String(v));
              });
              optionsMap[k] = Array.from(set).sort();
            });
          }
          onFiltersChange({ activeFilters: {}, options: optionsMap });
        }
      } catch (err) {
        if (mounted) setError(String(err.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [dataUrl, onFiltersChange]);

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%"> {/* Reduced spacing */}
      <StatusCard
        title="No of Right Size Network"
        dataUrl={`${API_BASE_URL}/read/status_summary1.csv`}
        style={{ padding: "8px", fontSize: "14px" }} // Compact styling for StatusCard
      />
      <StatusCard
        title="No of Network Errors"
        dataUrl={`${API_BASE_URL}/read/status_summary2.csv`}
        style={{ padding: "8px", fontSize: "14px" }} // Compact styling for StatusCard
      />
      <TableCard title="Vs Previous Period">
        {loading ? (
          <Spin tip="Loading..." />
        ) : error ? (
          <Alert type="error" message={error} />
        ) : (
          <div style={{ maxHeight: "150px", overflowY: "auto" }}> {/* Fixed height for Table */}
            <TableComponent data={data} columns={columns} />
          </div>
        )}
      </TableCard>
    </SimpleGrid>
  );
}

export default DashboardComponent;
