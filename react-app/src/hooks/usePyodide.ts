import { useState, useEffect } from "react";

type PyodideInterface = Awaited<ReturnType<typeof window.loadPyodide>>;

export function usePyodide() {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false; // ★ クリーンアップフラグ

    const load = async () => {
      try {
        const instance = await window.loadPyodide({ indexURL: "/pyodide/" });
        if (isCancelled) return; // ★ 処理がキャンセルされていたら中断

        await instance.loadPackage("micropip");
        if (isCancelled) return;

        const micropip = instance.pyimport("micropip");
        await micropip.install("pulp");
        if (isCancelled) return;

        setPyodide(instance);
      } catch (error) {
        if (!isCancelled) {
          console.error("Pyodideのロードに失敗しました:", error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    // ★ useEffectのクリーンアップ関数
    // コンポーネントがアンマウントされる時に実行される
    return () => {
      isCancelled = true;
    };
  }, []); // 空の依存配列は変更なし

  return { pyodide, isLoading };
}
