// src/App.tsx
import { Toaster } from "react-hot-toast";
// ★ 1. BrowserRouter をインポート
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppHeader } from "./components/layout/AppHeader";
import { PageNav } from "./components/layout/PageNav";
import { ProjectHubPage } from "./pages/ProjectHubPage";
import { MasterPage } from "./pages/MasterPage";
import { ServicePage } from "./pages/ServicePage";
import { PathfindingPage } from "./pages/PathfindingPage.tsx";
import { SolverPage } from "./pages/SolverPage.tsx";
import "./App.css";

function App() {
  return (
    // ★ 2. BrowserRouterで全体を囲み、basenameを設定
    <BrowserRouter basename="/MovingTasks">
      <div className="app-layout">
        <AppHeader />
        <PageNav />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ProjectHubPage />} />
            <Route path="/master" element={<MasterPage />} />
            <Route path="/service" element={<ServicePage />} />
            <Route path="/pathfinding" element={<PathfindingPage />} />
            <Route path="/solver" element={<SolverPage />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
