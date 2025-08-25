/**
 * @fileoverview Built-in terminal commands
 * @module commands
 */

import utils from './utils.js';

/**
 * Base command class for consistent command structure
 */
export class Command {
    constructor(name, options = {}) {
        this.name = name;
        this.type = options.type || 'exec';
        this.mime = options.mime || 'application/x-sharedlib';
        this.help = options.help || `No help available for ${name}`;
        this.func = options.func || this.execute.bind(this);
        this.aliases = options.aliases || [];
        this.permissions = options.permissions || [];
    }

    /**
     * Execute the command - should be overridden by subclasses
     * @param {Object} terminal - Terminal instance
     * @param {Object} argv - Parsed arguments
     */
    async execute(terminal, argv) {
        terminal.printHTML(`Command ${this.name} not implemented`);
    }

    /**
     * Check if user has permission to execute this command
     * @param {Object} user - User object
     * @returns {boolean} True if user has permission
     */
    hasPermission(user) {
        if (this.permissions.length === 0) return true;
        return this.permissions.some(perm => user.permissions?.includes(perm));
    }
}

/**
 * Tree command
 */
export class TreeCommand extends Command {
    constructor() {
        super('tree', {
            help: "<span class=\"cmd\">tree</span>: [<span class=\"parameter\">path</span>] [<span class=\"parameter\">options</span>]\n\tGraphically displays a directory structure.\n\n\tWhen you use the <span class=\"cmd\">tree</span> command each directory name is displayed along\n\twith the names of any subdirectories within it. The structure displayed\n\tby <span class=\"cmd\">tree</span> depends upon which parameters you specify.\n\t\n\tIf you don't specify a path, <span class=\"cmd\">tree</span> displays the tree structure of the\n\tcurrent working directory.\n\n\tOptions:\n\t&emsp;-f\tDisplay the names of the files in each folder.\n\n",
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        try {
            const path = argv._[0];
            const startNode = path ? terminal.vfs._resolve_path(path) : terminal.vfs.cwd;

            if (startNode.type !== 'dir') {
                terminal.printHTML(`tree: ${path || startNode.key}: Not a directory`);
                return;
            }

            terminal.printHTML(path || '.');

            const displayFiles = !!argv.f;

            const buildTree = (node, prefix) => {
                if (!node.children || node.children.length === 0) {
                    return;
                }

                let children = [...node.children];
                if (!displayFiles) {
                    children = children.filter(child => child.type === 'dir');
                }
                children.sort((a, b) => a.key.localeCompare(b.key));

                children.forEach((child, index) => {
                    const isLast = index === children.length - 1;
                    const connector = isLast ? '┗━━&nbsp;' : '┣━━&nbsp;';
                    const newPrefix = prefix + (isLast ? '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' : '┃&nbsp;&nbsp;&nbsp;&nbsp;');

                    let name = child.key;
                    if (child.type === 'dir') {
                        name = `<span class="dir">${name}</span>`;
                    }

                    terminal.printHTML(`${prefix}${connector}${name}`);

                    if (child.type === 'dir') {
                        buildTree(child, newPrefix);
                    }
                });
            };

            buildTree(startNode, '');
        } catch (error) {
            terminal.printHTML(`tree: ${error.message}`);
        }
    }
}


/**
 * Clear screen command
 */
export class ClearCommand extends Command {
    constructor() {
        super('clear', {
            aliases: ['cls'],
            help: "<span class=\"cmd\">clear</span>: [<span class=\"parameter\">options</span>]\n\tClear the terminal.\n\n\tClears the current terminal window. If <span class=\"parameter\">-h</span> is specified\n\tthen also clears the command history.\n\n\tOptions:\n\t&emsp;-h\tclear command history\n\n"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }
        if (argv.clear || argv.c) {
            terminal.printHTML(this.help);
            return;
        }
        terminal.clear();
    }
}

/**
 * Print working directory command
 */
export class PwdCommand extends Command {
    constructor() {
        super('pwd', {
            help: "<span class=\"cmd\">pwd</span>: Print working directory\n\nPrint the full pathname of the current working directory.\n\nOptions:\n\t-h, --help\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }
        terminal.print(terminal.vfs._absolute_path(terminal.vfs.cwd));
    }
}

/**
 * List directory contents command
 */
export class LsCommand extends Command {
    constructor() {
        super('ls', {
            aliases: ['dir'],
            help: "<span class=\"cmd\">ls</span>: List directory contents\n\nList information about files and directories.\n\nOptions:\n\t-l, --long\t\tUse long listing format\n\t-a, --all\t\tShow hidden files (starting with .)\n\t-d, --directory\t\tList directories themselves, not their contents\n\t-f, --files-only\tShow only files\n\t-h, --help\t\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        try {
            let targetNode = argv._.length > 0 
                ? terminal.vfs._resolve_path(argv._[0]) 
                : terminal.vfs.cwd;

            if (argv.d && targetNode.type === "dir") {
                terminal.write(targetNode.key);
                terminal.newLine();
                return;
            }

            if (targetNode.type !== "dir") {
                terminal.printHTML(`ls: ${argv._[0] || 'target'}: Not a directory`);
                return;
            }

            let children = targetNode.children;

            // Apply filters
            if (!argv.a && !argv.all) {
                children = children.filter(child => !child.key.startsWith('.'));
            }

            if (argv.f || argv['files-only']) {
                children = children.filter(child => child.type === 'file');
            }

            // Sort children alphabetically
            children = [...children].sort((a, b) => a.key.localeCompare(b.key));

            if (argv.l || argv.long) {
                terminal.printHTML(`total ${children.length}`);
                
                children.forEach(child => {
                    const isDir = child.type === 'dir';
                    const size = isDir ? '0' : (child.size || '0').toString().padStart(8);
                    const permissions = child.permissions || (isDir ? 'rwxr-xr-x' : 'rw-r--r--');
                    const modified = child.modified || 'unknown';
                    const user = child.user || 'root';
                    const group = child.group || 'root';
                    
                    const colorizedName = isDir 
                        ? `<span class="dir">${child.key}</span>`
                        : child.key;
                    
                    const fileType = isDir ? 'd' : (child.type === 'exec' ? '*' : '-');
                    terminal.printHTML(`${fileType}${permissions} ${user} ${group} ${size} ${modified} ${colorizedName}`);
                });
            } else {
                // Simple listing in columns
                const terminalWidth = 80;
                const maxNameLength = Math.max(...children.map(c => c.key.length)) + 2;
                const columns = Math.floor(terminalWidth / maxNameLength) || 1;
                
                for (let i = 0; i < children.length; i += columns) {
                    const row = children.slice(i, i + columns);
                    const rowHTML = row.map(child => {
                        const name = child.type === 'dir' 
                            ? `<span class="dir">${child.key}</span>`
                            : child.key;
                        return name.padEnd(maxNameLength);
                    }).join('');
                    
                    terminal.printHTML(rowHTML);
                }
            }
            
            if (children.length === 0) {
                terminal.newLine();
            }
            
        } catch (error) {
            terminal.printHTML(`ls: ${error.message}`);
        }
    }
}

/**
 * Reboot command
 */
export class RebootCommand extends Command {
    constructor() {
        super('reboot', {
            aliases: ['restart', 'reset'],
            help: "<span class=\"cmd\">reboot</span>: Reboot the terminal\n\nReboots the terminal, clearing all state.\n\nOptions:\n\t-h, --help\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }
        terminal
            .clear()
            .printHTML(terminal.opts.welcome)
            .newLine();
            return;
    }
}

/**
 * Whereis command
 */
export class WhereisCommand extends Command {
    constructor() {
        super('whereis', {
            help: "<span class=\"cmd\">whereis</span>: [<span class=\"parameter\">command</span>]\n\tLocate the binary, source, and manual page files for a command.\n\n\tSearches for the specified <span class=\"cmd\">command</span> in the directories listed in the\n\tPATH environment variable and returns the full path to the command if found.\n\n"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }
        terminal.vfs.whereis(argv._[0]);
    }
}

/**
 * Change directory command
 */
export class CdCommand extends Command {
    constructor() {
        super('cd', {
            help: "<span class=\"cmd\">cd</span>: Change directory\n\nChange the current working directory to DIR.\n\nSpecial directories:\n\t~\t\tHome directory\n\t-\t\tPrevious directory\n\t..\t\tParent directory\n\t.\t\tCurrent directory\n\nOptions:\n\t-h, --help\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        try {
            let targetPath = argv._.length > 0 ? argv._[0] : terminal.env.HOME;
            const currentPath = terminal.vfs._absolute_path(terminal.vfs.cwd);

            // Handle special cases
            switch (targetPath) {
                case '~':
                    targetPath = terminal.env.HOME;
                    break;
                case '-':
                    if (!terminal.env.OLDPWD) {
                        terminal.printHTML("-bash: cd: OLDPWD not set");
                        return;
                    }
                    targetPath = terminal.env.OLDPWD;
                    terminal.printHTML(targetPath);
                    break;
                case '.':
                    return;
                case '..':
                    if (terminal.vfs.cwd.parent) {
                        terminal.env.OLDPWD = currentPath;
                        terminal.vfs.cwd = terminal.vfs.cwd.parent;
                        terminal.env.PWD = terminal.vfs._absolute_path(terminal.vfs.cwd);
                        terminal.setPrompt();
                    }
                    return;
            }

            terminal.env.OLDPWD = currentPath;
            terminal.vfs.cd(targetPath);
            terminal.env.PWD = terminal.vfs._absolute_path(terminal.vfs.cwd);
            terminal.setPrompt();

        } catch (error) {
            terminal.printHTML(`-bash: cd: ${error.message}`);
        }
    }
}

/**
 * Echo command
 */
export class EchoCommand extends Command {
    constructor() {
        super('echo', {
            help: "<span class=\"cmd\">echo</span>: Display line of text\n\nDisplay the ARGs, separated by a single space character and\nfollowed by a newline, on the standard output.\n\nOptions:\n\t-n\t\tDo not output trailing newline\n\t-h, --help\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        if (argv._.length === 0) {
            if (!argv.n) terminal.newLine();
            return;
        }

        let output = '';
        
        for (let i = 0; i < argv._.length; i++) {
            const arg = argv._[i];
            
            if (arg.startsWith("$")) {
                const envVar = arg.slice(1);
                output += terminal.env[envVar] || "";
            } else {
                output += arg;
            }
            
            if (i < argv._.length - 1) {
                output += " ";
            }
        }

        terminal.print(output);
        if (!argv.n) terminal.newLine();
    }
}

/**
 * Cat command for reading/writing files
 */
export class CatCommand extends Command {
    constructor() {
        super('cat', {
            help: "<span class=\"cmd\">cat</span>: Display file contents\n\nConcatenate FILE(s) to standard output.\n\nWith no FILE, or when FILE is -, read standard input.\n\nOptions:\n\t-n, --number\t\tNumber all output lines\n\t-h, --help\t\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        if (argv._.length === 0) {
            terminal.printHTML("cat: missing file operand");
            return;
        }

        try {
            for (const fileName of argv._) {
                const content = terminal.vfs.cat('', fileName);
                
                if (argv.n || argv.number) {
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        const lineNumber = (index + 1).toString().padStart(6, ' ');
                        terminal.printHTML(`${lineNumber}  ${line}`);
                    });
                } else {
                    terminal.printHTML(content);
                }
            }
        } catch (error) {
            terminal.printHTML(`cat: ${error.message}`);
        }
    }
}

/**
 * Touch command for creating files
 */
export class TouchCommand extends Command {
    constructor() {
        super('touch', {
            help: "<span class=\"cmd\">touch</span>: Create empty file\n\nUpdate the access and modification times of each FILE to the current time.\nA FILE argument that does not exist is created empty.\n\nOptions:\n\t-h, --help\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        if (argv._.length === 0) {
            terminal.printHTML("touch: missing file operand");
            return;
        }

        try {
            for (const fileName of argv._) {
                // Check if file exists
                try {
                    const existingContent = terminal.vfs.cat('', fileName);
                    // File exists, update timestamp (simulate by re-writing same content)
                    terminal.vfs.cat('>', fileName, existingContent);
                } catch {
                    // File doesn't exist, create it
                    terminal.vfs.cat('>', fileName, '');
                }
            }
        } catch (error) {
            terminal.printHTML(`touch: ${error.message}`);
        }
    }
}

/**
 * Mkdir command for creating directories
 */
export class MkdirCommand extends Command {
    constructor() {
        super('mkdir', {
            help: "<span class=\"cmd\">mkdir</span>: Create directories\n\nCreate the DIRECTORY(ies), if they do not already exist.\n\nOptions:\n\t-p, --parents\tMake parent directories as needed\n\t-h, --help\t\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        if (argv._.length === 0) {
            terminal.printHTML("mkdir: missing operand");
            return;
        }

        try {
            for (const dirName of argv._) {
                terminal.vfs.mkdir(dirName);
            }
        } catch (error) {
            terminal.printHTML(`mkdir: ${error.message}`);
        }
    }
}

/**
 * Remove files command
 */
export class RmCommand extends Command {
    constructor() {
        super('rm', {
            help: "<span class=\"cmd\">rm</span>: Remove files\n\nRemove (unlink) the FILE(s).\n\nOptions:\n\t-i, --interactive\tPrompt before every removal\n\t-f, --force\t\tIgnore nonexistent files, never prompt\n\t-r, --recursive\tRemove directories and their contents recursively\n\t-h, --help\t\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        if (argv._.length === 0) {
            terminal.printHTML("rm: missing operand");
            return;
        }

        try {
            for (const fileName of argv._) {
                if (argv.i || argv.interactive) {
                    const confirm = await terminal.confirm(`Remove '${fileName}'?`);
                    if (!confirm) continue;
                }
                
                terminal.vfs.rm(fileName);
            }
        } catch (error) {
            if (!argv.f && !argv.force) {
                terminal.printHTML(`rm: ${error.message}`);
            }
        }
    }
}

/**
 * Who am I command
 */
export class WhoamiCommand extends Command {
    constructor() {
        super('whoami', {
            help: "<span class=\"cmd\">whoami</span>: Print effective user name\n\nPrint the user name associated with the current effective user ID.\n\nOptions:\n\t-h, --help\tShow this help message"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }
        terminal.print(terminal.env.USER || 'demo');
    }
}

/**
 * Set environment variables command
 */
export class SetCommand extends Command {
    constructor() {
        super('set', {
            help: "<span class=\"cmd\">set</span>: Set shell variables\n\nSet each NAME to VALUE in the environment.\n\nWith no options, display all shell variables.\n\nUsage: set [NAME=VALUE]\n\nOptions:\n\t-h, --help\tShow this help message\n\t-u, --unset=NAME\tRemove variable from environmrnt"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        if (argv._.length === 0) {
            // Display all environment variables
            const sortedKeys = Object.keys(terminal.env).sort();
            for (const key of sortedKeys) {
                terminal.printHTML(`${key}=${terminal.env[key]}`);
            }
            return;
        }

        if (argv._.length < 2) {
            terminal.printHTML("set: Usage: set [key] [value]");
            return;
        }

        const [key, ...valueParts] = argv._;
        const value = valueParts.join(' ');
        terminal.env[key.toUpperCase()] = value;
        terminal.printHTML(`<span class="info">${key.toUpperCase()}</span> set to <span class="success">${value}</span>`);
    }
}

/**
 * Base64 encode/decode command
 */
export class Base64Command extends Command {
    constructor() {
        super('base64', {
            aliases: ['b64'],
            help: "<span class=\"cmd\">base64</span>: [<span class=\"parameter\">string</span>] [<span class=\"parameter\">options</span>]\n\tBase64 encode or decode standard input, to standard output.\n\n\tEncode or decode a string using the algorithum as described for\n\tthe Base64 alphabet specified in <a href=\"https://datatracker.ietf.org/doc/html/rfc4648\" target=\"_blank\">RFC 4648, section 4</a>. If no option\n\tis specified then <span class=\"cmd\">base64</span> will default to encoding.\n\n\tOptions:\n\t&emsp;-e, --encode\tencode the input string\n\t&emsp;-d, --decode\tdecode the input string\n\n"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        if (argv._.length === 0) {
            terminal.printHTML("base64: Usage: base64 [string] [options]\n");
            return;
        }

        const str = argv._.join(" ");

        if (str.charAt(0) === '"' || str.charAt(0) === "'") {
            str = str.slice(0, 1);
        }
        if (str.charAt(str.length - 1) === '"' || str.charAt(str.length - 1) === "'") {
            str = str.slice(-1);
        }
        
        try {
            if (argv.d || argv.decode) {
                terminal.printHTML(utils.wordBreak(utils.b64.de(str)));
            } else {
                terminal.printHTML(utils.wordBreak(utils.b64.en(str)));
            }
        } catch (error) {
            terminal.printHTML(`base64: ${error.message}`);
        }
    }
}

/**
 * Theme management command
 */
export class ThemeCommand extends Command {
    constructor() {
        super('theme', {
            help: "<span class=\"cmd\">theme</span>: [<span class=\"parameter\">theme</span>]\nSet the shell theme.\n\nChange the the theme of the terminal.\n\nWith no argument or switch, <span class=\"cmd\">theme</span> will return the current theme\n\n\tOptions:\n\t&emsp;-t|--list\tlist available themes\n\n"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        const themes = {
            "dark": "dark",
            "light": "light",
            "laserwave": "dark",
            "nord": "dark",
            "greyscale": "dark",
            "dracula": "dark",
            "nightowl": "dark",
            "onedark": "dark"
        };

        if (argv.l || argv.list) {
            terminal.printHTML("Available themes:");
            Object.entries(themes).forEach(([name, type]) => {
                terminal.printHTML(`  ${name.padEnd(15)} (${type})`);
            });
            return;
        }

        if (argv._.length === 0) {
            terminal.print(terminal.theme || terminal.opts.theme);
            return;
        }

        const newTheme = argv._[0];
        if (themes[newTheme]) {
            terminal.setTheme(newTheme);
            terminal.printHTML(`Theme set to: ${newTheme}`);
        } else {
            terminal.printHTML(`Unknown theme: ${newTheme}`);
            terminal.printHTML("Use 'theme -l' to see available themes");
        }
    }
}

/**
 * Help command
 */
export class HelpCommand extends Command {
    constructor() {
        super('help', {
            help: "<span class=\"cmd\">help</span>: [<span class=\"parameter\">command</span>]\n\tDisplay a command's help information.\n\n\tShows the help information of the supplied <span class=\"cmd\">command</span>. If no\n\t<span class=\"cmd\">command</span> is specified then shows the help message.\n\n"
        });
    }

    async execute(terminal, argv) {
        if (argv.help || argv.h) {
            terminal.printHTML(this.help);
            return;
        }

        let append = "";
        if (argv._.length === 0) {
            append += "<span class=\"host\">TERM[E]DITOR BASH</span>, <span class=\"info\">version 1.0-release</span> (" + navigator.platform.replace(' ', '-').replace('_', '-').toLowerCase() + "-gnu)\n";
            append += "These shell commands are defined internally. Type <span class=\"cmd\">help</span> to see this list.\n";
            append += "Type <span class=\"cmd\">help</span> <span class=\"parameter\">command</span> for help with a particular command.\n\n";
            append += "Available commands:\n";
            const columnWidth = 30; // Fixed width for each column

            for (const cmdName of Object.keys(terminal.commands)) {
                const padding = columnWidth - cmdName.length;
                const columnText = `<span class="cmd" style="padding-left:3em">${cmdName}</span>${'&nbsp;'.repeat(padding)}`;
                append += columnText;

                if (Object.keys(terminal.commands).indexOf(cmdName) % 2 !== 0) {
                    append += "\n";
                }
            }
            append += "\n";
        } else {
            append += terminal.commands[argv._[0]].help;
        }
        terminal.printHTML(append);
        return;
    }
}

/**
 * Command manager for registering and executing commands
 */
export class CommandManager {
    constructor() {
        this.commands = new Map();
        this.aliases = new Map();
    }

    /**
     * Register a command
     * @param {Command} command - Command instance to register
     */
    register(command) {
        if (!(command instanceof Command)) {
            throw new Error('Command must be an instance of Command class');
        }

        this.commands.set(command.name, command);
        
        // Register aliases
        if (command.aliases) {
            for (const alias of command.aliases) {
                this.aliases.set(alias, command.name);
            }
        }
    }

    /**
     * Get command by name or alias
     * @param {string} name - Command name or alias
     * @returns {Command|null} Command instance or null
     */
    get(name) {
        // Check direct command name
        if (this.commands.has(name)) {
            return this.commands.get(name);
        }
        
        // Check aliases
        if (this.aliases.has(name)) {
            const commandName = this.aliases.get(name);
            return this.commands.get(commandName);
        }
        
        return null;
    }

    /**
     * Check if command exists
     * @param {string} name - Command name or alias
     * @returns {boolean} True if command exists
     */
    has(name) {
        return this.commands.has(name) || this.aliases.has(name);
    }

    /**
     * Get all command names
     * @returns {Array<string>} Array of command names
     */
    list() {
        return Array.from(this.commands.keys());
    }

    /**
     * Execute a command
     * @param {string} name - Command name
     * @param {Object} terminal - Terminal instance
     * @param {Object} argv - Parsed arguments
     * @returns {Promise} Command execution result
     */
    async execute(name, terminal, argv) {
        const command = this.get(name);
        
        if (!command) {
            throw new Error(`Command not found: ${name}`);
        }

        // Check permissions
        if (!command.hasPermission(terminal.user || {})) {
            throw new Error(`Permission denied: ${name}`);
        }

        return await command.execute(terminal, argv);
    }

    /**
     * Load commands from a manifest file
     * @todo add this functionality to the terminal once
     *       I figure out how to do it properly
     * @param {string} manifest 
     * @returns {CommandManager} Self for chaining
     */
    async load(manifest) {
        try {
            // Fetch the manifest file
            const response = await fetch(manifest);
            if (!response.ok) {
                throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
            }
            
            const user = await response.json();
            
            if (!Array.isArray(user.commands)) {
                throw new Error('Manifest must contain a "commands" array');
            }
            
            // Get base URL from manifest URL
            const baseUrl = manifest.substring(0, manifest.lastIndexOf('/') + 1);
            
            // Convert command file names to full URLs
            const commandFiles = user.commands.map(file => baseUrl + file);
            
            let loadedCount = 0;
            let loadedCmds = [];
            
            for (const file of commandFiles) {
                try {
                    // Dynamic import the module
                    const module = await import(file);
                    
                    // Look for exported classes in the module
                    for (const [exportName, exportValue] of Object.entries(module)) {
                        // Check if the export is a class (constructor function)
                        if (typeof exportValue === 'function' && 
                            exportValue.prototype && 
                            exportValue.prototype.constructor === exportValue) {
                            
                            try {
                                // Try to instantiate and register the command
                                loadedCmds.push(new exportValue());
                                //const commandInstance = new exportValue();
                                console.log(loadedCmds);
                                //this.register(commandInstance);
                                console.log(`Loaded command: ${exportName} from ${file}`);
                                loadedCount++;
                            } catch (registerError) {
                                // If it's not a valid Command class, skip it
                                console.warn(`Skipped ${exportName} from ${file}: ${registerError.message}`);
                            }
                        }
                    }                    
                    for (const command of loadedCmds) {
                        this.register(command);
                    }

                    return this;
                } catch (fileError) {
                    console.error(`✗ Failed to load ${file}: ${fileError.message}`);
                }
            }
            
            console.log(`Loaded ${loadedCount} commands from ${commandFiles.length} files`);
            return loadedCount;
            
        } catch (error) {
            console.error(`Failed to load commands from manifest '${manifest}': ${error.message}`);
            throw error;
        }
    }

    /**
     * Register all built-in commands
     * @returns {CommandManager} Self for chaining
     */
    registerBuiltins() {
        const builtins = [
            new TreeCommand(),
            new ClearCommand(),
            new WhereisCommand(),
            new PwdCommand(),
            new LsCommand(),
            new CdCommand(),
            new EchoCommand(),
            new CatCommand(),
            new TouchCommand(),
            new MkdirCommand(),
            new RmCommand(),
            new WhoamiCommand(),
            new SetCommand(),
            new Base64Command(),
            new RebootCommand(),
            new ThemeCommand(),
            new HelpCommand()
        ].sort((a, b) => a.name.localeCompare(b.name));

        for (const command of builtins) {
            this.register(command);
        }

        return this;
    }
}

export default CommandManager;