from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pulp
import time

from pydantic import BaseModel, Field # BaseModelとFieldをインポート

# FastAPIアプリケーションのインスタンスを作成
app = FastAPI()

# --- ここが重要 ---
# CORS (Cross-Origin Resource Sharing) の設定
# 異なるオリジン（今回は http://localhost:3000）からのリクエストを許可する
origins = [
    "http://localhost:3000", # React開発サーバーのURL
    "http://localhost:5173",
    "https://yagamifes-it.github.io/MovingTasks",
    "https://yagamifes-it.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # すべてのHTTPメソッドを許可
    allow_headers=["*"], # すべてのHTTPヘッダーを許可
)
# --- ここまで ---

class QuantityChangeModel(BaseModel):
    fromAmount: int
    toAmount: int

class ObjectCategoryModel(BaseModel):
    key: str
    name: str

class PointModel(BaseModel):
    key: str
    name: str
    groupKey: str
    x: float
    y: float
    # JSONのキーは文字列であるため、dict[str, ...] で受け取る
    # strの部分はObjectCategoryのkeyが入る想定
    objects: dict[str, QuantityChangeModel]

class RouteModel(BaseModel):
    key: str
    # 'from'はPythonの予約語なので、別の変数名(from_node)を使い、
    # aliasでJSONの'from'フィールドとマッピングする
    from_node: str = Field(alias='from')
    to_node: str = Field(alias='to')
    distance: float
    nodeKeys: list[str]

# フロントから送られてくるデータ全体の構造を定義
class ProblemDataModel(BaseModel):
    objectCategories: dict[str, ObjectCategoryModel]
    points: dict[str, PointModel]
    routes: dict[str, RouteModel]
    # フロントから制御できるよう、タスクペナルティもデータに含める
    taskPenalty: int
    # どの物品カテゴリについて解くかを指定するキー
    targetObjectCategoryKeys: list[str]
    timeLimitSeconds: int = 60


# ▼▼▼ 新しいAPIエンドポイント ▼▼▼
@app.get("/")
def health_check():
    """Renderのヘルスチェック用エンドポイント"""
    return {"status": "ok"}

@app.post("/solve-dynamic-problem")
def solve_dynamic_problem(data: ProblemDataModel): # 引数でデータを受け取る
    # --- データへのアクセス方法 ---
    # FastAPIとPydanticのおかげで、dataは既にPythonオブジェクトになっている
    # print(f"Solving for category: {data.targetObjectCategoryKey}")
    # print(f"Task Penalty: {data.taskPenalty}")
    # print(f"First point's name: {list(data.points.values())[0].name}")
    final_response = []
    print("\n--- Backend Solver Start ---") # ログ追加
    print(f"Received request to solve for: {data.targetObjectCategoryKeys}") # ログ追加
    
    # 1. 計算対象のデータを抽出
    for category_key in data.targetObjectCategoryKeys:
        
        supply_nodes = {}
        demand_nodes = {}

        for point_key, point in data.points.items():
            if category_key in point.objects:
                change = point.objects[category_key].toAmount - point.objects[category_key].fromAmount
                if change < 0: # 供給地 (在庫が増える)
                    supply_nodes[point_key] = -change # 応急処置
                elif change > 0: # 需要地 (在庫が減る)
                    demand_nodes[point_key] = +change # 応急処置
        
        print(f"Extracted Supply Nodes: {supply_nodes}")
        print(f"Extracted Demand Nodes: {demand_nodes}")

        # コストはRouteのdistanceを利用
        costs = {(r.from_node, r.to_node): r.distance for r in data.routes.values()}
        
        # 2. PuLP問題の定義 (ロジックは前回とほぼ同じ)
        prob = pulp.LpProblem("Dynamic_Transportation_Problem", pulp.LpMinimize)
        
        # 変数定義
        route_keys = [(s, d) for s in supply_nodes for d in demand_nodes]
        route_vars = pulp.LpVariable.dicts("Route", route_keys, lowBound=0, cat='Integer')
        task_vars = pulp.LpVariable.dicts("TaskActive", route_keys, cat='Binary')

        # 目的関数
        prob += (
            pulp.lpSum([route_vars[r] * costs.get(r, 1e9) for r in route_keys]) + # 存在しない経路は大きなコスト
            pulp.lpSum([task_vars[r] * data.taskPenalty for r in route_keys]),
            "Total_Cost"
        )

        # 制約条件
        for s_key, s_amount in supply_nodes.items():
            prob += pulp.lpSum([route_vars[(s_key, d_key)] for d_key in demand_nodes]) <= s_amount
        
        for d_key, d_amount in demand_nodes.items():
            prob += pulp.lpSum([route_vars[(s_key, d_key)] for s_key in supply_nodes]) == d_amount

        M = sum(supply_nodes.values())
        for r in route_keys:
            prob += route_vars[r] <= M * task_vars[r]

        # 3. 問題を解いて結果を返す (前回と同様のロジック)
        prob.solve()
        
        status = pulp.LpStatus[prob.status]
        category_routes = []
        
        if status == "Optimal":
            for r in route_keys:
                amount = pulp.value(route_vars[r])
                if amount > 0:
                    category_routes.append({
                        "supplyNode": r[0],
                        "demandNode": r[1],
                        "amount": amount,
                        "objectKey": category_key # ★ objectKeyも付与
                    })
        
        # ★ このカテゴリの結果オブジェクトを作成
        category_result = {
            "objectKey": category_key,
            "status": status,
            "totalCost": pulp.value(prob.objective) if status == "Optimal" else None,
            "taskCount": len(category_routes), # ★ タスク数を計算
            "routes": category_routes
        }
        
        final_response.append(category_result) # ★ 最終レスポンスリストに追加
    return final_response

