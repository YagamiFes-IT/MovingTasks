// src/components/editor/DataInspector.tsx

import { useState, useMemo } from "react";
import { useAppStore } from "../../store/dataStore";
import { GraphNode, Group } from "../../types/entities";
import { EditNodeModal } from "./EditNodeModal"; // EditNodeModalをインポート
import { EditGroupModal } from "./EditGroupModal";
import "./DataInspector.css";

export function DataInspector() {
  const [activeTab, setActiveTab] = useState<"paths" | "nodes">("nodes"); // デフォルトをnodesに変更
  const data = useAppStore((state) => state.data);
  const updatePathCost = useAppStore((state) => state.updatePathCost);
  const addPath = useAppStore((state) => state.addPath); // ★ addPathアクションを取得
  const addNode = useAppStore((state) => state.addNode);
  const addGroup = useAppStore((state) => state.addGroup);
  const updateNode = useAppStore((state) => state.updateNode);
  const deleteNodes = useAppStore((state) => state.deleteNodes);
  const updateGroup = useAppStore((state) => state.updateGroup); // ★ アクションを取得
  const deleteGroup = useAppStore((state) => state.deleteGroup); // ★ アクションを取得

  // --- UI表示状態の管理 ---
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false); // ★ デフォルトを閉じる
  const [isGroupListOpen, setIsGroupListOpen] = useState(true);
  const [isNodeListOpen, setIsNodeListOpen] = useState(true);
  const [isAddPathOpen, setIsAddPathOpen] = useState(true); // ★ パス追加フォーム用のState

  // --- パス追加フォーム用のState ---
  const [pathNode1, setPathNode1] = useState("");
  const [pathNode2, setPathNode2] = useState("");
  const [newPathCost, setNewPathCost] = useState("");
  const [newPathOppositeCost, setNewPathOppositeCost] = useState("");

  // --- グループ追加フォーム用のState ---
  const [newGroupKey, setNewGroupKey] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // --- ノード追加フォーム用のState ---
  const [newNodeType, setNewNodeType] = useState<"point" | "waypoint">("point");
  const [newNodeKey, setNewNodeKey] = useState("");
  const [newNodeGroup, setNewNodeGroup] = useState("");
  const [newNodeName, setNewNodeName] = useState("");

  // ★ 1. 編集モーダルを管理するためのStateを宣言
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);

  // (sortedPaths と sortedNodes の useMemo は変更なし)
  const sortedPaths = useMemo(() => {
    if (!data) return [];
    return Array.from(data.paths.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data]);

  const sortedNodes = useMemo(() => {
    if (!data) return [];
    const allNodes = [...data.points.values(), ...data.waypoints.values()];
    return allNodes.sort((nodeA, nodeB) => {
      const keyA = nodeA.groupKey + nodeA.key;
      const keyB = nodeB.groupKey + nodeB.key;
      return keyA.localeCompare(keyB);
    });
  }, [data]);

  const allNodes = useMemo(() => {
    if (!data) return [];
    return [...data.points.values(), ...data.waypoints.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [data]);

  const handleAddPath = () => {
    if (!pathNode1 || !pathNode2) {
      alert("2つのノードを選択してください。");
      return;
    }
    addPath(
      pathNode1,
      pathNode2,
      Number(newPathCost), // Number('') は 0 になる
      Number(newPathOppositeCost)
    );
    // フォームをリセット
    setPathNode1("");
    setPathNode2("");
    setNewPathCost("");
    setNewPathOppositeCost("");
  };

  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const handleOpenEditGroupModal = (group: Group) => {
    setEditingGroup(group);
    setIsEditGroupModalOpen(true);
  };

  const handleSaveGroup = (key: string, newName: string, newDescription: string) => {
    updateGroup(key, newName, newDescription);
    setIsEditGroupModalOpen(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupKey: string) => {
    if (!data) return;
    // --- 削除対象の洗い出し ---
    const groupName = data.groups.get(groupKey)?.name || groupKey;
    const allNodes: GraphNode[] = [...data.points.values(), ...data.waypoints.values()];

    const nodesInGroup = allNodes.filter((node) => node.groupKey === groupKey);
    const pathsAffected = Array.from(data.paths.values()).filter((p) => nodesInGroup.some((n) => n.key === p.from.key || n.key === p.to.key));

    // --- 警告メッセージの生成 ---
    let warningMessage = `グループ "${groupName}" を削除します。よろしいですか？\n\nこれにより、以下の関連データもすべて削除されます:\n`;
    warningMessage += `\n[ NODES (${nodesInGroup.length}件) ]\n`;
    warningMessage += nodesInGroup.map((n) => `- ${n.key}`).join("\n");
    warningMessage += `\n\n[ PATHS (${pathsAffected.length}件) ]\n`;
    warningMessage += pathsAffected.map((p) => `- ${p.from.key} ↔ ${p.to.key}`).join("\n");

    if (window.confirm(warningMessage)) {
      deleteGroup(groupKey);
    }
  };

  const handleAddGroup = () => {
    if (!newGroupKey.trim() || !newGroupName.trim()) {
      alert("Group KeyとNameは必須です。");
      return;
    }
    addGroup(newGroupKey.trim(), newGroupName.trim(), newGroupDesc.trim());
    setNewGroupKey("");
    setNewGroupName("");
    setNewGroupDesc("");
  };

  const handleAddNode = () => {
    if (!newNodeKey.trim() || !newNodeGroup) {
      alert("Groupの選択とNode Keyの入力は必須です。");
      return;
    }
    addNode(newNodeType, newNodeKey.trim(), newNodeGroup, newNodeName.trim());
    setNewNodeKey("");
    setNewNodeName("");
  };

  const handleOpenEditModal = (node: GraphNode) => {
    setEditingNode(node);
    setIsEditModalOpen(true);
  };

  const handleSaveNode = (key: string, newGroup: string, newName?: string) => {
    updateNode(key, newGroup, newName);
    setIsEditModalOpen(false);
    setEditingNode(null);
  };
  const handleDeleteNode = (key: string) => {
    // 誤操作防止の確認ダイアログ
    if (window.confirm(`ノード "${key}" を削除します。よろしいですか？\n関連するパスもすべて削除されます。`)) {
      // 既存のdeleteNodesアクションを、キーが1つの配列を渡して呼び出す
      deleteNodes([key]);
    }
  };
  const allGroups = useMemo(() => {
    // ★ 2. dataが存在しない場合のチェックを追加
    if (!data) return [];
    return Array.from(data.groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  if (!data) {
    return <div className="inspector-container">データを読み込んでください。</div>;
  }

  return (
    <div className="inspector-container">
      <div className="inspector-tabs">
        <button onClick={() => setActiveTab("paths")} className={activeTab === "paths" ? "active" : ""}>
          Paths
        </button>
        <button onClick={() => setActiveTab("nodes")} className={activeTab === "nodes" ? "active" : ""}>
          Nodes
        </button>
      </div>

      <div className="inspector-content">
        {activeTab === "paths" && (
          <div>
            {/* --- パス追加フォーム（折りたたみ式） --- */}
            <div className="collapsible-section">
              <h3 onClick={() => setIsAddPathOpen(!isAddPathOpen)}>
                <span className="triangle">{isAddPathOpen ? "▼" : "▶"}</span> Add New Path
              </h3>
              {isAddPathOpen && (
                <div className="add-node-form">
                  <select value={pathNode1} onChange={(e) => setPathNode1(e.target.value)}>
                    <option value="" disabled>
                      -- Select Node 1 --
                    </option>
                    {allNodes.map((node) => (
                      <option key={node.key} value={node.key}>
                        {node.key}
                      </option>
                    ))}
                  </select>
                  <select value={pathNode2} onChange={(e) => setPathNode2(e.target.value)}>
                    <option value="" disabled>
                      -- Select Node 2 --
                    </option>
                    {allNodes.map((node) => (
                      <option key={node.key} value={node.key}>
                        {node.key}
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
                {/* ★ 修正: ヘッダーを双方向用に変更 */}
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th className="cost-column">Cost (From→To)</th>
                    <th className="cost-column">Cost (To→From)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ★ 修正: 1つのPathオブジェクトから2つのコスト入力を作る */}
                  {sortedPaths.map(([pathKey, path]) => (
                    <tr key={pathKey}>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "nodes" && (
          <div>
            {/* --- グループ追加フォーム（折りたたみ式） --- */}
            <div className="collapsible-section">
              <h3 onClick={() => setIsAddGroupOpen(!isAddGroupOpen)}>
                <span className="triangle">{isAddGroupOpen ? "▼" : "▶"}</span> Add New Group
              </h3>
              {isAddGroupOpen && (
                <div className="add-node-form">
                  <input type="text" placeholder="Key (Unique)" value={newGroupKey} onChange={(e) => setNewGroupKey(e.target.value)} />
                  <input type="text" placeholder="Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                  <input type="text" placeholder="Description" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} />
                  <button onClick={handleAddGroup}>Add Group</button>
                </div>
              )}
            </div>

            {/* --- ノード追加フォーム（折りたたみ式） --- */}
            <div className="collapsible-section">
              <h3 onClick={() => setIsAddNodeOpen(!isAddNodeOpen)}>
                <span className="triangle">{isAddNodeOpen ? "▼" : "▶"}</span> Add New Node
              </h3>
              {isAddNodeOpen && (
                <div className="add-node-form">
                  {/* ★★★ グループ入力欄をプルダウンに変更 ★★★ */}
                  <select value={newNodeGroup} onChange={(e) => setNewNodeGroup(e.target.value)}>
                    <option value="" disabled>
                      -- Select a Group --
                    </option>
                    {allGroups.map((group) => (
                      <option key={group.key} value={group.key}>
                        {group.name} ({group.key})
                      </option>
                    ))}
                  </select>

                  <select value={newNodeType} onChange={(e) => setNewNodeType(e.target.value as "point" | "waypoint")}>
                    <option value="point">Point</option>
                    <option value="waypoint">Waypoint</option>
                  </select>
                  <input type="text" placeholder="Key (Unique)" value={newNodeKey} onChange={(e) => setNewNodeKey(e.target.value)} />
                  {newNodeType === "point" && <input type="text" placeholder="Name" value={newNodeName} onChange={(e) => setNewNodeName(e.target.value)} />}
                  <button onClick={handleAddNode}>Add Node</button>
                </div>
              )}
            </div>

            <div className="collapsible-section">
              <h3 onClick={() => setIsGroupListOpen(!isGroupListOpen)}>
                <span className="triangle">{isGroupListOpen ? "▼" : "▶"}</span> Groups
              </h3>
              {isGroupListOpen && (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Key</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allGroups.map((group) => (
                      <tr key={group.key}>
                        <td>{group.name}</td>
                        <td>{group.key}</td>
                        <td>
                          <button onClick={() => handleOpenEditGroupModal(group)}>Edit</button>
                          <button onClick={() => handleDeleteGroup(group.key)} className="delete-button">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="collapsible-section">
              <h3 onClick={() => setIsNodeListOpen(!isNodeListOpen)}>
                <span className="triangle">{isNodeListOpen ? "▼" : "▶"}</span> Nodes
              </h3>
              {isNodeListOpen && (
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Key</th>
                      <th>Group</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedNodes.map((node) => (
                      <tr key={node.key}>
                        <td>{data.waypoints.has(node.key) ? "Waypoint" : "Point"}</td>
                        <td>{node.key}</td>
                        <td>{node.groupKey}</td>
                        <td>
                          <button onClick={() => handleOpenEditModal(node)}>Edit</button>
                          <button onClick={() => handleDeleteNode(node.key)} className="delete-button">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
      <EditNodeModal isOpen={isEditModalOpen} node={editingNode} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveNode} groups={allGroups} />
      <EditGroupModal isOpen={isEditGroupModalOpen} group={editingGroup} onClose={() => setIsEditGroupModalOpen(false)} onSave={handleSaveGroup} />
    </div>
  );
}
