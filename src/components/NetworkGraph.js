import React, { useEffect, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, Handle } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

const nodeWidth = 120;
const nodeHeight = 50;

// Custom Triangle Node Component
const TriangleNode = ({ data }) => {
  return (
    <div style={{ width: nodeWidth, height: nodeHeight, position: 'relative' }}>
      {/* Triangle shape using CSS borders */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${nodeWidth / 2}px solid transparent`,
          borderRight: `${nodeWidth / 2}px solid transparent`,
          borderBottom: `${nodeHeight}px solid #666`,
          position: 'relative',
        }}
      >
        {/* removed handles from here */}
      </div>

      {/* Centered handles so edges start/terminate at node center */}
      <Handle
        type="source"
        position="left"
        style={{
          // center the handle inside the node
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'transparent',
          border: 'none',
          zIndex: 10,
          width: 10,
          height: 10,
        }}
      />
      <Handle
        type="target"
        position="left"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'transparent',
          border: 'none',
          zIndex: 10,
          width: 10,
          height: 10,
        }}
      />

      {/* Label positioned at the center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '12px',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        {data.label}
      </div>
    </div>
  );
};

function getLayoutedElements(nodes, edges, direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Remove targetPosition and sourcePosition since we're using custom handles
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
}

const defaultNodeStyle = (extra = {}) => ({
  background: "#666",
  color: "white",
  borderRadius: "8px",
  padding: "5px",
  fontSize: "12px",
  ...extra,
});

export default function NetworkGraph({ dataUrl }) {
  const [rawData, setRawData] = useState([]);
  const [allColumns, setAllColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [elements, setElements] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch data
  useEffect(() => {
    if (!dataUrl) return;

    setLoading(true);
    fetch(dataUrl)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          setLoading(false);
          return;
        }

        setRawData(data);

        // Detect columns containing "Item"
        const itemKeys = Object.keys(data[0]).filter((k) =>
          k.toLowerCase().includes("item") || k.toLowerCase().includes("resource")
        );

        // Sort numerically if possible
        itemKeys.sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
          const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
          return numB - numA; // bottom → top
        });

        setAllColumns(itemKeys);
        setSelectedColumns(itemKeys); // default: all selected
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch data:", err);
        setLoading(false);
      });
  }, [dataUrl]);

  // 🔹 Build graph whenever data or selectedColumns changes
  useEffect(() => {
    if (rawData.length === 0 || selectedColumns.length === 0) return;

    const nodesMap = new Map();
    const edges = [];
    const edgesSet = new Set(); // To prevent duplicate edges

    rawData.forEach((row) => {
      let prev = null;

      selectedColumns.forEach((key) => {
        const val = row[key];
        if (!val) return;

        if (!nodesMap.has(val)) {
          nodesMap.set(val, {
            id: val,
            type: 'triangle', // Set to custom triangle type
            data: { label: val },
            position: { x: 0, y: 0 },
            draggable: true, // Enable dragging for nodes
          });
        }

        if (prev) {
          const edgeId = `${val}-${prev}`;
          if (!edgesSet.has(edgeId)) {
            edgesSet.add(edgeId);
            // use straight edges to avoid curved/smoothstep rendering
            edges.push({
              id: edgeId,
              source: val,
              target: prev,
              type: "straight",
            });
          }
        }

        prev = val;
      });
    });

    const nodes = Array.from(nodesMap.values());
    const layouted = getLayoutedElements(nodes, edges, "TB");
    setElements(layouted);
  }, [rawData, selectedColumns]);

  const toggleColumn = (col) => {
    setSelectedColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  if (loading) return <div>Loading network...</div>;

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Sidebar for column selection */}
      <div style={{ width: "150px", padding: "10px", borderRight: "1px solid #ccc" }}> {/* Reduced width for more space */}
        <h4>Columns</h4>
        {allColumns.map((col) => (
          <div key={col}>
            <label>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={() => toggleColumn(col)}
              />
              {col}
            </label>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div style={{ flex: 1 }}>
        <ReactFlow 
          nodes={elements.nodes} 
          edges={elements.edges} 
          nodeTypes={{ triangle: TriangleNode }} // Register custom node type
          fitView
        >
          <Background />
          <Controls />
          <MiniMap style={{ opacity: 0.4 }} /> {/* Make MiniMap almost transparent */}
        </ReactFlow>
      </div>
    </div>
  );
}
