// src/components/layout/AppHeader.tsx
import React, { useRef } from "react";
import { useAppStore } from "../../store/dataStore";
import { loadDataFromZip } from "../../services/dataLoader";
import { exportDataToZip } from "../../services/dataExporter";
import { toast } from "react-hot-toast";

export const AppHeader = () => {
  // ストアから必要な状態とアクションを取得
  const { data, isLoading, createNewProject, setLoading, setData, setError } = useAppStore();

  // 非表示のinput要素を参照するためのref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const loadedData = await loadDataFromZip(file);
      setData(loadedData);
    } catch (e) {
      const message = e instanceof Error ? e.message : "不明なエラーが発生しました。";
      setError(message);
    }
    // valueをリセットして同じファイルを選択できるようにする
    event.target.value = "";
  };

  const handleImportClick = () => {
    // ボタンクリックで非表示のinputをクリックさせる
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    if (data) {
      const date = new Date();
      const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
      const fileName = `mapdata_${formattedDate}.zip`;
      exportDataToZip(data, fileName);
      toast.success(`${fileName} をエクスポートしました。`);
    } else {
      // alertの代わりにトースト通知を使う
      toast.error("エクスポートするデータがありません。");
    }
  };

  return (
    <header className="app-header">
      <div className="project-title">矢上祭タスク管理</div>
      <nav>
        <button onClick={createNewProject} disabled={isLoading}>
          新規作成
        </button>
        <button onClick={handleImportClick} disabled={isLoading}>
          インポート
        </button>
        {/* ファイル選択のための非表示のinput要素 */}
        <input type="file" accept=".zip" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
        <button onClick={handleExport} disabled={isLoading || !data}>
          エクスポート
        </button>
      </nav>
      {/* ローディング中はインジケーターなどを表示しても良い */}
      {isLoading && <div className="loading-indicator">読み込み中...</div>}
    </header>
  );
};
