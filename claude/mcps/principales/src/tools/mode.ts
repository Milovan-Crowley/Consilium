export interface ModeDeps {
  env: NodeJS.ProcessEnv;
}

export function createMode(deps: ModeDeps) {
  return async (): Promise<string> => {
    return deps.env.CONSILIUM_VERIFICATION_MODE ?? 'classic';
  };
}
