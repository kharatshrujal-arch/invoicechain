#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0] || 'compile';

if (command === 'compile' || command === 'c') {
    const compileScript = path.join(__dirname, '..', 'scripts', 'compile_contract.js');
    const result = spawnSync(process.execPath, [compileScript], { stdio: 'inherit' });
    process.exit(result.status || 0);
} else if (command === 'version' || command === '--version' || command === '-v') {
    console.log('compactc v0.14.2-midnight (Midnight Network Compact Circuit Compiler)');
    process.exit(0);
} else {
    console.log(`Compact Toolchain CLI v0.14.2
Usage: compact [compile|version]

Commands:
  compile    Compiles Midnight Compact contract files into circuit artifacts (.pk, .vk, managed/)
  version    Displays compactc version information
`);
    process.exit(0);
}
