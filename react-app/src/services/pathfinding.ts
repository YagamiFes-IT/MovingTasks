import TinyQueue from "tinyqueue";
import { Point, Path, Waypoint, Route } from "../types/entities";

type GraphNode = Point | Waypoint;

// --- 1. 単一始点ダイクストラ（内部で使う計算エンジン） ---
function findPathsFromSingleSource(allNodes: ReadonlyMap<string, GraphNode>, adj: Map<string, { to: string; cost: number }[]>, startNodeKey: string) {
  const distances = new Map<string, number>();
  const predecessors = new Map<string, string | null>();
  const pq = new TinyQueue<{ key: string; dist: number }>([], (a, b) => a.dist - b.dist);

  allNodes.forEach((node) => distances.set(node.key, Infinity));
  distances.set(startNodeKey, 0);
  pq.push({ key: startNodeKey, dist: 0 });

  while (pq.length > 0) {
    const { key: u } = pq.pop()!;
    (adj.get(u) || []).forEach((edge) => {
      const v = edge.to;
      const newDist = (distances.get(u) ?? Infinity) + edge.cost;
      if (newDist < (distances.get(v) ?? Infinity)) {
        distances.set(v, newDist);
        predecessors.set(v, u);
        pq.push({ key: v, dist: newDist });
      }
    });
  }
  return { distances, predecessors };
}

// --- 2. UIから呼び出す統括関数 ---
export function calculateAllPointToPointRoutes(points: ReadonlyMap<string, Point>, waypoints: ReadonlyMap<string, Waypoint>, paths: ReadonlyMap<string, Path>): Map<string, Route> {
  const finalRoutes = new Map<string, Route>();
  const allNodes = new Map([...points.entries(), ...waypoints.entries()]);

  // 隣接リストを作成 (一度だけ)
  const adj: Map<string, { to: string; cost: number }[]> = new Map();
  paths.forEach((path) => {
    adj.set(path.from.key, [...(adj.get(path.from.key) || []), { to: path.to.key, cost: path.cost }]);
    adj.set(path.to.key, [...(adj.get(path.to.key) || []), { to: path.from.key, cost: path.opposite_cost }]);
  });

  // --- すべてのPointを始点としてループ ---
  for (const startPoint of points.values()) {
    const { distances, predecessors } = findPathsFromSingleSource(allNodes, adj, startPoint.key);

    // --- 結果をフィルタリング ---
    // 終点がPointである経路のみを抽出
    for (const endPoint of points.values()) {
      // 始点と終点が同じ場合はスキップ
      if (startPoint.key === endPoint.key) continue;

      const distance = distances.get(endPoint.key);
      if (distance === undefined || distance === Infinity) continue;

      // 経路を復元
      const pathKeys: string[] = [];
      let current: string | null = endPoint.key;
      while (current) {
        pathKeys.unshift(current);
        current = predecessors.get(current) ?? null;
      }

      const newRoute = new Route(startPoint.key, endPoint.key, distance, pathKeys);
      finalRoutes.set(newRoute.key, newRoute);
    }
  }

  return finalRoutes;
}
