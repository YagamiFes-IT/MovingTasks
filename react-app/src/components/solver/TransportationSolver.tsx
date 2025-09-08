// src/components/TransportationSolver.tsx

import React, { useState, useEffect } from "react";
import { useAppStore } from "../../store/dataStore"; // ストアのパスは適宜修正してください
import { useExportTasksToExcel } from "../../hooks/useExportTasksToExcel"; // 追加

const TransportationSolver: React.FC = () => {
  // 1. ストアから必要な状態とアクションを取得
  const { data, isSolving, solverResult, error, solveTransportationProblem, solveTransportationProblemFast } = useAppStore();

  // 2. このコンポーネント内で管理する状態
  // ユーザーが入力するタスクペナルティ
  const [penalty, setPenalty] = useState<number>(0);
  // 表示をフィルタリングするための備品カテゴリキー（"all"は全件表示）
  const [displayCategory, setDisplayCategory] = useState<string>("all");
  const [timeLimit, setTimeLimit] = useState<number>(60);

  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<string[]>([]);

  const { exportToExcel } = useExportTasksToExcel(); // 追加

  // zipファイル名はアップロード時にstate等で保持して渡してください（ここでは空文字で仮置き）
  const zipFileName = "";

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  useEffect(() => {
    if (data && data.objectCategories.size > 0) {
      const currentCategoryExists = data.objectCategories.has(displayCategory);
      if (!currentCategoryExists || displayCategory === "all") {
        const firstCategoryKey = data.objectCategories.keys().next().value;
        if (firstCategoryKey) {
          // デフォルトを「すべて表示」のままにするか、最初のカテゴリを選択させるかはお好みで
          // setDisplayCategory(firstCategoryKey);
        }
      }
    }
  }, [data, displayCategory]);

  // 3. 計算実行ボタンが押されたときの処理
  const handleSolveFull = () => {
    solveTransportationProblem(penalty, selectedCategoryKeys);
  };

  const handleSolveFast = () => {
    solveTransportationProblemFast(penalty, timeLimit, selectedCategoryKeys);
  };
  // 4. 表示用のデータを準備
  // 全てのタスクのリスト
  const allTasks = data?.tasks ? Array.from(data.tasks.values()) : [];
  // フィルタリングされたタスクのリスト
  const filteredTasks = displayCategory === "all" ? allTasks : allTasks.filter((task) => task.object.key === displayCategory);

  // ドロップダウン用のカテゴリリスト
  const categoryOptions = data ? Array.from(data.objectCategories.values()) : [];

  return (
    <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #555", borderRadius: "8px", width: "100%", maxWidth: "600px" }}>
      <h2>輸送問題ソルバー</h2>
      <div style={{ marginBottom: "15px" }}>
        <label>計算対象カテゴリ:</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "5px" }}>
          {categoryOptions.map((category) => (
            <label key={category.key}>
              <input
                type="checkbox"
                checked={selectedCategoryKeys.includes(category.key)}
                onChange={(e) => {
                  setSelectedCategoryKeys((prev) => (e.target.checked ? [...prev, category.key] : prev.filter((k) => k !== category.key)));
                }}
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>
      {/* --- 機能1: タスクペナルティの入力と最適化の実行 --- */}
      <div style={{ marginBottom: "15px" }}>
        <label>タスクペナルティ: </label>
        <input type="number" value={penalty} onChange={(e) => setPenalty(Number(e.target.value))} onFocus={handleFocus} style={{ marginLeft: "10px" }} />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>計算時間の上限 (秒): </label>
        <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} onFocus={handleFocus} style={{ marginLeft: "10px" }} min="1" />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={handleSolveFast} disabled={isSolving}>
          {isSolving ? "計算中..." : "高速計算 (1分以内)"}
        </button>
        <button onClick={handleSolveFull} disabled={isSolving}>
          {isSolving ? "計算中..." : "完全解を計算"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: "15px" }}>エラー: {error}</p>}

      {/* --- 結果表示部分（ステータスの表示を少しリッチにする） --- */}
      {solverResult && (
        <div style={{ marginTop: "20px" }}>
          <h3>計算結果サマリー</h3>
          <button style={{ marginTop: "15px" }} onClick={() => exportToExcel(solverResult, data ? new Map(data.objectCategories) : new Map(), penalty, timeLimit, selectedCategoryKeys, zipFileName)}>
            エクセルにエクスポート
          </button>
          <ul style={{ listStyle: "none", paddingLeft: 0, marginBottom: "20px" }}>
            {solverResult.map((result) => {
              // ★ 4. ステータスに応じて色とテキストを動的に変更
              let statusColor = "orange";
              let statusText = result.status;
              if (result.status === "Optimal") {
                statusColor = "lightgreen";
                statusText = "最適解";
              } else if (result.status === "Feasible") {
                statusColor = "lightblue";
                statusText = "暫定解 (時間内)";
              }

              return (
                <li key={result.objectKey} style={{ borderBottom: "1px solid #444", padding: "10px 0" }}>
                  <strong>{data?.objectCategories.get(result.objectKey)?.name || result.objectKey}:</strong>
                  <span style={{ color: statusColor, marginLeft: "10px", fontWeight: "bold" }}>{statusText}</span>
                  {["Optimal", "Feasible"].includes(result.status) && (
                    <span style={{ fontSize: "0.9em", marginLeft: "15px" }}>
                      (コスト: {result.totalCost?.toFixed(2)}, タスク数: {result.taskCount})
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {/* プルダウン形式で表示するタスクを選択 */}
          <div>
            <label>表示フィルタ: </label>
            <select value={displayCategory} onChange={(e) => setDisplayCategory(e.target.value)} style={{ marginLeft: "10px" }}>
              <option value="all">すべて表示</option>
              {categoryOptions.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <h4>生成されたタスク ({filteredTasks.length}件)</h4>
          {filteredTasks.length > 0 ? (
            <ul style={{ listStyle: "none", paddingLeft: 0, maxHeight: "300px", overflowY: "auto" }}>
              {filteredTasks.map((task) => (
                <li key={task.id} style={{ background: "#F0F0F0", padding: "10px", margin: "5px 0", borderRadius: "4px" }}>
                  {task.fromPoint} → {task.toPoint} : <strong>{task.count}個</strong> ({task.object.name})
                </li>
              ))}
            </ul>
          ) : (
            <p>表示対象のタスクはありません。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransportationSolver;
