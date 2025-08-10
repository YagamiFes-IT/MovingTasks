// src/services/dataLoader.ts

import JSZip from "jszip";
import { createCanonicalPathKey } from "../utils/pathUtils";
import {
  // entities.tsから新しいクラス定義をインポート
  ObjectCategory,
  QuantityChange,
  GraphNode,
  Point,
  Waypoint,
  Group,
  Path,
} from "../types/entities.ts"; // パスはプロジェクトに合わせて修正してください
import {
  FileFormatError,
  parseXml,
  findXmlElement,
  toInt,
  toBool,
} from "../utils/xmlUtils.ts"; // パスはプロジェクトに合わせて修正してください

// --- 定数定義 ---
const FILENAME_GROUPS = "Groups.xml";
const FILENAME_OBJECTS = "Objects.xml";
const FILENAME_PATHS = "Paths.xml";
const DIR_POINTS = "Points/";

/** Pathを格納するMapのキー。'fromKey->toKey'の形式。 */
type PathKey = string;

/**
 * アプリケーションの全データを保持するコンテナクラス。
 */
export class Data {
  public readonly objectCategories: ReadonlyMap<string, ObjectCategory>;
  public readonly groups: ReadonlyMap<string, Group>;
  public readonly points: ReadonlyMap<string, Point>;
  public readonly waypoints: ReadonlyMap<string, Waypoint>;
  public readonly paths: ReadonlyMap<PathKey, Path>;

  constructor(
    objectCategories: Map<string, ObjectCategory>,
    groups: Map<string, Group>,
    points: Map<string, Point>,
    waypoints: Map<string, Waypoint>,
    paths: Map<PathKey, Path>
  ) {
    this.objectCategories = objectCategories;
    this.groups = groups;
    this.points = points;
    this.waypoints = waypoints;
    this.paths = paths;
  }
}

/**
 * アップロードされたZIPファイルを解析し、アプリケーションのDataオブジェクトを生成する。
 * @param zipFile ユーザーがアップロードしたFileオブジェクト
 * @returns 解析されたデータを含むDataインスタンスのPromise
 */
