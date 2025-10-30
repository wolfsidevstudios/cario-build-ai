import React from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-markup-templating'; // Required for Vue

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: 'jsx' | 'vue';
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, language }) => {
  const highlight = (code: string) => {
    const langDefinition = Prism.languages[language];
    if (langDefinition) {
      return Prism.highlight(code, langDefinition, language);
    }
    return code; // fallback to no highlighting
  };
  
  return (
    <div className="relative h-full bg-[#2d2d2d] overflow-auto code-editor-container">
      <Editor
        value={code}
        onValueChange={onCodeChange}
        highlight={highlight}
        padding={10}
        className="code-editor"
        aria-label="Code editor"
      />
    </div>
  );
};

export default CodeEditor;