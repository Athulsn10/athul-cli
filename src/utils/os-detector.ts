import os from 'os';

export type OSType = 'windows' | 'macos' | 'linux' | 'unknown';

export function detectOS(): OSType {
    const platform = os.platform();

    switch (platform) {
        case 'win32':
            return 'windows';
        case 'darwin':
            return 'macos';
        case 'linux':
            return 'linux';
        default:
            return 'unknown';
    }
}

export function getOSDisplayName(osType: OSType): string {
    switch (osType) {
        case 'windows':
            return 'Windows';
        case 'macos':
            return 'macOS';
        case 'linux':
            return 'Linux';
        default:
            return 'Unknown OS';
    }
}
