// src/pages/ServicePage.tsx

import { useState } from "react";
import { useAppStore } from "../store/dataStore";
import { NoData } from "../components/layout/NoData.tsx";
import { ServiceMap } from "../components/editor/ServiceMap";
import { InventoryPanel } from "../components/editor/InventoryPanel";

export function ServicePage() {
  const data = useAppStore((state) => state.data);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [focusedNodeKey, setFocusedNodeKey] = useState<string | null>(null);

  if (!data) {
    return <NoData />;
  }

  // ノードがクリックされたときのハンドラ（両パネルで共有）
  const handleNodeFocus = (key: string) => {
    setFocusedNodeKey(key);
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 40px)", padding: "20px", gap: "20px" }}>
      {/* --- 左パネル：地図表示 --- */}
      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "8px", minWidth: 0 }}>
        <ServiceMap data={data} selectedCategoryKey={selectedCategoryKey} onNodeClick={handleNodeFocus} focusedNodeKey={focusedNodeKey} />
      </div>

      {/* --- 右パネル：在庫編集 --- */}
      {/* ★ 新しいInventoryPanelコンポーネントを呼び出す */}
      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "8px", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <InventoryPanel data={data} selectedCategoryKey={selectedCategoryKey} setSelectedCategoryKey={setSelectedCategoryKey} focusedNodeKey={focusedNodeKey} onRowClick={handleNodeFocus} />
      </div>
    </div>
  );
}
