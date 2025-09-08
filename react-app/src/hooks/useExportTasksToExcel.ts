import * as XLSX from "xlsx";
import type { SolverResultByCategory } from "../types/apiTypes";
import { ObjectCategory } from "../types/entities";

/**
 * タスク計算結果をエクセルファイルとしてエクスポートするカスタムフック
 */
export function useExportTasksToExcel() {
  const exportToExcel = (solverResult: SolverResultByCategory[], objectCategories: Map<string, ObjectCategory>, penalty: number, timeLimit: number, selectedCategoryKeys: string[], zipFileName: string = "") => {
    if (!solverResult || solverResult.length === 0) return;

    const now = new Date();

    // 各カテゴリごとのタスク数と解ステータスを集計
    const taskCountsCostAndStatus = solverResult.map((result) => {
      const categoryName = objectCategories.get(result.objectKey)?.name || result.objectKey;
      return [categoryName, result.taskCount, result.totalCost ?? "", result.status];
    });

    // 1. サマリーシート
    const summarySheet = [
      ["エクスポート日時", now.toLocaleString()],
      ["参照zipファイル名", zipFileName || "未取得"],
      ["計算対象カテゴリ", selectedCategoryKeys.map((k) => objectCategories.get(k)?.name || k).join(", ")],
      ["タスクペナルティ", penalty],
      ["計算時間上限(秒)", timeLimit],
      ["カテゴリ別サマリー", ""],
      ["カテゴリ", "タスク数", "総コスト", "解ステータス"],
      ["カテゴリ", "タスク数", "解ステータス"],
      ...taskCountsCostAndStatus,
    ];

    const sheets: { [sheetName: string]: XLSX.WorkSheet } = {
      サマリー: XLSX.utils.aoa_to_sheet(summarySheet),
    };

    // 2. 各カテゴリごとに「from整列」「to整列」シートを作成
    solverResult.forEach((result) => {
      const category = objectCategories.get(result.objectKey);
      const baseName = category?.name || result.objectKey;
      const tasks = result.routes || result.routes || [];

      // from整列（supplyNodeでソート）
      const fromSorted = [...tasks].sort((a, b) => {
        if (a.supplyNode < b.supplyNode) return -1;
        if (a.supplyNode > b.supplyNode) return 1;
        return 0;
      });
      const fromSheetData = [["from", "to", "amount", "cost"], ...fromSorted.map((task) => [task.demandNode, task.supplyNode, task.amount, task.cost ?? ""])]; // 応急処置
      sheets[`${baseName}(to整列)`] = XLSX.utils.aoa_to_sheet(fromSheetData);

      // to整列（demandNodeでソート）
      const toSorted = [...tasks].sort((a, b) => {
        if (a.demandNode < b.demandNode) return -1;
        if (a.demandNode > b.demandNode) return 1;
        return 0;
      });
      const toSheetData = [["from", "to", "amount", "cost"], ...toSorted.map((task) => [task.demandNode, task.supplyNode, task.amount, task.cost ?? ""])]; // 応急処置
      sheets[`${baseName}(from整列)`] = XLSX.utils.aoa_to_sheet(toSheetData);
    });

    // 3. ブック作成・ダウンロード
    const wb = XLSX.utils.book_new();
    Object.entries(sheets).forEach(([name, ws]) => {
      XLSX.utils.book_append_sheet(wb, ws, name);
    });

    XLSX.writeFile(wb, `輸送タスク結果_${now.toISOString().slice(0, 10)}.xlsx`);
  };

  return { exportToExcel };
}
