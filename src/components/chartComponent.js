import React from "react";
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

// register required chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

/*
  ChartComponent
  - Controlled/simple adapter for SheetComponent
  - Props:
    - categories: array of category labels for x-axis (e.g. ["ERP","OP","MP"...])
    - series: array of { name: string, data: number[] }
    - title: optional chart title
    - type/stacked/height: optional visual controls
  - If series/categories are missing it renders an empty placeholder chart.
*/
export default function ChartComponent({
  categories = [],
  series = [],
  title = "",
  stacked = false,
  height = 320,
}) {
  // palette (extend as needed)
  const palette = [
    "#2b7a78", // teal
    "#f6c85f", // yellow
    "#ef553b", // red/orange
    "#3b82f6", // blue
    "#34d399", // green
    "#a78bfa", // purple
    "#ff7ab6", // pink
    "#60a5fa", // light blue
  ];

  const datasets =
    Array.isArray(series) && series.length
      ? series.map((s, idx) => {
          const color = palette[idx % palette.length];
          return {
            label: s.name || `Series ${idx + 1}`,
            data: Array.isArray(s.data) ? s.data.map((v) => (v === null || v === undefined ? null : Number(v))) : [],
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1,
            // small visual padding between bars when not stacked
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

  const data = {
    labels: Array.isArray(categories) ? categories : [],
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
      <Bar data={data} options={options} />
    </div>
  );
}
