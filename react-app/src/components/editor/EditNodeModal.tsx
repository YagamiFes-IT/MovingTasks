// src/components/editor/EditNodeModal.tsx

import { useState, useEffect } from "react";
// ★ 1. Groupをインポート
import { GraphNode, Point, Group } from "../../types/entities";
import "./DataInspector.css";

interface EditNodeModalProps {
  node: GraphNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, newGroup: string, newName?: string) => void;
  // ★ 2. グループのリストを受け取るためのプロパティを追加
  groups: Group[];
}

// ★ 3. propsにgroupsを追加
export function EditNodeModal({ node, isOpen, onClose, onSave, groups }: EditNodeModalProps) {
  const [group, setGroup] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (node) {
      setGroup(node.groupKey);
      if ("name" in node) {
        setName((node as Point).name);
      }
    }
  }, [node]);

  if (!isOpen || !node) {
    return null;
  }

  const handleSave = () => {
    onSave(node.key, group, "name" in node ? name : undefined);
  };

  const isPoint = "name" in node;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Node: {node.key}</h2>
        <div className="edit-node-form">
          <label>Group Key</label>
          {/* ★ 4. inputをselect（プルダウン）に変更 */}
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            {/* ★ 修正: オプショナルチェイニング(?.)を追加して安全にmapを呼び出す */}
            {groups?.map((g) => (
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
