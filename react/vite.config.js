import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
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
        "db.kinterstore.my.id"     
      ],
    },
  };
});