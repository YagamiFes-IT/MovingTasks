// src/components/TransportationSolver.tsx
import React, { useState } from "react";
import { useAppStore } from "../../store/dataStore.ts"; // 作成したストアをインポート

const TransportationSolver: React.FC = () => {
  // ストアから必要な値とアクションを取得
  const { isSolving, solverResult, error, solveTransportationProblem } = useAppStore();

  // UIで設定するためのローカルなstate
  const [penalty, setPenalty] = useState(100);
  const [targetCategory, setTargetCategory] = useState("p_desk"); // ★ここはUIで選択できるようにする

  const handleSolve = () => {
    // ストアのアクションを呼び出すだけ
    solveTransportationProblem(targetCategory, penalty);
  };

  return (
    <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #555", borderRadius: "8px" }}>
      <h2>輸送問題ソルバー</h2>
      {/* UIでペナルティなどを設定する例 */}
      <div>
        <label>タスクペナルティ: </label>
        <input type="number" value={penalty} onChange={(e) => setPenalty(Number(e.target.value))} />
      </div>
      {/* ★ 本来はObjectCategoryの一覧から選択するドロップダウンなどを用意する */}

      <button onClick={handleSolve} disabled={isSolving}>
        {isSolving ? "計算中..." : "最適化計算を実行"}
      </button>

      {error && <p style={{ color: "red" }}>エラー: {error}</p>}

      {solverResult && (
        <div style={{ marginTop: "20px" }}>
          <h3>計算結果</h3>
          <p>
            <strong>ステータス:</strong> {solverResult.status}
          </p>
          {solverResult.totalCost !== null && (
            <p>
              <strong>総コスト (ペナルティ込):</strong> {solverResult.totalCost.toFixed(2)}
            </p>
          )}
          <h4>輸送経路:</h4>
          {solverResult.routes.length > 0 ? (
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {solverResult.routes.map((route, index) => (
                <li key={index} style={{ background: "#F0F0F0", padding: "10px", margin: "5px 0", borderRadius: "4px" }}>
                  {route.supplyNode} → {route.demandNode} : <strong>{route.amount}個</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>有効な輸送経路はありません。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TransportationSolver;
