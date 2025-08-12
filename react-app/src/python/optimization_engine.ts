export const OPTIMIZATION_PYTHON_SCRIPT = `
import pulp

def solve_inventory_task(supply_data, demand_data, costs_data, task_penalty):
    """
    在庫輸送タスクの最適化問題を解く。

    Args:
        supply_data (dict): 供給地の備品在庫 { '供給地キー': {'備品キー': 個数} }
        demand_data (dict): 需要地の備品需要 { '需要地キー': {'備品キー': 個数} }
        costs_data (dict): 経路コスト { ('供給地キー', '需要地キー'): コスト }
        task_penalty (int): 1タスクあたりのペナルティコスト

    Returns:
        list: 輸送タスクのリスト [{'from': s, 'to': d, 'object': p, 'amount': val}]
    """

    # --- 0. データの前処理 ---
    supply_points = list(supply_data.keys())
    demand_points = list(demand_data.keys())
    
    # 全ての備品の種類をリストアップ
    products = set()
    for s in supply_points:
        products.update(supply_data[s].keys())
    for d in demand_points:
        products.update(demand_data[d].keys())
    products = list(products)
    
    # --- 1. モデルの定義 ---
    model = pulp.LpProblem("Yakagamisai_Task_Optimization", pulp.LpMinimize)

    # --- 2. 変数の定義 ---
    # a) 輸送量を表す整数変数 x_psd (備品pを供給地sから需要地dへ)
    route_vars = pulp.LpVariable.dicts("Route", (products, supply_points, demand_points), lowBound=0, cat='Integer')
    
    # b) タスクの有無を表すバイナリ変数 y_psd
    task_vars = pulp.LpVariable.dicts("TaskUsed", (products, supply_points, demand_points), cat='Binary')

    # --- 3. 目的関数の設定 ---
    # a) 総輸送コスト
    total_transport_cost = pulp.lpSum(
        costs_data.get((s, d), 10000) * route_vars[p][s][d] 
        for p in products for s in supply_points for d in demand_points
    )
    # b) 総タスクペナルティ
    total_task_penalty = pulp.lpSum(
        task_penalty * task_vars[p][s][d]
        for p in products for s in supply_points for d in demand_points
    )
    model += total_transport_cost + total_task_penalty, "Total_Cost"

    # --- 4. 制約条件の設定 ---
    
    # a) 各供給地の各備品について、供給量を満たす
    for p in products:
        for s in supply_points:
            model += pulp.lpSum(route_vars[p][s][d] for d in demand_points) == supply_data.get(s, {}).get(p, 0), f"Supply_{p}_{s}"

    # b) 各需要地の各備品について、需要量を満たす
    for p in products:
        for d in demand_points:
            model += pulp.lpSum(route_vars[p][s][d] for s in supply_points) == demand_data.get(d, {}).get(p, 0), f"Demand_{p}_{d}"

    # c) 輸送量とタスク有無を結びつける (Big M)
    M = 10000 # 輸送量としてありえない大きな数
    for p in products:
        for s in supply_points:
            for d in demand_points:
                model += route_vars[p][s][d] <= M * task_vars[p][s][d], f"BigM_{p}_{s}_{d}"

    # --- 5. 求解 ---
    model.solve()

    # --- 6. 結果の取得 ---
    results = []
    if pulp.LpStatus[model.status] == 'Optimal':
        for p in products:
            for s in supply_points:
                for d in demand_points:
                    amount = route_vars[p][s][d].value()
                    # 輸送量が0より大きいタスクのみをリストアップ
                    if amount > 0:
                        results.append({
                            'from': s,
                            'to': d,
                            'object': p,
                            'amount': int(amount)
                        })
    return results
`;
