import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

import baseConfig from '@audiomass/config/eslint';
import { createClassicRuntimeCompatibility } from '../../tooling/eslint-classic-runtime.mjs';

const eslintConfig = [
  ...baseConfig,
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'next-env.d.ts',
      'public/editor-assets/**',
      'editor-runtime/static/**',
    ],
  },
  createClassicRuntimeCompatibility(),
];

export default eslintConfig;
