import { spawn } from 'child_process';
import type { OSType } from './os-detector.js';

export interface CommandResult {
    success: boolean;
    output: string;
    error: string;
    exitCode: number | null;
}

export async function runCommand(
    command: string,
    args: string[],
    osType: OSType,
    silent: boolean = false
): Promise<CommandResult> {
    return new Promise((resolve) => {
        let output = '';
        let error = '';

        const child = spawn(command, args, {
            shell: true,
            stdio: ['inherit', 'pipe', 'pipe']
        });

        child.stdout?.on('data', (data) => {
            const text = data.toString();
            output += text;
            if (!silent) process.stdout.write(text);
        });

        child.stderr?.on('data', (data) => {
            const text = data.toString();
            error += text;
            if (!silent) process.stderr.write(text);
        });

        child.on('close', (code) => {
            resolve({
                success: code === 0,
                output,
                error,
                exitCode: code
            });
        });

        child.on('error', (err) => {
            resolve({
                success: false,
                output,
                error: err.message,
                exitCode: null
            });
        });
    });
}

export interface DDEVCommand {
    name: string;
    command: string;
    args: string[];
    description: string;
}

export const DDEV_COMMANDS: DDEVCommand[] = [
    {
        name: 'config',
        command: 'ddev',
        args: ['config', '--project-type=wordpress'],
        description: 'Configuring DDEV for WordPress'
    },
    {
        name: 'start',
        command: 'ddev',
        args: ['start'],
        description: 'Starting DDEV containers'
    },
    {
        name: 'download',
        command: 'ddev',
        args: ['wp', 'core', 'download'],
        description: 'Downloading WordPress core files'
    },
    {
        name: 'download',
        command: 'ddev',
        args: ['wp', 'core', 'download'],
        description: 'Downloading WordPress core files'
    }
];
