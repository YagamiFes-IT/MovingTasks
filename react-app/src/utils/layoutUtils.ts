// src/utils/layoutUtils.ts

import dagre from "dagre";
import type { Node, Edge } from "reactflow";

// ノードとエッジを受け取り、レイアウト計算後の新しいノード配列を返す
export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  // レイアウトの方向を左から右へ
  dagreGraph.setGraph({ rankdir: "TB" }); // 'TB' (Top to Bottom) or 'LR' (Left to Right)

  const nodeWidth = 150;
  const nodeHeight = 100;

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // 未配置のノード(x=0, y=0)のみ、計算結果を適用する
    if (node.position.x === 0 && node.position.y === 0 && nodeWithPosition) {
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    }
    return node;
  });

  return layoutedNodes;
};
