#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Copy Prisma query engines to ensure they're available in Vercel
 * This script handles cases where @prisma/client can't locate the engines
 */

const prismaPath = path.join(__dirname, '../node_modules/@prisma/client');
const prismaLibPath = path.join(__dirname, '../node_modules/.prisma/client');

console.log('🔧 Copying Prisma binaries...');
console.log('From:', prismaLibPath);
console.log('To:', prismaPath);

// Ensure source directory exists
if (!fs.existsSync(prismaLibPath)) {
  console.error('❌ Error: .prisma/client directory not found');
  console.log('Run "prisma generate" first');
  process.exit(1);
}

// Ensure destination directory exists
if (!fs.existsSync(prismaPath)) {
  fs.mkdirSync(prismaPath, { recursive: true });
  console.log('✅ Created @prisma/client directory');
}

// Copy .node files (query engines)
const files = fs.readdirSync(prismaLibPath);
const nodeFiles = files.filter(f => f.endsWith('.node'));

if (nodeFiles.length === 0) {
  console.warn('⚠️ No .node files found in .prisma/client');
} else {
  nodeFiles.forEach(file => {
    const src = path.join(prismaLibPath, file);
    const dst = path.join(prismaPath, file);
    
    try {
      fs.copyFileSync(src, dst);
      console.log(`✅ Copied ${file}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${file}:`, error.message);
    }
  });
}

console.log('✨ Done!');
