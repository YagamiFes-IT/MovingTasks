// src/components/editor/EditNodeModal.tsx

import { useState, useEffect } from "react";
// ★ 1. Areaをインポート
import { GraphNode, Point, Area } from "../../types/entities";
import "./DataInspector.css";

interface EditNodeModalProps {
  node: GraphNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, newArea: string, newName?: string) => void;
  // ★ 2. グループのリストを受け取るためのプロパティを追加
  areas: Area[];
}

// ★ 3. propsにareasを追加
export function EditNodeModal({ node, isOpen, onClose, onSave, areas }: EditNodeModalProps) {
  const [area, setArea] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (node) {
      setArea(node.areaKey);
      if ("name" in node) {
        setName((node as Point).name);
      }
    }
  }, [node]);

  if (!isOpen || !node) {
    return null;
  }

  const handleSave = () => {
    onSave(node.key, area, "name" in node ? name : undefined);
  };

  const isPoint = "name" in node;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Node: {node.key}</h2>
        <div className="edit-node-form">
          <label>Area Key</label>
          {/* ★ 4. inputをselect（プルダウン）に変更 */}
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            {/* ★ 修正: オプショナルチェイニング(?.)を追加して安全にmapを呼び出す */}
            {areas?.map((g) => (
              <option key={g.key} value={g.key}>
                {g.name} ({g.key})
              </option>
            ))}
          </select>

          {isPoint && (
            <>
              <label>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </>
          )}
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