# ★★★ 新しいAPIエンドポイントを追加 ★★★
@app.post("/solve-dynamic-problem-fast")
def solve_dynamic_problem_fast(data: ProblemDataModel):
    final_response = []
    # TIME_LIMIT_SECONDS = 300
    
    for category_key in data.targetObjectCategoryKeys:
        
        supply_nodes = {}
        demand_nodes = {}

        for point_key, point in data.points.items():
            if category_key in point.objects:
                change = point.objects[category_key].toAmount - point.objects[category_key].fromAmount
                if change < 0: # 供給地 (在庫が増える)
                    demand_nodes[point_key] = -change
                elif change > 0: # 需要地 (在庫が減る)
                    supply_nodes[point_key] = +change # 需要量は正の値にする
        
        print(f"Extracted Supply Nodes: {supply_nodes}")
        print(f"Extracted Demand Nodes: {demand_nodes}")

        # コストはRouteのdistanceを利用
        costs = {(r.from_node, r.to_node): r.distance for r in data.routes.values()}
        
        # 2. PuLP問題の定義 (ロジックは前回とほぼ同じ)
        prob = pulp.LpProblem("Dynamic_Transportation_Problem", pulp.LpMinimize)
        
        # 変数定義
        route_keys = [(s, d) for s in supply_nodes for d in demand_nodes]
        route_vars = pulp.LpVariable.dicts("Route", route_keys, lowBound=0, cat='Integer')
        task_vars = pulp.LpVariable.dicts("TaskActive", route_keys, cat='Binary')

        # 目的関数
        prob += (
            pulp.lpSum([route_vars[r] * costs.get(r, 1e9) for r in route_keys]) + # 存在しない経路は大きなコスト
            pulp.lpSum([task_vars[r] * data.taskPenalty for r in route_keys]),
            "Total_Cost"
        )

        # 制約条件
        for s_key, s_amount in supply_nodes.items():
            prob += pulp.lpSum([route_vars[(s_key, d_key)] for d_key in demand_nodes]) <= s_amount
        
        for d_key, d_amount in demand_nodes.items():
            prob += pulp.lpSum([route_vars[(s_key, d_key)] for s_key in supply_nodes]) == d_amount

        M = sum(supply_nodes.values())
        for r in route_keys:
            prob += route_vars[r] <= M * task_vars[r]

        # ★ 1. solveメソッドに時間制限を追加
        # ここでは55秒に設定（Renderのタイムアウトが約1分のため） 
        solver = pulp.PULP_CBC_CMD(timeLimit=data.timeLimitSeconds, msg=1)
        # ★ 2. solve()の前後で時間を記録
        start_time = time.time()
        prob.solve(solver)
        end_time = time.time()

        solve_time = end_time - start_time
        print(f"--- Solve time for {category_key}: {solve_time:.2f} seconds ---")

        status = pulp.LpStatus[prob.status]
        objective_value = pulp.value(prob.objective)
        
        # ★★★ 3. 独自のステータス判定ロジック ★★★
        custom_status = "Infeasible" # デフォルト

        if objective_value is not None:
            # 解が見つかった場合
            if status == "Optimal" and solve_time < data.timeLimitSeconds * 0.98:
                # ステータスがOptimal かつ 時間制限に明らかに達していない場合のみ最適と判断
                custom_status = "Optimal"
            else:
                # それ以外はすべて暫定解 (Feasible) とする
                custom_status = "Feasible"
    
        category_routes = []

        # --- 結果のルート抽出 ---
        # 解が見つかっている場合（OptimalまたはFeasible）のみ実行
        if custom_status in ["Optimal", "Feasible"]:
            for r in route_keys:
                amount = pulp.value(route_vars[r])
                if amount is not None and amount > 0:
                    category_routes.append({
                        "supplyNode": r[0], "demandNode": r[1],
                        "amount": amount, "objectKey": category_key
                    })
        
        category_result = {
            "objectKey": category_key,
            "status": custom_status,
            "totalCost": objective_value,
            "taskCount": len(category_routes),
            "routes": category_routes,
        }
        final_response.append(category_result)

    return final_response