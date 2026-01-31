import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

let genAI: GoogleGenerativeAI | null = null;

/**
 * Reads API key from .athul-env file in current directory
 */
function getApiKeyFromEnvFile(): string | null {
    const envFilePath = path.join(process.cwd(), '.athul-env');

    try {
        if (!fs.existsSync(envFilePath)) {
            return null;
        }

        const envContent = fs.readFileSync(envFilePath, 'utf-8');
        const lines = envContent.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            // Parse KEY=VALUE format
            const match = trimmedLine.match(/^GEMINI_API_KEY\s*=\s*(.+)$/);
            if (match) {
                // Remove quotes if present
                let apiKey = match[1].trim();
                if ((apiKey.startsWith('"') && apiKey.endsWith('"')) ||
                    (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
                    apiKey = apiKey.slice(1, -1);
                }
                return apiKey;
            }
        }

        return null;
    } catch (error) {
        console.error(chalk.red('Error reading .athul-env file:'), error);
        return null;
    }
}

/**
 * Gets API key from multiple sources in order of precedence
 */
function getApiKey(): string | null {
    // 1. Check environment variable
    if (process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }

    // 2. Check .athul-env file in current directory
    const apiKey = getApiKeyFromEnvFile();
    if (apiKey) {
        return apiKey;
    }

    return null;
}

export function initializeGemini(): boolean {
    const apiKey = getApiKey();

    if (!apiKey) {
        console.log(chalk.yellow('\n⚠️  Gemini API key not found!'));
        console.log(chalk.white('\nTo enable AI-powered error analysis:'));
        console.log(chalk.cyan('  1. Get a free API key from: https://ai.google.dev/'));
        console.log(chalk.cyan('  2. Create a .athul-env file in your project directory'));
        console.log(chalk.cyan('  3. Add this line to the file:'));
        console.log(chalk.green('     GEMINI_API_KEY=your-api-key-here\n'));
        return false;
    }

    genAI = new GoogleGenerativeAI(apiKey);
    return true;
}

export async function analyzeError(
    command: string,
    errorOutput: string,
    osType: string
): Promise<string> {
    if (!genAI) {
        return 'Gemini API not initialized. Create a .athul-env file with GEMINI_API_KEY=your-key for AI-powered error analysis.';
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

        const validErrorOutput = errorOutput ? errorOutput : 'No error output provided';
        // Truncate error output to avoid token limits (approx 4000 chars)
        const truncatedError = validErrorOutput.length > 4000
            ? validErrorOutput.substring(validErrorOutput.length - 4000)
            : validErrorOutput;

        const prompt = `You are a helpful assistant for developers setting up WordPress with DDEV.

A user running on ${osType} encountered an error while executing the following command:
Command: ${command}

Error output:
${truncatedError}

Please analyze this error and provide:
1. A brief explanation of what went wrong
2. Step-by-step instructions to fix the issue
3. Any preventive measures for the future

Keep your response concise and actionable. Format it for terminal output (no markdown).`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        const err = error as Error;
        return `Failed to analyze error with Gemini: ${err.message}`;
    }
}

export function formatAIResponse(response: string): void {
    console.log('\n' + chalk.cyan('━'.repeat(60)));
    console.log(chalk.cyan.bold('🤖 AI Error Analysis:'));
    console.log(chalk.cyan('━'.repeat(60)) + '\n');
    console.log(response);
    console.log('\n' + chalk.cyan('━'.repeat(60)) + '\n');
}