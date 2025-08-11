// src/App.tsx
import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom";
import { AppHeader } from "./components/layout/AppHeader"; // 作成したヘッダー
import { PageNav } from "./components/layout/PageNav"; // 作成したナビ
import { ProjectHubPage } from "./pages/ProjectHubPage"; // 新しいハブページ
import { MasterPage } from "./pages/MasterPage";
import { ServicePage } from "./pages/ServicePage";
import { PathfindingPage } from "./pages/PathfindingPage.tsx"; // 経路計算ページ
import "./App.css";

function App() {
  return (
    <div className="app-layout">
      {/* 1. ファイル操作用のグローバルヘッダー */}
      <AppHeader />

      {/* 2. ページ遷移用のナビゲーション */}
      <PageNav />

      {/* 3. メインコンテンツエリア */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProjectHubPage />} />
          <Route path="/master" element={<MasterPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/pathfinding" element={<PathfindingPage />} />
        </Routes>
      </main>

      {/* 4. 通知表示用のコンポーネント */}
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
