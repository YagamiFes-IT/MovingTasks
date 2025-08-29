// src/components/pathfinding/RouteMiniMap.tsx

import { useMemo } from "react";
import ReactFlow, { Background, Controls, Handle, Position } from "reactflow";
import type { Edge, Node, NodeProps } from "reactflow";
import "reactflow/dist/style.css";
import type { Data } from "../../services/dataLoader";
import type { Route } from "../../types/entities";

// --- Propsの型定義 ---
interface RouteMiniMapProps {
  data: Data;
  highlightedRoute: Route | null;
}

// --- 1. GraphEditorからCircleNodeを移植・改造 ---
// RouteMiniMap.tsx 内の CircleNode

type CircleNodeData = {
  label: string;
  nodeType: "point" | "waypoint";
};

const CircleNode = ({ data, style }: NodeProps<CircleNodeData> & { style?: React.CSSProperties }) => {
  const size = data.nodeType === "point" ? 100 : 60;

  // ★ 1. Handle（接続点）用のスタイルを定義
  const handleStyle: React.CSSProperties = {
    width: 1,
    height: 1,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "transparent",
    border: "none",
  };

  const divStyle: React.CSSProperties = {
    // --- 1. 基本的なスタイルを追加 ---
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: "5px",
    boxSizing: "border-box",

    // --- 2. 形状とサイズを定義 ---
    width: size,
    height: size,
    borderRadius: "50%", // ★ これで円形になります
    fontSize: data.nodeType === "point" ? "1em" : "0.7em",

    // --- 3. 親から渡された動的なスタイル（背景色や枠線）を適用 ---
    ...style,
  };

  return (
    <>
      <Handle type="source" position={Position.Top} style={handleStyle} />
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={divStyle}>{data.label}</div>
    </>
  );
};

const nodeTypes = { circle: CircleNode };

// --- 2. メインコンポーネント ---
export const RouteMiniMap = ({ data, highlightedRoute }: RouteMiniMapProps) => {
  const { nodes, edges } = useMemo(() => {
    const allGraphNodes = [...data.points.values(), ...data.waypoints.values()];

    const nodes: Node<CircleNodeData>[] = allGraphNodes.map((node) => {
      // デフォルトのスタイル
      let baseStyle: React.CSSProperties = {
        background: "name" in node ? "#fff" : "#f0f0f0",
        border: `2px solid ${"name" in node ? "#1a192b" : "#888"}`,
        color: "#000",
        fontWeight: "normal",
      };

      // ハイライト対象の経路がある場合、スタイルを上書き
      if (highlightedRoute) {
        if (node.key === highlightedRoute.from) {
          baseStyle = { ...baseStyle, background: "#28a745", color: "#fff", fontWeight: "bold", border: "3px solid #1e7e34" };
        } else if (node.key === highlightedRoute.to) {
          baseStyle = { ...baseStyle, background: "#dc3545", color: "#fff", fontWeight: "bold", border: "3px solid #b21f2d" };
        } else if (highlightedRoute.nodeKeys.includes(node.key)) {
          baseStyle = { ...baseStyle, background: "#ffc107", color: "#000", border: "3px solid #d39e00" };
        }
      }

      return {
        id: node.key,
        type: "circle",
        position: { x: node.x, y: node.y },
        data: { label: "name" in node ? node.name : node.key, nodeType: "name" in node ? "point" : "waypoint" },
        style: baseStyle, // ★ 計算したstyleを渡す
      };
    });

    // --- エッジの生成ロジック ---
    const edges: Edge[] = Array.from(data.paths.values()).map((path) => {
      let isPathInRoute = false;
      if (highlightedRoute) {
        for (let i = 0; i < highlightedRoute.nodeKeys.length - 1; i++) {
          const current = highlightedRoute.nodeKeys[i];
          const next = highlightedRoute.nodeKeys[i + 1];
          if ((current === path.from.key && next === path.to.key) || (current === path.to.key && next === path.from.key)) {
            isPathInRoute = true;
            break;
          }
        }
      }

      return {
        id: `e-${path.from.key}-${path.to.key}`,
        source: path.from.key,
        target: path.to.key,
        type: "straight", // ★ 直線エッジを指定
        animated: isPathInRoute,
        style: {
          strokeWidth: isPathInRoute ? 3 : 1,
          stroke: isPathInRoute ? "#007bff" : "#b1b1b7",
        },
      };
    });

    return { nodes, edges };
  }, [data, highlightedRoute]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false} // 選択操作自体は不可にする
      fitView
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
};
