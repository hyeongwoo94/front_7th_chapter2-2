import { defineConfig as defineTestConfig, mergeConfig, ViteUserConfig } from "vitest/config";
import { defineConfig, UserConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createViteConfig(options: UserConfig = {}, testOptions: ViteUserConfig["test"] = {}): UserConfig {
  const config = defineConfig({
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
        // react 패키지를 올바르게 resolve하도록 설정 (app 패키지 빌드 시 필요)
        react: resolve(__dirname, "packages/react/src/index.ts"),
        "react-dom/client": resolve(__dirname, "packages/react/src/client/index.ts"),
      },
    },
    server: {
      ...options.server,
    },
    ssr: {
      ...options.ssr,
      noExternal: options.ssr?.noExternal || [],
    },
  });
  const testConfig = defineTestConfig({
    test: {
      globals: true,
      environment: "jsdom",
      exclude: ["**/e2e/**", "**/*.e2e.spec.js", "**/node_modules/**"],
      ...testOptions,
    },
  });

  const merged = mergeConfig(config, testConfig);

  if (options.define && merged.define) {
    merged.define = {
      ...merged.define,
      ...options.define,
    };
  } else if (options.define) {
    merged.define = options.define;
  }

  // server 설정이 undefined가 되지 않도록 보장
  if (!merged.server) {
    merged.server = {};
  }

  // ssr 설정이 undefined가 되지 않도록 보장
  if (!merged.ssr) {
    merged.ssr = {
      noExternal: [],
    };
  } else if (!merged.ssr.noExternal) {
    merged.ssr.noExternal = [];
  }

  return merged;
}
