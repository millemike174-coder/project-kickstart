import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { mcpPlugin } from '@lovable.dev/mcp-js/stacks/supabase/vite';

export default defineConfig({
  plugins: [react(), mcpPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
