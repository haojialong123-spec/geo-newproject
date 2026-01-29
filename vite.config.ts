import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use '.' to look for .env in the current directory
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    server: {
      host: true, // 允许外网访问
      port: 5173,
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