export async function loadDataFromZip(zipFile: File): Promise<Data> {
  const zip = await JSZip.loadAsync(zipFile);

  // --- 1. ベースパスの自動検出 ---
  // ZIP内のフォルダ構造に対応するため、必須ファイルの位置からルートパスを推測する
  let basePath = "";
  const anyCoreFile = Object.values(zip.files).find(
    (file) =>
      file.name.endsWith(FILENAME_OBJECTS) || file.name.endsWith(FILENAME_PATHS)
  );
  if (anyCoreFile) {
    basePath = anyCoreFile.name.substring(
      0,
      anyCoreFile.name.lastIndexOf("/") + 1
    );
  }

  // --- 2. 必須ファイルの読み込み ---
  const groupsFile = zip.file(basePath + FILENAME_GROUPS);
  const objectsFile = zip.file(basePath + FILENAME_OBJECTS);
  const pathsFile = zip.file(basePath + FILENAME_PATHS);

  if (!groupsFile || !objectsFile || !pathsFile) {
    throw new FileFormatError(
      zipFile.name,
      `必須ファイル(Groups.xml, Objects.xml, Paths.xml)が見つかりません。`
    );
  }

  // =========================================================================
  // STEP 1: Groupsの解析
  // =========================================================================
  const groups = new Map<string, Group>();
  const groupsXmlText = await groupsFile.async("string");
  const groupsRoot = parseXml(
    groupsXmlText,
    "GroupCollection",
    FILENAME_GROUPS
  );

  findXmlElement(groupsRoot, "Groups")
    .querySelectorAll("ObjectGroup")
    .forEach((el) => {
      const key = el.getAttribute("Key");
      const name = el.getAttribute("Name") ?? "名称未設定";
      const description = el.getAttribute("Description") ?? "";
      if (!key) return; // Keyがないグループは無視
      groups.set(key, new Group(key, name, description));
    });

  // =========================================================================
  // STEP 2: ObjectCategoriesの解析
  // =========================================================================
  const categories = new Map<string, ObjectCategory>();
  const objectsXmlText = await objectsFile.async("string");
  const objectsRoot = parseXml(
    objectsXmlText,
    "ObjectCollection",
    FILENAME_OBJECTS
  );

  findXmlElement(objectsRoot, "Categories")
    .querySelectorAll("ObjectCategory")
    .forEach((el) => {
      const key = el.getAttribute("Key");
      const name = el.getAttribute("Name") ?? "名称未設定";
      if (!key) return; // Keyがないカテゴリは無視
      categories.set(key, new ObjectCategory(key, name));
    });

  // =========================================================================
  // STEP 3: Pointsの解析
  // =========================================================================
  const points = new Map<string, Point>();
  const pointFiles = Object.values(zip.files).filter(
    (file) => file.name.startsWith(basePath + DIR_POINTS) && !file.dir
  );

  for (const pointZipFile of pointFiles) {
    const entryName = pointZipFile.name;
    const pointXmlText = await pointZipFile.async("string");
    const pointRoot = parseXml(pointXmlText, "Point", entryName);

    const key = pointRoot.querySelector("Key")?.textContent;
    const name = pointRoot.querySelector("Name")?.textContent ?? "名称未設定";
    const groupKey = pointRoot.getAttribute("GroupKey");
    if (!key || !groupKey) continue; // KeyまたはGroupKeyがない拠点は無効

    const x = toInt(pointRoot.getAttribute("x"), 0, entryName);
    const y = toInt(pointRoot.getAttribute("y"), 0, entryName);

    const objects = new Map<ObjectCategory, QuantityChange>();
    findXmlElement(pointRoot, "Objects")
      .querySelectorAll("Object")
      .forEach((el) => {
        const categoryKey = el.getAttribute("CategoryKey");
        const category = categoryKey ? categories.get(categoryKey) : undefined;
        if (!category) {
          throw new FileFormatError(
            entryName,
            `物品カテゴリ '${categoryKey}' が存在しません。`
          );
        }
        const fromAmount = toInt(el.getAttribute("From"), 0, entryName);
        const toAmount = toInt(el.getAttribute("To"), 0, entryName);
        objects.set(category, new QuantityChange(fromAmount, toAmount));
      });

    points.set(key, new Point(key, name, groupKey, x, y, objects));
  }

  // =========================================================================
  // STEP 4: Waypointsの解析
  // =========================================================================
  const waypoints = new Map<string, Waypoint>();
  const pathsXmlText = await pathsFile.async("string");
  const pathsRoot = parseXml(pathsXmlText, "PathCollection", FILENAME_PATHS);

  findXmlElement(pathsRoot, "Waypoints")
    .querySelectorAll("Waypoint")
    .forEach((el) => {
      const key = el.getAttribute("Key");
      const groupKey = el.getAttribute("GroupKey");
      if (!key || !groupKey) return; // KeyまたはGroupKeyがない経由地は無効
      const x = toInt(el.getAttribute("x"), 0, FILENAME_PATHS);
      const y = toInt(el.getAttribute("y"), 0, FILENAME_PATHS);
      waypoints.set(key, new Waypoint(key, groupKey, x, y));
    });

  // =========================================================================
  // STEP 5: GraphNodeをGroupに登録
  // =========================================================================
  const allGraphNodes = new Map<string, GraphNode>([...points, ...waypoints]);
  allGraphNodes.forEach((GraphNode) => {
    const group = groups.get(GraphNode.groupKey);
    group?.GraphNodes.push(GraphNode);
  });

  // =========================================================================
  // STEP 6: PathsとそのOverrideの解析
  // =========================================================================
  // src/services/dataLoader.ts （のパス読み込み部分）

  // --- pathsの読み込み ---
  const paths = new Map<PathKey, Path>();
  findXmlElement(pathsRoot, "Paths")
    .querySelectorAll("Path")
    .forEach((el) => {
      // ★ 1. XMLからキーとコストを取得
      const point1Key = el.getAttribute("Point1Key");
      const point2Key = el.getAttribute("Point2Key");
      if (!point1Key || !point2Key) return;

      const point1Node = allGraphNodes.get(point1Key);
      const point2Node = allGraphNodes.get(point2Key);
      if (!point1Node || !point2Node) {
        throw new FileFormatError(
          FILENAME_PATHS,
          `Pathの参照キー '${point1Key}' または '${point2Key}' が見つかりません。`
        );
      }

      const cost1to2 = toInt(el.getAttribute("Cost"), 0, FILENAME_PATHS);
      const cost2to1 = toInt(
        el.getAttribute("OppositeCost"),
        cost1to2,
        FILENAME_PATHS
      );
      const isInternal = toBool(
        el.getAttribute("IsInternal"),
        false,
        FILENAME_PATHS
      );

      // ★ 2. キーを辞書順で比較し、fromとtoを固定化（Canonicalization）
      let fromNode: GraphNode,
        toNode: GraphNode,
        forwardCost: number,
        backwardCost: number;

      if (point1Key < point2Key) {
        // Point1が'from'
        fromNode = point1Node;
        toNode = point2Node;
        forwardCost = cost1to2;
        backwardCost = cost2to1;
      } else {
        // Point2が'from'
        fromNode = point2Node;
        toNode = point1Node;
        forwardCost = cost2to1;
        backwardCost = cost1to2;
      }

      // ★ 3. 常に一意なキーを生成
      const canonicalKey = createCanonicalPathKey(fromNode.key, toNode.key);

      // ★ 4. 新しいPathオブジェクトを「1つだけ」生成してMapにセット
      paths.set(
        canonicalKey,
        new Path(fromNode, toNode, forwardCost, backwardCost, isInternal)
      );
    });
  // --- 最終的なDataオブジェクトを生成して返す ---
  return new Data(categories, groups, points, waypoints, paths);
}
