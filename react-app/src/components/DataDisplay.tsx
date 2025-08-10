// src/components/DataDisplay.tsx

import React, { useState, useMemo } from "react";
import type { Data } from "../services/dataLoader";
import "./DataDisplay.css"; // 作成したCSSファイルをインポート

// ★ UIを整理するため、折りたたみ可能なセクション用のコンポーネントを定義
const CollapsibleSection: React.FC<{ title: string; count: number; children: React.ReactNode }> = ({ title, count, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section>
      <header className="collapsible-header" onClick={() => setIsOpen(!isOpen)}>
        <span className={`triangle ${isOpen ? "open" : ""}`}>▶</span>
        {title} ({count})
      </header>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </section>
  );
};

export const DataDisplay: React.FC<{ data: Data }> = ({ data }) => {
  // ★ PointsとWaypointsを結合してソートした単一のノードリストを作成
  const allNodes = useMemo(() => {
    return [...data.points.values(), ...data.waypoints.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [data.points, data.waypoints]);

  return (
    <div className="data-display-container">
      <h2>📊 Loaded Data Details</h2>

      {/* ★ Object Categories Section (テーブル形式に) */}
      <CollapsibleSection title="Object Categories" count={data.objectCategories.size}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(data.objectCategories.values()).map((cat) => (
              <tr key={cat.key}>
                <td>{cat.name}</td>
                <td>
                  <code>{cat.key}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>

      {/* ★ Groups Section (テーブル形式に) */}
      <CollapsibleSection title="Groups" count={data.groups.size}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(data.groups.values()).map((group) => (
              <tr key={group.key}>
                <td>{group.name}</td>
                <td>
                  <code>{group.key}</code>
                </td>
                <td>{group.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>

      {/* ★ Nodes Section (PointとWaypointを統合) */}
      <CollapsibleSection title="Nodes" count={allNodes.length}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Type</th>
              <th>Name</th>
              <th>Group</th>
            </tr>
          </thead>
          <tbody>
            {allNodes.map((node) => (
              <tr key={node.key}>
                <td>
                  <code>{node.key}</code>
                </td>
                <td>{data.points.has(node.key) ? "Point" : "Waypoint"}</td>
                <td>{"name" in node ? node.name : "-"}</td>
                <td>
                  <code>{node.groupKey}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>

      {/* ★ Paths Section (双方向コストを正確に表示) */}
      <CollapsibleSection title="Paths" count={data.paths.size}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Node 1</th>
              <th>Node 2</th>
              <th>Cost (1→2)</th>
              <th>Cost (2→1)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(data.paths.values()).map((path) => (
              <tr key={`${path.from.key}-${path.to.key}`}>
                <td>
                  <code>{path.from.key}</code>
                </td>
                <td>
                  <code>{path.to.key}</code>
                </td>
                <td>{path.cost}</td>
                <td>{path.opposite_cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>
    </div>
  );
};
