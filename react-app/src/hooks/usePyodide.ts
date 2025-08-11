import { useState, useEffect } from "react";

// --- この部分を修正 ---
// ReturnTypeを使って、window.loadPyodide関数の返り値の型を安全に取得します。
// Awaited<T>は、Promiseが解決した後の型を取り出します。
type PyodideInterface = Awaited<ReturnType<typeof window.loadPyodide>>;
// --------------------

// Pyodideのロード処理はグローバルで一度だけ実行する
const pyodidePromise = window.loadPyodide({
  indexURL: "/pyodide/",
});

export const usePyodide = () => {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const instance = await pyodidePromise;
        await instance.loadPackage("pulp");
        setPyodide(instance);
      } catch (error) {
        console.error("Pyodide failed to load", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return { pyodide, isLoading };
};
