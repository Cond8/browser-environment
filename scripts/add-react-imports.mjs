#!/usr/bin/env node
// scripts/add-react-imports.mjs

import { execSync } from 'child_process';
import fs from 'fs';

// Find all TSX files
const tsxFiles = execSync('find src -type f -name "*.tsx"').toString().split('\n').filter(Boolean);

console.log(`Found ${tsxFiles.length} TSX files to process`);
let modifiedCount = 0;

// Process each file
tsxFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');

    // Skip if file already imports React
    if (content.includes('import React') || content.includes('import * as React')) {
      console.log(`✓ ${file} - Already has React import`);
      return;
    }

    // Find the last import statement
    const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
    if (importLines.length === 0) {
      console.log(`⚠️ ${file} - No import statements found, skipping`);
      return;
    }

    // Determine where to add the React import
    const lines = content.split('\n');
    const lastImportIndex = lines.findIndex(
      (line, i, arr) =>
        line.trim().startsWith('import ') &&
        (line.includes(';') || !arr[i + 1]?.trim().startsWith('  ')),
    );

    if (lastImportIndex === -1) {
      console.log(`⚠️ ${file} - Could not determine import position, skipping`);
      return;
    }

    // Add React import after the last import
    lines.splice(lastImportIndex + 1, 0, "import React from 'react';");

    // Write the modified content back
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`✅ ${file} - Added React import`);
    modifiedCount++;
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\nDone! Modified ${modifiedCount} of ${tsxFiles.length} files.`);
