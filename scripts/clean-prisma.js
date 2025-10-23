#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Remove the .prisma directory to force regeneration
const prismaDir = path.join(__dirname, '..', 'node_modules', '.prisma');

if (fs.existsSync(prismaDir)) {
  console.log('🧹 Cleaning .prisma directory...');
  fs.rmSync(prismaDir, { recursive: true, force: true });
  console.log('✅ .prisma directory cleaned');
} else {
  console.log('ℹ️ .prisma directory does not exist');
}

// Also clean @prisma/client/runtime
const runtimeDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'client', 'runtime');
if (fs.existsSync(runtimeDir)) {
  console.log('🧹 Cleaning @prisma/client/runtime...');
  const files = fs.readdirSync(runtimeDir);
  files.forEach(file => {
    if (file.startsWith('libquery_engine-')) {
      const filepath = path.join(runtimeDir, file);
      fs.rmSync(filepath, { force: true });
      console.log(`✅ Removed ${file}`);
    }
  });
}

console.log('🎯 Prisma cache cleaned successfully');
