import { createViteConfig } from "../../createViteConfig";
import { resolve } from "path";
import { execSync } from "child_process";

const getBasePath = (): string => {
  if (process.env.NODE_ENV !== "production") return "";
  if (process.env.VITE_BASE_PATH) return process.env.VITE_BASE_PATH;

  try {
    const remoteUrl = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    const match = remoteUrl.match(/\/([^/]+)\.git$/);
    const repoName = match ? match[1] : "front_7th_chapter2-2";
    return `/${repoName}/`;
  } catch {
    return "/front_7th_chapter2-2/";
  }
};

const base: string = getBasePath();

export default createViteConfig({
  base,
  define: {
    "import.meta.env.VITE_BASE_URL": JSON.stringify(base),
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
