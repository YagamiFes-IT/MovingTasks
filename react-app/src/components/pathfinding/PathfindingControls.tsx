// src/components/pathfinding/PathfindingControls.tsx

interface PathfindingControlsProps {
  onCalculate: () => void;
}

export const PathfindingControls = ({ onCalculate }: PathfindingControlsProps) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p>下のボタンを押すと、すべての主要地点（Point）間の最短経路を一度に計算します。</p>
      <button onClick={onCalculate}>全経路を再計算</button>
    </div>
  );
};
