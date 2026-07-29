const classicRuntimeModules = [
  'actions.ts',
  'contextmenu.ts',
  'engine.ts',
  'fx-auto.ts',
  'fx-pg-eq.ts',
  'markers.ts',
  'modal.ts',
  'multitrack.ts',
  'ui-fx.ts',
  'ui.ts',
];

const classicRuntimeRules = {
  '@typescript-eslint/no-this-alias': 'off',
  '@typescript-eslint/no-unused-expressions': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  'no-empty': 'off',
  'no-prototype-builtins': 'off',
  'no-useless-escape': 'off',
  'no-var': 'off',
  'prefer-const': 'off',
};

export function createClassicRuntimeCompatibility(prefix = '') {
  return {
    files: classicRuntimeModules.map((filename) => `${prefix}editor-runtime/${filename}`),
    rules: classicRuntimeRules,
  };
}
