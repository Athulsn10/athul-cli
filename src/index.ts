#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';

const program = new Command();

program
    .name('athul')
    .description('CLI tool for setting up WordPress projects locally using DDEV')
    .version('1.0.0');

program
    .command('init')
    .description('Initialize and set up a WordPress project with DDEV')
    .action(initCommand);

program.parse();
