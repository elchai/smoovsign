import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// בונה אל שורש הריפו (smoovsign.com ב-GitHub Pages): index.html של האתר הציבורי,
// והקבצים תחת lp/. אסור למחוק את שורש הריפו, שם יושבים app.html והאפליקציה.
export default defineConfig({
  plugins: [react()],
  build: { outDir: '..', emptyOutDir: false, assetsDir: 'lp/assets' },
});
