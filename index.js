#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const yaml = require('yaml');

// Utility to create file with optional content
async function createFile(filePath, content = '') {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

// Recursively build the structure
async function buildStructure(basePath, structure) {
  for (const [key, value] of Object.entries(structure)) {
    const targetPath = path.join(basePath, key);

    if (Array.isArray(value)) {
      await fs.mkdir(targetPath, { recursive: true });

      for (const entry of value) {
        if (typeof entry === 'string') {
          // Create empty file
          await createFile(path.join(targetPath, entry));
        } else if (typeof entry === 'object') {
          for (const [fileName, content] of Object.entries(entry)) {
            await createFile(path.join(targetPath, fileName), content);
          }
        }
      }
    } else if (typeof value === 'object') {
      // Nested folder
      await fs.mkdir(targetPath, { recursive: true });
      await buildStructure(targetPath, value);
    } else if (typeof value === 'string') {
      // File with content
      await createFile(targetPath, value);
    }
  }
}

async function main() {
  const cwd = process.cwd();
  const setupFilePath = path.join(cwd, 'setup.yaml');

  try {
    const setupContent = await fs.readFile(setupFilePath, 'utf8');
    const parsed = yaml.parse(setupContent);

    const projectName = parsed.project_name || 'my_project';
    const projectPath = path.join(cwd, projectName);

    await fs.mkdir(projectPath, { recursive: true });

    await buildStructure(projectPath, parsed.structure);

    console.log(`✅ Project "${projectName}" created successfully.`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
