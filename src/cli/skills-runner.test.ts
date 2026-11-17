import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSkillsRunner } from "./skills-runner.ts";

describe("resolveSkillsRunner", () => {
  it("uses pnpm dlx without -y when invoked under pnpm", () => {
    const result = resolveSkillsRunner(["update", "modern-web-guidance"], {
      npm_config_user_agent: "pnpm/11.25.0 npm/? node/v24.21.0 linux x64",
    });
    assert.strictEqual(result.command, "pnpm");
    assert.deepStrictEqual(result.args, ["dlx", "skills", "update", "modern-web-guidance"]);
    assert.strictEqual(result.env.npm_config_force, undefined);
  });

  it("uses yarn dlx when invoked under Yarn Berry (>= 2)", () => {
    const result = resolveSkillsRunner(["update", "modern-web-guidance"], {
      npm_config_user_agent: "yarn/4.5.0 npm/? node/v22.18.0 linux x64",
    });
    assert.strictEqual(result.command, "yarn");
    assert.deepStrictEqual(result.args, ["dlx", "skills", "update", "modern-web-guidance"]);
    assert.strictEqual(result.env.npm_config_force, undefined);
  });

  it("falls back to npx with npm_config_force=true under Yarn Classic (v1)", () => {
    const result = resolveSkillsRunner(["update", "modern-web-guidance"], {
      npm_config_user_agent: "yarn/1.22.22 npm/? node/v22.18.0 linux x64",
    });
    assert.strictEqual(result.command, "npx");
    assert.deepStrictEqual(result.args, ["-y", "skills", "update", "modern-web-guidance"]);
    assert.strictEqual(result.env.npm_config_force, "true");
  });

  it("uses bunx when invoked under bun", () => {
    const result = resolveSkillsRunner(["remove", "modern-web-guidance"], {
      npm_config_user_agent: "bun/1.2.0 npm/? node/v22.18.0 linux x64",
    });
    assert.strictEqual(result.command, "bunx");
    assert.deepStrictEqual(result.args, ["skills", "remove", "modern-web-guidance"]);
    assert.strictEqual(result.env.npm_config_force, undefined);
  });

  it("falls back to npx -y with npm_config_force=true under npm or unset user agent", () => {
    for (const env of [
      {},
      { npm_config_user_agent: "npm/12.0.2 node/v24.21.0 linux x64" },
    ]) {
      const result = resolveSkillsRunner(["add", "GoogleChrome/modern-web-guidance"], env);
      assert.strictEqual(result.command, "npx");
      assert.deepStrictEqual(result.args, [
        "-y",
        "skills",
        "add",
        "GoogleChrome/modern-web-guidance",
      ]);
      assert.strictEqual(result.env.npm_config_force, "true");
    }
  });

  it("preserves explicit npm_config_force and extra env vars when falling back to npx", () => {
    const result = resolveSkillsRunner(["add", "GoogleChrome/modern-web-guidance"], {
      AI_AGENT: "claude",
      npm_config_force: "false",
    });
    assert.strictEqual(result.command, "npx");
    assert.strictEqual(result.env.AI_AGENT, "claude");
    assert.strictEqual(result.env.npm_config_force, "false");
  });
});
