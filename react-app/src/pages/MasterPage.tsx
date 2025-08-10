// src/pages/MasterPage.tsx

import React, { useState } from "react";
import { useAppStore } from "../store/dataStore";
import { Link } from "react-router-dom";
import { ObjectEditor } from "../components/editor/ObjectEditor.tsx"; // これから作成
import { GraphEditor } from "../components/editor/GraphEditor.tsx"; // ←インポート
import { DataInspector } from "../components/editor/DataInspector";

// タブのスタイル（任意）
const tabStyle: React.CSSProperties = {
  padding: "10px 15px",
  cursor: "pointer",
  border: "1px solid transparent",
  borderBottom: "none",
};
const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  borderBottom: "2px solid blue",
  fontWeight: "bold",
};

export function MasterPage() {
  const data = useAppStore((state) => state.data);
  const [activeTab, setActiveTab] = useState<"objects" | "points">("objects");

  // データがロードされていない場合は、操作できないので案内を表示
  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>No data loaded</h2>
        <p>Please upload a ZIP file on the home page first.</p>
        <Link to="/">Go to Home</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Master Data Management</h1>

      {/* タブナビゲーション */}
      <nav style={{ borderBottom: "1px solid #ccc", marginBottom: "20px" }}>
        <button style={activeTab === "objects" ? activeTabStyle : tabStyle} onClick={() => setActiveTab("objects")}>
          Object Categories
        </button>
        <button style={activeTab === "points" ? activeTabStyle : tabStyle} onClick={() => setActiveTab("points")}>
          Points & Paths
        </button>
      </nav>

      {/* タブに応じて表示するコンポーネントを切り替え */}
      <div>
        {activeTab === "objects" && <ObjectEditor />}

        {activeTab === "points" && (
          // Flexboxを使って左右に分割するコンテナ
          <div style={{ display: "flex", gap: "20px", height: "80vh" }}>
            {/* 左側：グラフエディタ（可変幅） */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <GraphEditor />
            </div>

            {/* 右側：データインスペクター（固定幅） */}
            <div style={{ width: "550px", minWidth: "350px" }}>
              <DataInspector />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
