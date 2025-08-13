// src/components/editor/InventoryPanel.tsx

import { useMemo, useEffect } from "react";
import type { Data } from "../../services/dataLoader";
import { InventoryTable } from "./InventoryTable";

interface InventoryPanelProps {
  data: Data;
  selectedCategoryKey: string | null;
  setSelectedCategoryKey: (key: string | null) => void;
  focusedNodeKey: string | null;
  onRowClick: (key: string) => void;
}

export const InventoryPanel = ({ data, selectedCategoryKey, setSelectedCategoryKey, focusedNodeKey, onRowClick }: InventoryPanelProps) => {
  const allCategories = useMemo(() => {
    return Array.from(data.objectCategories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.objectCategories]);

  useEffect(() => {
    // カテゴリが選択されておらず、選択肢が存在する場合に最初のカテゴリを選択する
    if (!selectedCategoryKey && allCategories.length > 0) {
      setSelectedCategoryKey(allCategories[0].key);
    }
  }, [allCategories, selectedCategoryKey, setSelectedCategoryKey]);

  return (
    <>
      {/* --- ツールバー：備品選択 --- */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid #ccc", backgroundColor: "#f8f8f8" }}>
        <label htmlFor="category-select">表示する備品を選択:</label>
        <select id="category-select" value={selectedCategoryKey || ""} onChange={(e) => setSelectedCategoryKey(e.target.value)} style={{ padding: "5px", minWidth: "200px" }}>
          {allCategories.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* --- メインコンテンツ：在庫テーブル --- */}
      <div style={{ flexGrow: 1, overflowY: "auto" }}>
        <InventoryTable data={data} selectedCategoryKey={selectedCategoryKey} focusedNodeKey={focusedNodeKey} onRowClick={onRowClick} />
      </div>
    </>
  );
};
