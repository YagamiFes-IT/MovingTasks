// src/components/pathfinding/CalculationStatus.tsx

export const CalculationStatus = ({ routeCount, isStale }: { routeCount: number; isStale: boolean }) => {
  if (routeCount === 0 && !isStale) {
    return <p>まだ経路は計算されていません。</p>;
  }

  const statusMessage = isStale ? <span style={{ color: "orange", fontWeight: "bold" }}>情報が古くなっています（グラフ変更あり）</span> : <span style={{ color: "green", fontWeight: "bold" }}>この経路情報は最新です</span>;

  return (
    <div style={{ border: "1px solid #eee", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
      <p style={{ margin: 0 }}>
        <strong>計算済みルート数:</strong> {routeCount} 件 | <strong>状態:</strong> {statusMessage}
      </p>
      {isStale && <p style={{ marginTop: "5px", fontSize: "0.9rem", color: "#666" }}>グラフ構造が変更されたため、再計算を推奨します。</p>}
    </div>
  );
};
