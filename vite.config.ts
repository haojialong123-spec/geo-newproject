import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use '.' to look for .env in the current directory
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api/antigravity': {
          target: process.env.VITE_ANTIGRAVITY_BASE_URL || 'http://127.0.0.1:8045',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/antigravity/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // 注入用户提供的修复版 User-Agent
              proxyReq.setHeader('User-Agent', 'antigravity/1.15.8 darwin/arm64');
            });
          }
        }
      }
    },
    define: {
      // Explicitly replace ONLY the API_KEY string in the code.
      // Do NOT use 'process.env': {} because it overwrites process.env.NODE_ENV and breaks React.
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      outDir: 'build',
    },
  };
});