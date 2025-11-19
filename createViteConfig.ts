import { defineConfig as defineTestConfig, mergeConfig, ViteUserConfig } from "vitest/config";
import { defineConfig, UserConfig } from "vite";

export function createViteConfig(options: UserConfig = {}, testOptions: ViteUserConfig["test"] = {}): UserConfig {
  const config = defineConfig(options);
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

  return merged;
}
