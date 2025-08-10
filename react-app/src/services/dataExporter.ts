// src/services/dataExporter.ts

import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { Data } from "./dataLoader";
import type { Group, ObjectCategory, Path, Point, Waypoint } from "../types/entities";

/**
 * 現在のDataオブジェクトをZIPファイルとしてエクスポートし、ダウンロードをトリガーする。
 * @param data エクスポート対象のDataオブジェクト
 * @param fileName ダウンロードするファイル名
 */
export async function exportDataToZip(data: Data, fileName: string = "exported_data.zip"): Promise<void> {
  const zip = new JSZip();

  // 各XMLファイルの文字列を生成
  const groupsXml = _generateGroupsXml(data.groups);
  const objectsXml = _generateObjectsXml(data.objectCategories);
  const pathsXml = _generatePathsXml(data.paths, data.waypoints);

  // メインのXMLファイルをZIPに追加
  zip.file("Groups.xml", groupsXml);
  zip.file("Objects.xml", objectsXml);
  zip.file("Paths.xml", pathsXml);

  // 各Pointを個別のXMLファイルとしてPoints/ディレクトリに追加
  const pointsFolder = zip.folder("Points");
  if (pointsFolder) {
    for (const point of data.points.values()) {
      const pointXml = _generatePointXml(point);
      pointsFolder.file(`${point.key}.xml`, pointXml);
    }
  }

  // ZIPファイルを生成してダウンロード
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, fileName);
}

// --- 以下、各XMLを生成するためのプライベートなヘルパー関数 ---

function _generateGroupsXml(groups: ReadonlyMap<string, Group>): string {
  const groupEntries = Array.from(groups.values())
    .map((g) => `    <ObjectGroup Key="${g.key}" Name="${g.name}" Description="${g.description}" />`)
    .join("\n");

  return `<GroupCollection>\n  <Groups>\n${groupEntries}\n  </Groups>\n</GroupCollection>`;
}

function _generateObjectsXml(categories: ReadonlyMap<string, ObjectCategory>): string {
  const categoryEntries = Array.from(categories.values())
    .map((c) => `    <ObjectCategory Key="${c.key}" Name="${c.name}" />`)
    .join("\n");

  return `<ObjectCollection>\n  <Categories>\n${categoryEntries}\n  </Categories>\n</ObjectCollection>`;
}

function _generatePathsXml(paths: ReadonlyMap<string, Path>, waypoints: ReadonlyMap<string, Waypoint>): string {
  const waypointEntries = Array.from(waypoints.values())
    .map((w) => `    <Waypoint Key="${w.key}" GroupKey="${w.groupKey}" x="${w.x}" y="${w.y}" />`)
    .join("\n");

  const pathEntries = Array.from(paths.values())
    .map((p) => {
      // dataLoaderの正規化ロジックに合わせてCostとOppositeCostを再割り当て
      const cost1to2 = p.from.key < p.to.key ? p.cost : p.opposite_cost;
      const cost2to1 = p.from.key < p.to.key ? p.opposite_cost : p.cost;
      return `    <Path Point1Key="${p.from.key}" Point2Key="${p.to.key}" Cost="${cost1to2}" OppositeCost="${cost2to1}" IsInternal="${p.isInternal}" />`;
    })
    .join("\n");

  return `<PathCollection>\n  <Waypoints>\n${waypointEntries}\n  </Waypoints>\n  <Paths>\n${pathEntries}\n  </Paths>\n</PathCollection>`;
}

function _generatePointXml(point: Point): string {
  const objectEntries = Array.from(point.objects.entries())
    .map(([category, change]) => `    <Object CategoryKey="${category.key}" From="${change.fromAmount}" To="${change.toAmount}" />`)
    .join("\n");

  return `<Point GroupKey="${point.groupKey}" x="${point.x}" y="${point.y}">\n  <Key>${point.key}</Key>\n  <Name>${point.name}</Name>\n  <Objects>\n${objectEntries}\n  </Objects>\n</Point>`;
}
