export interface IElectronAPI {
  saveProject: (data: string, defaultPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  loadProject: () => Promise<string | null>;
  savePdf: (data: ArrayBuffer, defaultPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}


