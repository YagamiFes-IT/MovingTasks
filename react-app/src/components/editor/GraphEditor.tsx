// src/components/editor/GraphEditor.tsx

import { useMemo, useEffect, useCallback } from "react";
import ReactFlow, { Background, BackgroundVariant, Controls, useNodesState, useEdgesState, Handle, Position } from "reactflow";
// 修正点1: 型のインポートを分離
import type { Node, Edge, EdgeMouseHandler, NodeProps } from "reactflow";
import "reactflow/dist/style.css";
import { useAppStore } from "../../store/dataStore";
import "./editor.css";
import { createCanonicalPathKey } from "../../utils/pathUtils";

type CircleNodeData = {
  label: string;
  nodeType: "point" | "waypoint"; // ★ 'point'か'waypoint'かのタイプ情報
};

const CircleNode = ({ data, selected }: NodeProps<CircleNodeData>) => {
  const size = data.nodeType === "point" ? 100 : 60; // Pointは100px, Waypointは60px
  const baseBorderColor = data.nodeType === "point" ? "#1a192b" : "#888";
  const baseBackgroundColor = data.nodeType === "point" ? "#fff" : "#f0f0f0"; // Waypointは薄い灰色に

  const borderStyle = selected
    ? "3px solid #007bff" // 選択されている場合は青い太枠
    : `2px solid ${baseBorderColor}`; // 通常時は黒い枠

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

  return (
    <>
      {/* ★ 修正: 必須プロパティである position を追加 */}
      <Handle
        type="source"
        position={Position.Top} // 型エラー解消のために追加
        style={handleStyle}
      />
      {/* ★ 修正: 必須プロパティである position を追加 */}
      <Handle
        type="target"
        position={Position.Top} // 型エラー解消のために追加
        style={handleStyle}
      />

      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "50%",
          backgroundColor: baseBackgroundColor,
          textAlign: "center",
          padding: "5px",
          boxSizing: "border-box",
          position: "relative",
          border: borderStyle, // ★ 3. 動的なスタイルを適用
          transition: "border 0.1s ease-in-out", // B. スムーズに変化させる（任意）
          fontSize: data.nodeType === "point" ? "1em" : "0.7em", // Waypointの文字も少し小さく
        }}
      >
        {data.label}
      </div>
    </>
  );
};

const nodeTypes = { circle: CircleNode };

export function GraphEditor() {
  const data = useAppStore((state) => state.data);
  const updateAllNodePositions = useAppStore((state) => state.updateAllNodePositions);
  const deleteNodes = useAppStore((state) => state.deleteNodes);
  const deletePaths = useAppStore((state) => state.deletePaths);

  // ★ インスペクター連携のため、選択中のエッジ情報をストアで管理する想定
  const setSelectedEdgePairKey = useAppStore((state) => state.setSelectedEdgePairKey);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // ★ 変更点1: エッジ生成ロジックを全面的に修正
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!data) return { initialNodes: [], initialEdges: [] };

    const points = Array.from(data.points.values());
    const waypoints = Array.from(data.waypoints.values());

    // PointとWaypointを別々にmapして、後で結合する
    const pointNodes: Node<CircleNodeData>[] = points.map((node) => ({
      id: node.key,
      type: "circle",
      position: { x: node.x, y: node.y },
      data: {
        label: node.name,
        nodeType: "point", // ★ 4. タイプ情報をデータに追加
      },
    }));

    const waypointNodes: Node<CircleNodeData>[] = waypoints.map((node) => ({
      id: node.key,
      type: "circle",
      position: { x: node.x, y: node.y },
      data: {
        label: `${node.key}`,
        nodeType: "waypoint", // ★ 4. タイプ情報をデータに追加
      },
    }));

    const initialNodes = [...pointNodes, ...waypointNodes];

    const finalEdges: Edge[] = Array.from(data.paths.values()).map((path) => {
      const edgeId = `e-${path.from.key}-${path.to.key}`;
      return {
        id: edgeId,
        source: path.from.key,
        target: path.to.key,
        type: "straight",
      };
    });

    return { initialNodes: initialNodes, initialEdges: finalEdges };
  }, [data]);

  useEffect(() => {
    // dataStoreから来たノードとエッジを、そのままReact Flowの状態にセットするだけ
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleSaveLayout = useCallback(() => {
    const newPositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => {
      newPositions.set(node.id, node.position);
    });
    updateAllNodePositions(newPositions);
    alert("Layout saved!");
  }, [nodes, updateAllNodePositions]);

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      // 'e-' プレフィックスを削除して、ストアで管理しているペアキーを取得
      const pairKey = edge.id.replace("e-", "");
      // ストアのアクションを呼び出して、選択されたエッジのキーをセット
      setSelectedEdgePairKey(pairKey);
      console.log("Selected Edge PairKey:", pairKey);
    },
    [setSelectedEdgePairKey]
  );

  const handleNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      // 削除されたノードオブジェクトの配列から、キーの配列を作成
      const keysToDelete = deletedNodes.map((node) => node.id);
      // ストアのアクションを呼び出す
      deleteNodes(keysToDelete);
    },
    [deleteNodes]
  );

  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      console.log("handleEdgesDelete is called with:", deletedEdges);
      const keysToDelete = deletedEdges.map((edge) => createCanonicalPathKey(edge.source, edge.target));
      console.log("Calling deletePaths with keys:", keysToDelete);

      deletePaths(keysToDelete);
    },
    [deletePaths]
  );

  return (
    <div>
      <div style={{ padding: "10px 0" }}>
        <button onClick={handleSaveLayout}>Save Layout</button>
      </div>
      <div style={{ height: "70vh", border: "1px solid #ddd" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={handleEdgeClick} // ★ 変更点3: クリックハンドラを渡す
          onNodesDelete={handleNodesDelete}
          onEdgesDelete={handleEdgesDelete}
          nodeTypes={nodeTypes}
          snapToGrid={true}
          snapGrid={[15, 15]}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
