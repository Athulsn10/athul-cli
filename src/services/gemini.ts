import { GoogleGenerativeAI } from '@google/generative-ai';
import chalk from 'chalk';

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(): boolean {
    const apiKey = 'AIzaSyC24X_DAHcV0vntj0jY2ZXQEmUMv_LNiYQ';

    if (!apiKey) {
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
        return 'Gemini API not initialized. Set GEMINI_API_KEY environment variable for AI-powered error analysis.';
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `You are a helpful assistant for developers setting up WordPress with DDEV.

        A user running on ${osType} encountered an error while executing the following command:
        Command: ${command}

        Error output:
        ${errorOutput}

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
