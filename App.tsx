import React, { useState, useEffect } from 'react';
import SidePanel from './components/Header'; // Re-using Header as SidePanel
import Workspace from './components/Preview'; // Re-using Preview as Workspace
import useDebounce from './hooks/useDebounce';
import { ChatMessage, AppAsset } from './types';
import { INITIAL_CODE_REACT, SYSTEM_PROMPT_REACT, SYSTEM_PROMPT_VUE, INITIAL_MESSAGE, INITIAL_CODE_VUE } from './constants';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const APP_ASSETS_STORAGE_KEY = 'ai-app-builder-assets';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [assets, setAssets] = useState<AppAsset[]>(() => {
    try {
      const savedAssets = localStorage.getItem(APP_ASSETS_STORAGE_KEY);
      return savedAssets ? JSON.parse(savedAssets) : [];
    } catch (error) {
      console.error("Failed to parse assets from localStorage", error);
      return [];
    }
  });
  
  const [reactCode, setReactCode] = useState<string>(INITIAL_CODE_REACT);
  const [vueCode, setVueCode] = useState<string>(INITIAL_CODE_VUE);
  const [input, setInput] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [platform, setPlatform] = useState<'react' | 'vue'>('react');

  const code = platform === 'react' ? reactCode : vueCode;
  const setCode = platform === 'react' ? setReactCode : setVueCode;

  const debouncedCode = useDebounce(code, 500);

  useEffect(() => {
    try {
      localStorage.setItem(APP_ASSETS_STORAGE_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error("Failed to save assets to localStorage", error);
    }
  }, [assets]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const message = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: message }],
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const historyForApi: ChatMessage[] = [
        ...newMessages,
        { role: 'model', parts: [{ text: `Here is the current code to be modified:\n\`\`\`${platform === 'react' ? 'jsx' : 'vue'}\n${code}\n\`\`\``}] }
      ];
      
      const systemPrompt = platform === 'react' ? SYSTEM_PROMPT_REACT : SYSTEM_PROMPT_VUE;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: historyForApi,
        config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                explanation: {
                  type: Type.STRING,
                  description: "A user-friendly, conversational explanation of the changes made. This should be in markdown format.",
                },
                code: {
                  type: Type.STRING,
                  description: `The complete, self-contained ${platform === 'react' ? 'React' : 'Vue'} component code for the application. The component must be the default export or follow the SFC standard.`,
                },
              },
              required: ["explanation", "code"],
            },
        },
      });

      const aiResponseText = response.text;
      if (!aiResponseText) {
        throw new Error("The AI returned an empty or invalid response. This could be due to a content safety filter.");
      }
      
      const parsedResponse = JSON.parse(aiResponseText);

      if (parsedResponse.explanation && parsedResponse.code) {
        const modelMessage: ChatMessage = {
          role: 'model',
          parts: [{ text: parsedResponse.explanation }],
        };
        setMessages([...newMessages, modelMessage]);
        setCode(parsedResponse.code);
      } else {
        throw new Error("AI response is missing 'explanation' or 'code' keys.");
      }

    } catch (e: any) {
      console.error(e);
      const errorMessage: ChatMessage = {
          role: 'model',
          parts: [{ text: `Sorry, I encountered an error. \n\n**Details:**\n\`\`\`\n${e.message}\n\`\`\`` }]
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAsset = (assetUrl: string, assetType: 'image' | 'sound'): string => {
    const newAssetId = `asset_${assets.length + 1}`;
    const newAsset: AppAsset = { id: newAssetId, type: assetType, url: assetUrl };
    setAssets(prevAssets => [...prevAssets, newAsset]);
    return newAssetId;
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    setInput(prev => `${prev}${prev ? ' ' : ''}${placeholder}`.trim() + ' ');
  };


  return (
    <div className="flex flex-col h-screen bg-gray-800 text-gray-200">
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/3 h-full flex flex-col">
          <SidePanel 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
            platform={platform}
            onPlatformChange={setPlatform}
            input={input}
            setInput={setInput}
          />
        </div>
        <div className="w-full md:w-2/3 h-full flex flex-col">
          <Workspace 
            code={debouncedCode} 
            onCodeChange={setCode} 
            error={error} 
            setError={setError}
            platform={platform}
            assets={assets}
            onCreateAsset={handleCreateAsset}
            onInsertPlaceholder={handleInsertPlaceholder}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default App;