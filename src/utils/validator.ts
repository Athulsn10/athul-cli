import fs from 'fs';
import path from 'path';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateWordPressStructure(directory: string): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    const wpContentPath = path.join(directory, 'wp-content');
    const themesPath = path.join(wpContentPath, 'themes');

    // Check if wp-content folder exists
    if (!fs.existsSync(wpContentPath)) {
        result.isValid = false;
        result.errors.push('wp-content folder not found in the current directory');
        return result;
    }

    // Check if themes folder exists
    if (!fs.existsSync(themesPath)) {
        result.isValid = false;
        result.errors.push('wp-content/themes folder not found');
        return result;
    }

    // Check if at least one theme exists
    const themes = fs.readdirSync(themesPath).filter(item => {
        const itemPath = path.join(themesPath, item);
        return fs.statSync(itemPath).isDirectory();
    });

    if (themes.length === 0) {
        result.isValid = false;
        result.errors.push('No theme found in wp-content/themes folder');
        return result;
    }

    result.warnings.push(`Found ${themes.length} theme(s): ${themes.join(', ')}`);

    return result;
}
