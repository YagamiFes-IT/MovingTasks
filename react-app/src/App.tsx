// src/App.tsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage.tsx";
import { MasterPage } from "./pages/MasterPage";
import { ServicePage } from "./pages/ServicePage";
import "./App.css";

function App() {
  return (
    <div>
      <nav className="app-nav">
        <div className="nav-main-links">
          <Link to="/" className="nav-link nav-link-main">
            ホーム
          </Link>
          <Link to="/service" className="nav-link nav-link-main">
            業務データ編集
          </Link>
        </div>

        <div>
          <Link to="/master" className="nav-link nav-link-sub">
            マスタ管理
          </Link>
        </div>
      </nav>

      {/* URLに応じて表示するページを切り替える */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/master" element={<MasterPage />} />
        <Route path="/service" element={<ServicePage />} />
      </Routes>
    </div>
  );
}

export default App;
