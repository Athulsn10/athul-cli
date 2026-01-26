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

    // System Checks Section
    displaySection('System Checks');

    const osType = detectOS();
    displayStatus('Operating System', getOSDisplayName(osType), 'success');

    if (osType === 'unknown') {
        displayStatus('Warning', 'Unknown OS detected, using defaults', 'warning');
    }

    // Gemini Connection
    const geminiInitialized = initializeGemini();
    if (geminiInitialized) {
        displayStatus('AI', 'Connected', 'success');
    } else {
        displayStatus('AI', 'Not configured (set GEMINI_API_KEY)', 'warning');
    }

    // Docker Check
    const dockerSpinner = createSpinner('Checking Docker status...');
    dockerSpinner.start();

    const dockerCheck = await runCommand('docker', ['info'], osType, true);

    if (!dockerCheck.success) {
        dockerSpinner.warn(chalk.yellow('Docker is not running'));

        const { default: inquirer } = await import('inquirer');

        const { startDocker } = await inquirer.prompt([{
            type: 'confirm',
            name: 'startDocker',
            message: 'Would you like to start Docker Desktop now?',
            default: true
        }]);

        if (startDocker) {
            const startSpinner = createSpinner('Starting Docker Desktop...');
            startSpinner.start();

            let startCmd = '';
            if (osType === 'macos') {
                startCmd = 'open -a Docker';
            } else if (osType === 'windows') {
                startCmd = 'start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"';
            } else {
                startSpinner.fail('Cannot auto-start Docker on this OS');
                console.log(chalk.red('Please start Docker manually and try again.'));
                process.exit(1);
            }

            try {
                const { exec } = await import('child_process');
                exec(startCmd);

                startSpinner.text = chalk.hex('#00f5ff')('Waiting for Docker to be ready...');

                let attempts = 0;
                const maxAttempts = 60; // 2 minutes
                let isRunning = false;

                while (attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 2000));
                    const check = await runCommand('docker', ['info'], osType, true);
                    if (check.success) {
                        isRunning = true;
                        break;
                    }
                    attempts++;
                }

                if (isRunning) {
                    startSpinner.succeed(chalk.hex('#00ff88')('Docker is now running'));
                } else {
                    startSpinner.fail('Timed out waiting for Docker');
                    console.log(chalk.red('Please ensure Docker Desktop is running and try again.'));
                    process.exit(1);
                }

            } catch (error) {
                startSpinner.fail('Failed to start Docker');
                process.exit(1);
            }
        } else {
            process.exit(1);
        }
    }

    dockerSpinner.succeed(chalk.hex('#00ff88')('Docker is running'));

    // DDEV Check
    const ddevSpinner = createSpinner('Checking DDEV installation...');
    ddevSpinner.start();

    const ddevCheck = await runCommand('ddev', ['--version'], osType, true);

    if (!ddevCheck.success) {
        ddevSpinner.fail(chalk.yellow('DDEV is not installed'));
        displayError('DDEV is required to run this project.');
        console.log();
        const { default: terminalLink } = await import('terminal-link');
        const link = terminalLink(chalk.gray('Please install DDEV by following the instructions at:'), 'https://ddev.com/get-started/');
        console.log(link + '\n');
        process.exit(1);
    }

    ddevSpinner.succeed(chalk.hex('#00ff88')('DDEV is installed'));

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
                const analysisSpinner = createSpinner('Analyzing error with AI...');
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

    // DB Import Section
    displaySection('Database Import');

    // Prompt for DB file
    const { default: inquirer } = await import('inquirer');

    console.log(chalk.gray('\n  To import a database, provide the path to your .sql, .sql.gz, or .zip file.'));
    console.log(chalk.gray('  Example Windows: ') + chalk.white('C:\\Users\\name\\Downloads\\db.sql'));
    console.log(chalk.gray('  Example macOS/Linux: ') + chalk.white('/Users/name/Downloads/db.sql'));
    console.log(chalk.gray('  (Press Enter to skip)\n'));

    const { dbPath } = await inquirer.prompt([{
        type: 'input',
        name: 'dbPath',
        message: 'Database file path:',
        trim: true
    }]);

    if (dbPath) {
        const importSpinner = createSpinner('Importing database...');
        importSpinner.start();

        // Remove quotes if user added them
        const cleanPath = dbPath.replace(/^["']|["']$/g, '');

        const result = await runCommand('ddev', ['import-db', `--file=${cleanPath}`], osType);

        if (!result.success) {
            importSpinner.fail(chalk.hex('#ff006e')('Database import failed'));
            displayError(`Command failed: ddev import-db --file=${cleanPath}`);

            if (result.error) {
                console.log(chalk.gray('\n  Error output:'));
                console.log(chalk.hex('#ff006e')(`  ${result.error.split('\n').join('\n  ')}`));
            }

            if (geminiInitialized) {
                const analysisSpinner = createSpinner('Analyzing error with AI...');
                analysisSpinner.start();
                const analysis = await analyzeError(
                    `ddev import-db --file=${cleanPath}`,
                    result.error || result.output,
                    getOSDisplayName(osType)
                );
                analysisSpinner.stop();
                displayAIAnalysis(analysis);
            }
            console.log(chalk.yellow('\n  Proceeding with launch despite DB import failure...'));
        } else {
            importSpinner.succeed(chalk.hex('#00ff88')('Database imported successfully'));
        }
    } else {
        console.log(chalk.gray('  Skipping database import...'));
    }

    // Launch Section
    const launchSpinner = createSpinner('Launching project...');
    launchSpinner.start();

    const result = await runCommand('ddev', ['launch'], osType);

    if (!result.success) {
        launchSpinner.fail(chalk.hex('#ff006e')('Launch failed'));
    } else {
        launchSpinner.succeed(chalk.hex('#00ff88')('Project launched'));
    }

    displaySuccess('WordPress Setup Complete!');

    console.log(chalk.gray('  Your WordPress site is now running.'));
    console.log(chalk.gray('  Use ') + chalk.hex('#00f5ff')('ddev describe') + chalk.gray(' to see your site URL.\n'));
}
