// src/store/dataStore.ts
import { toast } from "react-hot-toast";
import { create } from "zustand";
import { Data } from "../services/dataLoader";
import { ObjectCategory, Path, Group, Point, Waypoint, QuantityChange, Route, Task } from "../types/entities";
import { createCanonicalPathKey } from "../utils/pathUtils"; // ★ pathUtilsをインポート

// import type { Path } from "../types/entities";

interface RouteResult {
  supplyNode: string;
  demandNode: string;
  amount: number;
  cost?: number; // costはオプショナルにしておく
  objectKey: string;
}

/** 備品カテゴリごとの計算結果 */
interface SolverResultByCategory {
  objectKey: string; // ★ どの備品カテゴリの結果かを示すキー
  status: string;
  totalCost: number | null;
  taskCount: number; // ★ タスク数を追加
  routes: RouteResult[]; // ★ このカテゴリに属するタスクのみ
}

/** APIからのレスポンス全体の型 */
type SolverResponse = SolverResultByCategory[]; // ★ 結果の配列になる

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
  setRoutes: (newRoutes: Map<string, Route>) => void;
  isRouteStale: boolean;
  markRoutesAsStale: (stale: boolean) => void;

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

  isSolving: boolean; // 計算中かどうかを示すフラグ
  solverResult: SolverResponse | null; // 計算結果を保持

  // ★★★ 追加3: 新しいアクションの型定義 ★★★
  solveTransportationProblem: (taskPenalty: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // --- 初期状態 ---
  data: null,
  isLoading: false,
  error: null,
  selectedEdgePairKey: null,
  isRouteStale: false,
  isSolving: false,
  solverResult: null,

  // --- 状態管理系アクション ---

  setData: (newData) => {
    // dataLoaderからのデータはReadonlyではない可能性があるため、
    // コンストラクタでReadonlyMapに変換するのは安全な方法。
    // routesは初期状態では空なので、空のMapを渡す。
    set({
      data: new Data(new Map(newData.objectCategories), new Map(newData.groups), new Map(newData.points), new Map(newData.waypoints), new Map(newData.paths), newData.routes ? new Map(newData.routes) : new Map(), newData.tasks ? new Map(newData.tasks) : new Map()),
      isLoading: false,
      error: null,
    });
    toast.success("プロジェクトが正常に読み込まれました。");
  },

  setLoading: () => set({ isLoading: true, error: null, data: null }),

  setError: (errorMessage) => {
    set({ error: errorMessage, isLoading: false, data: null });
    // ✨ エラー通知を出す
    toast.error(`エラー: ${errorMessage}`);
  },

  setSelectedEdgePairKey: (key) => set({ selectedEdgePairKey: key }),

  markRoutesAsStale: (stale) => set({ isRouteStale: stale }),

  createNewProject: () => {
    // 空のMapを持つ、まっさらなDataオブジェクトを生成
    const emptyData = new Data(new Map(), new Map(), new Map(), new Map(), new Map(), new Map(), new Map());
    set({ data: emptyData, isLoading: false, error: null, isRouteStale: false });
    toast.success("新しいプロジェクトが作成されました。");
  },

  // --- ObjectCategory（備品）系アクション ---

  addObjectCategory: (key, name) =>
    set((state) => {
      if (!state.data) return {};
      const newCategories = new Map(state.data.objectCategories);
      newCategories.set(key, new ObjectCategory(key, name));
      return { data: state.data.withNewObjectCategories(newCategories) };
    }),

  updateObjectCategory: (key, newName) =>
    set((state) => {
      if (!state.data) return {};
      const newCategories = new Map(state.data.objectCategories);
      const category = newCategories.get(key);
      if (category) {
        // イミュータブルにするため新しいインスタンスで置き換え
        newCategories.set(key, new ObjectCategory(key, newName));
      }
      return { data: state.data.withNewObjectCategories(newCategories) };
    }),

  deleteObjectCategory: (keyToDelete: string) => {
    console.log("--- 1. deleteObjectCategory アクション開始 ---", { keyToDelete });

    const currentData = get().data;
    if (!currentData) {
      console.warn("デバッグ: currentDataが存在しないため処理を中断。");
      return;
    }

    const categoryToDelete = currentData.objectCategories.get(keyToDelete);

    if (!categoryToDelete) {
      console.warn(`デバッグ: カテゴリキー "${keyToDelete}" が見つかりませんでした。`);
      // toast.errorはここにあるので、もしこのメッセージが出るならtoast自体は機能している
      toast.error(`エラー: カテゴリキー "${keyToDelete}" が見つかりません。`);
      return;
    }

    console.log("--- 2. 削除対象のカテゴリを発見 ---", { categoryToDelete });

    const newObjectCategories = new Map(currentData.objectCategories);
    newObjectCategories.delete(keyToDelete);

    const newPoints = new Map(currentData.points);
    let pointsWereUpdated = false; // ★ ポイントが更新されたかを追跡するフラグ

    for (const [pointKey, point] of newPoints.entries()) {
      if (point.objects.has(categoryToDelete)) {
        console.log(`--- 3. Point "${pointKey}" からカテゴリ "${keyToDelete}" を削除します ---`);
        pointsWereUpdated = true; // ★ 更新があったことを記録

        const newPointObjects = new Map(point.objects);
        newPointObjects.delete(categoryToDelete);

        const updatedPoint = new Point(point.key, point.name, point.groupKey, point.x, point.y, newPointObjects);
        newPoints.set(pointKey, updatedPoint);
      }
    }

    if (pointsWereUpdated) {
      console.log("--- 4. ポイントの更新がありました ---", { newPoints });
    } else {
      console.log("--- 4. どのポイントにも削除対象のカテゴリはありませんでした ---");
    }

    const newData = currentData.withNewObjectCategories(newObjectCategories).withNewPoints(newPoints);

    console.log("--- 5. 新しいDataオブジェクトを生成しました ---");

    set({ data: newData });

    console.log("--- 6. set({ data: newData }) を呼び出しました ---");

    toast.success(`備品カテゴリ "${categoryToDelete.name}" を関連データごと削除しました。`);

    console.log("--- 7. toast.success() が呼び出されました ---");
  },

  // --- Group（グループ）系アクション ---

  addGroup: (key, name, description) =>
    set((state) => {
      if (!state.data || state.data.groups.has(key)) {
        if (state.data?.groups.has(key)) alert(`エラー: グループキー "${key}" は既に使用されています。`);
        return {};
      }
      const newGroups = new Map(state.data.groups);
      newGroups.set(key, new Group(key, name, description));
      return { data: state.data.withNewGroups(newGroups) };
    }),

  updateGroup: (key, newName, newDescription) =>
    set((state) => {
      if (!state.data) return {};
      const newGroups = new Map(state.data.groups);
      const group = newGroups.get(key);
      if (group) {
        // イミュータブルにするため新しいインスタンスで置き換え
        newGroups.set(key, new Group(key, newName, newDescription));
      }
      return { data: state.data.withNewGroups(newGroups) };
    }),

  deleteGroup: (groupKey) =>
    set((state) => {
      if (!state.data) return {};

      const nodesInGroup = [...state.data.points.values(), ...state.data.waypoints.values()].filter((node) => node.groupKey === groupKey);
      const nodesToDelete = nodesInGroup.map((node) => node.key);

      const newGroups = new Map(state.data.groups);
      newGroups.delete(groupKey);

      const newPoints = new Map(state.data.points);
      const newWaypoints = new Map(state.data.waypoints);
      nodesToDelete.forEach((key) => {
        newPoints.delete(key);
        newWaypoints.delete(key);
      });

      const newPaths = new Map(state.data.paths);
      for (const [pathKey, path] of newPaths.entries()) {
        if (nodesToDelete.includes(path.from.key) || nodesToDelete.includes(path.to.key)) {
          newPaths.delete(pathKey);
        }
      }

      // メソッドをチェーンして更新
      return {
        data: state.data.withNewGroups(newGroups).withNewPoints(newPoints).withNewWaypoints(newWaypoints).withNewPaths(newPaths),
        isRouteStale: true,
      };
    }),

  // --- Node（地点）系アクション ---

  addNode: (type, key, groupKey, name) =>
    set((state) => {
      if (!state.data || state.data.points.has(key) || state.data.waypoints.has(key)) {
        if (state.data) alert(`エラー: ノードキー "${key}" は既に使用されています。`);
        return {};
      }

      if (type === "point") {
        const newPoints = new Map(state.data.points);
        newPoints.set(key, new Point(key, name || key, groupKey, 0, 0, new Map()));
        return { data: state.data.withNewPoints(newPoints), isRouteStale: true };
      } else {
        const newWaypoints = new Map(state.data.waypoints);
        newWaypoints.set(key, new Waypoint(key, groupKey, 0, 0));
        return { data: state.data.withNewWaypoints(newWaypoints), isRouteStale: true };
      }
    }),

  updateNode: (key, newGroupKey, newName) =>
    set((state) => {
      if (!state.data) return {};

      if (state.data.points.has(key)) {
        const newPoints = new Map(state.data.points);
        const oldPoint = newPoints.get(key)!;
        const newPoint = new Point(
          key,
          newName ?? oldPoint.name,
          newGroupKey,
          oldPoint.x,
          oldPoint.y,
          new Map(oldPoint.objects) // ReadonlyMapから新しいMapを生成
        );
        newPoints.set(key, newPoint);
        return { data: state.data.withNewPoints(newPoints), isRouteStale: true };
      } else if (state.data.waypoints.has(key)) {
        const newWaypoints = new Map(state.data.waypoints);
        const oldWaypoint = newWaypoints.get(key)!;
        const newWaypoint = new Waypoint(key, newGroupKey, oldWaypoint.x, oldWaypoint.y);
        newWaypoints.set(key, newWaypoint);
        return { data: state.data.withNewWaypoints(newWaypoints), isRouteStale: true };
      }
      return {};
    }),

  deleteNodes: (nodeKeysToDelete) =>
    set((state) => {
      if (!state.data || nodeKeysToDelete.length === 0) return {};

      const newPoints = new Map(state.data.points);
      const newWaypoints = new Map(state.data.waypoints);
      const newPaths = new Map(state.data.paths);

      nodeKeysToDelete.forEach((key) => {
        newPoints.delete(key);
        newWaypoints.delete(key);
      });

      for (const [pathKey, path] of newPaths.entries()) {
        if (nodeKeysToDelete.includes(path.from.key) || nodeKeysToDelete.includes(path.to.key)) {
          newPaths.delete(pathKey);
        }
      }

      return {
        data: state.data.withNewPoints(newPoints).withNewWaypoints(newWaypoints).withNewPaths(newPaths),
        isRouteStale: true,
      };
    }),

  updateAllNodePositions: (positions) =>
    set((state) => {
      if (!state.data) return {};
      const newPoints = new Map(state.data.points);
      const newWaypoints = new Map(state.data.waypoints);

      positions.forEach((pos, key) => {
        if (newPoints.has(key)) {
          const oldPoint = newPoints.get(key)!;
          newPoints.set(
            key,
            new Point(
              key,
              oldPoint.name,
              oldPoint.groupKey,
              pos.x,
              pos.y,
              new Map(oldPoint.objects) // ReadonlyMapから新しいMapを生成
            )
          );
        } else if (newWaypoints.has(key)) {
          const oldWaypoint = newWaypoints.get(key)!;
          newWaypoints.set(key, new Waypoint(key, oldWaypoint.groupKey, pos.x, pos.y));
        }
      });

      return {
        data: state.data.withNewPoints(newPoints).withNewWaypoints(newWaypoints),
        isRouteStale: true,
      };
    }),

  updatePointObjectQuantity: (pointKey, categoryKey, from, to) =>
    set((state) => {
      if (!state.data) return {};
      const newPoints = new Map(state.data.points);
      const targetPoint = newPoints.get(pointKey);
      const targetCategory = state.data.objectCategories.get(categoryKey);

      if (!targetPoint || !targetCategory) return {};

      const newObjects = new Map(targetPoint.objects);
      newObjects.set(targetCategory, new QuantityChange(from, to));

      const newPoint = new Point(targetPoint.key, targetPoint.name, targetPoint.groupKey, targetPoint.x, targetPoint.y, newObjects);
      newPoints.set(pointKey, newPoint);

      return { data: state.data.withNewPoints(newPoints) };
    }),

  // --- Path（経路）系アクション ---

  addPath: (nodeKey1, nodeKey2, cost1to2, cost2to1) =>
    set((state) => {
      if (!state.data) return {};
      if (nodeKey1 === nodeKey2) {
        alert("エラー: 同じノード間にパスは作成できません。");
        return {};
      }
      const canonicalKey = createCanonicalPathKey(nodeKey1, nodeKey2);
      if (state.data.paths.has(canonicalKey)) {
        alert("エラー: そのパスは既に存在します。");
        return {};
      }

      const allNodes = new Map([...state.data.points.entries(), ...state.data.waypoints.entries()]);
      const node1 = allNodes.get(nodeKey1);
      const node2 = allNodes.get(nodeKey2);
      if (!node1 || !node2) return {};

      const fromNode = nodeKey1 < nodeKey2 ? node1 : node2;
      const toNode = nodeKey1 < nodeKey2 ? node2 : node1;
      const forwardCost = nodeKey1 < nodeKey2 ? cost1to2 ?? 0 : cost2to1 ?? 0;
      const backwardCost = nodeKey1 < nodeKey2 ? cost2to1 ?? 0 : cost1to2 ?? 0;

      const newPaths = new Map(state.data.paths);
      newPaths.set(canonicalKey, new Path(fromNode, toNode, forwardCost, backwardCost));

      return { data: state.data.withNewPaths(newPaths), isRouteStale: true };
    }),

  updatePathCost: (pathKey, direction, newCost) =>
    set((state) => {
      if (!state.data) return {};
      const newPaths = new Map(state.data.paths);
      const path_to_update = newPaths.get(pathKey);

      if (path_to_update) {
        const newPath = new Path(path_to_update.from, path_to_update.to, direction === "forward" ? newCost : path_to_update.cost, direction === "backward" ? newCost : path_to_update.opposite_cost);
        newPaths.set(pathKey, newPath);
        return { data: state.data.withNewPaths(newPaths), isRouteStale: true };
      }
      return {};
    }),

  deletePaths: (pathKeysToDelete) =>
    set((state) => {
      if (!state.data || pathKeysToDelete.length === 0) return {};
      const newPaths = new Map(state.data.paths);
      pathKeysToDelete.forEach((key) => newPaths.delete(key));
      return { data: state.data.withNewPaths(newPaths), isRouteStale: true };
    }),

  // --- Route（最適ルート）系アクション ---

  setRoutes: (newRoutes) =>
    set((state) => {
      if (!state.data) return {};
      return {
        data: state.data.withNewRoutes(newRoutes),
        isRouteStale: false,
      };
    }),
  solveTransportationProblem: async (taskPenalty: number) => {
    // ★ 1. taskPenaltyを引数で受け取る
    set({ isSolving: true, error: null, solverResult: null });

    try {
      const currentData = get().data;
      if (!currentData) {
        throw new Error("データがロードされていません。");
      }
      // 1. 計算可能な備品カテゴリを判定
      const solvableCategoryKeys: string[] = [];
      for (const category of currentData.objectCategories.values()) {
        let totalSupply = 0;
        let totalDemand = 0;
        for (const point of currentData.points.values()) {
          const quantityChange = point.objects.get(category);
          if (quantityChange) {
            const diff = quantityChange.toAmount - quantityChange.fromAmount;
            if (diff > 0) totalDemand += diff;
            else if (diff < 0) totalSupply += -diff;
          }
        }
        if (totalSupply > 0 && totalSupply === totalDemand) {
          solvableCategoryKeys.push(category.key);
        }
      }

      if (solvableCategoryKeys.length === 0) {
        toast("計算可能な（需要と供給が一致する）備品がありません。");
        set({ isSolving: false });
        return;
      }

      const pointsForApi = Array.from(currentData.points.values()).reduce((acc, point) => {
        // point.objects (Map) をループし、キーに category.key を使った新しいオブジェクトを作成
        const newObjects = Array.from(point.objects.entries()).reduce((objAcc, [category, quantityChange]) => {
          // categoryオブジェクト自身ではなく、category.key をキーにする
          objAcc[category.key] = quantityChange;
          return objAcc;
        }, {} as { [key: string]: QuantityChange });

        // 新しいpointオブジェクトを生成
        acc[point.key] = {
          ...point,
          objects: newObjects, // 正しく変換されたオブジェクトをセット
        };
        return acc;
      }, {} as { [key: string]: object });

      const problemData = {
        objectCategories: Object.fromEntries(currentData.objectCategories.entries()),
        points: pointsForApi,
        routes: Object.fromEntries(currentData.routes.entries()),
        taskPenalty: taskPenalty, // ★ UIから渡された値を使用
        targetObjectCategoryKeys: solvableCategoryKeys, // ★ 計算対象のキーリスト
      };
      const PRODUCTION_API_URL = "https://movingtasks-pythonapi.onrender.com";
      const DEVELOPMENT_API_URL = "http://localhost:8000";

      // 2. 現在のホスト名に応じてAPI URLを決定
      //    window.location.hostnameで、現在ブラウザが表示しているサイトのドメイン名がわかる
      const apiUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

      console.log("Connecting to API at:", apiUrl); // デバッグ用に、どちらのURLを使っているか表示

      const response = await fetch(`${apiUrl}/solve-dynamic-problem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(problemData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "APIリクエストに失敗しました");
      }

      const results: SolverResponse = await response.json();

      // 5. 結果を処理してTaskオブジェクトとして格納する
      const newTasks = new Map<string, Task>();
      let isAnyOptimal = false;

      // ★ 結果の配列をループ処理
      for (const result of results) {
        if (result.status === "Optimal" && result.routes) {
          isAnyOptimal = true;
          // ★ result.routes（＝そのカテゴリのタスクリスト）をループ
          for (const route of result.routes) {
            const objectCategory = currentData.objectCategories.get(route.objectKey);
            if (!objectCategory) continue;

            const routeInfo = currentData.routes.get(`${route.supplyNode}_${route.demandNode}`);
            const distance = routeInfo ? routeInfo.distance : 0;
            const taskWeight = distance * route.amount;

            const newTask = new Task(route.supplyNode, route.demandNode, objectCategory, route.amount, taskWeight);
            newTasks.set(newTask.id, newTask);
          }
        }
      }

      // 1つでも最適解が見つかっていれば、タスクを更新
      if (isAnyOptimal) {
        const newData = currentData.withNewTasks(newTasks);
        set({
          data: newData,
          solverResult: results, // ★ APIからのレスポンス全体を保存
          isSolving: false,
        });
        toast.success("計算が完了し、タスクが生成されました！");
      } else {
        set({ solverResult: results, isSolving: false });
        toast.error(`計算に失敗しました。`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "予期せぬエラーが発生しました。";
      set({ error: errorMessage, isSolving: false });
      toast.error(errorMessage);
    }
  },
}));
