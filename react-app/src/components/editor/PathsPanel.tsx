// src/components/editor/PathsPanel.tsx

import { useState, useMemo } from "react";
import { useAppStore } from "../../store/dataStore";
import { createCanonicalPathKey } from "../../utils/pathUtils"; // ★ インポート

interface PathsPanelProps {
  selectedPathKey: string | null;
  onPathSelect: (key: string | null) => void;
}

export function PathsPanel({ selectedPathKey, onPathSelect }: PathsPanelProps) {
  const data = useAppStore((state) => state.data);
  const updatePathCost = useAppStore((state) => state.updatePathCost);
  const addPath = useAppStore((state) => state.addPath);
  const deletePaths = useAppStore((state) => state.deletePaths);

  const [isAddPathOpen, setIsAddPathOpen] = useState(true);
  const [pathNode1, setPathNode1] = useState("");
  const [pathNode2, setPathNode2] = useState("");
  const [newPathCost, setNewPathCost] = useState("");
  const [newPathOppositeCost, setNewPathOppositeCost] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const sortedPaths = useMemo(() => {
    if (!data) return [];
    return Array.from(data.paths.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const allGroups = useMemo(() => {
    if (!data) return [];
    return Array.from(data.groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const filteredNodes = useMemo(() => {
    if (!data) return [];
    const all = [...data.points.values(), ...data.waypoints.values()];

    // どのグループも選択されていない場合は、すべてのノードを表示
    if (selectedGroups.size === 0) {
      return all.sort((a, b) => a.key.localeCompare(b.key));
    }

    // 選択されたグループに属するノードのみをフィルタリング
    return all.filter((node) => selectedGroups.has(node.groupKey)).sort((a, b) => a.key.localeCompare(b.key));
  }, [data, selectedGroups]);

  const handleGroupToggle = (groupKey: string) => {
    setSelectedGroups((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(groupKey)) {
        newSelected.delete(groupKey);
      } else {
        newSelected.add(groupKey);
      }
      return newSelected;
    });
  };

  const handleAddPath = () => {
    if (!pathNode1 || !pathNode2) {
      alert("2つのノードを選択してください。");
      return;
    }
    addPath(pathNode1, pathNode2, Number(newPathCost), Number(newPathOppositeCost));
    setPathNode1("");
    setPathNode2("");
    setNewPathCost("");
    setNewPathOppositeCost("");
  };

  const handleDeletePath = (pathKeyToDelete: string) => {
    // 誤操作防止の確認ダイアログ
    if (window.confirm(`パス "${pathKeyToDelete}" を削除しますか？`)) {
      // deletePathsアクションはキーの配列を期待するため、配列で渡す
      deletePaths([pathKeyToDelete]);
    }
  };

  if (!data) return null;

  return (
    <div>
      <div className="collapsible-section">
        <h3 onClick={() => setIsAddPathOpen(!isAddPathOpen)}>
          <span className="triangle">{isAddPathOpen ? "▼" : "▶"}</span> Add New Path
        </h3>
        {isAddPathOpen && (
          <div className="add-node-form">
            {/* ★ 5. グループフィルタ用のチェックボックスUIを追加 */}
            <div className="group-filter" style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #eee" }}>
              <label>Filter nodes by group:</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "5px" }}>
                {allGroups.map((group) => (
                  <div key={group.key}>
                    <input type="checkbox" id={`group-filter-${group.key}`} checked={selectedGroups.has(group.key)} onChange={() => handleGroupToggle(group.key)} />
                    <label htmlFor={`group-filter-${group.key}`} style={{ marginLeft: "4px" }}>
                      {group.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* ★ 6. プルダウンの選択肢を`filteredNodes`に変更 */}
            <select value={pathNode1} onChange={(e) => setPathNode1(e.target.value)}>
              <option value="" disabled>
                {" "}
                -- Select Node 1 --{" "}
              </option>
              {filteredNodes.map((node) => (
                <option key={node.key} value={node.key}>
                  {node.key} ({node.groupKey})
                </option>
              ))}
            </select>
            <select value={pathNode2} onChange={(e) => setPathNode2(e.target.value)}>
              <option value="" disabled>
                {" "}
                -- Select Node 2 --{" "}
              </option>
              {filteredNodes.map((node) => (
                <option key={node.key} value={node.key}>
                  {node.key} ({node.groupKey})
                </option>
              ))}
            </select>
            <input type="number" placeholder="Cost (Node1 → Node2)" value={newPathCost} onChange={(e) => setNewPathCost(e.target.value)} />
            <input type="number" placeholder="Cost (Node2 → Node1)" value={newPathOppositeCost} onChange={(e) => setNewPathOppositeCost(e.target.value)} />
            <button onClick={handleAddPath}>Add Path</button>
          </div>
        )}
      </div>

      {/* --- 既存パス一覧テーブル --- */}
      <div className="collapsible-section">
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th className="cost-column">Cost (From→To)</th>
              <th className="cost-column">Cost (To→From)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedPaths.map(([pathKey, path]) => {
              const canonicalKey = createCanonicalPathKey(path.from.key, path.to.key);
              return (
                <tr key={pathKey} className={canonicalKey === selectedPathKey ? "selected-row" : ""} onClick={() => onPathSelect(canonicalKey)}>
                  {" "}
                  <td>
                    {data.waypoints.has(path.from.key) ? `(W) ${path.from.key}` : path.from.key}
                    <span className="group-name">({path.from.groupKey})</span>
                  </td>
                  <td>
                    {data.waypoints.has(path.to.key) ? `(W) ${path.to.key}` : path.to.key}
                    <span className="group-name">({path.to.groupKey})</span>
                  </td>
                  <td>
                    <input type="number" value={path.cost} onChange={(e) => updatePathCost(pathKey, "forward", Number(e.target.value))} className="cost-input" />
                  </td>
                  <td>
                    <input type="number" value={path.opposite_cost} onChange={(e) => updatePathCost(pathKey, "backward", Number(e.target.value))} className="cost-input" />
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // ★ 行全体のクリックイベントを発生させない
                        handleDeletePath(canonicalKey);
                      }}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
