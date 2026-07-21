export interface AndroidBridge {
  setTheme(theme: string): void;
  onHighlightAction(actionData: string): void;
  onZoomChanged(zoomLevel: number): void;
  onPageChanged(pageNumber: number): void;
  log(message: string): void;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridge;
    setFileFromAndroid?: (uri: string, theme?: string) => void;
  }
}

export  interface ViewerEvent {
  type: string;
  detail?: any;
}