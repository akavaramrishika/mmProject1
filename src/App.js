import React, { useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BaseEdge,
} from "reactflow";
import "reactflow/dist/style.css";

/* 🔥 YOUR RENDER BACKEND */
const API_URL = "https://mmproject1.onrender.com";

/* ================= ORGANIC EDGE ================= */
const OrganicEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
}) => {
  const curvature = 0.35;

  const c1x = sourceX + (targetX - sourceX) * curvature;
  const c1y = sourceY;

  const c2x = targetX - (targetX - sourceX) * curvature;
  const c2y = targetY;

  const path = `
    M ${sourceX},${sourceY}
    C ${c1x},${c1y}
      ${c2x},${c2y}
      ${targetX},${targetY}
  `;

  return (
    <BaseEdge
      path={path}
      style={{
        strokeWidth: 3,
        strokeLinecap: "round",
        ...style,
      }}
    />
  );
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);

  const centerX = 800;
  const centerY = 600;
  const radius = 450;

  /* ================= BUILD RADIAL LAYOUT ================= */
  const buildLayout = (data) => {
    const newNodes = [];
    const newEdges = [];

    // Root
    newNodes.push({
      id: "root",
      data: { label: "MindMapify" },
      position: { x: centerX, y: centerY },
      draggable: false,
      style: {
        width: 180,
        height: 180,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: 18,
        border: "4px solid #000",
        background: "#ffffff",
      },
    });

    const sections = Object.keys(data);
    const angleStep = (2 * Math.PI) / sections.length;

    sections.forEach((section, i) => {
      const angle = i * angleStep;

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const sectionId = `section-${i}`;

      newNodes.push({
        id: sectionId,
        data: { label: section },
        position: { x, y },
        draggable: false,
        style: {
          padding: "12px 22px",
          borderRadius: 25,
          border: "3px solid #4f46e5",
          background: "#eef2ff",
          fontWeight: "bold",
        },
      });

      newEdges.push({
        id: `edge-root-${i}`,
        source: "root",
        target: sectionId,
        type: "organic",
        style: { stroke: "#4f46e5" },
      });

      // CHILDREN
      const children = data[section];
      const childSpacing = 140;

      children.forEach((child, j) => {
        const childX = x + 320 * Math.cos(angle);
        const childY =
          y + (j - (children.length - 1) / 2) * childSpacing;

        const childId = `child-${i}-${j}`;

        newNodes.push({
          id: childId,
          data: { label: child },
          position: { x: childX, y: childY },
          draggable: false,
          style: {
            padding: "10px 18px",
            borderRadius: 20,
            border: "2px solid #6366f1",
            background: "#ffffff",
          },
        });

        newEdges.push({
          id: `edge-${sectionId}-${childId}`,
          source: sectionId,
          target: childId,
          type: "organic",
          style: { stroke: "#6366f1" },
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  /* ================= FILE UPLOAD ================= */
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.Mindmap) {
        buildLayout(result.Mindmap);
      } else {
        alert("Mindmap generation failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Backend connection failed.");
    }

    setLoading(false);
  };

  return (
    <div style={{ height: "100vh", background: "#f3f4f6" }}>
      <div style={{ padding: 30, textAlign: "center" }}>
        <h1>🌈 MindMapify</h1>
        <p>Upload PDF → Generate Smart Mindmap</p>

        <input type="file" accept=".pdf" onChange={handleUpload} />

        {loading && <p>Generating...</p>}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={{ organic: OrganicEdge }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
        <Background gap={25} />
      </ReactFlow>
    </div>
  );
}

export default App;