/**
 * @fileoverview Main entry point for the terminal emulator
 * @module index
 */

// Core modules
import TerminalEmulator from './terminal.js';
import VirtualFileSystem from './vfs.js';
import { Parser, ParserCache, CommandValidator } from './parser.js';
import { TreeStructure, TreeNode } from './tree.js';
import CommandManager, { Command } from './command.js';
import utils from './utils.js';
import { DEFAULT_FS, DEFAULT_ENV, DEFAULT_ALIASES, SAMPLE_USERS, FILE_TYPES } from './filesystem-data.js';

/**
 * Terminal emulator factory with convenient initialization
 */
export class TerminalFactory {
    /**
     * Create a new terminal instance with sensible defaults
     * @param {string|Element} element - DOM element or CSS selector
     * @param {Object} options - Configuration options
     * @returns {TerminalEmulator} Terminal instance
     */
    static create(element, options = {}) {
        const vfs = new VirtualFileSystem();
        const terminal = new TerminalEmulator(element, vfs, options);
        
        // Show welcome message if enabled
        if (options.showWelcome !== false) {
            terminal.printHTML(terminal.opts.welcome);
            terminal.newLine();
        }
        
        return terminal;
    }

    /**
     * Create terminal with custom filesystem
     * @param {string|Element} element - DOM element or CSS selector
     * @param {Object} filesystemData - Custom filesystem structure
     * @param {Object} options - Configuration options
     * @returns {TerminalEmulator} Terminal instance
     */
    static createWithFilesystem(element, filesystemData, options = {}) {
        const vfs = new VirtualFileSystem();
        vfs.initStructure(filesystemData, null);
        
        const terminal = new TerminalEmulator(element, vfs, options);
        
        if (options.showWelcome !== false) {
            terminal.printHTML(terminal.opts.welcome);
            terminal.newLine();
        }
        
        return terminal;
    }

    /**
     * Create multiple terminal instances
     * @param {Array<{element: string|Element, options?: Object}>} configs - Terminal configurations
     * @returns {Array<TerminalEmulator>} Array of terminal instances
     */
    static createMultiple(configs) {
        return configs.map(config => this.create(config.element, config.options));
    }
}

/**
 * Configuration manager for terminal emulator settings
 */
export class TerminalConfig {
    constructor() {
        this.themes = {
            dark: 'dark',
            light: 'light',
            laserwave: 'dark',
            nord: 'dark',
            greyscale: 'dark',
            dracula: 'dark',
            nightowl: 'dark',
            onedark: 'dark'
        };

        this.defaults = {
            welcome: "<span class=\"host\">TERM[E]DITOR BASH</span>&mdash;v1.0\nType <span class=\"cmd\">help</span> to get started.",
            theme: 'onedark',
            maxHistorySize: 1000,
            cursorType: 'block',
            textSize: '14px',
            fontFamily: '"Fira Code", "Source Code Pro", Monaco, Consolas, monospace',
            forceFocus: true,
            overflow: 'auto',
            whiteSpace: 'break-spaces',
            showWelcome: true
        };
    }

    /**
     * Get default configuration
     * @returns {Object} Default configuration
     */
    getDefaults() {
        return { ...this.defaults };
    }

    /**
     * Get available themes
     * @returns {Object} Available themes
     */
    getThemes() {
        return { ...this.themes };
    }

    /**
     * Validate configuration
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validate(config) {
        const issues = [];
        
        if (config.theme && !this.themes[config.theme]) {
            issues.push(`Unknown theme: ${config.theme}`);
        }
        
        if (config.maxHistorySize && (config.maxHistorySize < 1 || config.maxHistorySize > 10000)) {
            issues.push('maxHistorySize must be between 1 and 10000');
        }
        
        if (config.textSize && !config.textSize.match(/^\d+(\.\d+)?(px|em|rem|%)$/)) {
            issues.push('textSize must be a valid CSS size value');
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Merge configurations with validation
     * @param {Object} base - Base configuration
     * @param {Object} override - Override configuration
     * @returns {Object} Merged configuration
     */
    merge(base, override) {
        const merged = { ...base, ...override };
        const validation = this.validate(merged);
        
        if (!validation.isValid) {
            console.warn('Configuration validation issues:', validation.issues);
        }
        
        return merged;
    }
}

/**
 * Terminal emulator plugin system
 */
export class PluginManager {
    constructor(terminal) {
        this.terminal = terminal;
        this.plugins = new Map();
        this.hooks = new Map();
    }

    /**
     * Register a plugin
     * @param {string} name - Plugin name
     * @param {Object} plugin - Plugin object
     */
    register(name, plugin) {
        if (this.plugins.has(name)) {
            throw new Error(`Plugin ${name} already registered`);
        }

        this.plugins.set(name, plugin);
        
        // Initialize plugin
        //if (typeof plugin.init === 'function') {
        //    plugin.init(this.terminal);
        //}
        
        // Register plugin commands
        if (plugin.commands) {
            for (const [cmdName, cmdDef] of Object.entries(plugin.commands)) {
                this.terminal.registerCommand(cmdName, cmdDef);
            }
        }
        
        // Register plugin hooks
        if (plugin.hooks) {
            for (const [hookName, hookFunc] of Object.entries(plugin.hooks)) {
                this.addHook(hookName, hookFunc);
            }
        }
    }

