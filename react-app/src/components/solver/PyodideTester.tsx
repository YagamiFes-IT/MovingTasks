import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type PyodideInterface = Awaited<ReturnType<typeof window.loadPyodide>>;

export const PyodideTester = () => {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [statusMessage, setStatusMessage] = useState("Pyodideとpulpを準備中...");

  useEffect(() => {
    let isCancelled = false;

    const loadPyodideAndPackages = async () => {
      try {
        setStatusMessage("コアエンジンをロード中...");
        const pyodideInstance = await window.loadPyodide({
          indexURL: "/pyodide/",
        });
        if (isCancelled) return;

        setPyodide(pyodideInstance);
        setStatusMessage("準備完了！Pythonコードを実行できます。");
        toast.success("Pyodideとpulpの準備が完了しました。");
      } catch (error) {
        if (!isCancelled) {
          console.error("Pyodideのロード/パッケージインストールに失敗しました:", error);
          setStatusMessage("初期化中にエラーが発生しました。");
          toast.error("初期化に失敗しました。コンソールを確認してください。");
        }
      }
    };

    loadPyodideAndPackages();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleTestPulp = () => {
    if (!pyodide) return;
    try {
      // pulpがインポートできるか簡単なテストコードを実行
      const result = pyodide.runPython(`
        import micropip
        await micropip.install('pulp')
        
        import pulp
        # 簡単な問題を作成して、pulpが動作するか確認
        prob = pulp.LpProblem("Test")
        x = pulp.LpVariable("x", 0, 10)
        prob += x
        # Python側でのprintはコンソールに出力される
        print("PuLP version:", pulp.__version__)
        # 簡単な文字列を返して、JS側で受け取る
        "pulpのインポートと簡単なテストに成功しました！"
      `);
      toast.success(result);
      console.log("pulp test result:", result);
    } catch (error) {
      toast.error("pulpのテスト実行中にエラーが発生しました。");
      console.error(error);
    }
  };

  return (
    <div style={{ border: "1px solid green", padding: "15px", margin: "20px 0", borderRadius: "8px" }}>
      <h4>Pyodide + Pulp 統合テスト</h4>
      <p>状態: {statusMessage}</p>
      <button onClick={handleTestPulp} disabled={!pyodide}>
        pulpの動作をテスト
      </button>
    </div>
  );
};
