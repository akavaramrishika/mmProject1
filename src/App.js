import React, { useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BaseEdge,
} from "reactflow";
import "reactflow/dist/style.css";

const API_URL = "http://127.0.0.1:5000/upload"; // 🔥 Replace after deployment

const OrganicEdge = ({ sourceX, sourceY, targetX, targetY, style = {} }) => {
  const path = `
    M ${sourceX},${sourceY}
    C ${sourceX + 220},${sourceY}
      ${targetX - 220},${targetY}
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
  const [mindmapData, setMindmapData] = useState({});
  const [expanded, setExpanded] = useState([]);
  const [loading, setLoading] = useState(false);

  const centerX = 1100;
  const centerY = 700;
  const sectionOffsetX = 550;
  const childOffsetX = 450;
  const childSpacing = 130;

  const colors = [
    "#FF6B6B",
    "#6C5CE7",
    "#00B894",
    "#FDCB6E",
    "#0984E3",
    "#E84393",
  ];

  const buildLayout = (data, expandedSections) => {
    let newNodes = [];
    let newEdges = [];

    const sections = Object.keys(data);
    const mid = Math.ceil(sections.length / 2);
    const leftSections = sections.slice(0, mid);
    const rightSections = sections.slice(mid);

    newNodes.push({
      id: "root",
      data: { label: "MindMapify" },
      position: { x: centerX, y: centerY },
      draggable: false,
      style: {
        width: 240,
        height: 240,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#6C5CE7,#00B894)",
        color: "white",
        border: "8px solid white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: "26px",
      },
    });

    const placeSide = (sectionList, isLeft) => {
      const sectionHeights = sectionList.map((section) => {
        const childCount = (data[section] || []).length;
        return Math.max(260, childCount * childSpacing + 180);
      });

      const totalHeight = sectionHeights.reduce((a, b) => a + b, 0);
      let currentY = centerY - totalHeight / 2;

      sectionList.forEach((section, index) => {
        const blockHeight = sectionHeights[index];
        const blockStartY = currentY;
        const sectionY = blockStartY + blockHeight / 2;

        const sectionX = isLeft
          ? centerX - sectionOffsetX
          : centerX + sectionOffsetX;

        const id = `${isLeft ? "L" : "R"}-section-${index}`;
        const color = colors[index % colors.length];

        newNodes.push({
          id,
          data: { label: section },
          position: { x: sectionX, y: sectionY },
          draggable: false,
          style: {
            background: color,
            color: "white",
            padding: "18px 35px",
            borderRadius: "40px",
            minWidth: 280,
            fontWeight: "600",
          },
        });

        newEdges.push({
          id: `e-root-${id}`,
          source: "root",
          target: id,
          type: "organic",
          style: { stroke: color },
        });

        if (expandedSections.includes(id)) {
          const children = data[section] || [];

          children.slice(0, 6).forEach((child, i) => {
            const childY = blockStartY + 100 + i * childSpacing;
            const childX = isLeft
              ? sectionX - childOffsetX
              : sectionX + childOffsetX;

            const childId = `${id}-child-${i}`;

            newNodes.push({
              id: childId,
              data: { label: child },
              position: { x: childX, y: childY },
              draggable: false,
              style: {
                background: "#fff",
                padding: "16px 30px",
                borderRadius: "30px",
                minWidth: 340,
                border: `3px solid ${color}`,
              },
            });

            newEdges.push({
              id: `e-${id}-${childId}`,
              source: id,
              target: childId,
              type: "organic",
              style: { stroke: color },
            });
          });
        }

        currentY += blockHeight;
      });
    };

    placeSide(leftSections, true);
    placeSide(rightSections, false);

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const onNodeClick = (event, node) => {
    if (!node.id.includes("section")) return;
    let updated = [...expanded];
    if (expanded.includes(node.id)) {
      updated = updated.filter((id) => id !== node.id);
    } else {
      updated.push(node.id);
    }
    setExpanded(updated);
    buildLayout(mindmapData, updated);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    setLoading(false);

    if (!result || !result.Mindmap) return;

    setMindmapData(result.Mindmap);
    setExpanded([]);
    buildLayout(result.Mindmap, []);
  };

  return (
    <div style={{ height: "100vh", background: "#f4f6f8" }}>
      <div style={{ padding: "25px", textAlign: "center" }}>
        <h1>🌈 MindMapify</h1>
        <input type="file" accept=".pdf" onChange={handleUpload} />
        {loading && <p>Generating...</p>}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={{ organic: OrganicEdge }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Controls />
        <Background color="#ddd" gap={40} />
      </ReactFlow>
    </div>
  );
}

export default App;