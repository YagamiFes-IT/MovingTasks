// src/components/layout/Tabs.tsx

import React from "react";

// タブのスタイル定義
const tabStyle: React.CSSProperties = {
  padding: "10px 15px",
  cursor: "pointer",
  border: "1px solid transparent",
  borderBottom: "none",
  background: "none",
};
const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  borderBottom: "2px solid blue",
  fontWeight: "bold",
};

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export const Tabs = ({ tabs, activeTab, setActiveTab }: TabsProps) => {
  return (
    <nav style={{ borderBottom: "1px solid #ccc", marginBottom: "20px" }}>
      {tabs.map((tab) => (
        <button key={tab.id} style={activeTab === tab.id ? activeTabStyle : tabStyle} onClick={() => setActiveTab(tab.id)}>
          {tab.label}
        </button>
      ))}
    </nav>
  );
};
