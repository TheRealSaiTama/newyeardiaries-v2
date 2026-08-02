import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    port: 5173,
    open: true,
  },
  appType: 'spa',
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/pages/AdminPage')) return 'admin';
          if (id.includes('src/pages/CheckoutPage')) return 'checkout';
          if (id.includes('src/pages/BrandingPage')) return 'branding';
          if (id.includes('src/pages/BulkQuotePage')) return 'bulk-quote';
          if (id.includes('node_modules/@supabase')) return 'supabase';
        },
      },
    },
  },
});
