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
  Route,
} from "../types/entities.ts"; // パスはプロジェクトに合わせて修正してください
import { FileFormatError, parseXml, findXmlElement, toInt, toBool } from "../utils/xmlUtils.ts"; // パスはプロジェクトに合わせて修正してください

// --- 定数定義 ---
const DIR_POINTS = "Points/";
const FILENAME_GROUPS = "Groups.xml";
const FILENAME_OBJECTS = "Objects.xml";
const FILENAME_PATHS = "Paths.xml";
const FILENAME_ROUTES = "Routes.xml"; // ファイル名を定数化
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
  public readonly routes: ReadonlyMap<string, Route>;

  constructor(objectCategories: ReadonlyMap<string, ObjectCategory>, groups: ReadonlyMap<string, Group>, points: ReadonlyMap<string, Point>, waypoints: ReadonlyMap<string, Waypoint>, paths: ReadonlyMap<string, Path>, routes: ReadonlyMap<string, Route> = new Map()) {
    this.objectCategories = objectCategories;
    this.groups = groups;
    this.points = points;
    this.waypoints = waypoints;
    this.paths = paths;
    this.routes = routes;
  }

  public withNewObjectCategories(newMap: ReadonlyMap<string, ObjectCategory>): Data {
    return new Data(newMap, this.groups, this.points, this.waypoints, this.paths, this.routes);
  }

  public withNewGroups(newMap: ReadonlyMap<string, Group>): Data {
    return new Data(this.objectCategories, newMap, this.points, this.waypoints, this.paths, this.routes);
  }

  public withNewPoints(newMap: ReadonlyMap<string, Point>): Data {
    return new Data(this.objectCategories, this.groups, newMap, this.waypoints, this.paths, this.routes);
  }

  public withNewWaypoints(newMap: ReadonlyMap<string, Waypoint>): Data {
    return new Data(this.objectCategories, this.groups, this.points, newMap, this.paths, this.routes);
  }

  public withNewPaths(newMap: ReadonlyMap<string, Path>): Data {
    return new Data(this.objectCategories, this.groups, this.points, this.waypoints, newMap, this.routes);
  }

  public withNewRoutes(newMap: ReadonlyMap<string, Route>): Data {
    return new Data(this.objectCategories, this.groups, this.points, this.waypoints, this.paths, newMap);
  }
}

/**
 * Routes.xmlを解析し、RouteオブジェクトのMapを生成する。
 * ファイルが存在しない場合は空のMapを返す。
 * @param zip JSZipのインスタンス
 * @param basePath ZIPファイル内のルートパス
 * @returns 解析されたRouteのMap, または空のMap
 */
async function parseRoutesXml(zip: JSZip, basePath: string): Promise<Map<string, Route>> {
  const routesFile = zip.file(basePath + FILENAME_ROUTES);
  const routes = new Map<string, Route>();

  // Routes.xmlが存在しない場合は、何もせず空のMapを返す
  if (!routesFile) {
    console.log("Routes.xml not found, returning empty routes map.");
    return routes;
  }

  const routesXmlText = await routesFile.async("string");
  const routesRoot = parseXml(routesXmlText, "RouteCollection", FILENAME_ROUTES);

  findXmlElement(routesRoot, "Routes")
    .querySelectorAll("Route")
    .forEach((el) => {
      const from = el.getAttribute("from");
      const to = el.getAttribute("to");
      const distanceStr = el.getAttribute("distance");

      if (!from || !to || !distanceStr) {
        console.warn("Skipping route with missing attributes:", { from, to, distanceStr });
        return; // 必須属性がなければスキップ
      }

      const distance = parseFloat(distanceStr);
      if (isNaN(distance)) {
        console.warn("Skipping route with invalid distance:", distanceStr);
        return; // 不正な数値ならスキップ
      }

      const pathElement = el.querySelector("Path");
      if (!pathElement) {
        console.warn("Skipping route with no <Path> element:", { from, to });
        return;
      }

      const nodeKeys: string[] = [];
      pathElement.querySelectorAll("Node").forEach((nodeEl) => {
        const key = nodeEl.getAttribute("key");
        if (key) {
          nodeKeys.push(key);
        }
      });

      const newRoute = new Route(from, to, distance, nodeKeys);
      routes.set(newRoute.key, newRoute);
    });

  return routes;
}

/**
 * Groups.xmlを解析し、GroupオブジェクトのMapを生成する。
 * @param zip JSZipのインスタンス
 * @param basePath ZIPファイル内のルートパス
 * @returns 解析されたGroupのMap
 * @throws {FileFormatError} 必須ファイルが見つからない場合にエラーを投げる
 */
