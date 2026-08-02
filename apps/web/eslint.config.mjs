import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

import baseConfig from '@audiomass/config/eslint';

const eslintConfig = [
  ...baseConfig,
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'coverage/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
