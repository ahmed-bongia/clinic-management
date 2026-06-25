const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const backendRoot = join(__dirname, '..');
const directories = ['config', 'controllers', 'middleware', 'routes', 'scripts', 'utils'];

const collectJavaScriptFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
  });

const files = [join(backendRoot, 'server.js')];

for (const directory of directories) {
  const directoryPath = join(backendRoot, directory);
  if (statSync(directoryPath).isDirectory()) files.push(...collectJavaScriptFiles(directoryPath));
}

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Syntax check passed for ${files.length} backend JavaScript files.`);
