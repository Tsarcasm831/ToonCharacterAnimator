const fs = require('fs');
const path = require('path');

const getImports = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
    const exportRegex = /export\s+.*?\s+from\s+['"](.*?)['"]/g;
    const dynamicImportRegex = /import\(['"](.*?)['"]\)/g;
    const imports = [];
    
    let match;
    while ((match = importRegex.exec(content)) !== null) imports.push(match[1]);
    while ((match = exportRegex.exec(content)) !== null) imports.push(match[1]);
    while ((match = dynamicImportRegex.exec(content)) !== null) imports.push(match[1]);
    return imports;
};

const resolveImport = (basePath, importPath) => {
    if (!importPath.startsWith('.')) return null;
    let resolved = path.resolve(path.dirname(basePath), importPath);
    const exts = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx', '.json'];
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
    for (const ext of exts) {
        if (fs.existsSync(resolved + ext)) return resolved + ext;
    }
    return null;
};

const visited = new Set();
const toVisit = [
    path.resolve('components/ui/previews/PlayerPreview.tsx'),
    path.resolve('components/ui/panels/ControlPanel.tsx'),
    path.resolve('types.ts'),
    path.resolve('types2.ts')
];

while (toVisit.length > 0) {
    const current = toVisit.pop();
    if (!fs.existsSync(current)) continue;
    if (visited.has(current)) continue;
    visited.add(current);
    
    const imports = getImports(current);
    for (const imp of imports) {
        const resolved = resolveImport(current, imp);
        if (resolved && !visited.has(resolved)) {
            toVisit.push(resolved);
        }
    }
}

const rootDir = path.resolve('.');
const outDir = path.resolve('standalone_cc/src');

for (const file of visited) {
    const rel = path.relative(rootDir, file);
    if (rel.startsWith('..')) continue;
    const dest = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
}
console.log('Copied ' + visited.size + ' files to standalone_cc/src');
