// src/utils/pathUtils.ts

/**
 * 2つのノードキーから、常に一意な（正規化された）パスキーを生成する
 * @param key1 ノードキー1
 * @param key2 ノードキー2
 * @returns ex: "NodeA-NodeB" (必ず辞書順で連結)
 */
export const createCanonicalPathKey = (key1: string, key2: string): string => {
  return [key1, key2].sort().join("-");
};
