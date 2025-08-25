/**
 * @fileoverview Command line parser for the terminal emulator
 * @module parser
 */

/**
 * Custom error for parsing failures
 */
export class ParserError extends Error {
    constructor(message, position, input) {
        super(message);
        this.name = 'ParserError';
        this.position = position;
        this.input = input;
    }

    toString() {
        return `${this.message} at position ${this.position} in: "${this.input}"`;
    }
}

/**
 * Command line parser with optimized performance
 */
export class Parser {
    /**
     * Pre-compiled regex patterns for better performance
     */
    static PATTERNS = {
        WHITESPACE_CLEANUP: /\s{2,}/g,
        TABS_NEWLINES: /\t|\n/g,
        STRING_TOKENIZE: /[^\s"']+|"([^"]*)"|'([^']*)'/g,
        SINGLE_FLAG: /^-[^-]/,
        FLAG_MATCHER: /^-/,
        VERBOSE_FLAG_EQUALS: /^--.*=$/,
        VERBOSE_FLAG_NAME_EQUALS: /--(.*)=/,
        VERBOSE_FLAG_VALUE_EQUALS: /^--.*=.*$/,
        VERBOSE_FLAG_NAME_CAPTURE: /--(.*)=/,
        VERBOSE_FLAG_VALUE_CAPTURE: /=(.*)/,
        VERBOSE_FLAG: /^--/,
        ANY_FLAG: /^-/
    };

    /**
     * Create a new parser instance
     * @param {string} command - Command string to parse
     * @throws {ParserError} When command is invalid
     */
    constructor(command) {
        if (!command?.length) {
            throw new ParserError('Command provided is empty', 0, command || '');
        }
        if (typeof command !== 'string') {
            throw new ParserError('Input must be of type string', 0, command);
        }

        this.raw = command;
        
        try {
            const cleanCommand = this._cleanCommand(command);
            const argv = this._stringToArray(cleanCommand);
            
            this.command = argv[0];
            this._ = [];

            if (argv.length > 1) {
                Object.assign(this, this._parseIterative(argv.slice(1)));
            }
        } catch (error) {
            if (error instanceof ParserError) {
                throw error;
            }
            throw new ParserError(`Failed to parse command: ${error.message}`, 0, command);
        }
    }

    /**
     * Clean and normalize command string
     * @param {string} command - Raw command string
     * @returns {string} Cleaned command string
     * @private
     */
    _cleanCommand(command) {
        return command
            .replace(Parser.PATTERNS.WHITESPACE_CLEANUP, ' ')
            .replace(Parser.PATTERNS.TABS_NEWLINES, ' ')
            .trim();
    }

    /**
     * Split command string into arguments array, preserving quoted strings
     * @param {string} string - Command string to tokenize
     * @returns {Array<string>} Array of arguments
     * @private
     */
    _stringToArray(string) {
        const matches = string.match(Parser.PATTERNS.STRING_TOKENIZE);
        return matches || [];
    }

    /**
     * Parse arguments array iteratively (more efficient than recursive)
     * @param {Array<string>} options - Arguments to parse
     * @returns {Object} Parsed options object
     * @private
     */
    _parseIterative(options) {
        const parsed = {};
        let i = 0;

        while (i < options.length) {
            const current = options[i];
            
            // Handle single character flags (-f, -v, etc.)
            if (Parser.PATTERNS.SINGLE_FLAG.test(current)) {
                const optionName = current.slice(1);
                const next = options[i + 1];
                
                if (!next || Parser.PATTERNS.FLAG_MATCHER.test(next)) {
                    parsed[optionName] = true;
                    i++;
                } else {
                    parsed[optionName] = this._cleanQuotes(next);
                    i += 2;
                }
                continue;
            }

            // Handle verbose flags with separate value (--flag="value")
            if (Parser.PATTERNS.VERBOSE_FLAG_EQUALS.test(current)) {
                const match = current.match(Parser.PATTERNS.VERBOSE_FLAG_NAME_EQUALS);
                if (match) {
                    const optionName = match[1];
                    const value = options[i + 1];
                    parsed[optionName] = value ? this._cleanQuotes(value) : '';
                    i += 2;
                } else {
                    i++;
                }
                continue;
            }

            // Handle verbose flags with embedded value (--flag=value)
            if (Parser.PATTERNS.VERBOSE_FLAG_VALUE_EQUALS.test(current)) {
                const nameMatch = current.match(Parser.PATTERNS.VERBOSE_FLAG_NAME_CAPTURE);
                const valueMatch = current.match(Parser.PATTERNS.VERBOSE_FLAG_VALUE_CAPTURE);
                
                if (nameMatch && valueMatch) {
                    parsed[nameMatch[1]] = this._cleanQuotes(valueMatch[1]);
                }
                i++;
                continue;
            }

            // Handle verbose flags (--flag)
            if (Parser.PATTERNS.VERBOSE_FLAG.test(current)) {
                const optionName = current.replace('--', '');
                const next = options[i + 1];
                
                if (!next || Parser.PATTERNS.ANY_FLAG.test(next)) {
                    parsed[optionName] = true;
                    i++;
                } else {
                    parsed[optionName] = this._cleanQuotes(next);
                    i += 2;
                }
                continue;
            }

            // Not a flag - add to positional arguments
            this._.push(this._cleanQuotes(current));
            i++;
        }

        return parsed;
    }

    /**
     * Remove surrounding quotes from a string
     * @param {string} str - String to clean
     * @returns {string} Cleaned string
     * @private
     */
    _cleanQuotes(str) {
        if (!str) return str;
        
        if ((str.startsWith('"') && str.endsWith('"')) ||
            (str.startsWith("'") && str.endsWith("'"))) {
            return str.slice(1, -1);
        }
        
        return str;
    }

    /**
     * Validate parsed command for common issues
     * @returns {Object} Validation result
     */
    validate() {
        const issues = [];
        
        // Check for unmatched quotes
        const quoteCount = (this.raw.match(/"/g) || []).length;
        const singleQuoteCount = (this.raw.match(/'/g) || []).length;
        
        if (quoteCount % 2 !== 0) {
            issues.push('Unmatched double quote marks');
        }
        
        if (singleQuoteCount % 2 !== 0) {
            issues.push('Unmatched single quote marks');
        }

        // Check for empty command
        if (!this.command?.trim()) {
            issues.push('Empty command');
        }

        // Check for suspicious patterns
        if (this.raw.includes('--=')) {
            issues.push('Invalid flag format: --=');
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Get a string representation of the parsed command
     * @returns {string} String representation
     */
    toString() {
        const flags = Object.entries(this)
            .filter(([key, value]) => key !== 'command' && key !== '_' && key !== 'raw')
            .map(([key, value]) => `${key}=${value}`)
            .join(' ');
            
        return `Command: ${this.command}, Args: [${this._.join(', ')}], Flags: {${flags}}`;
    }
}

/**
 * Command validation utilities
 */
export class CommandValidator {
    /**
     * Validate a parsed command
     * @param {Parser} parser - Parser instance to validate
     * @returns {Object} Validation result
     */
    static validate(parser) {
        if (!(parser instanceof Parser)) {
            return {
                isValid: false,
                issues: ['Invalid parser instance']
            };
        }

        return parser.validate();
    }

    /**
     * Check if command has required arguments
     * @param {Parser} parser - Parser instance
     * @param {number} minArgs - Minimum required arguments
     * @returns {boolean} True if has required arguments
     */
    static hasRequiredArgs(parser, minArgs) {
        return parser._.length >= minArgs;
    }

    /**
     * Check if command has specific flag
     * @param {Parser} parser - Parser instance
     * @param {string} flag - Flag to check for
     * @returns {boolean} True if flag exists
     */
    static hasFlag(parser, flag) {
        return parser.hasOwnProperty(flag);
    }

    /**
     * Get flag value or default
     * @param {Parser} parser - Parser instance
     * @param {string} flag - Flag name
     * @param {*} defaultValue - Default value if flag not present
     * @returns {*} Flag value or default
     */
    static getFlagValue(parser, flag, defaultValue = null) {
        return parser.hasOwnProperty(flag) ? parser[flag] : defaultValue;
    }
}

/**
 * Parser cache for better performance with repeated commands
 */
export class ParserCache {
    constructor(maxSize = 100) {
        this._cache = new Map();
        this._maxSize = maxSize;
    }

    /**
     * Get parsed command from cache or parse if not cached
     * @param {string} command - Command to parse
     * @returns {Parser} Parser instance
     */
    parse(command) {
        if (this._cache.has(command)) {
            return this._cache.get(command);
        }

        const parser = new Parser(command);
        
        // Cache management
        if (this._cache.size >= this._maxSize) {
            const firstKey = this._cache.keys().next().value;
            this._cache.delete(firstKey);
        }
        
        this._cache.set(command, parser);
        return parser;
    }

    /**
     * Clear the cache
     */
    clear() {
        this._cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            size: this._cache.size,
            maxSize: this._maxSize,
            hitRate: this._hits / (this._hits + this._misses) || 0
        };
    }
}

export default Parser;