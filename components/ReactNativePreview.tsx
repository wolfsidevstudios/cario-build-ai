import React, { useState, useEffect } from 'react';

interface VuePreviewProps {
  code: string;
  setError: (error: string | null) => void;
}

const parseSFC = (code: string) => {
    const template = code.match(/<template>([\s\S]*)<\/template>/)?.[1] || '';
    const script = code.match(/<script>([\s\S]*)<\/script>/)?.[1] || '';
    const style = code.match(/<style.*>([\s\S]*)<\/style>/)?.[1] || '';
    return { template, script, style };
};

export const generateVuePreviewHtml = (code: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
        if (!window.Babel) {
            return reject(new Error('Babel is not loaded.'));
        }
        if (!window.Vue) {
            return reject(new Error('Vue is not loaded.'));
        }

        const { template, script, style } = parseSFC(code);

        const transformedScript = window.Babel.transform(script, {
            presets: ['es2015', 'react'], // react preset for JSX if needed, es2015 for modules
        }).code;

        const html = `
            <html>
            <head>
                <title>Vue Preview</title>
                <style>
                    body { margin: 0; background-color: #1e1e1e; color: #ffffff; font-family: sans-serif; }
                    ${style}
                </style>
            </head>
            <body>
                <div id="app"></div>
                <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
                <script type="text/javascript">
                    window.addEventListener('error', function(event) {
                        const errorPayload = { type: 'error', message: event.message + (event.error ? '\\n' + event.error.stack : '') };
                        try { window.parent.postMessage(errorPayload, '*'); } catch(e) {}
                    });

                    try {
                        const require = (name) => {
                          if (name === 'vue') return window.Vue;
                          throw new Error(\`Module not found: \${name}. Only 'vue' is supported in this sandbox.\`);
                        };
                        
                        let exports = {};
                        const module = { exports };

                        (function(module, exports, require) {
                          ${transformedScript}
                        })(module, exports, require);

                        const componentOptions = module.exports.default;
                        if (!componentOptions) {
                           throw new Error('No default export found in <script> block. Make sure to use "export default { ... }".');
                        }
                        
                        componentOptions.template = \`${template.replace(/`/g, '\\`')}\`;
                        
                        const app = Vue.createApp(componentOptions);
                        app.mount('#app');

                    } catch (e) {
                        const errorPayload = { type: 'error', message: e.stack };
                        try { window.parent.postMessage(errorPayload, '*'); } catch(e) {}
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


const VuePreview: React.FC<VuePreviewProps> = ({ code, setError }) => {
  const [iframeContent, setIframeContent] = useState('');

  useEffect(() => {
    const transpile = async () => {
      try {
        const html = await generateVuePreviewHtml(code);
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
      title="Vue Preview"
      sandbox="allow-scripts allow-same-origin"
      className="w-full h-full border-0"
    />
  );
};

declare global {
  interface Window {
    Babel: any;
    Vue: any;
  }
}

export default VuePreview;