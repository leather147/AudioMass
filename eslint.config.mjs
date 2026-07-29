import workspaceConfig from './packages/config/eslint.config.mjs';
import { createClassicRuntimeCompatibility } from './tooling/eslint-classic-runtime.mjs';

export default [...workspaceConfig, createClassicRuntimeCompatibility('apps/web/')];
