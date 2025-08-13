// src/pages/SolverPage.tsx

import TransportationSolver from "../components/solver/TransportationSolver.tsx";
import { useAppStore } from "../store/dataStore.ts"; // ★ ストアをインポート
import { NoData } from "../components/layout/NoData.tsx";
export function SolverPage() {
  // ★ ストアからdataを取得
  const data = useAppStore((state) => state.data);

  // ★ dataが存在しない場合は、ここでフォールバックUIを返す
  if (!data) {
    return <NoData />;
  }

  // ★ dataが存在する場合のみ、ソルバーコンポーネントを表示
  return <TransportationSolver />;
}
