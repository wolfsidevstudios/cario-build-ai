import React, { useState, useEffect } from 'react';

interface ReactPreviewProps {
  code: string;
  setError: (error: string | null) => void;
}

export const generateReactPreviewHtml = (code: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      if (!window.Babel) {
        return reject(new Error('Babel is not loaded.'));
      }

      const transformedCode = window.Babel.transform(code, {
        presets: ['react', 'es2015'],
        plugins: ['transform-modules-umd'],
      }).code;
      
      const html = `
        <html>
          <head>
            <title>App Preview</title>
            <style>
              body { margin: 0; background-color: #1e1e1e; color: #ffffff; font-family: sans-serif; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

            <!-- Firebase SDKs (v8 for compatibility with this sandbox) -->
            <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
            <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
            
            <script type="text/javascript">
              // In a real app, this would be your actual Firebase config.
              // For this sandbox, it's initialized with placeholder values.
              const firebaseConfig = {
                apiKey: "AIza...",
                authDomain: "project.firebaseapp.com",
                projectId: "project-id",
              };

              // Initialize Firebase
              if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                 try {
                   firebase.initializeApp(firebaseConfig);
                 } catch(e) {
                   console.error("Firebase initialization error", e);
                 }
              } else if (typeof firebase === 'undefined') {
                  console.error("Firebase SDK not loaded.");
              }

              window.addEventListener('error', function(event) {
                const errorPayload = {
                  type: 'error',
                  message: event.message + (event.error ? '\\n' + event.error.stack : '')
                };
                try {
                  window.parent.postMessage(errorPayload, '*');
                } catch(e) {
                  // Silently catch postMessage errors if in a detached window
                }
              });

              try {
                const require = (name) => {
                  if (name === 'react') return window.React;
                  if (name === 'firebase/firestore' && window.firebase) return window.firebase.firestore;
                  throw new Error(\`Module not found: \${name}. Only 'react' and 'firebase/firestore' are supported in this sandbox.\`);
                };
                
                let exports = {};
                const module = { exports };

                (function(module, exports, require) {
                  ${transformedCode}
                })(module, exports, require);
                
                const ComponentToRender = module.exports.default;
                if (ComponentToRender) {
                  const root = ReactDOM.createRoot(document.getElementById('root'));
                  root.render(React.createElement(ComponentToRender));
                } else {
                   throw new Error('No default export found. Make sure to use "export default YourComponent;"');
                }
              } catch (e) {
                 const errorPayload = {
                  type: 'error',
                  message: e.stack
                };
                try {
                  window.parent.postMessage(errorPayload, '*');
                } catch(e) {
                  // Silently catch postMessage errors if in a detached window
                }
                 // Also log to console for the detached window case
                 console.error(e);
              }
            </script>
          </body>
        </html>
      `;
      resolve(html);
    } catch (e: any) {
      reject(e);
    }
  });
};


const ReactPreview: React.FC<ReactPreviewProps> = ({ code, setError }) => {
  const [iframeContent, setIframeContent] = useState('');

  useEffect(() => {
    const transpile = async () => {
      try {
        const html = await generateReactPreviewHtml(code);
        setIframeContent(html);
        setError(null);
      } catch (e: any) {
        setError(e.message);
      }
    };
    
    transpile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'error') {
        setError(event.data.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <iframe
      srcDoc={iframeContent}
      title="React Preview"
      sandbox="allow-scripts allow-same-origin"
      className="w-full h-full border-0"
    />
  );
};

declare global {
  interface Window {
    Babel: any;
  }
}

export default ReactPreview;