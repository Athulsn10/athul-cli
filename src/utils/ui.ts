import gradient from 'gradient-string';
import boxen from 'boxen';
import figlet from 'figlet';
import chalk from 'chalk';
import ora from 'ora';

// Cyberpunk-style gradient
const cyberGradient = gradient(['#00f5ff', '#bf00ff', '#ff006e']);
const successGradient = gradient(['#00ff88', '#00f5ff']);
const warningGradient = gradient(['#ff9500', '#ff006e']);
const errorGradient = gradient(['#ff006e', '#ff0000']);

export function displayBanner(): void {
    console.clear();

    const banner = figlet.textSync('ATHUL CLI', {
        font: 'ANSI Shadow',
        horizontalLayout: 'fitted'
    });

    console.log('\n' + cyberGradient(banner));

    console.log(boxen(
        chalk.hex('#00f5ff')('WordPress DDEV Setup Tool') +
        chalk.gray(' • ') +
        chalk.hex('#bf00ff')('By Athul'),
        {
            padding: { left: 2, right: 2, top: 0, bottom: 0 },
            borderStyle: 'round',
            borderColor: '#00f5ff',
            dimBorder: true
        }
    ));

    console.log('');
}

export function displaySection(title: string): void {
    console.log('\n' + cyberGradient(`▸ ${title.toUpperCase()}`));
    console.log(chalk.hex('#333')('─'.repeat(50)));
}

export function displayStatus(label: string, value: string, status: 'success' | 'warning' | 'error' | 'info' = 'info'): void {
    const statusColors: Record<string, string> = {
        success: '#00ff88',
        warning: '#ff9500',
        error: '#ff006e',
        info: '#00f5ff'
    };

    const icon = {
        success: '✓',
        warning: '⚠',
        error: '✗',
        info: '◆'
    };

    console.log(
        chalk.hex(statusColors[status])(`  ${icon[status]} `) +
        chalk.gray(label + ': ') +
        chalk.white(value)
    );
}

export function displayBox(content: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const colors: Record<string, string> = {
        success: '#00ff88',
        error: '#ff006e',
        info: '#00f5ff'
    };

    console.log('\n' + boxen(content, {
        padding: 1,
        borderStyle: 'round',
        borderColor: colors[type],
        dimBorder: false
    }));
}

export function displayProgress(step: number, total: number, message: string): string {
    const progress = Math.round((step / total) * 100);
    const filled = Math.round(progress / 5);
    const empty = 20 - filled;

    const bar =
        chalk.hex('#00f5ff')('█'.repeat(filled)) +
        chalk.hex('#333')('░'.repeat(empty));

    return `${bar} ${chalk.hex('#bf00ff')(`${progress}%`)} ${chalk.gray(message)}`;
}

export function displaySuccess(message: string): void {
    console.log('\n' + successGradient('━'.repeat(60)));
    console.log(successGradient.multiline(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   ✓  ${message.padEnd(49)}  ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `));
}

export function displayError(message: string): void {
    console.log('\n' + errorGradient('━'.repeat(60)));
    console.log(errorGradient(`  ✗ ERROR: ${message}`));
    console.log(errorGradient('━'.repeat(60)));
}

export function displayAIAnalysis(analysis: string): void {
    console.log('\n' + boxen(
        cyberGradient('🤖 AI ANALYSIS\n\n') +
        chalk.white(analysis),
        {
            padding: 1,
            borderStyle: 'double',
            borderColor: '#bf00ff',
            title: '[ AI DIAGNOSTICS ]',
            titleAlignment: 'center'
        }
    ));
}

export function createSpinner(text: string): ReturnType<typeof ora> {
    return ora({
        text: chalk.hex('#00f5ff')(text),
        indent: 2,
        spinner: {
            interval: 80,
            frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'].map(f => chalk.hex('#bf00ff')(f))
        }
    });
}

export function displayStep(step: number, total: number, description: string): void {
    const stepIndicator = chalk.hex('#bf00ff')(`[${step}/${total}]`);
    const arrow = chalk.hex('#00f5ff')('▶');
    console.log(`\n  ${stepIndicator} ${arrow} ${chalk.white(description)}`);
}