async function parseGroupsXml(zip: JSZip, basePath: string): Promise<Map<string, Group>> {
  const groupsFile = zip.file(basePath + FILENAME_GROUPS);
  if (!groupsFile) {
    throw new FileFormatError(FILENAME_GROUPS, "ファイルが見つかりません。");
  }

  const groups = new Map<string, Group>();
  const groupsXmlText = await groupsFile.async("string");
  const groupsRoot = parseXml(groupsXmlText, "GroupCollection", FILENAME_GROUPS);

  findXmlElement(groupsRoot, "Groups")
    .querySelectorAll("ObjectGroup")
    .forEach((el) => {
      const key = el.getAttribute("Key");
      const name = el.getAttribute("Name") ?? "名称未設定";
      const description = el.getAttribute("Description") ?? "";
      if (key) {
        groups.set(key, new Group(key, name, description));
      }
    });

  return groups;
}

/**
 * Objects.xmlを解析し、ObjectCategoryオブジェクトのMapを生成する。
 * @param zip JSZipのインスタンス
 * @param basePath ZIPファイル内のルートパス
 * @returns 解析されたObjectCategoryのMap
 * @throws {FileFormatError} 必須ファイルが見つからない場合にエラーを投げる
 */
async function parseObjectCategoriesXml(zip: JSZip, basePath: string): Promise<Map<string, ObjectCategory>> {
  const objectsFile = zip.file(basePath + FILENAME_OBJECTS);
  if (!objectsFile) {
    throw new FileFormatError(FILENAME_OBJECTS, "ファイルが見つかりません。");
  }

  const categories = new Map<string, ObjectCategory>();
  const objectsXmlText = await objectsFile.async("string");
  const objectsRoot = parseXml(objectsXmlText, "ObjectCollection", FILENAME_OBJECTS);

  findXmlElement(objectsRoot, "Categories")
    .querySelectorAll("ObjectCategory")
    .forEach((el) => {
      const key = el.getAttribute("Key");
      const name = el.getAttribute("Name") ?? "名称未設定";
      if (key) {
        categories.set(key, new ObjectCategory(key, name));
      }
    });

  return categories;
}

/**
 * /Points ディレクトリ内の全XMLを解析し、PointオブジェクトのMapを生成する。
 * @param zip JSZipのインスタンス
 * @param basePath ZIPファイル内のルートパス
 * @param categories 依存するObjectCategoryのMap
 * @returns 解析されたPointのMap
 */
async function parsePointsXml(zip: JSZip, basePath: string, categories: ReadonlyMap<string, ObjectCategory>): Promise<Map<string, Point>> {
  const points = new Map<string, Point>();
  const pointFiles = Object.values(zip.files).filter((file) => file.name.startsWith(basePath + DIR_POINTS) && !file.dir);

  for (const pointZipFile of pointFiles) {
    const entryName = pointZipFile.name;
    const pointXmlText = await pointZipFile.async("string");
    const pointRoot = parseXml(pointXmlText, "Point", entryName);

    const key = pointRoot.querySelector("Key")?.textContent;
    const name = pointRoot.querySelector("Name")?.textContent ?? "名称未設定";
    const groupKey = pointRoot.getAttribute("GroupKey");
    if (!key || !groupKey) continue;

    const x = toInt(pointRoot.getAttribute("x"), 0, entryName);
    const y = toInt(pointRoot.getAttribute("y"), 0, entryName);

    const objects = new Map<ObjectCategory, QuantityChange>();
    findXmlElement(pointRoot, "Objects")
      .querySelectorAll("Object")
      .forEach((el) => {
        const categoryKey = el.getAttribute("CategoryKey");
        const category = categoryKey ? categories.get(categoryKey) : undefined;
        if (!category) {
          throw new FileFormatError(entryName, `物品カテゴリ '${categoryKey}' が存在しません。`);
        }
        const fromAmount = toInt(el.getAttribute("From"), 0, entryName);
        const toAmount = toInt(el.getAttribute("To"), 0, entryName);
        objects.set(category, new QuantityChange(fromAmount, toAmount));
      });

    points.set(key, new Point(key, name, groupKey, x, y, objects));
  }

  return points;
}

/**
 * パース済みのPathCollection XMLからWaypointのMapを生成する。
 * @param pathsRoot パース済みの<PathCollection>要素
 * @returns 解析されたWaypointのMap
 */
function parseWaypoints(pathsRoot: Element): Map<string, Waypoint> {
  const waypoints = new Map<string, Waypoint>();

  findXmlElement(pathsRoot, "Waypoints")
    .querySelectorAll("Waypoint")
    .forEach((el) => {
      const key = el.getAttribute("Key");
      const groupKey = el.getAttribute("GroupKey");
      if (!key || !groupKey) return;

      const x = toInt(el.getAttribute("x"), 0, FILENAME_PATHS);
      const y = toInt(el.getAttribute("y"), 0, FILENAME_PATHS);
      waypoints.set(key, new Waypoint(key, groupKey, x, y));
    });

  return waypoints;
}

