import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import ReactPreview, { generateReactPreviewHtml } from './ReactPreview';
import VuePreview, { generateVuePreviewHtml } from './ReactNativePreview';
import { AlertTriangle, Code, Eye, ExternalLink, Diamond } from 'lucide-react';
import { AppAsset } from '../types';
import AssetGenerator from './AssetGenerator';

type WorkspaceView = 'code' | 'preview' | 'assets';

interface WorkspaceProps {
  code: string;
  error: string | null;
  setError: (error: string | null) => void;
  onCodeChange: (newCode: string) => void;
  platform: 'react' | 'vue';
  assets: AppAsset[];
  onCreateAsset: (assetUrl: string, assetType: 'image' | 'sound') => string;
  onInsertPlaceholder: (placeholder: string) => void;
  isLoading: boolean;
}

const processCodeWithAssets = (code: string, assets: AppAsset[]): string => {
  let processedCode = code;
  for (const asset of assets) {
    processedCode = processedCode.replace(new RegExp(`%%${asset.id}%%`, 'g'), asset.url);
  }
  return processedCode;
};

const Workspace: React.FC<WorkspaceProps> = ({ code, error, setError, onCodeChange, platform, assets, onCreateAsset, onInsertPlaceholder, isLoading }) => {
  const [view, setView] = useState<WorkspaceView>('preview');

  const commonButtonClasses = "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 focus:outline-none";
  const activeButtonClasses = "bg-blue-600 text-white";
  const inactiveButtonClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";

  const handleOpenInNewTab = async () => {
    try {
      const finalCode = processCodeWithAssets(code, assets);
      const html = platform === 'react' 
        ? await generateReactPreviewHtml(finalCode) 
        : await generateVuePreviewHtml(finalCode);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // The URL will be released by the browser when the tab is closed.
    } catch (e: any) {
      setError(`Failed to open in new tab: ${e.message}`);
    }
  };

  const language = platform === 'react' ? 'jsx' : 'vue';
  const processedCode = processCodeWithAssets(code, assets);

  return (
    <div className="h-full w-full bg-gray-800 flex flex-col">
       <div className="flex-shrink-0 p-2 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
         {/* Spacer to help center the toggle */}
         <div className="w-16"></div>
         <div className="flex items-center p-1 space-x-1 bg-gray-800 rounded-full">
            <button
              onClick={() => setView('preview')}
              aria-pressed={view === 'preview'}
              className={`${commonButtonClasses} ${view === 'preview' ? activeButtonClasses : inactiveButtonClasses}`}
            >
              <Eye size={16} /> Preview
            </button>
            <button
              onClick={() => setView('code')}
              aria-pressed={view === 'code'}
              className={`${commonButtonClasses} ${view === 'code' ? activeButtonClasses : inactiveButtonClasses}`}
            >
              <Code size={16} /> Code
            </button>
            <button
              onClick={() => setView('assets')}
              aria-pressed={view === 'assets'}
              className={`${commonButtonClasses} ${view === 'assets' ? activeButtonClasses : inactiveButtonClasses}`}
            >
              <Diamond size={16} /> Assets
            </button>
         </div>
         <div className="w-16 flex justify-end pr-2">
            <button
                onClick={handleOpenInNewTab}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                title="Open in New Tab"
                aria-label="Open preview in new tab"
            >
                <ExternalLink size={18} />
            </button>
         </div>
       </div>
      <div className="flex-grow relative overflow-hidden bg-gray-800">
        {error && (
          <div className="absolute top-0 left-0 w-full bg-red-900/70 text-red-200 p-4 z-20 font-mono text-sm overflow-auto max-h-48 border-b-2 border-red-500/50" role="alert">
            <div className="flex items-center gap-2 mb-2">
               <AlertTriangle size={18} />
               <h3 className="font-bold text-lg">Error</h3>
            </div>
            <button onClick={() => setError(null)} className="absolute top-2 right-2 text-red-200 font-bold text-xl">&times;</button>
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        )}
        
        <div className={`w-full h-full absolute top-0 left-0 transition-opacity duration-300 ${view === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <CodeEditor code={code} onCodeChange={onCodeChange} language={language} />
        </div>
        
        <div className={`w-full h-full absolute top-0 left-0 transition-opacity duration-300 ${view === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          {platform === 'react' ? (
            <ReactPreview code={processedCode} setError={setError} />
          ) : (
            <VuePreview code={processedCode} setError={setError} />
          )}
        </div>
        
        <div className={`w-full h-full absolute top-0 left-0 transition-opacity duration-300 ${view === 'assets' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
          <AssetGenerator
            onCreateAsset={onCreateAsset}
            onInsertPlaceholder={onInsertPlaceholder}
            isLoading={isLoading}
            assets={assets}
          />
        </div>
      </div>
    </div>
  );
};

export default Workspace;