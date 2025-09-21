import React, { useMemo } from "react"; // Added useMemo for performance
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register required Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

/*
  ChartComponent
  - Adapted to work with SheetComponent's props: data (array of row objects), dimensions, measures, treeData, onDataChange.
  - Transforms tabular data into chart-friendly format:
    - If dimensions/measures are present (O9 data): Use first dimension as x-axis categories (unique values), aggregate measures by summing per category.
    - If no dimensions/measures (generic data): Derive from data—first column (excluding 'key') as category dimension, remaining columns as measures.
  - If no valid data, shows a placeholder.
  - onDataChange is accepted but not used (charts are read-only; extend if needed for interactivity).
*/
export default function ChartComponent({
  data = [], // Array of row objects from SheetComponent
  dimensions = [], // Array of { header: string } for dimension columns (O9 data)
  measures = [], // Array of { header: string } for measure columns (O9 data)
  treeData = [], // Ignored for now (could be used for hierarchical charts later)
  onDataChange, // Callback for data changes (not used here, as charts are read-only)
  title = "Chart View", // Default title
  stacked = false, // Passed through
  height = 320, // Passed through
}) {
  // Transform data into categories and series
  const { categories, series } = useMemo(() => {
    if (!data.length) {
      return { categories: [], series: [] }; // No data at all
    }

    let firstDim = "";
    let meas = [];

    if (dimensions.length > 0 && measures.length > 0) {
      // O9 data: Use provided dimensions and measures
      firstDim = dimensions[0].header;
      meas = measures;
    } else {
      // Generic data: Derive from columns
      const firstRow = data[0];
      const keys = Object.keys(firstRow).filter((k) => k !== "key");
      if (keys.length < 2) {
        return { categories: [], series: [] }; // Need at least 1 category + 1 measure column
      }
      firstDim = keys[0]; // First column as category
      meas = keys.slice(1).map((header) => ({ header })); // Remaining as measures
    }

    const categoryMap = new Map(); // { categoryValue: { measureHeader: sum } }

    // Aggregate data: Group by first dimension value and sum measures
    data.forEach((row) => {
      const cat = String(row[firstDim] ?? ""); // Category from first dimension
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {});
      }
      meas.forEach((measItem) => {
        const val = Number(row[measItem.header] ?? 0);
        if (!isNaN(val)) {
          categoryMap.get(cat)[measItem.header] = (categoryMap.get(cat)[measItem.header] || 0) + val;
        }
      });
    });

    // Build categories (sorted for consistency)
    const categories = Array.from(categoryMap.keys()).sort();

    // Build series: One per measure
    const series = meas.map((measItem) => ({
      name: measItem.header,
      data: categories.map((cat) => categoryMap.get(cat)[measItem.header] || 0),
    }));

    return { categories, series };
  }, [data, dimensions, measures]);

  // Palette (extended for more series)
  const palette = [
    "#2b7a78",
    "#f6c85f",
    "#ef553b",
    "#3b82f6",
    "#34d399",
    "#a78bfa",
    "#ff7ab6",
    "#60a5fa",
    "#fbbf24",
    "#f87171",
    "#06b6d4",
    "#84cc16",
    "#c084fc",
    "#fb7185",
    "#38bdf8",
    "#4ade80",
  ];

  const datasets = series.length
    ? series.map((s, idx) => {
        const color = palette[idx % palette.length];
        return {
          label: s.name,
          data: s.data,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1,
          barPercentage: stacked ? 1.0 : 0.6,
          categoryPercentage: stacked ? 1.0 : 0.8,
        };
      })
    : [
        {
          label: "No data",
          data: categories.map(() => 0),
          backgroundColor: "#e5e7eb",
          borderColor: "#9ca3af",
          borderWidth: 1,
        },
      ];

  const chartData = {
    labels: categories,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { boxWidth: 12, padding: 12 },
      },
      title: {
        display: Boolean(title),
        text: title,
        font: { size: 14, weight: "600" },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    scales: {
      x: {
        stacked,
        ticks: { maxRotation: 0, autoSkip: true },
        grid: { display: false },
      },
      y: {
        stacked,
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  return (
    <div style={{ width: "100%", height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
