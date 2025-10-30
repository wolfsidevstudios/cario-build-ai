import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Download, Copy, Loader, Image as ImageIcon, Music2, PlusCircle, UploadCloud, Camera } from 'lucide-react';
import { AppAsset } from '../types';

interface AssetGeneratorProps {
  onCreateAsset: (assetUrl: string, assetType: 'image' | 'sound') => string;
  onInsertPlaceholder: (placeholder: string) => void;
  isLoading: boolean;
  assets: AppAsset[];
}

interface SpecificGeneratorProps {
  onCreateAsset: (assetUrl: string, assetType: 'image' | 'sound') => string;
  onInsertPlaceholder: (placeholder: string) => void;
  isLoading: boolean;
}

const ImageGenerator: React.FC<SpecificGeneratorProps> = ({ onCreateAsset, onInsertPlaceholder, isLoading: isAppLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAsset, setGeneratedAsset] = useState<{url: string; id: string} | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    
    const isLoading = isAppLoading || isGenerating;

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsGenerating(true);
        setError(null);
        setGeneratedAsset(null);
        setFeedback(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    const newAssetId = onCreateAsset(imageUrl, 'image');
                    setGeneratedAsset({ url: imageUrl, id: newAssetId });
                    return;
                }
            }
            throw new Error("No image data found in the response.");
        } catch (e: any) {
            console.error(e);
            setError(`Failed to generate image: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (generatedAsset) {
            navigator.clipboard.writeText(generatedAsset.url);
            setFeedback('Data URL copied!');
            setTimeout(() => setFeedback(null), 2000);
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Image Generator</h3>
            <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A modern logo for a coffee shop, vector style"
                    className="w-full bg-gray-800 text-gray-200 rounded-lg p-3 border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    disabled={isLoading}
                />
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 disabled:bg-gray-600 transition-colors"
            >
                {isGenerating ? <Loader className="animate-spin" size={20} /> : 'Generate Image'}
            </button>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            
            {isGenerating && <div className="flex justify-center p-8"><Loader className="animate-spin text-gray-200" size={32} /></div>}

            {generatedAsset && (
                <div className="space-y-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <img src={generatedAsset.url} alt="Generated asset" className="rounded-md border border-gray-700 max-w-full mx-auto" />
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button onClick={() => onInsertPlaceholder(`%%${generatedAsset.id}%%`)} disabled={isAppLoading} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 disabled:bg-gray-600 transition-colors"><PlusCircle size={16} /> Insert</button>
                        <button onClick={handleCopy} disabled={isAppLoading} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-full font-semibold hover:bg-gray-600 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"><Copy size={16} /> Copy URL</button>
                        <a href={generatedAsset.url} download="generated-image.png" className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-full font-semibold hover:bg-gray-600 transition-colors"><Download size={16} /> Download</a>
                    </div>
                    {feedback && <div className="text-green-400 text-sm text-center">{feedback}</div>}
                </div>
            )}
        </div>
    );
};

const SoundGenerator: React.FC<SpecificGeneratorProps> = ({ onCreateAsset, onInsertPlaceholder, isLoading: isAppLoading }) => {
    const [prompt, setPrompt] = useState('');
    const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM'); // ElevenLabs - Rachel
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAsset, setGeneratedAsset] = useState<{ url: string; dataUrl: string; id: string } | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

    const voices = [
        { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
        { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
        { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
        { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
        { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
    ];
    const isLoading = isAppLoading || isGenerating;

    const handleGenerate = async () => {
        if (!ELEVENLABS_API_KEY) {
            setError("ElevenLabs API key is not configured. Please set the ELEVENLABS_API_KEY environment variable in your project's settings.");
            return;
        }
        if (!prompt.trim()) {
            setError('Please enter some text to generate audio.');
            return;
        }
        setIsGenerating(true);
        setError(null);
        setGeneratedAsset(null);
        setFeedback(null);
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text: prompt,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API Error (${response.status}): ${errorText}`);
            }

            const audioBlob = await response.blob();
            const blobUrl = URL.createObjectURL(audioBlob);

            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const newAssetId = onCreateAsset(dataUrl, 'sound');
                setGeneratedAsset({ url: blobUrl, dataUrl: dataUrl, id: newAssetId });
            };
            reader.readAsDataURL(audioBlob);

        } catch (e: any) {
            console.error(e);
            setError(`Failed to generate audio: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCopy = () => {
        if (generatedAsset) {
            navigator.clipboard.writeText(generatedAsset.dataUrl);
            setFeedback('Data URL copied!');
            setTimeout(() => setFeedback(null), 2000);
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Sound Effect Generator</h3>
            <div className="space-y-2">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a sound or enter text for TTS... e.g., 'A loud futuristic spaceship door opening'"
                    className="w-full bg-gray-800 text-gray-200 rounded-lg p-3 border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    disabled={isLoading}
                />
                <select 
                    value={voiceId} 
                    onChange={e => setVoiceId(e.target.value)}
                    className="w-full bg-gray-800 text-gray-200 rounded-lg p-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                >
                    {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 disabled:bg-gray-600 transition-colors"
            >
                 {isGenerating ? <Loader className="animate-spin" size={20} /> : 'Generate Audio'}
            </button>
            {error && <div className="text-red-400 text-sm p-2 bg-red-900/50 rounded-md">{error}</div>}
            
            {isGenerating && <div className="flex justify-center p-8"><Loader className="animate-spin text-gray-200" size={32} /></div>}
            
            {generatedAsset && (
                 <div className="space-y-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <audio controls src={generatedAsset.url} className="w-full" />
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button onClick={() => onInsertPlaceholder(`%%${generatedAsset.id}%%`)} disabled={isAppLoading} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 disabled:bg-gray-600 transition-colors"><PlusCircle size={16} /> Insert</button>
                        <button onClick={handleCopy} disabled={isAppLoading} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-full font-semibold hover:bg-gray-600 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"><Copy size={16} /> Copy URL</button>
                        <a href={generatedAsset.url} download="generated-audio.mp3" className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-full font-semibold hover:bg-gray-600 transition-colors"><Download size={16} /> Download</a>
                    </div>
                    {feedback && <div className="text-green-400 text-sm text-center">{feedback}</div>}
                </div>
            )}
        </div>
    );
};

interface PexelsImage {
  id: number;
  src: { large: string; medium: string; };
  alt: string;
}

const PexelsSearch: React.FC<SpecificGeneratorProps> = ({ onCreateAsset, onInsertPlaceholder, isLoading: isAppLoading }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PexelsImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertingAssetId, setConvertingAssetId] = useState<number | null>(null);
  
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!PEXELS_API_KEY) {
      setError("Pexels API key is not configured. Please set the PEXELS_API_KEY environment variable in your project's settings.");
      return;
    }
    
    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12`, {
        headers: { Authorization: PEXELS_API_KEY },
      });
      if (!response.ok) {
        throw new Error(`Pexels API error (${response.status}): ${await response.text()}`);
      }
      const data = await response.json();
      setResults(data.photos);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleInsert = async (image: PexelsImage) => {
    setConvertingAssetId(image.id);
    try {
      // Using a CORS proxy for Pexels images to avoid tainted canvas issues if needed, but direct fetch is often fine.
      const response = await fetch(image.src.large);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newAssetId = onCreateAsset(base64data, 'image');
        onInsertPlaceholder(`%%${newAssetId}%%`);
        setConvertingAssetId(null);
      };
      reader.onerror = () => {
        throw new Error("Failed to read image blob as Data URL.");
      }
    } catch (e: any) {
      setError(`Failed to process image: ${e.message}`);
      setConvertingAssetId(null);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">Search Pexels for Images</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="e.g., modern office"
          className="flex-grow bg-gray-800 text-gray-200 rounded-lg p-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isAppLoading || isSearching}
        />
        <button
          onClick={handleSearch}
          disabled={isAppLoading || isSearching || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 disabled:bg-gray-600 transition-colors flex items-center justify-center"
        >
          {isSearching ? <Loader className="animate-spin" size={20} /> : 'Search'}
        </button>
      </div>
      {error && <div className="text-red-400 text-sm p-2 bg-red-900/50 rounded-md">{error}</div>}
      
      {isSearching && !results.length && <div className="flex justify-center p-8"><Loader className="animate-spin text-gray-200" size={32} /></div>}

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {results.map(image => (
            <div key={image.id} className="relative group bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <img src={image.src.medium} alt={image.alt} className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                <button
                  onClick={() => handleInsert(image)}
                  disabled={isAppLoading || convertingAssetId === image.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 disabled:bg-gray-600 transition-colors"
                >
                  {convertingAssetId === image.id ? <Loader className="animate-spin" size={16} /> : <PlusCircle size={16} />}
                  Insert
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface AssetLibraryProps extends SpecificGeneratorProps {
    assets: AppAsset[];
}

const AssetLibrary: React.FC<AssetLibraryProps> = ({ onCreateAsset, onInsertPlaceholder, isLoading, assets }) => {
    const imageAssets = assets.filter(asset => asset.type === 'image');
    const [error, setError] = useState<string | null>(null);
    const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
        const files = 'dataTransfer' in event ? event.dataTransfer.files : event.target.files;
        if (!files || files.length === 0) {
            return;
        }

        setError(null);
        const promises: Promise<void>[] = [];

        for (const file of Array.from(files) as File[]) {
            if (!file.type.startsWith('image/')) {
                console.warn(`Skipping non-image file: ${file.name}`);
                continue;
            }

            const promise = new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const dataUrl = e.target?.result as string;
                        onCreateAsset(dataUrl, 'image');
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = () => {
                    reject(new Error(`Failed to read the file: ${file.name}`));
                };
                reader.readAsDataURL(file);
            });
            promises.push(promise);
        }

        Promise.all(promises)
            .catch(err => {
                console.error(err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An error occurred while reading files.');
                }
            });
        
        if ('target' in event && event.target) {
            (event.target as HTMLInputElement).value = '';
        }
    };
    
    const handleInsertAll = () => {
        const placeholders = imageAssets.map(asset => `%%${asset.id}%%`).join(' ');
        onInsertPlaceholder(placeholders);
    };

    const handleCopy = (asset: { url: string; id: string }) => {
        navigator.clipboard.writeText(asset.url);
        setCopiedAssetId(asset.id);
        setTimeout(() => setCopiedAssetId(null), 2000);
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Asset Library</h3>
            <div 
                className="w-full p-6 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    handleFileChange(e);
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isLoading}
                    multiple
                />
                <UploadCloud className="mx-auto text-gray-400" size={40} />
                <p className="mt-2 text-sm text-gray-400">
                    <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
             {error && <div className="text-red-400 text-sm">{error}</div>}

            {imageAssets.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-md font-semibold text-gray-300">Image Assets ({imageAssets.length})</h4>
                        {imageAssets.length > 1 && (
                            <button
                                onClick={handleInsertAll}
                                disabled={isLoading}
                                className="px-3 py-1 text-xs bg-gray-700 text-gray-200 rounded-full font-semibold hover:bg-gray-600 disabled:bg-gray-600 disabled:text-gray-400 transition-colors"
                            >
                                Insert All
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {imageAssets.map((asset) => (
                             <div key={asset.id} className="space-y-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <img src={asset.url} alt="Uploaded asset" className="rounded-md border border-gray-700 w-full aspect-[16/10] object-contain bg-gray-900" />
                                <div className="flex gap-2">
                                    <button onClick={() => onInsertPlaceholder(`%%${asset.id}%%`)} disabled={isLoading} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-500 disabled:bg-gray-600 transition-colors"><PlusCircle size={16} /> Insert</button>
                                    <button onClick={() => handleCopy(asset)} disabled={isLoading} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-full font-semibold hover:bg-gray-600 disabled:bg-gray-600 disabled:text-gray-400 transition-colors">
                                        {copiedAssetId === asset.id ? 'Copied!' : <><Copy size={16} /> Copy</>}
                                    </button>
                                    <a href={asset.url} download={`asset-${asset.id}.png`} className="flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm bg-gray-700 text-gray-200 rounded-full font-semibold hover:bg-gray-600 transition-colors"><Download size={16} /></a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const AssetGenerator: React.FC<AssetGeneratorProps> = ({ onCreateAsset, onInsertPlaceholder, isLoading, assets }) => {
    const [assetType, setAssetType] = useState<'image' | 'sound' | 'upload' | 'pexels'>('upload');
    
    const commonButtonClasses = "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 focus:outline-none";
    const activeButtonClasses = "bg-blue-600 text-white";
    const inactiveButtonClasses = "text-gray-300 hover:bg-gray-700";

    const renderContent = () => {
        const props = { onCreateAsset, onInsertPlaceholder, isLoading };
        switch (assetType) {
            case 'image':
                return <ImageGenerator {...props} />;
            case 'sound':
                return <SoundGenerator {...props} />;
            case 'upload':
                return <AssetLibrary {...props} assets={assets} />;
            case 'pexels':
                return <PexelsSearch {...props} />;
            default:
                return null;
        }
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex-shrink-0 p-2">
                 <div className="flex items-center justify-center p-1 space-x-1 bg-gray-800 rounded-full">
                    <button
                        onClick={() => setAssetType('upload')}
                        aria-pressed={assetType === 'upload'}
                        className={`${commonButtonClasses} ${assetType === 'upload' ? activeButtonClasses : inactiveButtonClasses}`}
                    >
                        <UploadCloud size={16} /> Library
                    </button>
                     <button
                        onClick={() => setAssetType('pexels')}
                        aria-pressed={assetType === 'pexels'}
                        className={`${commonButtonClasses} ${assetType === 'pexels' ? activeButtonClasses : inactiveButtonClasses}`}
                    >
                        <Camera size={16} /> Pexels
                    </button>
                    <button
                        onClick={() => setAssetType('image')}
                        aria-pressed={assetType === 'image'}
                        className={`${commonButtonClasses} ${assetType === 'image' ? activeButtonClasses : inactiveButtonClasses}`}
                    >
                        <ImageIcon size={16} /> Generate
                    </button>
                    <button
                        onClick={() => setAssetType('sound')}
                        aria-pressed={assetType === 'sound'}
                        className={`${commonButtonClasses} ${assetType === 'sound' ? activeButtonClasses : inactiveButtonClasses}`}
                    >
                        <Music2 size={16} /> Sound
                    </button>
                 </div>
            </div>
            <div className="flex-grow">
               {renderContent()}
            </div>
        </div>
    );
};

export default AssetGenerator;