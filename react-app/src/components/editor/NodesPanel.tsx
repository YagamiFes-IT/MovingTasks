import { useState, useMemo } from "react";
import { useAppStore } from "../../store/dataStore";
import { GraphNode, Area } from "../../types/entities";
import { EditNodeModal } from "./EditNodeModal";
import { EditAreaModal } from "./EditAreaModal";

interface NodesPanelProps {
  selectedNodeKey: string | null;
  onNodeSelect: (key: string | null) => void;
}

export function NodesPanel({ selectedNodeKey, onNodeSelect }: NodesPanelProps) {
  // --- ストアから必要なStateとアクションを取得 ---
  const data = useAppStore((state) => state.data);
  const addNode = useAppStore((state) => state.addNode);
  const addArea = useAppStore((state) => state.addArea);
  const updateNode = useAppStore((state) => state.updateNode);
  const deleteNodes = useAppStore((state) => state.deleteNodes);
  const updateArea = useAppStore((state) => state.updateArea);
  const deleteArea = useAppStore((state) => state.deleteArea);

  // --- UI表示状態の管理 ---
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAreaListOpen, setIsAreaListOpen] = useState(true);
  const [isNodeListOpen, setIsNodeListOpen] = useState(true);

  // --- グループ追加フォーム用のState ---
  const [newAreaKey, setNewAreaKey] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaDesc, setNewAreaDesc] = useState("");

  // --- ノード追加フォーム用のState ---
  const [newNodeType, setNewNodeType] = useState<"point" | "waypoint">("point");
  const [newNodeKey, setNewNodeKey] = useState("");
  const [newNodeArea, setNewNodeArea] = useState("");
  const [newNodeName, setNewNodeName] = useState("");

  // --- 編集モーダル用のState ---
  const [isEditNodeModalOpen, setIsEditNodeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  // --- 表示用データのメモ化 ---
  const sortedNodes = useMemo(() => {
    if (!data) return [];
    const allNodes = [...data.points.values(), ...data.waypoints.values()];
    return allNodes.sort((nodeA, nodeB) => (nodeA.areaKey + nodeA.key).localeCompare(nodeB.areaKey + nodeB.key));
  }, [data]);

  const allAreas = useMemo(() => {
    if (!data) return [];
    return Array.from(data.areas.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // --- イベントハンドラ ---
  const handleAddArea = () => {
    if (!newAreaKey.trim() || !newAreaName.trim()) {
      alert("Area KeyとNameは必須です。");
      return;
    }
    addArea(newAreaKey.trim(), newAreaName.trim(), newAreaDesc.trim());
    setNewAreaKey("");
    setNewAreaName("");
    setNewAreaDesc("");
  };

  const handleAddNode = () => {
    if (!newNodeKey.trim() || !newNodeArea) {
      alert("Areaの選択とNode Keyの入力は必須です。");
      return;
    }
    addNode(newNodeType, newNodeKey.trim(), newNodeArea, newNodeName.trim());
    setNewNodeKey("");
    setNewNodeName("");
  };

  const handleOpenEditAreaModal = (area: Area) => {
    setEditingArea(area);
    setIsEditAreaModalOpen(true);
  };

  const handleSaveArea = (key: string, newName: string, newDescription: string) => {
    updateArea(key, newName, newDescription);
    setIsEditAreaModalOpen(false);
    setEditingArea(null);
  };

  const handleDeleteArea = (areaKey: string) => {
    if (!data) return;
    const areaName = data.areas.get(areaKey)?.name || areaKey;
    const nodesInArea = [...data.points.values(), ...data.waypoints.values()].filter((node) => node.areaKey === areaKey);
    // (警告メッセージ生成のロジックは省略しても良いし、より詳細にしても良い)
    if (window.confirm(`グループ "${areaName}" を削除しますか？\n関連するノード（${nodesInArea.length}件）もすべて削除されます。`)) {
      deleteArea(areaKey);
    }
  };

  const handleOpenEditModal = (node: GraphNode) => {
    setEditingNode(node);
    setIsEditNodeModalOpen(true);
  };

  const handleSaveNode = (key: string, newArea: string, newName?: string) => {
    updateNode(key, newArea, newName);
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
        <h3 onClick={() => setIsAddAreaOpen(!isAddAreaOpen)}>
          <span className="triangle">{isAddAreaOpen ? "▼" : "▶"}</span> Add New Area
        </h3>
        {isAddAreaOpen && (
          <div className="add-node-form">
            <input type="text" placeholder="Key (Unique)" value={newAreaKey} onChange={(e) => setNewAreaKey(e.target.value)} />
            <input type="text" placeholder="Name" value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} />
            <input type="text" placeholder="Description" value={newAreaDesc} onChange={(e) => setNewAreaDesc(e.target.value)} />
            <button onClick={handleAddArea}>Add Area</button>
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
            <select value={newNodeArea} onChange={(e) => setNewNodeArea(e.target.value)}>
              <option value="" disabled>
                {" "}
                -- Select a Area --{" "}
              </option>
              {allAreas.map((area) => (
                <option key={area.key} value={area.key}>
                  {area.name} ({area.key})
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
        <h3 onClick={() => setIsAreaListOpen(!isAreaListOpen)}>
          <span className="triangle">{isAreaListOpen ? "▼" : "▶"}</span> Areas
        </h3>
        {isAreaListOpen && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allAreas.map((area) => (
                <tr key={area.key}>
                  <td>{area.name}</td>
                  <td>{area.key}</td>
                  <td>
                    <button onClick={() => handleOpenEditAreaModal(area)}>Edit</button>
                    <button onClick={() => handleDeleteArea(area.key)} className="delete-button">
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
                <th>Area</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedNodes.map((node) => (
                <tr key={node.key} className={node.key === selectedNodeKey ? "selected-row" : ""} onClick={() => onNodeSelect(node.key)}>
                  <td>{data.waypoints.has(node.key) ? "Waypoint" : "Point"}</td>
                  <td>{node.key}</td>
                  <td>{node.areaKey}</td>
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
      <EditNodeModal isOpen={isEditNodeModalOpen} node={editingNode} onClose={() => setIsEditNodeModalOpen(false)} onSave={handleSaveNode} areas={allAreas} />
      <EditAreaModal isOpen={isEditAreaModalOpen} area={editingArea} onClose={() => setIsEditAreaModalOpen(false)} onSave={handleSaveArea} />
    </>
  );
}
