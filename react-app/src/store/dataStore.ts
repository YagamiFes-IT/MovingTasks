// src/store/dataStore.ts

import { create } from "zustand";
import { Data } from "../services/dataLoader";
import { ObjectCategory, GraphNode, Path, Group, Point, Waypoint, QuantityChange } from "../types/entities";
import { createCanonicalPathKey } from "../utils/pathUtils"; // ★ pathUtilsをインポート

// import type { Path } from "../types/entities";

interface AppState {
  data: Data | null;
  isLoading: boolean;
  error: string | null;
  selectedEdgePairKey: string | null;
  setData: (data: Data) => void;
  setLoading: () => void;
  setError: (error: string) => void;
  addObjectCategory: (key: string, name: string) => void;
  updateObjectCategory: (key: string, newName: string) => void;
  deleteObjectCategory: (key: string) => void;
  updateAllNodePositions: (positions: Map<string, { x: number; y: number }>) => void;
  setSelectedEdgePairKey: (key: string | null) => void;
  // ★ 修正1: updatePathCostの型定義を変更
  updatePathCost: (
    pathKey: string,
    direction: "forward" | "backward", // 'forward'はcost, 'backward'はopposite_cost
    newCost: number
  ) => void;

  addPath: (nodeKey1: string, nodeKey2: string, cost1to2?: number, cost2to1?: number) => void;
  deletePaths: (pathKeysToDelete: string[]) => void;

  addNode: (type: "point" | "waypoint", key: string, groupKey: string, name?: string) => void;
  updateNode: (key: string, newGroupKey: string, newName?: string) => void;
  deleteNodes: (nodeKeysToDelete: string[]) => void;

  addGroup: (key: string, name: string, description: string) => void;
  updateGroup: (key: string, newName: string, newDescription: string) => void;
  deleteGroup: (groupKey: string) => void;

  createNewProject: () => void;

