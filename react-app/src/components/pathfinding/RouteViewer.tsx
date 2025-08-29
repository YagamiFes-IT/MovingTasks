// src/components/pathfinding/RouteViewer.tsx

import { useState, useMemo } from "react";
import { useAppStore } from "../../store/dataStore";
import type { Route } from "../../types/entities";
import { RouteTablePanel } from "./RouteTablePanel";
import { RouteMiniMap } from "./RouteMiniMap";

export const RouteViewer = () => {
  const data = useAppStore((state) => state.data);

  // --- 親で管理する状態 ---
  // 1. 左パネルで選択された「始点ノード」のキー
  const [selectedStartNode, setSelectedStartNode] = useState<string>("");
  // 2. 左パネルのテーブルで選択された単一の「経路オブジェクト」
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // --- 子に渡すためのデータを準備 ---
  // 選択された始点ノードから出発する全経路のリスト
  const routesFromStart = useMemo(() => {
    if (!data || !selectedStartNode) return [];
    return Array.from(data.routes.values())
      .filter((route) => route.from === selectedStartNode)
      .sort((a, b) => a.distance - b.distance);
  }, [data, selectedStartNode]);

  // ノードのキーと名前の対応表
  const nodeNameMap = useMemo(() => {
    if (!data) return new Map();
    return new Map([...data.points.entries(), ...data.waypoints.entries()].map(([key, node]) => [key, "name" in node ? node.name : key]));
  }, [data]);

  // データがなければ何も表示しない
  if (!data || data.routes.size === 0) {
    return <p>計算済みの経路がありません。</p>;
  }

  return (
    <div style={{ display: "flex", gap: "20px", height: "100%" }}>
      {/* --- 左パネル --- */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <RouteTablePanel
          points={Array.from(data.points.values())}
          routes={routesFromStart}
          nodeNameMap={nodeNameMap}
          selectedStartNode={selectedStartNode}
          onStartNodeChange={(nodeKey) => {
            setSelectedStartNode(nodeKey);
            setSelectedRoute(null); // 始点を変えたら経路の選択はリセット
          }}
          selectedRoute={selectedRoute}
          onRouteSelect={setSelectedRoute}
        />
      </div>

      {/* --- 右パネル --- */}
      <div style={{ flex: 2.3, minWidth: 0, border: "1px solid #ccc", borderRadius: "8px" }}>
        <RouteMiniMap data={data} highlightedRoute={selectedRoute} />
      </div>
    </div>
  );
};
