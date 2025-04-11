// scripts/add-filepath-comment.mjs
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'path';

// Resolve the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the root directory (adjust if needed)
const ROOT_DIR = path.resolve(__dirname, '../');
const GITIGNORE_PATH = path.resolve(__dirname, '../.gitignore');

// Define file extensions and their comment formats
const COMMENT_FORMATS = {
  '.js': { start: '//', end: '', regex: /^\/\/\s*/ },
  '.ts': { start: '//', end: '', regex: /^\/\/\s*/ },
  '.tsx': { start: '//', end: '', regex: /^\/\/\s*/ },
  '.jsx': { start: '//', end: '', regex: /^\/\/\s*/ },
  '.vhx': { start: '//', end: '', regex: /^\/\/\s*/ },
  '.mjs': { start: '//', end: '', regex: /^\/\/\s*/ },
  '.cjs': { start: '//', end: '', regex: /^\/\/\s*/ },
  '.html': { start: '<!--', end: '-->', regex: /^<!--\s*/ },
  '.css': { start: '/*', end: ' */', regex: /^\/\*\s*/ },
  '.scss': { start: '/*', end: ' */', regex: /^\/\*\s*/ },
  '.yaml': { start: '#', end: '', regex: /^#\s*/ },
  '.yml': { start: '#', end: '', regex: /^#\s*/ },
};

/**
 * Loads and parses the .gitignore file.
 * @param {string} gitignorePath - Path to the .gitignore file.
 * @returns {Set<string>} - A set of patterns to ignore.
 */
function loadGitignore(gitignorePath) {
  const ignoreSet = new Set();

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    gitignoreContent.split('\n').forEach(line => {
      let trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        if (trimmed.startsWith('/')) {
          trimmed = trimmed.slice(1);
        }
        ignoreSet.add(trimmed);
      }
    });
  }

  // Always ignore these directories explicitly
  const excludeDirs = [
    '.git',
    '.idea',
    '.nx',
    '.next',
    '.vscode',
    'dist',
    'tmp',
    'cache',
    'chunks',
    'node_modules',
  ];
  excludeDirs.forEach(dir => ignoreSet.add(dir));

  return ignoreSet;
}

/**
 * Checks if a path matches any pattern in the ignore set.
 * @param {string} relativePath - The relative path to check.
 * @param {Set<string>} ignoreSet - The set of ignore patterns.
 * @returns {boolean} - True if the path matches an ignore pattern.
 */
