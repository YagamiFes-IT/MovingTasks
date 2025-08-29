// src/components/pathfinding/RouteTablePanel.tsx

import type { Point, Route } from "../../types/entities";

interface RouteTablePanelProps {
  points: Point[];
  routes: Route[];
  nodeNameMap: Map<string, string>;
  selectedStartNode: string;
  onStartNodeChange: (nodeKey: string) => void;
  selectedRoute: Route | null;
  onRouteSelect: (route: Route) => void;
}

export const RouteTablePanel = ({ points, routes, nodeNameMap, selectedStartNode, onStartNodeChange, selectedRoute, onRouteSelect }: RouteTablePanelProps) => {
  return (
    <>
      <p>計算結果の確認：結果を表示したい始点ノードを選択してください。</p>
      <select value={selectedStartNode} onChange={(e) => onStartNodeChange(e.target.value)} style={{ marginBottom: "20px" }}>
        <option value="">始点ノードを選択...</option>
        {points.map((point) => (
          <option key={point.key} value={point.key}>
            {point.name}
          </option>
        ))}
      </select>

      {selectedStartNode && (
        <div style={{ flexGrow: 1, overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>終点</th>
                <th>総コスト</th>
                <th>経由ノード数</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.key} onClick={() => onRouteSelect(route)} className={route.key === selectedRoute?.key ? "selected-row" : ""}>
                  <td>{nodeNameMap.get(route.to) || route.to}</td>
                  <td>{route.distance.toFixed(2)}</td>
                  <td>{route.nodeKeys.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
