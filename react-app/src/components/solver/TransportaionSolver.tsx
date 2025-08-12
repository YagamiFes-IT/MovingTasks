// src/components/TransportationSolver.tsx
import React, { useState } from "react";
import { useAppStore } from "../../store/dataStore"; // ストアのパスは適宜修正してください

const TransportationSolver: React.FC = () => {
  // 1. ストアから必要な状態とアクションを取得
  const { data, isSolving, solverResult, error, solveTransportationProblem } = useAppStore();

  // 2. このコンポーネント内で管理する状態
  // ユーザーが入力するタスクペナルティ
  const [penalty, setPenalty] = useState<number>(0);
  // 表示をフィルタリングするための備品カテゴリキー（"all"は全件表示）
  const [displayCategory, setDisplayCategory] = useState<string>("all");

  // 3. 計算実行ボタンが押されたときの処理
  const handleSolve = () => {
    // ストアのアクションに、UIから入力されたペナルティ値を渡して実行
    solveTransportationProblem(penalty);
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

      {/* --- 機能1: タスクペナルティの入力と最適化の実行 --- */}
      <div style={{ marginBottom: "15px" }}>
        <label>タスクペナルティ: </label>
        <input type="number" value={penalty} onChange={(e) => setPenalty(Number(e.target.value))} style={{ marginLeft: "10px" }} />
      </div>
      <button onClick={handleSolve} disabled={isSolving}>
        {isSolving ? "計算中..." : "全備品の最適化計算を実行"}
      </button>

      {error && <p style={{ color: "red", marginTop: "15px" }}>エラー: {error}</p>}

      {/* --- 機能2: 結果のサマリーとフィルタ表示 --- */}
      {solverResult && (
        <div style={{ marginTop: "20px" }}>
          <h3>計算結果サマリー</h3>
          {/* オブジェクトごとの成否を表示 */}
          <ul style={{ listStyle: "none", paddingLeft: 0, marginBottom: "20px" }}>
            {solverResult.map((result) => (
              <li key={result.objectKey} style={{ borderBottom: "1px solid #444", padding: "10px 0" }}>
                <strong>{data?.objectCategories.get(result.objectKey)?.name || result.objectKey}:</strong>
                <span style={{ color: result.status === "Optimal" ? "lightgreen" : "orange", marginLeft: "10px" }}>{result.status}</span>
                {result.status === "Optimal" && (
                  <span style={{ fontSize: "0.9em", marginLeft: "15px" }}>
                    (コスト: {result.totalCost?.toFixed(2)}, タスク数: {result.taskCount})
                  </span>
                )}
              </li>
            ))}
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
