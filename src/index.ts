#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const program = new Command();

program
    .name('athul')
    .description('CLI tool for setting up WordPress projects locally using DDEV')
    .version(packageJson.version);

program
    .command('init')
    .description('Initialize and set up a WordPress project with DDEV')
    .action(initCommand);

program.parse();
