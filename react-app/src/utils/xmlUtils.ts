export class FileFormatError extends Error {
  public fileName: string;
  public innerException?: Error;

  constructor(fileName: string, message?: string, innerException?: Error) {
    let finalMessage = message;
    if (!finalMessage) {
      if (innerException) {
        finalMessage = innerException.message;
      } else {
        finalMessage =
          "ファイルの読込に失敗しました。ファイルが破損している可能性があります。";
      }
    }
    super(`Failed to parse '${fileName}'. ${finalMessage}`);
    this.name = "FileFormatError"; // エラー名を設定
    this.fileName = fileName;
    this.innerException = innerException;
  }
}

export function parseXml(
  content: string,
  rootTag: string,
  fileName: string
): Element {
  try {
    // ブラウザ標準のDOMParserを使用
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "application/xml");

    // パースエラーがあるかチェック
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      throw new Error(parserError.textContent || "XML parsing failed");
    }

    const root = doc.documentElement;
    if (root.tagName !== rootTag) {
      throw new FileFormatError(
        fileName,
        `ルート要素名 '${root.tagName}'が間違っています。正しくは '${rootTag}' です。`
      );
    }
    return root;
  } catch (e) {
    // eがErrorインスタンスかチェックして、そうでなければ新しいErrorでラップする
    const error = e instanceof Error ? e : new Error(String(e));
    throw new FileFormatError(fileName, error.message, error);
  }
}

/**
 * 指定された要素から、タグ名に一致する最初の子要素を検索します。
 * 見つからない場合は、中身が空の新しい要素を返します（DOMには接続されない）。
 * @param element 親要素
 * @param tag 検索するタグ名
 * @returns 見つかった子要素、または新しい空の要素
 */
export function findXmlElement(element: Element, tag: string): Element {
  const child = element.querySelector(tag);
  return child ?? document.createElement(tag);
}

/**
 * 文字列を整数に変換します。
 * @param text 変換する文字列 (nullやundefinedの可能性あり)
 * @param defaultValue textがnull/undefinedの場合のデフォルト値
 * @param fileName エラー表示用のファイル名
 * @returns 変換後の数値
 */
export function toInt(
  text: string | null | undefined,
  defaultValue: number,
  fileName: string
): number {
  if (text === null || text === undefined) {
    return defaultValue;
  }
  const num = parseInt(text, 10);
  if (isNaN(num)) {
    throw new FileFormatError(fileName, `'${text}' は整数値ではありません。`);
  }
  return num;
}

/**
 * 文字列を真偽値に変換します。
 * @param text 変換する文字列 (nullやundefinedの可能性あり)
 * @param defaultValue textがnull/undefinedの場合のデフォルト値
 * @param fileName エラー表示用のファイル名
 * @returns 変換後の真偽値
 */
export function toBool(
  text: string | null | undefined,
  defaultValue: boolean,
  fileName: string
): boolean {
  if (text === null || text === undefined) {
    return defaultValue;
  }
  const lowerText = text.toLowerCase();
  if (lowerText === "true") {
    return true;
  }
  if (lowerText === "false") {
    return false;
  }

  throw new FileFormatError(fileName, `'${text}' は真偽値ではありません。`);
}