function isIgnored(relativePath, ignoreSet) {
  const normalizedPath = relativePath.replace(/\\/g, '/'); // Normalize paths to use forward slashes

  if (normalizedPath.includes('turbo.json') || normalizedPath.includes('components.json')) {
    return true;
  }

  // Explicitly ignore any directory that includes /node_modules/ or starts with node_modules/
  if (normalizedPath.includes('/node_modules/') || normalizedPath.startsWith('node_modules/')) {
    return true;
  }

  for (const pattern of ignoreSet) {
    const escapedPattern = pattern.replace(/\\/g, '/'); // Normalize ignore pattern

    if (
      normalizedPath === escapedPattern ||
      normalizedPath.startsWith(`${escapedPattern}/`) ||
      normalizedPath.includes(`/${escapedPattern}/`) // Ensures nested .next directories are matched
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively find all supported files in the directory, respecting .gitignore rules.
 * @param {string} dir - Directory to start searching.
 * @param {string[]} fileList - Accumulated list of file paths.
 * @param {Set<string>} ignoreSet - Set of files/directories to ignore.
 * @returns {string[]} - List of file paths.
 */
function getSupportedFiles(dir, fileList = [], ignoreSet) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(ROOT_DIR, filePath);
    const stats = fs.statSync(filePath);

    if (isIgnored(relativePath, ignoreSet)) {
      return;
    }

    if (stats.isDirectory()) {
      getSupportedFiles(filePath, fileList, ignoreSet);
    } else if (COMMENT_FORMATS[path.extname(file)] || path.extname(file) === '.json') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Helper to remove comment markers from a comment line
function cleanComment(commentLine, { start, end, regex }) {
  let cleaned = commentLine.replace(regex, '');
  if (end && cleaned.endsWith(end)) {
    cleaned = cleaned.slice(0, -end.length);
  }
  return cleaned.trim();
}

// Heuristic to decide if a cleaned string looks like a filepath.
// Here we check that it includes a slash and a dot (for an extension)
function looksLikeFilepath(str) {
  return /[\/\\]/.test(str) && str.includes('.');
}

function prependFilePathComment(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath);

  if (ext === '.json') {
    try {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      const jsonContent = JSON.parse(fileData);
      const keys = Object.keys(jsonContent);

      const alreadyHasPath = keys[0] === '$path' && jsonContent['$path'] === relativePath;

      if (alreadyHasPath) {
        return; // Already correct and in order, skip
      }

      // Otherwise, build new object with $path on top
      const newJson = { $path: relativePath };
      keys.forEach(key => {
        if (key !== '$path') {
          newJson[key] = jsonContent[key];
        }
      });

      fs.writeFileSync(filePath, JSON.stringify(newJson, null, 2) + '\n', 'utf-8');

      if (jsonContent['$path'] !== relativePath) {
        console.log(`Updated JSON with "$path" in: ${relativePath}`);
      } else {
        console.log(`Reordered JSON with "$path" at the top in: ${relativePath}`);
      }
    } catch (err) {
      console.error(`Error parsing JSON file ${relativePath}: ${err}`);
    }
    return;
  }

  const { start, end, regex } = COMMENT_FORMATS[ext] || {};
  if (!start) return; // Skip unsupported file types

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.replace(/\r\n/g, '\n').split('\n');
  const correctComment = `${start} ${relativePath} ${end}`.trim();

  // Determine the starting index for inserting the comment.
  // If the file starts with a shebang, preserve it by inserting after line 0.
  let insertionIndex = 0;
  if (lines.length > 0 && lines[0].startsWith('#!')) {
    insertionIndex = 1;
  }

  // Find the first non-empty line after the insertion index.
  let firstNonEmptyIndex = lines.slice(insertionIndex).findIndex(line => line.trim() !== '');
  if (firstNonEmptyIndex !== -1) {
    firstNonEmptyIndex += insertionIndex; // Adjust index relative to original lines

    // Check for TypeScript directives (e.g., @ts-nocheck, @ts-check)
    if (/^\/\/\s*@ts-(no)?check/.test(lines[firstNonEmptyIndex])) {
      const directiveIndex = firstNonEmptyIndex;
      let nextNonEmpty = lines.slice(directiveIndex + 1).findIndex(line => line.trim() !== '');
      if (nextNonEmpty !== -1) {
        firstNonEmptyIndex = nextNonEmpty + directiveIndex + 1;
      }
    }
  }

  // If the first non-empty line (after any shebang and TS directives) already has a comment marker
  if (firstNonEmptyIndex !== -1 && regex.test(lines[firstNonEmptyIndex])) {
    const existingComment = cleanComment(lines[firstNonEmptyIndex], {
      start,
      end,
      regex,
    });
    if (existingComment === relativePath) {
      return; // Skip updating to prevent duplicates
    } else {
      console.log(`Replacing incorrect path comment in ${relativePath}`);
      lines[firstNonEmptyIndex] = correctComment;
    }
  } else {
    console.log(`Adding path comment in ${relativePath}`);
    // If a shebang exists, insert after it; otherwise, add at the top.
    if (insertionIndex > 0) {
      lines.splice(insertionIndex, 0, correctComment);
    } else {
      lines.unshift(correctComment);
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Main script execution
 */
(function main() {
  console.log('Updating supported files with file path comments or metadata...');
  const ignoreSet = loadGitignore(GITIGNORE_PATH);
  const supportedFiles = getSupportedFiles(ROOT_DIR, [], ignoreSet);

  supportedFiles.forEach(filePath => {
    prependFilePathComment(filePath);
  });

  console.log('All supported files have been updated.');
})();
