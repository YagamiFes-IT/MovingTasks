import { NavLink } from "react-router-dom";
import "./PageNav.css"; // スタイルシートをインポート

export const PageNav = () => {
  return (
    <nav className="page-nav">
      {/* NavLinkは、現在のURLと一致する場合に "active" クラスを自動で付与します。
        "ホーム" の代わりに「プロジェクトハブ」を玄関口とします。
      */}
      <NavLink to="/" end className="nav-link">
        プロジェクトハブ
      </NavLink>
      <NavLink to="/master" className="nav-link">
        マスタ編集
      </NavLink>
      <NavLink to="/service" className="nav-link">
        業務データ編集
      </NavLink>
      <NavLink to="/pathfinding" className="nav-link">
        経路計算
      </NavLink>
      <NavLink to="/solver" className="nav-link">
        移動表作成
      </NavLink>
      {/* 今後、タスク運用ページなどをここに追加 */}
    </nav>
  );
};
