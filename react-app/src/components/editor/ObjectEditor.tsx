// src/components/editor/ObjectEditor.tsx

import React, { useState } from "react";
import { useAppStore } from "../../store/dataStore"; // パスを修正

export function ObjectEditor() {
  // ストアから必要なデータとアクションを取得
  const categories = useAppStore((state) => state.data?.objectCategories);
  const { addObjectCategory, deleteObjectCategory } = useAppStore();

  // 新規追加フォーム用のローカルstate
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey && newName && !categories?.has(newKey)) {
      addObjectCategory(newKey, newName);
      setNewKey("");
      setNewName("");
    } else {
      alert("Key must be unique and not empty.");
    }
  };

  if (!categories) return null; // データがない場合は何も表示しない

  return (
    <div>
      <h3>Edit Object Categories</h3>

      {/* 既存カテゴリの一覧テーブル */}
      <table style={{ borderCollapse: "collapse", width: "500px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Key</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Name</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(categories.values()).map((cat) => (
            <tr key={cat.key}>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>
                {cat.key}
              </td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>
                {cat.name}
              </td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>
                <button onClick={() => deleteObjectCategory(cat.key)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 新規追加フォーム */}
      <h4 style={{ marginTop: "30px" }}>Add New Category</h4>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Category Key (e.g., 'Chair')"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Category Name (e.g., '椅子')"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
