import { useState, useMemo } from "react";
import { useAppStore } from "../../store/dataStore";
import { GraphNode, Group } from "../../types/entities";
import { EditNodeModal } from "./EditNodeModal";
import { EditGroupModal } from "./EditGroupModal";

interface NodesPanelProps {
  selectedNodeKey: string | null;
  onNodeSelect: (key: string | null) => void;
}

export function NodesPanel({ selectedNodeKey, onNodeSelect }: NodesPanelProps) {
  // --- ストアから必要なStateとアクションを取得 ---
  const data = useAppStore((state) => state.data);
  const addNode = useAppStore((state) => state.addNode);
  const addGroup = useAppStore((state) => state.addGroup);
  const updateNode = useAppStore((state) => state.updateNode);
  const deleteNodes = useAppStore((state) => state.deleteNodes);
  const updateGroup = useAppStore((state) => state.updateGroup);
  const deleteGroup = useAppStore((state) => state.deleteGroup);

  // --- UI表示状態の管理 ---
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isGroupListOpen, setIsGroupListOpen] = useState(true);
  const [isNodeListOpen, setIsNodeListOpen] = useState(true);

  // --- グループ追加フォーム用のState ---
  const [newGroupKey, setNewGroupKey] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");

  // --- ノード追加フォーム用のState ---
  const [newNodeType, setNewNodeType] = useState<"point" | "waypoint">("point");
  const [newNodeKey, setNewNodeKey] = useState("");
  const [newNodeGroup, setNewNodeGroup] = useState("");
  const [newNodeName, setNewNodeName] = useState("");

  // --- 編集モーダル用のState ---
  const [isEditNodeModalOpen, setIsEditNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  // --- 表示用データのメモ化 ---
  const sortedNodes = useMemo(() => {
    if (!data) return [];
    const allNodes = [...data.points.values(), ...data.waypoints.values()];
    return allNodes.sort((nodeA, nodeB) => (nodeA.groupKey + nodeA.key).localeCompare(nodeB.groupKey + nodeB.key));
  }, [data]);

  const allGroups = useMemo(() => {
    if (!data) return [];
    return Array.from(data.groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // --- イベントハンドラ ---
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
    const groupName = data.groups.get(groupKey)?.name || groupKey;
    const nodesInGroup = [...data.points.values(), ...data.waypoints.values()].filter((node) => node.groupKey === groupKey);
    // (警告メッセージ生成のロジックは省略しても良いし、より詳細にしても良い)
    if (window.confirm(`グループ "${groupName}" を削除しますか？\n関連するノード（${nodesInGroup.length}件）もすべて削除されます。`)) {
      deleteGroup(groupKey);
    }
  };

  const handleOpenEditModal = (node: GraphNode) => {
    setEditingNode(node);
    setIsEditNodeModalOpen(true);
  };

  const handleSaveNode = (key: string, newGroup: string, newName?: string) => {
    updateNode(key, newGroup, newName);
    setIsEditNodeModalOpen(false);
    setEditingNode(null);
  };

  const handleDeleteNode = (key: string) => {
    if (window.confirm(`ノード "${key}" を削除しますか？\n関連するパスもすべて削除されます。`)) {
      deleteNodes([key]);
    }
  };

  if (!data) return null; // 親コンポーネントでチェック済みのため、基本的には不要

  return (
    <>
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
            <select value={newNodeGroup} onChange={(e) => setNewNodeGroup(e.target.value)}>
              <option value="" disabled>
                {" "}
                -- Select a Group --{" "}
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

      {/* --- グループ一覧 --- */}
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

      {/* --- ノード一覧 --- */}
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
                <tr key={node.key} className={node.key === selectedNodeKey ? "selected-row" : ""} onClick={() => onNodeSelect(node.key)}>
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

      {/* --- モーダルコンポーネント --- */}
      <EditNodeModal isOpen={isEditNodeModalOpen} node={editingNode} onClose={() => setIsEditNodeModalOpen(false)} onSave={handleSaveNode} groups={allGroups} />
      <EditGroupModal isOpen={isEditGroupModalOpen} group={editingGroup} onClose={() => setIsEditGroupModalOpen(false)} onSave={handleSaveGroup} />
    </>
  );
}
