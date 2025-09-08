import { ObjectCategory, Route } from "./entities";

// APIレスポンスの型定義
export interface RouteResult {
  supplyNode: string;
  demandNode: string;
  amount: number;
  cost?: number;
  objectKey: string;
}

export interface SolverResultByCategory {
  objectKey: string;
  status: string;
  totalCost: number | null;
  taskCount: number;
  routes: RouteResult[];
}

export interface ProblemDataForApi {
  objectCategories: { [key: string]: ObjectCategory }; // 必要であればanyをより具体的な型に
  points: { [key: string]: object };
  routes: { [key: string]: Route };
  taskPenalty: number;
  targetObjectCategoryKeys: string[];
  timeLimitSeconds?: number; // オプショナルなプロパティとして定義
}

export type SolverResponse = SolverResultByCategory[];
