const LEGACY_EDITOR_PATH = '/apps/web/public/legacy/';

function quote(filename) {
  return `"${filename.replaceAll('"', '\\"')}"`;
}

function commandsFor(files, commands) {
  const targets = files
    .filter((filename) => !filename.replaceAll('\\', '/').includes(LEGACY_EDITOR_PATH))
    .map(quote)
    .join(' ');

  return targets ? commands.map((command) => `${command} ${targets}`) : [];
}

const lintStagedConfig = {
  '*.{js,mjs,cjs,ts,tsx}': (files) => commandsFor(files, ['eslint --fix', 'prettier --write']),
  '*.{json,md,yaml,yml,css}': (files) => commandsFor(files, ['prettier --write']),
};

export default lintStagedConfig;
