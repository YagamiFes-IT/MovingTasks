// src/App.tsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { HomePage } from "./pages/HomePage.tsx";
import { MasterPage } from "./pages/MasterPage";

const navStyle: React.CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #ccc",
  marginBottom: "20px",
};

function App() {
  return (
    <div>
      {/* 全ページ共通のナビゲーション */}
      <nav style={navStyle}>
        <Link to="/" style={{ marginRight: "15px" }}>
          ホーム
        </Link>
        <Link to="/master">マスタ管理</Link>
      </nav>

      {/* URLに応じて表示するページを切り替える */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/master" element={<MasterPage />} />
      </Routes>
    </div>
  );
}

export default App;
