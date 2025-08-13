// src/components/pathfinding/RouteViewer.tsx

import { useState, useMemo } from "react";
import type { Data } from "../../services/dataLoader";
import { RouteResultTable } from "./RouteResultTable";
import type { Point, Waypoint } from "../../types/entities";

interface RouteViewerProps {
  data: Data;
}

export const RouteViewer = ({ data }: RouteViewerProps) => {
  const [selectedStartNode, setSelectedStartNode] = useState<string>("");

  const nodeNameMap = useMemo(() => {
    return new Map(
      // ★★★ ここを修正 ★★★
      // nodeの型を、より具体的な `Point | Waypoint` と指定する
      [...data.points.entries(), ...data.waypoints.entries()].map(([key, node]: [string, Point | Waypoint]): [string, string] => {
        // "name" in node のチェックにより、TypeScriptがnodeの型を正しく推論してくれる
        // これにより `(node as any)` が不要になる
        return [key, "name" in node ? node.name : node.key];
      })
    );
  }, [data]);

  const filteredRoutes = useMemo(() => {
    if (!selectedStartNode) return [];
    return Array.from(data.routes.values())
      .filter((route) => route.from === selectedStartNode)
      .sort((a, b) => a.distance - b.distance);
  }, [data.routes, selectedStartNode]);

  if (data.routes.size === 0) {
    return null; // ルートがなければ何も表示しない
  }

  return (
    <div>
      <h3>計算結果の確認</h3>
      <p>結果を表示したい始点ノードを選択してください。</p>
      <select value={selectedStartNode} onChange={(e) => setSelectedStartNode(e.target.value)} style={{ marginBottom: "20px" }}>
        <option value="">始点ノードを選択...</option>
        {Array.from(data.points.values()).map((point) => (
          <option key={point.key} value={point.key}>
            {point.name}
          </option>
        ))}
      </select>

      {selectedStartNode && <RouteResultTable routes={filteredRoutes} nodeNameMap={nodeNameMap} />}
    </div>
  );
};
