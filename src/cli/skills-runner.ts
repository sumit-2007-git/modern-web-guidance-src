export interface SkillsRunnerInvocation {
  readonly command: string;
  readonly args: readonly string[];
  readonly env: NodeJS.ProcessEnv;
}

/**
 * Resolves the package-runner command (`pnpm dlx`, `yarn dlx`, `bunx`, or `npx`)
 * used to invoke the `skills` CLI for `install`, `update`, and `uninstall`.
 *
 * Respects the active package manager in `npm_config_user_agent` when invoked via
 * `pnpm`/`pnpx`, Yarn Berry (`>=2`), or `bun`/`bunx`. When falling back to `npx`,
 * sets `npm_config_force=true` (unless already explicitly configured) so npm 12+
 * does not abort with `EBADDEVENGINES` against an unrelated `devEngines.packageManager`
 * declaration in `process.cwd()/package.json`.
 */
export function resolveSkillsRunner(
  skillsSubcommandArgs: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): SkillsRunnerInvocation {
  const userAgent = env.npm_config_user_agent?.trim() ?? "";

  if (userAgent.startsWith("pnpm/")) {
    return {
      command: "pnpm",
      args: ["dlx", "skills", ...skillsSubcommandArgs],
      env: { ...env },
    };
  }

  const yarnMatch = userAgent.match(/^yarn\/(\d+)\./);
  if (yarnMatch && Number(yarnMatch[1]) >= 2) {
    return {
      command: "yarn",
      args: ["dlx", "skills", ...skillsSubcommandArgs],
      env: { ...env },
    };
  }

  if (userAgent.startsWith("bun/")) {
    return {
      command: "bunx",
      args: ["skills", ...skillsSubcommandArgs],
      env: { ...env },
    };
  }

  const npxEnv: NodeJS.ProcessEnv =
    env.npm_config_force !== undefined
      ? { ...env }
      : { ...env, npm_config_force: "true" };

  return {
    command: "npx",
    args: ["-y", "skills", ...skillsSubcommandArgs],
    env: npxEnv,
  };
}
