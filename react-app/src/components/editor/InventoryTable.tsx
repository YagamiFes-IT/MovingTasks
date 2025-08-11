// src/components/editor/InventoryTable.tsx

import { useMemo, useEffect, useRef } from "react";
import { Data } from "../../services/dataLoader";
import { useAppStore } from "../../store/dataStore";
import "../../pages/ServicePage.css";

interface InventoryTableProps {
  data: Data;
  selectedCategoryKey: string | null;
  focusedNodeKey: string | null; // ★ 1. 親からフォーカスすべきノードのキーを受け取る
  onRowClick: (nodeKey: string) => void;
}

export function InventoryTable({ data, selectedCategoryKey, focusedNodeKey, onRowClick }: InventoryTableProps) {
  const updatePointObjectQuantity = useAppStore((state) => state.updatePointObjectQuantity);

  const allPoints = useMemo(() => {
    return Array.from(data.points.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.points]);

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    if (focusedNodeKey) {
      const node = rowRefs.current.get(focusedNodeKey);
      node?.scrollIntoView({
        behavior: "smooth", // スムーズにスクロール
        block: "center", // 画面の中央に来るように
      });
    }
  }, [focusedNodeKey]);

  const columnTotals = useMemo(() => {
    if (!selectedCategoryKey) return { from: 0, to: 0 };
    const category = data.objectCategories.get(selectedCategoryKey);
    if (!category) return { from: 0, to: 0 };

    let totalFrom = 0;
    let totalTo = 0;
    for (const point of allPoints) {
      const quantityChange = point.objects.get(category);
      if (quantityChange) {
        totalFrom += quantityChange.fromAmount;
        totalTo += quantityChange.toAmount;
      }
    }
    return { from: totalFrom, to: totalTo };
  }, [data, selectedCategoryKey, allPoints]);

  const selectedCategory = data.objectCategories.get(selectedCategoryKey || "");
  if (!selectedCategory) return <div className="placeholder">カテゴリを選択してください。</div>;

  return (
    <table className="data-table inventory-table">
      <thead>
        <tr>
          <th>地点 (Point)</th>
          <th>{selectedCategory.name} (From)</th>
          <th>{selectedCategory.name} (To)</th>
        </tr>
      </thead>
      <tbody>
        {allPoints.map((point) => {
          const quantity = point.objects.get(selectedCategory);
          const fromAmount = quantity?.fromAmount ?? 0;
          const toAmount = quantity?.toAmount ?? 0;
          return (
            <tr
              key={point.key}
              ref={(el) => {
                if (el) {
                  rowRefs.current.set(point.key, el);
                } else {
                  rowRefs.current.delete(point.key);
                }
              }}
              className={point.key === focusedNodeKey ? "focused" : ""}
              onClick={() => onRowClick(point.key)}
            >
              <td>
                {point.name} (<code>{point.key}</code>)
              </td>
              <td>
                <input type="number" className="cost-input" value={fromAmount} onChange={(e) => updatePointObjectQuantity(point.key, selectedCategory.key, Number(e.target.value), toAmount)} />
              </td>
              <td>
                <input type="number" className="cost-input" value={toAmount} onChange={(e) => updatePointObjectQuantity(point.key, selectedCategory.key, fromAmount, Number(e.target.value))} />
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td>
            <strong>合計 (Total)</strong>
          </td>
          <td className={columnTotals.from !== columnTotals.to ? "total-unmatched" : ""}>
            <strong>{columnTotals.from}</strong>
          </td>
          <td className={columnTotals.from !== columnTotals.to ? "total-unmatched" : ""}>
            <strong>{columnTotals.to}</strong>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
