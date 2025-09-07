import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      __BACKEND_URL__: JSON.stringify(env.VITE_BACKEND_URL),
    },
    server: {
      allowedHosts: [
        "kinterstore.com",
        "www.kinterstore.com",
        "db.kinterstore.com",
        "www.kinterstore.my.id",
        "kinterstore.my.id",
        "db.kinterstore.my.id",
      ],
      proxy: {
        // Semua request /api/* diarahkan ke backend
        "/api": {
          target: "https://db.kinterstore.my.id",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
