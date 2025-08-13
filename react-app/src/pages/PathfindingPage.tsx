// src/pages/PathfindingPage.tsx

import { NoData } from "../components/layout/NoData.tsx";
import { useAppStore } from "../store/dataStore";
import { calculateAllPointToPointRoutes } from "../services/pathfinding";

// 新しく切り出したコンポーネントをインポート
import { CalculationStatus } from "../components/pathfinding/CalculationStatus";
import { PathfindingControls } from "../components/pathfinding/PathfindingControls";
import { RouteViewer } from "../components/pathfinding/RouteViewer";

export const PathfindingPage = () => {
  // --- 状態管理とロジック（ここに変更なし） ---
  const data = useAppStore((state) => state.data);
  const isRouteStale = useAppStore((state) => state.isRouteStale);
  const setRoutes = useAppStore((state) => state.setRoutes);

  const handleCalculateAll = () => {
    if (!data) return;
    const newRoutes = calculateAllPointToPointRoutes(data.points, data.waypoints, data.paths);
    setRoutes(newRoutes);
  };

  if (!data) {
    return <NoData />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>全地点間の最短経路計算</h2>

      <PathfindingControls onCalculate={handleCalculateAll} />

      <CalculationStatus routeCount={data.routes.size} isStale={isRouteStale} />

      <RouteViewer data={data} />
    </div>
  );
};
