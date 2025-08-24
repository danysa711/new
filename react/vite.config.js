// File: react/vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      __BACKEND_URL__: JSON.stringify(env.VITE_BACKEND_URL),
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'https://db.kinterstore.my.id',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      },
      allowedHosts: [
        "www.kinterstore.my.id", 
        "kinterstore.my.id", 
        "db.kinterstore.my.id", 
        "tes.kinterstore.my.id", 
        "db1.kinterstore.my.id"
      ],
    },
  };
});