/// <reference types="vite/client" />

import type { PyodideInterface as PyodideInterfaceFromPackage } from "pyodide";

declare global {
  interface Window {
    loadPyodide: (config?: { indexURL: string }) => Promise<PyodideInterfaceFromPackage>;
  }
}