    /**
     * Unregister a plugin
     * @param {string} name - Plugin name
     */
    unregister(name) {
        const plugin = this.plugins.get(name);
        if (!plugin) {
            throw new Error(`Plugin ${name} not found`);
        }

        // Cleanup plugin
        if (typeof plugin.destroy === 'function') {
            plugin.destroy(this.terminal);
        }
        
        this.plugins.delete(name);
    }

    /**
     * Add a hook
     * @param {string} hookName - Hook name
     * @param {Function} callback - Hook callback
     */
    addHook(hookName, callback) {
        if (!this.hooks.has(hookName)) {
            this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName).push(callback);
    }

    /**
     * Execute hooks
     * @param {string} hookName - Hook name
     * @param {...*} args - Hook arguments
     * @returns {Promise<Array>} Hook results
     */
    async executeHooks(hookName, ...args) {
        const hooks = this.hooks.get(hookName) || [];
        const results = [];
        
        for (const hook of hooks) {
            try {
                const result = await hook(...args);
                results.push(result);
            } catch (error) {
                console.error(`Hook ${hookName} error:`, error);
            }
        }
        
        return results;
    }

    /**
     * Get plugin instance
     * @param {string} name - Plugin name
     * @returns {Object|null} Plugin instance
     */
    getPlugin(name) {
        return this.plugins.get(name) || null;
    }

    /**
     * List registered plugins
     * @returns {Array<string>} Plugin names
     */
    listPlugins() {
        return Array.from(this.plugins.keys());
    }
}

