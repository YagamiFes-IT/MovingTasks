import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/dataStore";
import { calculateAllPointToPointRoutes } from "../services/pathfinding";
import { RouteResultTable } from "../components/pathfinding/RouteResultTable";

// ★ ステータス表示用の新しいコンポーネント
const CalculationStatus = ({ routeCount, isStale }: { routeCount: number; isStale: boolean }) => {
  if (routeCount === 0 && !isStale) {
    return <p>まだ経路は計算されていません。</p>;
  }

  // isStaleがtrueの場合、警告メッセージを表示
  const statusMessage = isStale ? <span style={{ color: "orange", fontWeight: "bold" }}>情報が古くなっています（グラフ変更あり）</span> : <span style={{ color: "green", fontWeight: "bold" }}>この経路情報は最新です</span>;

  return (
    <div className="calculation-status" style={{ border: "1px solid #eee", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
      <p style={{ margin: 0 }}>
        <strong>計算済みルート数:</strong> {routeCount} 件 | <strong>状態:</strong> {statusMessage}
      </p>
      {isStale && <p style={{ marginTop: "5px", fontSize: "0.9rem", color: "#666" }}>グラフ構造が変更されたため、再計算を推奨します。</p>}
    </div>
  );
};

export const PathfindingPage = () => {
  const data = useAppStore((state) => state.data);
  const isRouteStale = useAppStore((state) => state.isRouteStale); // ★ isStaleの状態を取得
  const setRoutes = useAppStore((state) => state.setRoutes);
  const markRoutesAsStale = useAppStore((state) => state.markRoutesAsStale); // ★ markRoutesAsStaleも取得

  const [selectedStartNode, setSelectedStartNode] = useState<string>("");

  const nodeNameMap = useMemo(() => {
    if (!data) return new Map();
    return new Map([...data.points.entries(), ...data.waypoints.entries()].map(([key, node]) => [key, "name" in node ? node.name : key]));
  }, [data]);

  const filteredRoutes = useMemo(() => {
    if (!data || !selectedStartNode) return [];
    return Array.from(data.routes.values())
      .filter((route) => route.from === selectedStartNode)
      .sort((a, b) => a.distance - b.distance);
  }, [data, selectedStartNode]);

  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>データが読み込まれていません</h2>
        <p>
          <Link to="/">プロジェクトハブ</Link>に戻ってデータを読み込んでください。
        </p>
      </div>
    );
  }

  const handleCalculateAll = () => {
    const newRoutes = calculateAllPointToPointRoutes(data.points, data.waypoints, data.paths);
    setRoutes(newRoutes);
    markRoutesAsStale(false); // setRoutes内で既にfalseに設定されている
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>全地点間の最短経路計算</h2>
      <div className="controls" style={{ marginBottom: "20px" }}>
        <p>下のボタンを押すと、すべての主要地点（Point）間の最短経路を一度に計算します。</p>
        <button onClick={handleCalculateAll}>全経路を再計算</button>
      </div>

      {/* ★ 新しいステータス表示コンポーネントをここに配置 */}
      <CalculationStatus routeCount={data.routes.size} isStale={isRouteStale} />

      <div className="results-viewer">
        <h3>計算結果の確認</h3>
        {data.routes.size > 0 && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
