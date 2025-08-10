// src/pages/ServicePage.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useAppStore } from "../store/dataStore";
import { Link } from "react-router-dom";
import { ServiceMap } from "../components/editor/ServiceMap";
import { InventoryTable } from "../components/editor/InventoryTable";
// import './ServicePage.css'; // ← CSSへの依存を減らすため、後で削除してもOK

export function ServicePage() {
  const data = useAppStore((state) => state.data);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [focusedNodeKey, setFocusedNodeKey] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    if (!data) return [];
    return Array.from(data.objectCategories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  useEffect(() => {
    if (!selectedCategoryKey && allCategories.length > 0) {
      setSelectedCategoryKey(allCategories[0].key);
    }
  }, [allCategories, selectedCategoryKey]);
  const handleNodeClick = (key: string) => {
    setFocusedNodeKey(key);
  };
  const handleTableRowClick = (key: string) => {
    setFocusedNodeKey(key);
  };
  if (!data) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>データが読み込まれていません</h2>
        <p>
          <Link to="/">ホームページ</Link>に戻ってデータを読み込んでください。
        </p>
      </div>
    );
  }

  return (
    // ★ 修正: classNameではなく、MasterPageと同じstyle属性でレイアウトを定義
    <div style={{ display: "flex", height: "calc(100vh - 40px)", padding: "20px", gap: "20px" }}>
      {/* --- 左パネル：地図表示 --- */}
      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "8px", minWidth: 0 }}>
        <ServiceMap data={data} selectedCategoryKey={selectedCategoryKey} onNodeClick={handleNodeClick} focusedNodeKey={focusedNodeKey} />
      </div>

      {/* --- 右パネル：物品編集テーブル --- */}
      <div style={{ flex: 1, border: "1px solid #ccc", borderRadius: "8px", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="toolbar" style={{ padding: "10px 20px", borderBottom: "1px solid #ccc", backgroundColor: "#f8f8f8" }}>
          <label htmlFor="category-select">表示する備品を選択:</label>
          <select id="category-select" value={selectedCategoryKey || ""} onChange={(e) => setSelectedCategoryKey(e.target.value)} style={{ padding: "5px", minWidth: "200px" }}>
            {allCategories.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flexGrow: 1, overflowY: "auto" }}>
          <InventoryTable data={data} selectedCategoryKey={selectedCategoryKey} focusedNodeKey={focusedNodeKey} onRowClick={handleTableRowClick} />
        </div>
      </div>
    </div>
  );
}
