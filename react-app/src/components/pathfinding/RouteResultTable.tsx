import React from "react";
import type { Route } from "../../types/entities";
import "./RouteResultTable.css"; // スタイルシートを後で作成

interface Props {
  routes: Route[];
  nodeNameMap: Map<string, string>; // ノードキーから名前に変換するためのマップ
}

export const RouteResultTable: React.FC<Props> = ({ routes, nodeNameMap }) => {
  return (
    <div className="table-container">
      <table className="results-table">
        <thead>
          <tr>
            <th>目的地 (To)</th>
            <th>コスト (Cost)</th>
            <th>経路 (Path)</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={route.key}>
              <td>{nodeNameMap.get(route.to) || route.to}</td>
              <td>{route.distance.toFixed(2)}</td>
              <td>{route.nodeKeys.map((key) => nodeNameMap.get(key) || key).join(" → ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