/**
 * 読み込まれた全ノードを、所属するGroupオブジェクトに登録する。
 * @param groups GroupのMap (このオブジェクトは関数内で変更されます)
 * @param points PointのMap
 * @param waypoints WaypointのMap
 */
function linkNodesToGroups(groups: Map<string, Group>, points: ReadonlyMap<string, Point>, waypoints: ReadonlyMap<string, Waypoint>): void {
  const allGraphNodes: ReadonlyMap<string, GraphNode> = new Map([...points, ...waypoints]);

  allGraphNodes.forEach((node) => {
    const group = groups.get(node.groupKey);
    // GroupクラスのGraphNodesプロパティがミュータブル（書き換え可能）である前提
    group?.GraphNodes.push(node);
  });
}

/**
 * パース済みのPathCollection XMLからPathオブジェクトのMapを生成する。
 * @param pathsRoot パース済みの<PathCollection>要素
 * @param allGraphNodes 全てのノード(PointとWaypoint)のMap
 * @returns 解析されたPathのMap
 */
function parsePaths(pathsRoot: Element, allGraphNodes: ReadonlyMap<string, GraphNode>): Map<string, Path> {
  const paths = new Map<string, Path>();

  findXmlElement(pathsRoot, "Paths")
    .querySelectorAll("Path")
    .forEach((el) => {
      const point1Key = el.getAttribute("Point1Key");
      const point2Key = el.getAttribute("Point2Key");
      if (!point1Key || !point2Key) return;

      const point1Node = allGraphNodes.get(point1Key);
      const point2Node = allGraphNodes.get(point2Key);
      if (!point1Node || !point2Node) {
        throw new FileFormatError(FILENAME_PATHS, `Pathの参照キー '${point1Key}' または '${point2Key}' が見つかりません。`);
      }

      const cost1to2 = toInt(el.getAttribute("Cost"), 0, FILENAME_PATHS);
      const cost2to1 = toInt(el.getAttribute("OppositeCost"), cost1to2, FILENAME_PATHS);
      const isInternal = toBool(el.getAttribute("IsInternal"), false, FILENAME_PATHS);

      let fromNode: GraphNode, toNode: GraphNode, forwardCost: number, backwardCost: number;

      if (point1Key < point2Key) {
        fromNode = point1Node;
        toNode = point2Node;
        forwardCost = cost1to2;
        backwardCost = cost2to1;
      } else {
        fromNode = point2Node;
        toNode = point1Node;
        forwardCost = cost2to1;
        backwardCost = cost1to2;
      }

      const canonicalKey = createCanonicalPathKey(fromNode.key, toNode.key);
      paths.set(canonicalKey, new Path(fromNode, toNode, forwardCost, backwardCost, isInternal));
    });

  return paths;
}

// src/services/dataLoader.ts

export async function loadDataFromZip(zipFile: File): Promise<Data> {
  const zip = await JSZip.loadAsync(zipFile);

  // --- 1. ベースパスの自動検出 ---
  let basePath = "";
  const anyCoreFile = Object.values(zip.files).find((file) => file.name.endsWith(FILENAME_OBJECTS));
  if (anyCoreFile) {
    basePath = anyCoreFile.name.substring(0, anyCoreFile.name.lastIndexOf("/") + 1);
  }

  // --- 2. 依存関係のない基本データを並列で解析 ---
  const [groups, categories] = await Promise.all([parseGroupsXml(zip, basePath), parseObjectCategoriesXml(zip, basePath)]);

  // --- 3. 依存関係のあるデータを順次解析 ---

  // PointはCategoryに依存
  const points = await parsePointsXml(zip, basePath, categories);

  // WaypointとPathは同じファイルから解析するので、一度だけ読み込む
  const pathsFile = zip.file(basePath + FILENAME_PATHS);
  if (!pathsFile) throw new FileFormatError(FILENAME_PATHS, "ファイルが見つかりません。");
  const pathsXmlText = await pathsFile.async("string");
  const pathsRoot = parseXml(pathsXmlText, "PathCollection", FILENAME_PATHS);

  const waypoints = parseWaypoints(pathsRoot);

  // Pathは全ノード情報に依存するため、このタイミングで作成
  const allGraphNodes = new Map([...points.entries(), ...waypoints.entries()]);
  const paths = parsePaths(pathsRoot, allGraphNodes);

  // --- 4. 読み込んだデータ同士の紐付け（後処理） ---
  linkNodesToGroups(groups, points, waypoints);

  // --- 5. オプショナルなデータ(Routes)の解析 ---
  const routes = await parseRoutesXml(zip, basePath);

  // --- 6. 最終的なDataオブジェクトを生成して返す ---
  return new Data(categories, groups, points, waypoints, paths, routes);
}
