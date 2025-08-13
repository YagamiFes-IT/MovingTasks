// src/pages/MasterPage.tsx

import { useState } from "react";
import { useAppStore } from "../store/dataStore";
import { ObjectEditor } from "../components/editor/ObjectEditor.tsx";
import { GraphEditor } from "../components/editor/GraphEditor.tsx";
import { DataInspector } from "../components/editor/DataInspector";
import { NoData } from "../components/layout/NoData.tsx";
import { Tabs } from "../components/editor/Tabs.tsx";

const TABS = [
  { id: "points", label: "Points & Paths" },
  { id: "objects", label: "Object Categories" },
];

export function MasterPage() {
  const data = useAppStore((state) => state.data);
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [selectedPathKey, setSelectedPathKey] = useState<string | null>(null);

  const [isInspectorOpen, setIsInspectorOpen] = useState(true);

  if (!data) {
    return <NoData />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Master Data Management</h1>
        {/* ★ 2. 開閉を切り替えるボタン */}
        {/* "points"タブがアクティブな時だけボタンを表示 */}
        {activeTab === "points" && <button onClick={() => setIsInspectorOpen(!isInspectorOpen)}>{isInspectorOpen ? "インスペクターを隠す" : "インスペクターを表示"}</button>}
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div>
        {activeTab === "objects" && <ObjectEditor />}

        {activeTab === "points" && (
          <div style={{ display: "flex", gap: "20px", height: "80vh" }}>
            {/* 左側：グラフエディタ */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <GraphEditor selectedNodeKey={selectedNodeKey} onNodeSelect={setSelectedNodeKey} selectedPathKey={selectedPathKey} onPathSelect={setSelectedPathKey} />
            </div>

            {/* ★ 3. isInspectorOpenがtrueの時だけインスペクターパネルを描画 */}
            {isInspectorOpen && (
              <div style={{ width: "630px", minWidth: "350px" }}>
                <DataInspector selectedNodeKey={selectedNodeKey} onNodeSelect={setSelectedNodeKey} selectedPathKey={selectedPathKey} onPathSelect={setSelectedPathKey} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
