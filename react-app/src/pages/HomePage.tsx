// src/pages/HomePage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/dataStore"; // 作成したストアをインポート
import { loadDataFromZip } from "../services/dataLoader";
import { DataDisplay } from "../components/DataDisplay"; // 前回作成したコンポーネント
import { exportDataToZip } from "../services/dataExporter";

export function HomePage() {
  // ストアから状態とアクションを取得
  const { data, isLoading, error, setLoading, setData, setError, createNewProject } = useAppStore();
  const navigate = useNavigate(); // ページ遷移のためのフック

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(); // ストアに「読み込み開始」を通知

    try {
      const loadedData = await loadDataFromZip(file);
      setData(loadedData); // ストアに「読み込み成功とデータ」を通知
      console.log("Successfully loaded data:", loadedData);

      // 読み込み成功後、自動的にマスタ管理ページに遷移
      navigate("/master");
    } catch (e) {
      const message = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(message); // ストアに「エラー発生」を通知
    }
  };
  const handleNewProject = () => {
    createNewProject(); // ストアに空のデータを作成させる
    navigate("/master"); // 編集ページへ遷移
  };
  const handleExport = () => {
    if (data) {
      const date = new Date();
      const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
      const fileName = `mapdata_${formattedDate}.zip`;

      exportDataToZip(data, fileName);
    } else {
      alert("エクスポートするデータがありません。");
    }
  };
  return (
    <div style={{ padding: "20px" }}>
      <h1>Graph Data Editor</h1>
      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
        <h2>Start Editing</h2>
        <p>既存のZIPファイルをアップロードするか、新規作成を選択してください。</p>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <input type="file" accept=".zip" onChange={handleFileChange} disabled={isLoading} />
          <span>OR</span>
          <button onClick={handleNewProject} disabled={isLoading}>
            Start with a Blank Canvas
          </button>
        </div>
      </div>

      {/* ストアの状態に応じてUIを切り替え */}
      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* データが正常に読み込まれたら内容を表示 */}
      {data && (
        <div>
          <h2>Upload Successful!</h2>
          <button onClick={handleExport} style={{ padding: "8px 16px" }}>
            Export Edited Data to ZIP
          </button>
          <DataDisplay data={data} />
        </div>
      )}
    </div>
  );
}
