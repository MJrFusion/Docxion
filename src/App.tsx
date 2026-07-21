// src/App.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileViewer, type FileViewerHandle } from '@file-viewer/react';
import officePreset from '@file-viewer/preset-office';
import './App.css';
import type { ViewerEvent } from './types/core';


// --- Main Component ---

const App: React.FC = () => {
  const [fileUri, setFileUri] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const viewerRef = useRef<FileViewerHandle>(null);

  // Called by Android via window.setFileFromAndroid
  const handleFileFromAndroid = useCallback((uri: string, theme: string = 'light') => {
    setFileUri(decodeURIComponent(uri));
    setTheme(theme as 'light' | 'dark');
    setIsLoading(true);
    window.AndroidBridge?.log(`Opening file: ${uri}`);
  }, []);

  // Register global function for Android
  useEffect(() => {
    window.setFileFromAndroid = handleFileFromAndroid;
    window.AndroidBridge?.log('React app ready');
    return () => {
      delete window.setFileFromAndroid;
    };
  }, [handleFileFromAndroid]);

  // Handle viewer events and forward to Android
  const handleViewerEvent = useCallback((event: ViewerEvent) => {
    const bridge = window.AndroidBridge;
    if (!bridge) return;

    switch (event.type) {
      case 'highlight':
        bridge.onHighlightAction(JSON.stringify({ type: 'highlight', data: event.detail }));
        break;
      case 'zoom-change':
        // When zoom changes, send the new zoom level to Android
        if (event.detail?.zoom) {
          bridge.onZoomChanged(event.detail.zoom);
        }
        break;
      case 'pageChange':
        if (event.detail?.page) bridge.onPageChanged(event.detail.page);
        break;
      default:
        bridge.log(`Unknown event: ${event.type}`);
    }
  }, []);

  // Handle loading state
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    window.AndroidBridge?.log('File loaded successfully');
  }, []);

  return (
    <div className="App">
      <div className="viewer-container">
        {fileUri ? (
          <>
            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner" />
                <p>Loading file...</p>
              </div>
            )}
            <FileViewer
              ref={viewerRef}
              url={fileUri}
              filename={fileUri.substring(fileUri.lastIndexOf('/') + 1)}
              options={{
                preset: [officePreset],
                theme: theme,
                toolbar: {
                  search: true,
                  print: true,
                  download: false,
                  zoom: true,    
                },
              }}
              onEvent={handleViewerEvent}
              onLoad={handleLoad}
            />
          </>
        ) : (
          <div className="placeholder">
            <h2>Android File Viewer</h2>
            <p>Select a file from the Android app to preview</p>
            <div className="supported-formats">
              <h4>Supported Formats</h4>
              <ul>
                <li>📄 Office: DOCX, XLSX, PPTX, PDF, OFD</li>
                <li>📐 Engineering: DWG, DXF, STL, STEP, IFC</li>
                <li>📊 Drawings: Draw.io, Excalidraw, XMind</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;