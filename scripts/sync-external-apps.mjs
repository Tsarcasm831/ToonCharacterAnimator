import { promises as fs } from 'fs';
import path from 'path';

const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');
const standaloneSourceDir = path.join(rootDir, 'standalone_cc', 'dist');
const standaloneTargetDir = path.join(publicDir, 'standalone_cc');

async function copyTree(sourceDir, targetDir) {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const copyEntry = async (sourcePath, targetPath) => {
    const stats = await fs.stat(sourcePath);
    if (stats.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
      const entries = await fs.readdir(sourcePath, { withFileTypes: true });
      for (const entry of entries) {
        await copyEntry(path.join(sourcePath, entry.name), path.join(targetPath, entry.name));
      }
      return;
    }

    const destinationPath = targetPath;

    await fs.mkdir(path.dirname(destinationPath), { recursive: true });

    await fs.copyFile(sourcePath, destinationPath);
  };

  await copyEntry(sourceDir, targetDir);
}

await copyTree(standaloneSourceDir, standaloneTargetDir);
