/**
 * データの基本的な構成要素（エンティティ）を定義するファイル。
 * 各クラスは、XMLファイルから読み込まれるデータの構造を表します。
 */

/**
 * 物品やアイテムのカテゴリを表します。
 * (Objects.xml -> <ObjectCategory>)
 */
export class ObjectCategory {
  /** 識別子となるユニークなキー */
  readonly key: string;
  /** カテゴリの表示名 */
  name: string;

  constructor(key: string, name: string) {
    this.key = key;
    this.name = name;
  }
}

// -----------------------------------------------------------------------------

/**
 * ある拠点で発生する物品の数量変化を表します。
 * ((Point).xml -> <Object>)
 */
export class QuantityChange {
  /** 変化前の数量 */
  fromAmount: number;
  /** 変化後の数量 */
  toAmount: number;

  constructor(fromAmount: number, toAmount: number) {
    this.fromAmount = fromAmount;
    this.toAmount = toAmount;
  }
}

// -----------------------------------------------------------------------------

/**
 * 地図上の「場所」を表すための共通基底クラス。
 * Point（拠点）とWaypoint（経由地）がこのクラスを継承します。
 */
export abstract class GraphNode {
  /** 識別子となるユニークなキー */
  readonly key: string;
  /** 所属するグループのキー */
  readonly groupKey: string;

  x: number;
  y: number;

  protected constructor(key: string, groupKey: string, x: number = 0, y: number = 0) {
    this.key = key;
    this.groupKey = groupKey;
    this.x = x;
    this.y = y;
  }
}

// -----------------------------------------------------------------------------

/**
 * 物品の数量変化が発生する「拠点」を表します。
 * ((Point).xml -> <Point>)
 */
export class Point extends GraphNode {
  /** 拠点の表示名 */
  name: string;
  /** この拠点で数量が変化する物品とその内容のマップ */
  readonly objects: ReadonlyMap<ObjectCategory, QuantityChange>;

  constructor(key: string, name: string, groupKey: string, x: number = 0, y: number = 0, objects: Map<ObjectCategory, QuantityChange>) {
    super(key, groupKey, x, y);
    this.name = name;
    this.objects = objects;
  }
}

// -----------------------------------------------------------------------------

/**
 * 経路の途中にある「経由地」を表します。物品の増減はありません。
 * (Paths.xml -> <Waypoint>)
 */
export class Waypoint extends GraphNode {
  // WaypointはKeyとGroupKey以外の固有情報を持ちません
  constructor(key: string, groupKey: string, x: number = 0, y: number = 0) {
    super(key, groupKey, x, y);
  }
}

// -----------------------------------------------------------------------------

/**
 * 拠点や経由地をまとめる「グループ」を表します。
 * (Groups.xml -> <ObjectGroup>)
 */
export class Group {
  /** 識別子となるユニークなキー */
  readonly key: string;
  /** グループの表示名 */
  name: string;
  /** グループの説明文 */
  description: string;
  /** このグループに所属するGraphNode（PointまたはWaypoint）のリスト */
  readonly GraphNodes: GraphNode[] = [];

  constructor(key: string, name: string, description: string) {
    this.key = key;
    this.name = name;
    this.description = description;
  }
}

// -----------------------------------------------------------------------------

/**
 * 2つのGraphNode（拠点 or 経由地）を結ぶ片道の「経路」を表します。
 * (Paths.xml -> <Path>)
 */
export class Path {
  /** 出発点 */
  from: GraphNode;
  /** 到着点 */
  to: GraphNode;
  /** 移動にかかるコスト */
  cost: number;
  opposite_cost: number;
  /** 建物内部の経路など、特殊な経路かどうかのフラグ */
  isInternal: boolean;
  /** 通行禁止の経路かどうかのフラグ */
  isProhibited: boolean;

  constructor(from: GraphNode, to: GraphNode, cost: number, opposite_cost: number, isInternal: boolean = false, isProhibited: boolean = false) {
    this.from = from;
    this.to = to;
    this.cost = cost;
    this.opposite_cost = opposite_cost;
    this.isInternal = isInternal;
    this.isProhibited = isProhibited;
  }
}

export class Route {
  public readonly key: string; // 例: "startNodeKey_endNodeKey"
  public readonly from: string; // 開始ノードキー
  public readonly to: string; // 終了ノードキー
  public readonly distance: number;
  public readonly nodeKeys: readonly string[]; // 経由するノードキーの配列

  constructor(from: string, to: string, distance: number, nodeKeys: string[]) {
    this.key = `${from}_${to}`;
    this.from = from;
    this.to = to;
    this.distance = distance;
    this.nodeKeys = nodeKeys;
  }
}

/**
 * 最適化計算によって生成された個別の輸送タスクを表します。
 */
export class Task {
  /**
   * タスクの一意な識別子。
   * 例: "fromPointKey_toPointKey_objectCategoryKey"
   */
  public readonly id: string;

  /** 輸送元となる拠点のキー */
  public readonly fromPoint: string;

  /** 輸送先となる拠点のキー */
  public readonly toPoint: string;

  /** 輸送対象の備品カテゴリ */
  public readonly object: ObjectCategory;

  /** 輸送する数量 */
  public count: number;

  /** このタスクの重み（例: 経路コスト × 数量） */
  public taskWeight: number;

  /** メモ（将来的な拡張用） */
  public notes: string;

  /** このタスクと両立できないタスクのリスト（将来的な拡張用） */
  public prohibitedTaskIds: string[];

  constructor(
    fromPoint: string,
    toPoint: string,
    object: ObjectCategory,
    count: number,
    taskWeight: number,
    notes: string = "", // デフォルト値
    prohibitedTaskIds: string[] = [] // デフォルト値
  ) {
    // 方法1（複合キー）でIDを自動生成
    this.id = `${fromPoint}_${toPoint}_${object.key}`;

    this.fromPoint = fromPoint;
    this.toPoint = toPoint;
    this.object = object;
    this.count = count;
    this.taskWeight = taskWeight;
    this.notes = notes;
    this.prohibitedTaskIds = prohibitedTaskIds;
  }
}
