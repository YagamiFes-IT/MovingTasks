import { Link } from "react-router-dom";
import { useAppStore } from "../store/dataStore";
import { DataDisplay } from "../components/DataDisplay"; // データ表示コンポーネント
import "./ProjectHubPage.css";

// データがロードされていない場合に表示するコンポーネント
const ProjectPrompt = () => (
  <div className="project-prompt">
    <h2>ようこそ！</h2>
    <p>ヘッダーの「インポート」から既存のプロジェクトを読み込むか、「新規作成」を開始してください。</p>
  </div>
);

export const ProjectHubPage = () => {
  // ストアから現在のデータを取得
  const data = useAppStore((state) => state.data);

  return (
    <div className="project-hub-page">
      <h1 className="hub-title">プロジェクトハブ</h1>
      <p className="hub-subtitle">{data ? "データが読み込まれました。実行したいタスクを選択してください。" : "プロジェクトが読み込まれていません。"}</p>

      {/* データがある場合のみナビゲーションカードを表示 */}
      {data && (
        <div className="hub-cards-container">
          <Link to="/master" className="hub-card">
            <h2>マスタ編集</h2>
            <p>地点、備品、グループの情報を定義・編集します。</p>
          </Link>
          <Link to="/service" className="hub-card">
            <h2>業務データ編集</h2>
            <p>各地点の備品在庫数を編集します。</p>
          </Link>
          <Link to="/pathfinding" className="hub-card">
            <h2>経路計算</h2>
            <p>最短経路を計算し、手動で調整します。</p>
          </Link>
        </div>
      )}

      <hr className="divider" />

      {/* 条件に応じて表示を切り替え */}
      <div className="data-display-section">{data ? <DataDisplay data={data} /> : <ProjectPrompt />}</div>
    </div>
  );
};
