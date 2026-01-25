import chalk from 'chalk';
import { detectOS, getOSDisplayName } from '../utils/os-detector.js';
import { validateWordPressStructure } from '../utils/validator.js';
import { runCommand, DDEV_COMMANDS } from '../utils/command-runner.js';
import { initializeGemini, analyzeError } from '../services/gemini.js';
import {
    displayBanner,
    displaySection,
    displayStatus,
    displaySuccess,
    displayError,
    displayAIAnalysis,
    displayStep,
    createSpinner,
    displayBox
} from '../utils/ui.js';

export async function initCommand(): Promise<void> {
    // Display futuristic banner
    displayBanner();

    // System Detection Section
    displaySection('System Detection');

    const osType = detectOS();
    displayStatus('Operating System', getOSDisplayName(osType), 'success');

    if (osType === 'unknown') {
        displayStatus('Warning', 'Unknown OS detected, using defaults', 'warning');
    }

    // Gemini Connection
    const geminiInitialized = initializeGemini();
    if (geminiInitialized) {
        displayStatus('Gemini AI', 'Connected', 'success');
    } else {
        displayStatus('Gemini AI', 'Not configured (set GEMINI_API_KEY)', 'warning');
    }

    // Validation Section
    displaySection('Project Validation');

    const spinner = createSpinner('Scanning project structure...');
    spinner.start();

    const cwd = process.cwd();
    const validation = validateWordPressStructure(cwd);

    if (!validation.isValid) {
        spinner.fail(chalk.hex('#ff006e')('Validation failed'));

        displayBox(
            chalk.hex('#ff006e')('PROJECT STRUCTURE ERROR\n\n') +
            validation.errors.map(e => chalk.white(`  ✗ ${e}`)).join('\n') +
            chalk.gray('\n\n Required structure:\n') +
            chalk.hex('#00f5ff')('  your-project/\n') +
            chalk.hex('#00f5ff')('  └── wp-content/\n') +
            chalk.hex('#00f5ff')('      └── themes/\n') +
            chalk.hex('#00f5ff')('          └── your-theme/'),
            'error'
        );

        console.log(chalk.gray('\n  Create the required folders and run ') + chalk.hex('#00f5ff')('athul init') + chalk.gray(' again.\n'));
        process.exit(1);
    }

    spinner.succeed(chalk.hex('#00ff88')('Project structure validated'));

    // Show found themes
    for (const warning of validation.warnings) {
        displayStatus('Themes', warning.replace('Found ', '').replace(' theme(s): ', ': '), 'info');
    }

    // DDEV Setup Section
    displaySection('DDEV WordPress Setup');

    const totalSteps = DDEV_COMMANDS.length;

    for (let i = 0; i < DDEV_COMMANDS.length; i++) {
        const ddevCmd = DDEV_COMMANDS[i];

        displayStep(i + 1, totalSteps, ddevCmd.description);

        const cmdSpinner = createSpinner(chalk.gray(`Executing: ${ddevCmd.command} ${ddevCmd.args.join(' ')}`));
        cmdSpinner.start();

        const result = await runCommand(ddevCmd.command, ddevCmd.args, osType);

        if (!result.success) {
            cmdSpinner.fail(chalk.hex('#ff006e')(`${ddevCmd.description} - Failed`));

            displayError(`Command failed: ${ddevCmd.command} ${ddevCmd.args.join(' ')}`);

            if (result.error) {
                console.log(chalk.gray('\n  Error output:'));
                console.log(chalk.hex('#ff006e')(`  ${result.error.split('\n').join('\n  ')}`));
            }

            // Use Gemini for error analysis
            if (geminiInitialized) {
                const analysisSpinner = createSpinner('Analyzing error with Gemini AI...');
                analysisSpinner.start();

                const analysis = await analyzeError(
                    `${ddevCmd.command} ${ddevCmd.args.join(' ')}`,
                    result.error || result.output,
                    getOSDisplayName(osType)
                );

                analysisSpinner.stop();
                displayAIAnalysis(analysis);
            }

            process.exit(1);
        }

        cmdSpinner.succeed(chalk.hex('#00ff88')(ddevCmd.description));
    }

    // Success!
    displaySuccess('WordPress Setup Complete!');

    console.log(chalk.gray('  Your WordPress site is now running.'));
    console.log(chalk.gray('  Use ') + chalk.hex('#00f5ff')('ddev describe') + chalk.gray(' to see your site URL.\n'));
}
