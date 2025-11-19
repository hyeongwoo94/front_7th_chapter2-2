import { createViteConfig } from "../../createViteConfig";
import { resolve } from "path";

const base: string =
  process.env.NODE_ENV === "production" ? process.env.VITE_BASE_PATH || "/front_7th_chapter2-2/" : "";

// BASE_URL을 명시적으로 설정 (빈 문자열이면 "/"로 설정)
const baseUrl = base || "/";

export default createViteConfig({
  base,
  define: {
    "import.meta.env.BASE_URL": JSON.stringify(baseUrl),
    "import.meta.env.PROD": JSON.stringify(process.env.NODE_ENV === "production"),
  },
  esbuild: {
    jsx: "transform",
    jsxInject: `import React from 'react';`,
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    jsxDev: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        404: resolve(__dirname, "404.html"),
      },
    },
  },
});
