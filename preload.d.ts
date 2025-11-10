// This file is not used in the web application version.
export interface IElectronAPI {
    saveProject: (data: string, defaultPath: string) => Promise<{ success: boolean; path?: string; error?: string }>,
    loadProject: (fileType: 'plog' | 'dfr' | 'spdfr') => Promise<string | null>,
    savePdf: (defaultPath: string) => Promise<{ success: boolean; path?: string; error?: string }>,
    readFile: (filePath: string) => Promise<{ success: boolean; data?: string; path?: string; error?: string }>,
    onOpenFile: (callback: (filePath: string) => void) => void,
}

declare global {
    interface Window {
        electronAPI: IElectronAPI
    }
}
export {};