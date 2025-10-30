import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Loader } from 'lucide-react';
import { ChatMessage } from '../types';

interface SidePanelProps {
  messages: ChatMessage[];
  onSendMessage: () => void;
  isLoading: boolean;
  platform: 'react' | 'vue';
  onPlatformChange: (platform: 'react' | 'vue') => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

const SidePanel: React.FC<SidePanelProps> = ({ messages, onSendMessage, isLoading, platform, onPlatformChange, input, setInput }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const commonButtonClasses = "px-4 py-1.5 text-sm font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors";
  const activeButtonClasses = "bg-blue-600 text-white";

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white"><Bot size={20} /></div>}
              <div className={`px-4 py-2 rounded-lg max-w-md ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.parts[0].text}</ReactMarkdown>
                </div>
              </div>
              {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white"><User size={20} /></div>}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white"><Bot size={20} /></div>
               <div className="px-4 py-3 rounded-lg bg-gray-700 flex items-center">
                  <Loader className="animate-spin text-gray-200" size={20} />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center bg-gray-800 rounded-full p-1 space-x-1">
            <button
              onClick={() => onPlatformChange('react')}
              className={`${commonButtonClasses} ${platform === 'react' ? activeButtonClasses : 'bg-transparent text-gray-300 hover:bg-gray-700'}`}
              aria-pressed={platform === 'react'}
            >
              React
            </button>
            <button
              onClick={() => onPlatformChange('vue')}
               className={`${commonButtonClasses} ${platform === 'vue' ? activeButtonClasses : 'bg-transparent text-gray-300 hover:bg-gray-700'}`}
               aria-pressed={platform === 'vue'}
            >
              Vue
            </button>
          </div>
        </div>
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Describe the ${platform} app you want to build...`}
            className="w-full bg-gray-800 text-gray-200 rounded-lg p-3 pr-12 border border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;