  updatePointObjectQuantity: (pointKey: string, categoryKey: string, from: number, to: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  selectedEdgePairKey: null,

  // ★ 修正2: setDataのロジックを大幅に簡略化
  // dataLoaderが正規化済みのデータを渡してくれるので、複雑な処理は不要になった
  setData: (newData) => {
    set({
      data: new Data(new Map(newData.objectCategories), new Map(newData.groups), new Map(newData.points), new Map(newData.waypoints), new Map(newData.paths)),
      isLoading: false,
      error: null,
    });
  },

  setLoading: () => set({ isLoading: true, error: null, data: null }),
  setError: (errorMessage) => set({ error: errorMessage, isLoading: false, data: null }),
  // 以降のアクションも同様に new Map() でラップする
  addObjectCategory: (key, name) =>
    set((state) => {
      if (!state.data) return {};
      const newCategories = new Map(state.data.objectCategories);
      newCategories.set(key, new ObjectCategory(key, name));

      // ★ 修正: 既存のstateもラップする
      return {
        data: new Data(newCategories, new Map(state.data.groups), new Map(state.data.points), new Map(state.data.waypoints), new Map(state.data.paths)),
      };
    }),

  updateObjectCategory: (key, newName) =>
    set((state) => {
      if (!state.data) return {};
      const newCategories = new Map(state.data.objectCategories);
      const category = newCategories.get(key);
      if (category) {
        category.name = newName;
      }
      // ★ 修正: 既存のstateもラップする
      return {
        data: new Data(newCategories, new Map(state.data.groups), new Map(state.data.points), new Map(state.data.waypoints), new Map(state.data.paths)),
      };
    }),

  deleteObjectCategory: (key) =>
    set((state) => {
      if (!state.data) return {};
      const newCategories = new Map(state.data.objectCategories);
      newCategories.delete(key);
      // ★ 修正: 既存のstateもラップする
      return {
        data: new Data(newCategories, new Map(state.data.groups), new Map(state.data.points), new Map(state.data.waypoints), new Map(state.data.paths)),
      };
    }),

  updateAllNodePositions: (positions) =>
    set((state) => {
      if (!state.data) return {};
      const newPoints = new Map(state.data.points);
      const newWaypoints = new Map(state.data.waypoints);
      positions.forEach((pos, key) => {
        const targetNode: GraphNode | undefined = newPoints.get(key) ?? newWaypoints.get(key);
        if (targetNode) {
          targetNode.x = pos.x;
          targetNode.y = pos.y;
        }
      });
      // ★ 修正: 既存のstateもラップする
      return {
        data: new Data(new Map(state.data.objectCategories), new Map(state.data.groups), newPoints, newWaypoints, new Map(state.data.paths)),
      };
    }),

  setSelectedEdgePairKey: (key) => set({ selectedEdgePairKey: key }),

  updatePathCost: (pathKey, direction, newCost) =>
    set((state) => {
      if (!state.data) return {};

      const newPaths = new Map(state.data.paths);
      const path_to_update = newPaths.get(pathKey);

      if (path_to_update) {
        // 'direction'の値に応じて、更新するプロパティを切り替える
        if (direction === "forward") {
          path_to_update.cost = newCost;
        } else {
          // direction === 'backward'
          path_to_update.opposite_cost = newCost;
        }

        return {
          data: new Data(new Map(state.data.objectCategories), new Map(state.data.groups), new Map(state.data.points), new Map(state.data.waypoints), newPaths),
        };
      }
      return {};
    }),
  deleteNodes: (nodeKeysToDelete) =>
    set((state) => {
      if (!state.data || nodeKeysToDelete.length === 0) {
        return {}; // データがないか、削除対象がなければ何もしない
      }

      const newPoints = new Map(state.data.points);
      const newWaypoints = new Map(state.data.waypoints);
      const newPaths = new Map(state.data.paths);

      // (A) 対象のノードを削除
      nodeKeysToDelete.forEach((key) => {
        newPoints.delete(key);
        newWaypoints.delete(key);
      });

      // (B) 削除されたノードに接続するパスをすべて削除
      for (const [pathKey, path] of newPaths.entries()) {
        // fromかtoのどちらかが削除対象キーに含まれていたら、そのパスを削除
        if (nodeKeysToDelete.includes(path.from.key) || nodeKeysToDelete.includes(path.to.key)) {
          newPaths.delete(pathKey);
        }
      }

      // (C) 変更を反映した新しいDataオブジェクトで状態を更新
      return {
        data: new Data(new Map(state.data.objectCategories), new Map(state.data.groups), newPoints, newWaypoints, newPaths),
      };
    }),
  deletePaths: (pathKeysToDelete) =>
    set((state) => {
      if (!state.data || pathKeysToDelete.length === 0) {
        return {};
      }

      const newPaths = new Map(state.data.paths);

      console.log("Before deletion, paths map size:", newPaths.size);

      // 受け取ったキーの配列を元に、該当するパスを削除
      pathKeysToDelete.forEach((key) => {
        console.log(`Attempting to delete key: "${key}" | Exists: ${newPaths.has(key)}`);
        newPaths.delete(key);
      });

      console.log("After deletion, paths map size:", newPaths.size);

      return {
        data: new Data(new Map(state.data.objectCategories), new Map(state.data.groups), new Map(state.data.points), new Map(state.data.waypoints), newPaths),
      };
    }),
  addNode: (type, key, groupKey, name) =>
    set((state) => {
      if (!state.data) return {};

      // 1. キーの重複チェック
      if (state.data.points.has(key) || state.data.waypoints.has(key)) {
        alert(`エラー: ノードキー "${key}" は既に使用されています。`);
        return {}; // 重複している場合は状態を更新しない
      }

      const newPoints = new Map(state.data.points);
      const newWaypoints = new Map(state.data.waypoints);

      // 2. タイプに応じて新しいノードインスタンスを作成
      if (type === "point") {
        // ★ 修正: 正しい引数の順番で、空のMapを渡す
        const newPoint = new Point(
          key,
          name || key, // name
          groupKey, // groupKey
          0, // x
          0, // y
          new Map() // objects (空のマップ)
        );
        newPoints.set(key, newPoint);
      } else {
        // type === 'waypoint'
        const newWaypoint = new Waypoint(key, groupKey, 0, 0);
        newWaypoints.set(key, newWaypoint);
      }

      // 3. 新しいDataオブジェクトで状態を更新
      return {
        data: new Data(new Map(state.data.objectCategories), new Map(state.data.groups), newPoints, newWaypoints, new Map(state.data.paths)),
      };
    }),

  updateNode: (key, newGroupKey, newName) =>
    set((state) => {
      if (!state.data) return {};

      const newPoints = new Map(state.data.points);
      const newWaypoints = new Map(state.data.waypoints);

      // ★ 修正: 更新対象がPointかWaypointかを確認
      if (newPoints.has(key)) {
        const oldPoint = newPoints.get(key)!; // `!`は、hasで存在確認済みのため

        // ★ 修正: 新しいPointインスタンスを生成して置き換える
        const newPoint = new Point(
          oldPoint.key,
          newName ?? oldPoint.name, // newNameが提供されなければ元の名前を使う
          newGroupKey,
          oldPoint.x,
          oldPoint.y,
          new Map(oldPoint.objects) // objectsはディープコピーではないが、今回はOK
        );
        newPoints.set(key, newPoint);
      } else if (newWaypoints.has(key)) {
        const oldWaypoint = newWaypoints.get(key)!;

        // ★ 修正: 新しいWaypointインスタンスを生成して置き換える
        const newWaypoint = new Waypoint(oldWaypoint.key, newGroupKey, oldWaypoint.x, oldWaypoint.y);
        newWaypoints.set(key, newWaypoint);
      }

      // 変更を反映した新しいDataオブジェクトで状態を更新
      return {
        data: new Data(new Map(state.data.objectCategories), new Map(state.data.groups), newPoints, newWaypoints, new Map(state.data.paths)),
      };
    }),
  addGroup: (key, name, description) =>
    set((state) => {
      if (!state.data) return {};

      // グループキーの重複チェック
      if (state.data.groups.has(key)) {
        alert(`エラー: グループキー "${key}" は既に使用されています。`);
        return {};
      }

      const newGroups = new Map(state.data.groups);
      const newGroup = new Group(key, name, description);
      newGroups.set(key, newGroup);

      return {
        data: new Data(
          new Map(state.data.objectCategories),
          newGroups, // 更新されたgroupsマップ
          new Map(state.data.points),
          new Map(state.data.waypoints),
          new Map(state.data.paths)
        ),
      };
    }),

  updateGroup: (key, newName, newDescription) =>
    set((state) => {
      if (!state.data) return {};
      const newGroups = new Map(state.data.groups);
      const group = newGroups.get(key);
      if (group) {
        // 直接プロパティを更新（readonlyではないため）
        group.name = newName;
        group.description = newDescription;
      }
      return {
        data: new Data(
          new Map(state.data.objectCategories),
          newGroups, // 更新されたgroupsマップ
          new Map(state.data.points),
          new Map(state.data.waypoints),
          new Map(state.data.paths)
        ),
      };
    }),

  // ★ 3. deleteGroupアクションの実装を追加
  deleteGroup: (groupKey) =>
    set((state) => {
      if (!state.data) return {};

      // --- 削除対象をリストアップ ---
      // (A) このグループに所属するノードのキー一覧を取得
      const nodesInGroup = [...state.data.points.values(), ...state.data.waypoints.values()].filter((node) => node.groupKey === groupKey);

      const nodesToDelete = nodesInGroup.map((node) => node.key);
      const newGroups = new Map(state.data.groups);
      const newPoints = new Map(state.data.points);
      const newWaypoints = new Map(state.data.waypoints);
      const newPaths = new Map(state.data.paths);

      // (B) グループ自体を削除
      newGroups.delete(groupKey);

      // (C) 該当するノードを削除
      nodesToDelete.forEach((key) => {
        newPoints.delete(key);
        newWaypoints.delete(key);
      });

      // (D) 該当ノードに接続するパスを削除
      for (const [pathKey, path] of newPaths.entries()) {
        if (nodesToDelete.includes(path.from.key) || nodesToDelete.includes(path.to.key)) {
          newPaths.delete(pathKey);
        }
      }

      return {
        data: new Data(new Map(state.data.objectCategories), newGroups, newPoints, newWaypoints, newPaths),
      };
    }),
  addPath: (nodeKey1, nodeKey2, cost1to2, cost2to1) =>
    set((state) => {
      if (!state.data) return {};

      // (A) 自分自身へのパスは作成しない
      if (nodeKey1 === nodeKey2) {
        alert("エラー: 同じノード間にパスは作成できません。");
        return {};
      }

      // (B) パスの重複チェック
      const canonicalKey = createCanonicalPathKey(nodeKey1, nodeKey2);
      if (state.data.paths.has(canonicalKey)) {
        alert("エラー: そのパスは既に存在します。");
        return {};
      }

      // (C) 新しいPathインスタンスを作成
      const allNodes = new Map([...state.data.points.entries(), ...state.data.waypoints.entries()]);
      const node1 = allNodes.get(nodeKey1);
      const node2 = allNodes.get(nodeKey2);
      if (!node1 || !node2) {
        // ユーザーには見えないが、開発者向けにエラーを記録
        console.error(`Path creation failed: Node "${!node1 ? nodeKey1 : nodeKey2}" not found.`);
        return {}; // ノードが見つからなければ、何もせず処理を終了
      }

      const fromNode = nodeKey1 < nodeKey2 ? node1 : node2;
      const toNode = nodeKey1 < nodeKey2 ? node2 : node1;

      // ★ 3. 受け取ったコストを使い、未定義なら0をセット
      const forwardCost = nodeKey1 < nodeKey2 ? cost1to2 ?? 0 : cost2to1 ?? 0;
      const backwardCost = nodeKey1 < nodeKey2 ? cost2to1 ?? 0 : cost1to2 ?? 0;

      const newPath = new Path(fromNode, toNode, forwardCost, backwardCost);

      const newPaths = new Map(state.data.paths);
      newPaths.set(createCanonicalPathKey(nodeKey1, nodeKey2), newPath);

      return {
        data: new Data(
          new Map(state.data.objectCategories),
          new Map(state.data.groups),
          new Map(state.data.points),
          new Map(state.data.waypoints),
          newPaths // 更新されたpathsマップ
        ),
      };
    }),
  createNewProject: () => {
    // 5つの空のMapを持つ、まっさらなDataオブジェクトを生成
    const emptyData = new Data(
      new Map(), // objectCategories
      new Map(), // groups
      new Map(), // points
      new Map(), // waypoints
      new Map() // paths
    );
    // 生成した空のデータをストアにセット
    set({ data: emptyData, isLoading: false, error: null });
  },
  updatePointObjectQuantity: (pointKey, categoryKey, from, to) =>
    set((state) => {
      if (!state.data) return {};

      const newPoints = new Map(state.data.points);
      const targetPoint = newPoints.get(pointKey);
      const targetCategory = state.data.objectCategories.get(categoryKey);

      if (!targetPoint || !targetCategory) {
        console.error("Point or Category not found for update");
        return {};
      }

      // イミュータブル（不変性）を保つため、新しいMapとQuantityChangeで置き換える
      const newObjects = new Map(targetPoint.objects);
      const newQuantityChange = new QuantityChange(from, to);
      newObjects.set(targetCategory, newQuantityChange);

      const newPoint = new Point(targetPoint.key, targetPoint.name, targetPoint.groupKey, targetPoint.x, targetPoint.y, newObjects);
      newPoints.set(pointKey, newPoint);

      return {
        data: new Data(
          new Map(state.data.objectCategories),
          new Map(state.data.groups),
          newPoints, // ★ 今回更新したPointsのマップ
          new Map(state.data.waypoints),
          new Map(state.data.paths)
        ),
      };
    }),
}));
