// src/components/editor/DataInspector.tsx

import { useState } from "react";
import { useAppStore } from "../../store/dataStore";
import { PathsPanel } from "./PathsPanel"; // ★ 新しいパネルをインポート
import { NodesPanel } from "./NodesPanel"; // ★ 新しいパネル
import "./DataInspector.css";

interface DataInspectorProps {
  selectedNodeKey: string | null;
  onNodeSelect: (key: string | null) => void;
  selectedPathKey: string | null;
  onPathSelect: (key: string | null) => void;
}

export function DataInspector({ selectedNodeKey, onNodeSelect, selectedPathKey, onPathSelect }: DataInspectorProps) {
  const [activeTab, setActiveTab] = useState<"paths" | "nodes">("nodes");
  const data = useAppStore((state) => state.data);

  // データがロードされていない場合の表示はここでも行う
  if (!data) {
    return <div className="inspector-container">データを読み込んでください。</div>;
  }

  return (
    <div className="inspector-container">
      {/* --- タブ切り替えUI --- */}
      <div className="inspector-tabs">
        <button onClick={() => setActiveTab("paths")} className={activeTab === "paths" ? "active" : ""}>
          Paths
        </button>
        <button onClick={() => setActiveTab("nodes")} className={activeTab === "nodes" ? "active" : ""}>
          Nodes & Areas
        </button>
      </div>

      {/* --- タブの中身 --- */}
      <div className="inspector-content">
        {/* activeTabに応じて、対応するパネルコンポーネントをレンダリング */}
        {activeTab === "paths" && <PathsPanel selectedPathKey={selectedPathKey} onPathSelect={onPathSelect} />}
        {activeTab === "nodes" && <NodesPanel selectedNodeKey={selectedNodeKey} onNodeSelect={onNodeSelect} />}
      </div>
    </div>
  );
}