/**
 * Performance monitor for terminal operations
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.enabled = false;
    }

    /**
     * Enable performance monitoring
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disable performance monitoring
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Start timing an operation
     * @param {string} operation - Operation name
     * @returns {string} Timer ID
     */
    start(operation) {
        if (!this.enabled) return null;
        
        const timerId = `${operation}_${Date.now()}_${Math.random()}`;
        const startTime = performance.now();
        
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, {
                count: 0,
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0,
                timers: new Map()
            });
        }
        
        this.metrics.get(operation).timers.set(timerId, startTime);
        return timerId;
    }

    /**
     * End timing an operation
     * @param {string} operation - Operation name
     * @param {string} timerId - Timer ID from start()
     */
    end(operation, timerId) {
        if (!this.enabled || !timerId) return;
        
        const metric = this.metrics.get(operation);
        if (!metric || !metric.timers.has(timerId)) return;
        
        const startTime = metric.timers.get(timerId);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        metric.count++;
        metric.totalTime += duration;
        metric.averageTime = metric.totalTime / metric.count;
        metric.minTime = Math.min(metric.minTime, duration);
        metric.maxTime = Math.max(metric.maxTime, duration);
        
        metric.timers.delete(timerId);
        
        if (duration > 100) { // Log slow operations
            console.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Get performance metrics
     * @param {string} operation - Operation name (optional)
     * @returns {Object|Map} Metrics for operation or all metrics
     */
    getMetrics(operation = null) {
        if (operation) {
            return this.metrics.get(operation) || null;
        }
        
        const result = {};
        for (const [key, value] of this.metrics.entries()) {
            result[key] = {
                count: value.count,
                totalTime: Math.round(value.totalTime * 100) / 100,
                averageTime: Math.round(value.averageTime * 100) / 100,
                minTime: Math.round(value.minTime * 100) / 100,
                maxTime: Math.round(value.maxTime * 100) / 100
            };
        }
        
        return result;
    }

    /**
     * Clear all metrics
     */
    clear() {
        this.metrics.clear();
    }
}

/**
 * Debug utilities for terminal development
 */
export class DebugUtils {
    /**
     * Log terminal state
     * @param {TerminalEmulator} terminal - Terminal instance
     */
    static logState(terminal) {
        console.group('Terminal State');
        console.log('Current directory:', terminal.path);
        console.log('Command history:', terminal.commandHistory);
        console.log('Environment:', terminal.env);
        console.log('VFS stats:', terminal.vfs.getStats());
        console.log('Parser cache size:', terminal._parserCache.getStats());
        console.groupEnd();
    }

    /**
     * Benchmark command execution
     * @param {TerminalEmulator} terminal - Terminal instance
     * @param {string} command - Command to benchmark
     * @param {number} iterations - Number of iterations
     * @returns {Promise<Object>} Benchmark results
     */
    static async benchmarkCommand(terminal, command, iterations = 100) {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await terminal.executeCommand(command);
            const end = performance.now();
            times.push(end - start);
        }
        
        const totalTime = times.reduce((sum, time) => sum + time, 0);
        const averageTime = totalTime / iterations;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        return {
            command,
            iterations,
            totalTime: Math.round(totalTime * 100) / 100,
            averageTime: Math.round(averageTime * 100) / 100,
            minTime: Math.round(minTime * 100) / 100,
            maxTime: Math.round(maxTime * 100) / 100,
            times
        };
    }

    /**
     * Validate filesystem integrity
     * @param {VirtualFileSystem} vfs - VFS instance
     * @returns {Object} Validation result
     */
    static validateFilesystem(vfs) {
        const issues = [];
        const visited = new Set();
        
        function validateNode(node, path = '') {
            if (visited.has(node)) {
                issues.push(`Circular reference detected at ${path}`);
                return;
            }
            
            visited.add(node);
            
            if (!node.key) {
                issues.push(`Node missing key at ${path}`);
            }
            
            if (node.parent && !node.parent.children.includes(node)) {
                issues.push(`Orphaned node: ${path}`);
            }
            
            for (const child of node.children) {
                if (child.parent !== node) {
                    issues.push(`Invalid parent reference at ${path}/${child.key}`);
                }
                validateNode(child, `${path}/${child.key}`);
            }
        }
        
        if (vfs.tree.root) {
            validateNode(vfs.tree.root);
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Generate filesystem report
     * @param {VirtualFileSystem} vfs - VFS instance
     * @returns {Object} Filesystem report
     */
    static generateFilesystemReport(vfs) {
        const stats = vfs.getStats();
        const report = {
            ...stats,
            structure: []
        };
        
        function buildStructure(node, depth = 0) {
            const item = {
                name: node.key,
                type: node.type,
                size: node.size || 0,
                depth,
                childCount: node.children.length
            };
            
            report.structure.push(item);
            
            for (const child of node.children) {
                buildStructure(child, depth + 1);
            }
        }
        
        if (vfs.tree.root) {
            buildStructure(vfs.tree.root);
        }
        
        return report;
    }
}

/**
 * Example plugin for demonstration
 */
export const ExamplePlugin = {
    name: 'example',
    version: '1.0.0',
    
    init(terminal) {
        console.log('Example plugin initialized');
    },
    
    commands: {
        hello: {
            func: async function(argv) {
                const name = argv._.length > 0 ? argv._[0] : 'World';
                this.printHTML(`<span class="success">Hello, ${name}!</span>`);
            },
            help: "<span class=\"cmd\">hello</span>: Say hello\n\nUsage: hello [name]"
        },
        
        fortune: {
            func: async function(argv) {
                const fortunes = [
                    "The best way to predict the future is to implement it.",
                    "There are only 10 types of people: those who understand binary and those who don't.",
                    "Programming is thinking, not typing.",
                    "Code is like humor. When you have to explain it, it's bad.",
                    "First, solve the problem. Then, write the code."
                ];
                
                const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
                this.printHTML(`<span class="info">"${fortune}"</span>`);
            },
            help: "<span class=\"cmd\">fortune</span>: Display a random programming quote"
        }
    },
    
    hooks: {
        beforeCommand: (command) => {
            console.log(`About to execute: ${command}`);
        },
        afterCommand: (command) => {
            console.log(`Finished executing: ${command}`);
        }
    },
    
    destroy(terminal) {
        console.log('Example plugin destroyed');
    }
};

// Export all components
export {
    // Core classes
    TerminalEmulator,
    VirtualFileSystem,
    CommandManager,
    Command,
    Parser,
    ParserCache,
    CommandValidator,
    TreeStructure,
    TreeNode,
    
    // Utility classes
    utils,
    
    // Data
    DEFAULT_FS,
    DEFAULT_ENV,
    DEFAULT_ALIASES,
    SAMPLE_USERS,
    FILE_TYPES
};

// Default export for convenience
export default TerminalFactory;

/**
 * Quick start function for immediate use
 * @param {string|Element} element - DOM element or CSS selector
 * @param {Object} options - Configuration options
 * @returns {TerminalEmulator} Terminal instance
 * 
 * @example
 * import { quickStart } from './terminal-emulator/index.js';
 * 
 * const terminal = quickStart('#terminal', {
 *   theme: 'dracula',
 *   welcome: 'Welcome to my custom terminal!'
 * });
 */
export function quickStart(element, options = {}) {
    return TerminalFactory.create(element, options);
}

/**
 * Initialize multiple terminals with shared filesystem
 * @param {Array<{element: string|Element, options?: Object}>} configs - Terminal configurations
 * @param {Object} sharedFilesystem - Shared filesystem data
 * @returns {Array<TerminalEmulator>} Terminal instances
 */
export function createSharedTerminals(configs, sharedFilesystem = DEFAULT_FS) {
    const vfs = new VirtualFileSystem();
    vfs.initStructure(sharedFilesystem, null);
    
    return configs.map(config => {
        const terminal = new TerminalEmulator(config.element, vfs, config.options);
        if (config.options?.showWelcome !== false) {
            terminal.printHTML(terminal.opts.welcome);
            terminal.newLine();
        }
        return terminal;
    });
}