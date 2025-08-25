/**
 * @fileoverview Utility functions for the terminal emulator
 * @module utils
 */

/**
 * Utility class containing helper functions for the terminal emulator
 */
class Utils {
    constructor() {
        // Pre-compiled regex patterns for better performance
        this._regexCache = {
            hostname: /^[^:/\s.#?]+\.[^:/\s#?]+|localhost$/,
            ipv4Block: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            ipv6Block: /^[0-9A-Fa-f]{1,4}$/,
            mdHeaders: [
                [/^### (.*$)/gim, '<h3>$1</h3>'],
                [/^## (.*$)/gim, '<h2>$1</h2>'],
                [/^# (.*$)/gim, '<h1>$1</h1>']
            ],
            mdCode: [
                [/``(.*?)``/gm, '<code>$1</code>'],
                [/`(.*?)`/gm, '<code>$1</code>']
            ],
            mdLinks: [
                [/\[(.*?)\]\((.*?) "(.*?)"\)/gm, '<a href="$2" title="$3">$1</a>'],
                [/<http(.*?)\>/gm, '<a href="http$1">http$1</a>'],
                [/\[(.*?)\]\(\)/gm, '<a href="$1">$1</a>'],
                [/\[(.*?)\]\((.*?)\)/gm, '<a href="$2">$1</a>']
            ]
        };

        // Cache for word breaking
        this._wordBreakCache = new Map();
        this._maxCacheSize = 100;

        this.history = {
            index: 0,
            limit: 100
        };
    }

    /**
     * Simple printf implementation
     * @param {string} format - Format string with %s and %d placeholders
     * @param {...*} args - Arguments to substitute
     * @returns {string} Formatted string
     */
    printf(format, ...args) {
        return format.replace(/%[sd]/g, () => args.shift());
    }

    /**
     * Check if input is a valid hostname
     * @param {string} input - Input to validate
     * @returns {boolean} True if valid hostname
     */
    isHostname(input) {
        return this._regexCache.hostname.test(input);
    }

    /**
     * Validate IPv4 address
     * @param {string} ip - IP address to validate
     * @returns {boolean} True if valid IPv4
     */
    isValidIPv4(ip) {
        if (!ip || typeof ip !== 'string') return false;
        
        const blocks = ip.split('.');
        if (blocks.length !== 4) return false;
        
        return blocks.every(block => {
            const num = parseInt(block, 10);
            return num >= 0 && num <= 255 && block === num.toString();
        });
    }

    /**
     * Validate IPv6 address
     * @param {string} ip - IP address to validate
     * @returns {boolean} True if valid IPv6
     */
    isValidIPv6(ip) {
        if (!ip || typeof ip !== 'string') return false;
        
        const blocks = ip.split(':');
        return blocks.length === 8 && blocks.every(block => 
            this._regexCache.ipv6Block.test(block)
        );
    }

    /**
     * Validate IP address (v4 or v6)
     * @param {string} ip - IP address to validate
     * @returns {boolean} True if valid IP
     */
    isValidIP(ip) {
        return this.isValidIPv4(ip) || this.isValidIPv6(ip);
    }

    /**
     * Enhanced fetch with better error handling
     * @param {string} url - URL to fetch
     * @param {Object} opts - Fetch options
     * @returns {Promise} Fetch result
     */
    async fetch(url, opts = {}) {
        try {
            const response = await fetch(url, {
                timeout: 10000,
                ...opts
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
            
        } catch (error) {
            throw new Error(`Fetch failed: ${error.message}`);
        }
    }

    /**
     * Pad string with specified character
     * @param {string} str - String to pad
     * @param {string} padChar - Character to pad with
     * @param {number} len - Target length
     * @returns {string} Padded string
     */
    pad(str, padChar, len) {
        const padLength = len - str.length;
        return padLength <= 0 ? str : str + padChar.repeat(padLength);
    }

    /**
     * Compare function for sorting
     * @param {Object} a - First object
     * @param {Object} b - Second object
     * @returns {number} Comparison result
     */
    compare(a, b) {
        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    }

    /**
     * Word break with caching for better performance
     * @param {string} str - String to break
     * @param {number} len - Maximum line length
     * @returns {string} Word-broken string
     */
    wordBreak(str, len = 84) {
        if (!str || str.length <= len) return str;
        
        const cacheKey = `${str.substring(0, 50)}:${len}`;
        if (this._wordBreakCache.has(cacheKey)) {
            return this._wordBreakCache.get(cacheKey);
        }
        
        const words = str.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length <= len) {
                currentLine = testLine;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        }

        if (currentLine) lines.push(currentLine);
        
        const result = lines.join('\n');
        
        // Cache management
        if (this._wordBreakCache.size >= this._maxCacheSize) {
            const firstKey = this._wordBreakCache.keys().next().value;
            this._wordBreakCache.delete(firstKey);
        }
        this._wordBreakCache.set(cacheKey, result);
        
        return result;
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Sleep promise
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate random name
     * @param {number} length - Length of name
     * @returns {string} Random name
     */
    createName(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const charLength = chars.length;
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * charLength));
        }
        return result;
    }

    /**
     * Create new array filled with value
     * @param {number} size - Array size
     * @param {*} value - Fill value
     * @returns {Array} New array
     */
    newArray(size, value) {
        return new Array(size).fill(value);
    }

    /**
     * Optimized markdown parser
     * @param {string} text - Markdown text
     * @returns {string} HTML output
     */
    MDParser(text) {
        if (!text) return '';
        
        let output = text;
        
        // Apply header transformations
        this._regexCache.mdHeaders.forEach(([regex, replacement]) => {
            output = output.replace(regex, replacement);
        });
        
        // Apply code transformations
        this._regexCache.mdCode.forEach(([regex, replacement]) => {
            output = output.replace(regex, replacement);
        });
        
        // Apply link transformations
        this._regexCache.mdLinks.forEach(([regex, replacement]) => {
            output = output.replace(regex, replacement);
        });
        
        // Lists and emphasis
        output = output.replace(/^[\*|+|-][ |.](.*)/gm, '<ul><li>$1</li></ul>')
                      .replace(/<\/ul\>\n<ul\>/g, '\n');
        output = output.replace(/^\d[ |.](.*)/gm, '<ol><li>$1</li></ol>')
                      .replace(/<\/ol\>\n<ol\>/g, '\n');
        output = output.replace(/\*\*\*(.*)\*\*\*/gm, '<b><em>$1</em></b>');
        output = output.replace(/\*\*(.*)\*\*/gm, '<b>$1</b>');
        output = output.replace(/\*([\w \d]*)\*/gm, '<em>$1</em>');
        output = output.replace(/___(.*)___/gm, '<b><em>$1</em></b>');
        output = output.replace(/__(.*)__/gm, '<u>$1</u>');
        output = output.replace(/_([\w \d]*)_/gm, '<em>$1</em>');
        
        return output.trim();
    }

    /**
     * Base64 encoding/decoding utilities
     */
    get b64() {
        return {
            /**
             * Base64 encode
             * @param {string} s - String to encode
             * @returns {string} Encoded string
             */
            en: function (s) {
                try {
                    return btoa(encodeURIComponent(s).replace(/%([0-9A-F]{2})/g, 
                        (match, p1) => String.fromCharCode('0x' + p1)));
                } catch (error) {
                    throw new Error('Invalid input for base64 encoding');
                }
            },

            /**
             * Base64 decode
             * @param {string} s - String to decode
             * @returns {string} Decoded string
             */
            de: function (s) {
                try {
                    return decodeURIComponent(atob(s).split('').map(c => {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                } catch (error) {
                    throw new Error('Invalid base64 input');
                }
            }
        };
    }

    /**
     * Stringify object to command line format
     * @param {Object} obj - Object to stringify
     * @returns {string} Stringified object
     */
    stringify(obj) {
        return Object.entries(obj)
                    .map(([key, value]) => `--${key}='${value}'`)
                    .join("");
    }

    /**
     * Flatten nested object
     * @param {Object} obj - Object to flatten
     * @param {string} parentKey - Parent key prefix
     * @param {Object} result - Result accumulator
     * @param {Function} keyTransformer - Key transformation function
     * @returns {Object} Flattened object
     */
    flatten(obj, parentKey = '', result = {}, keyTransformer = null) {
        const transformer = keyTransformer || ((key, parent) => parent ? `${parent}[${key}]` : key);
        
        Object.entries(obj).forEach(([key, value]) => {
            const transformedKey = transformer(key, parentKey);
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                this.flatten(value, transformedKey, result, keyTransformer);
            } else {
                result[transformedKey] = value;
            }
        });
        
        return result;
    }

    /**
     * Show progress bar
     * @param {number} current - Current progress
     * @param {number} total - Total progress
     * @param {string} before - Before text
     * @param {string} after - After text
     * @returns {string} Progress bar string
     */
    showProgress(current, total, before = "Progress:", after = "complete") {
        const barSize = 40;
        const percent = Math.round((current / total) * 100);
        const done = Math.round((barSize * percent) / 100);
        const todo = barSize - done;
        
        return `${before}: [${"#".repeat(done)}${"-".repeat(todo)}] ${percent}% ${after}`;
    }

    /**
     * Merge options objects
     * @param {Object} target - Target object
     * @param {...Object} sources - Source objects
     * @returns {Object} Merged object
     */
    mergeOpts(target, ...sources) {
        return Object.assign({}, ...sources.reverse(), target);
    }

    /**
     * Generate random integer
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    rand(max) {
        return Math.floor(Math.random() * max) + 1;
    }

    /**
     * Clear caches to free memory
     */
    clearCaches() {
        this._wordBreakCache.clear();
    }
}

// Create singleton instance
const utils = new Utils();

export default utils;
export { Utils };