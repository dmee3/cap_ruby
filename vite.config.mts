import { defineConfig } from "vite";
import ViteRails from "vite-plugin-rails";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    ViteRails({
      envVars: { RAILS_ENV: "development" },
      envOptions: { defineOn: "import.meta.env" },
      fullReload: {
        additionalPaths: ["config/routes.rb", "app/views/**/*"],
        delay: 300,
      },
    }),
    react(),
  ],
  build: { sourcemap: false },
  css: {
    preprocessorOptions: {
      scss: {
        // You can add global imports here if needed
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app/javascript'),
      '@atoms': path.resolve(__dirname, 'app/javascript/react/design-system/atoms'),
      '@molecules': path.resolve(__dirname, 'app/javascript/react/design-system/molecules'),
      '@organisms': path.resolve(__dirname, 'app/javascript/react/design-system/organisms'),
      '@templates': path.resolve(__dirname, 'app/javascript/react/design-system/templates'),
      '@components': path.resolve(__dirname, 'app/javascript/react/components'),
      '@widgets': path.resolve(__dirname, 'app/javascript/react/widgets'),
    },
  },
});
