/**
 * @fileoverview Usage examples for the terminal emulator
 * @module examples
 */

import { 
    quickStart, 
    TerminalFactory, 
    TerminalEmulator,
    VirtualFileSystem,
    CommandManager,
    Command,
    PerformanceMonitor,
    PluginManager,
    DebugUtils,
    ExamplePlugin
} from './index.js';

/**
 * Basic usage example
 */
export function basicExample() {
    // Simple initialization
    const terminal = quickStart('#terminal', {
        theme: 'onedark',
        welcome: 'Welcome to the basic terminal example!',
        textSize: '16px'
    });
    
    console.log('Basic terminal created:', terminal);
    return terminal;
}

/**
 * Advanced configuration example
 */
export function advancedExample() {
    const options = {
        theme: 'dracula',
        maxHistorySize: 500,
        textSize: '14px',
        fontFamily: '"Fira Code", monospace',
        forceFocus: true,
        welcome: `
            <div style="text-align: center;">
                <h2 style="color: #50fa7b;">Advanced Terminal</h2>
                <p>Type <span class="cmd">help</span> to see available commands</p>
                <p>Type <span class="cmd">theme -l</span> to see available themes</p>
            </div>
        `
    };
    
    const terminal = TerminalFactory.create('#advanced-terminal', options);
    
    // Add custom command
    terminal.registerCommand('datetime', {
        func: function(argv) {
            if (argv.help || argv.h) {
                this.printHTML('<span class="cmd">datetime</span>: Display current date and time');
                return;
            }
            
            const now = new Date();
            const formatted = now.toLocaleString();
            this.printHTML(`Current date and time: <span class="info">${formatted}</span>`);
        },
        help: 'Display current date and time'
    });
    
    return terminal;
}

/**
 * Multiple terminals with shared filesystem
 */
export function multipleTerminalsExample() {
    const configs = [
        {
            element: '#terminal1',
            options: {
                theme: 'dark',
                welcome: 'Terminal 1 - Shared filesystem demo'
            }
        },
        {
            element: '#terminal2', 
            options: {
                theme: 'light',
                welcome: 'Terminal 2 - Same filesystem as Terminal 1'
            }
        }
    ];
    
    const terminals = TerminalFactory.createMultiple(configs);
    
    // Demonstrate shared filesystem
    setTimeout(() => {
        terminals[0].executeCommand('touch shared-file.txt');
        terminals[0].executeCommand('echo "Hello from Terminal 1" > shared-file.txt');
        
        setTimeout(() => {
            terminals[1].executeCommand('cat shared-file.txt');
        }, 1000);
    }, 2000);
    
    return terminals;
}

/**
 * Custom command example
 */
export function customCommandExample() {
    const terminal = quickStart('#terminal', {
        welcome: 'Terminal with custom commands'
    });
    
    // Weather command (mock)
    terminal.registerCommand('weather', {
        func: async function(argv) {
            if (argv.help || argv.h) {
                this.printHTML('<span class="cmd">weather</span>: Get weather information\nUsage: weather [city]');
                return;
            }
            
            const city = argv._.length > 0 ? argv._[0] : 'Unknown';
            
            this.printHTML('Fetching weather data...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock weather data
            const weather = {
                temperature: Math.floor(Math.random() * 30) + 10,
                condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
                humidity: Math.floor(Math.random() * 40) + 40
            };
            
            this.printHTML(`
                <div>
                    <h3>Weather in ${city}</h3>
                    <p>Temperature: <span class="info">${weather.temperature}°C</span></p>
                    <p>Condition: <span class="success">${weather.condition}</span></p>
                    <p>Humidity: <span class="info">${weather.humidity}%</span></p>
                </div>
            `);
        },
        help: 'Get weather information for a city'
    });
    
    // System info command
    terminal.registerCommand('sysinfo', {
        func: function(argv) {
            if (argv.help || argv.h) {
                this.printHTML('<span class="cmd">sysinfo</span>: Display system information');
                return;
            }
            
            const info = {
                'Browser': navigator.userAgent.split(' ').pop(),
                'Platform': navigator.platform,
                'Language': navigator.language,
                'Screen Resolution': `${screen.width}x${screen.height}`,
                'Color Depth': `${screen.colorDepth} bits`,
                'Cookies Enabled': navigator.cookieEnabled ? 'Yes' : 'No',
                'Online': navigator.onLine ? 'Yes' : 'No'
            };
            
            this.printHTML('<h3>System Information</h3>');
            for (const [key, value] of Object.entries(info)) {
                this.printHTML(`<span class="cmd">${key.padEnd(20)}</span>: ${value}`);
            }
        },
        help: 'Display system information'
    });
    
    return terminal;
}

/**
 * Plugin system example
 */
export function pluginExample() {
    const terminal = quickStart('#terminal', {
        welcome: 'Terminal with plugin system'
    });
    
    // Initialize plugin manager
    const pluginManager = new PluginManager(terminal);
    
    // Register example plugin
    pluginManager.register('example', ExamplePlugin);
    
    // Create a custom plugin
    const mathPlugin = {
        name: 'math',
        version: '1.0.0',
        
        init(terminal) {
            console.log('Math plugin initialized');
        },
        
        commands: {
            calc: {
                func: function(argv) {
                    if (argv.help || argv.h) {
                        this.printHTML('<span class="cmd">calc</span>: Simple calculator\nUsage: calc <expression>');
                        return;
                    }
                    
                    if (argv._.length === 0) {
                        this.printHTML('calc: missing expression');
                        return;
                    }
                    
                    const expression = argv._.join(' ');
                    try {
                        // Simple evaluation (in real use, use a proper math parser)
                        const result = Function(`"use strict"; return (${expression})`)();
                        this.printHTML(`<span class="info">${expression}</span> = <span class="success">${result}</span>`);
                    } catch (error) {
                        this.printHTML(`<span class="error">Invalid expression: ${expression}</span>`);
                    }
                },
                help: 'Simple calculator - evaluates mathematical expressions'
            },
            
            random: {
                func: function(argv) {
                    if (argv.help || argv.h) {
                        this.printHTML('<span class="cmd">random</span>: Generate random number\nUsage: random [min] [max]');
                        return;
                    }
                    
                    let min = 0, max = 100;
                    
                    if (argv._.length >= 1) min = parseInt(argv._[0]) || 0;
                    if (argv._.length >= 2) max = parseInt(argv._[1]) || 100;
                    
                    const result = Math.floor(Math.random() * (max - min + 1)) + min;
                    this.printHTML(`Random number between ${min} and ${max}: <span class="success">${result}</span>`);
                },
                help: 'Generate a random number within specified range'
            }
        }
    };
    
    // Register math plugin
    pluginManager.register('math', mathPlugin);
    
    // Store plugin manager on terminal for access
    terminal.pluginManager = pluginManager;
    
    return terminal;
}

/**
 * Performance monitoring example
 */
export function performanceExample() {
    const terminal = quickStart('#terminal', {
        welcome: 'Terminal with performance monitoring'
    });
    
    const monitor = new PerformanceMonitor();
    monitor.enable();
    
    // Override command execution to add monitoring
    const originalExecuteCommand = terminal.executeCommand.bind(terminal);
    terminal.executeCommand = async function(command) {
        const timerId = monitor.start('command_execution');
        try {
            await originalExecuteCommand(command);
        } finally {
            monitor.end('command_execution', timerId);
        }
    };
    
    // Add performance command
    terminal.registerCommand('perf', {
        func: function(argv) {
            if (argv.help || argv.h) {
                this.printHTML('<span class="cmd">perf</span>: Show performance metrics');
                return;
            }
            
            const metrics = monitor.getMetrics();
            
            if (Object.keys(metrics).length === 0) {
                this.printHTML('No performance data available yet.');
                return;
            }
            
            this.printHTML('<h3>Performance Metrics</h3>');
            for (const [operation, stats] of Object.entries(metrics)) {
                this.printHTML(`
                    <div>
                        <strong>${operation}:</strong>
                        <ul>
                            <li>Count: ${stats.count}</li>
                            <li>Average: ${stats.averageTime}ms</li>
                            <li>Min: ${stats.minTime}ms</li>
                            <li>Max: ${stats.maxTime}ms</li>
                            <li>Total: ${stats.totalTime}ms</li>
                        </ul>
                    </div>
                `);
            }
        },
        help: 'Show performance metrics for terminal operations'
    });
    
    terminal.performanceMonitor = monitor;
    return terminal;
}

/**
 * Debug utilities example
 */
export function debugExample() {
    const terminal = quickStart('#terminal', {
        welcome: 'Terminal with debug utilities'
    });
    
    // Add debug commands
    terminal.registerCommand('debug-state', {
        func: function(argv) {
            if (argv.help || argv.h) {
                this.printHTML('<span class="cmd">debug-state</span>: Show terminal state');
                return;
            }
            DebugUtils.logState(this);
            this.printHTML('Terminal state logged to console');
        },
        help: 'Log terminal state to browser console'
    });
    
    terminal.registerCommand('debug-fs', {
        func: function(argv) {
            if (argv.help || argv.h) {
                this.printHTML('<span class="cmd">debug-fs</span>: Validate filesystem integrity');
                return;
            }
            
            const validation = DebugUtils.validateFilesystem(this.vfs);
            
            if (validation.isValid) {
                this.printHTML('<span class="success">Filesystem integrity check passed</span>');
            } else {
                this.printHTML('<span class="error">Filesystem integrity issues found:</span>');
                validation.issues.forEach(issue => {
                    this.printHTML(`  - ${issue}`);
                });
            }
        },
        help: 'Validate filesystem integrity'
    });
    
    terminal.registerCommand('debug-report', {
        func: function(argv) {
            if (argv.help || argv.h) {
                this.printHTML('<span class="cmd">debug-report</span>: Generate filesystem report');
                return;
            }
            
            const report = DebugUtils.generateFilesystemReport(this.vfs);
            console.log('Filesystem Report:', report);
            
            this.printHTML(`
                <h3>Filesystem Report</h3>
                <p>Total Nodes: <span class="info">${report.nodeCount}</span></p>
                <p>Files: <span class="info">${report.fileCount}</span></p>
                <p>Directories: <span class="info">${report.dirCount}</span></p>
                <p>Total Size: <span class="info">${report.totalSize} bytes</span></p>
                <p>Max Depth: <span class="info">${report.maxDepth}</span></p>
                <p>Cache Size: <span class="info">${report.cacheSize}</span></p>
                <p><em>Full report logged to console</em></p>
            `);
        },
        help: 'Generate detailed filesystem report'
    });
    
    return terminal;
}

/**
 * Interactive tutorial example
 */
export function tutorialExample() {
    const terminal = quickStart('#terminal', {
        welcome: `
            <div style="text-align: center; color: #50fa7b;">
                <h2>🎓 Interactive Terminal Tutorial</h2>
                <p>Learn how to use the terminal step by step!</p>
                <p>Type <span class="cmd">tutorial</span> to begin</p>
            </div>
        `
    });
    
    let tutorialStep = 0;
    const tutorialSteps = [
        {
            instruction: "Let's start with the basics. Type <span class=\"cmd\">pwd</span> to see your current directory:",
            command: 'pwd',
            explanation: "Great! 'pwd' stands for 'print working directory' and shows where you are in the filesystem."
        },
        {
            instruction: "Now let's see what's in this directory. Type <span class=\"cmd\">ls</span> to list the contents:",
            command: 'ls',
            explanation: "Perfect! 'ls' lists all files and directories in the current location."
        },
        {
            instruction: "Let's look at the detailed view. Type <span class=\"cmd\">ls -l</span> for more information:",
            command: 'ls -l',
            explanation: "Excellent! The '-l' flag shows detailed information including permissions, size, and modification date."
        },
        {
            instruction: "Time to explore! Type <span class=\"cmd\">cd Documents</span> to enter the Documents folder:",
            command: 'cd Documents',
            explanation: "'cd' means 'change directory'. You've successfully navigated to the Documents folder!"
        },
        {
            instruction: "Let's create a new file. Type <span class=\"cmd\">touch my-file.txt</span>:",
            command: 'touch my-file.txt',
            explanation: "Great job! 'touch' creates new empty files. Your file has been created!"
        },
        {
            instruction: "Let's add some content. Type <span class=\"cmd\">echo \"Hello World\" > my-file.txt</span>:",
            command: 'echo "Hello World" > my-file.txt',
            explanation: "Perfect! You've written 'Hello World' to your file using echo and redirection (>)."
        },
        {
            instruction: "Now let's read the file. Type <span class=\"cmd\">cat my-file.txt</span>:",
            command: 'cat my-file.txt',
            explanation: "Excellent! 'cat' displays the contents of files. You can see your 'Hello World' message!"
        },
        {
            instruction: "Finally, let's go back. Type <span class=\"cmd\">cd ..</span> to go to the parent directory:",
            command: 'cd ..',
            explanation: "Perfect! '..' always refers to the parent directory. You're back where you started!"
        }
    ];
    
    terminal.registerCommand('tutorial', {
        func: function(argv) {
            if (argv.help || argv.h) {
                this.printHTML('<span class="cmd">tutorial</span>: Interactive terminal tutorial');
                return;
            }
            
            tutorialStep = 0;
            this.printHTML(`
                <div style="border: 1px solid #50fa7b; padding: 10px; margin: 10px 0;">
                    <h3>📚 Step ${tutorialStep + 1}/${tutorialSteps.length}</h3>
                    <p>${tutorialSteps[tutorialStep].instruction}</p>
                </div>
            `);
        },
        help: 'Start the interactive terminal tutorial'
    });
    
    // Override command execution to check tutorial progress
    const originalExecuteCommand = terminal.executeCommand.bind(terminal);
    terminal.executeCommand = async function(command) {
        await originalExecuteCommand(command);
        
        if (tutorialStep < tutorialSteps.length) {
            const currentStep = tutorialSteps[tutorialStep];
            
            if (command.trim().toLowerCase() === currentStep.command.toLowerCase()) {
                this.printHTML(`
                    <div style="border: 1px solid #50fa7b; padding: 10px; margin: 10px 0; background: rgba(80, 250, 123, 0.1);">
                        <p>✅ ${currentStep.explanation}</p>
                    </div>
                `);
                
                tutorialStep++;
                
                if (tutorialStep < tutorialSteps.length) {
                    this.printHTML(`
                        <div style="border: 1px solid #50fa7b; padding: 10px; margin: 10px 0;">
                            <h3>📚 Step ${tutorialStep + 1}/${tutorialSteps.length}</h3>
                            <p>${tutorialSteps[tutorialStep].instruction}</p>
                        </div>
                    `);
                } else {
                    this.printHTML(`
                        <div style="border: 1px solid #50fa7b; padding: 10px; margin: 10px 0; background: rgba(80, 250, 123, 0.2);">
                            <h3>🎉 Congratulations!</h3>
                            <p>You've completed the terminal tutorial! You now know the basics of:</p>
                            <ul>
                                <li>Navigation (pwd, cd, ls)</li>
                                <li>File operations (touch, cat, echo)</li>
                                <li>Command flags and redirection</li>
                            </ul>
                            <p>Type <span class="cmd">help</span> to see all available commands and continue exploring!</p>
                        </div>
                    `);
                }
            }
        }
    };
    
    return terminal;
}

/**
 * Real-world integration example - Chat application
 */
export function chatApplicationExample() {
    const terminal = quickStart('#terminal', {
        welcome: `
            <div style="text-align: center;">
                <h2>💬 Chat Terminal</h2>
                <p>A terminal-based chat application demo</p>
                <p>Type <span class="cmd">chat join</span> to start chatting</p>
            </div>
        `,
        theme: 'dracula'
    });
    
    let chatUsers = ['alice', 'bob', 'charlie'];
    let chatHistory = [];
    let currentUser = null;
    let chatActive = false;
    
    terminal.registerCommand('chat', {
        func: async function(argv) {
            if (argv.help || argv.h) {
                this.printHTML(`
                    <span class="cmd">chat</span>: Chat application commands
                    <br>Usage:
                    <br>  chat join [username] - Join the chat
                    <br>  chat send <message> - Send a message
                    <br>  chat users - List online users
                    <br>  chat history - Show chat history
                    <br>  chat leave - Leave the chat
                `);
                return;
            }
            
            const action = argv._[0];
            
            switch (action) {
                case 'join':
                    currentUser = argv._[1] || await this.prompt('Enter username:');
                    chatActive = true;
                    chatUsers.push(currentUser);
                    this.printHTML(`<span class="success">✓ Joined chat as ${currentUser}</span>`);
                    this.printHTML(`<span class="info">💡 Use 'chat send <message>' to send messages</span>`);
                    break;
                    
                case 'send':
                    if (!chatActive) {
                        this.printHTML('<span class="error">You must join the chat first</span>');
                        return;
                    }
                    
                    const message = argv._.slice(1).join(' ');
                    if (!message) {
                        this.printHTML('<span class="error">Message cannot be empty</span>');
                        return;
                    }
                    
                    const timestamp = new Date().toLocaleTimeString();
                    const chatMessage = { user: currentUser, message, timestamp };
                    chatHistory.push(chatMessage);
                    
                    this.printHTML(`<span class="user">[${timestamp}] ${currentUser}:</span> ${message}`);
                    
                    // Simulate other users responding
                    setTimeout(() => {
                        const responses = [
                            'That\'s interesting!',
                            'I agree!',
                            'Tell me more about that',
                            'Nice point',
                            'Haha, good one!'
                        ];
                        
                        const randomUser = chatUsers[Math.floor(Math.random() * chatUsers.length)];
                        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                        const responseTime = new Date().toLocaleTimeString();
                        
                        if (randomUser !== currentUser) {
                            const response = { user: randomUser, message: randomResponse, timestamp: responseTime };
                            chatHistory.push(response);
                            this.printHTML(`<span class="info">[${responseTime}] ${randomUser}:</span> ${randomResponse}`);
                        }
                    }, Math.random() * 3000 + 1000);
                    break;
                    
                case 'users':
                    this.printHTML('<span class="cmd">Online users:</span>');
                    chatUsers.forEach(user => {
                        const status = user === currentUser ? ' (you)' : '';
                        this.printHTML(`  • ${user}${status}`);
                    });
                    break;
                    
                case 'history':
                    if (chatHistory.length === 0) {
                        this.printHTML('<span class="info">No chat history</span>');
                        return;
                    }
                    
                    this.printHTML('<span class="cmd">Chat History:</span>');
                    chatHistory.forEach(msg => {
                        const userClass = msg.user === currentUser ? 'user' : 'info';
                        this.printHTML(`<span class="${userClass}">[${msg.timestamp}] ${msg.user}:</span> ${msg.message}`);
                    });
                    break;
                    
                case 'leave':
                    chatActive = false;
                    chatUsers = chatUsers.filter(user => user !== currentUser);
                    this.printHTML(`<span class="info">Left chat room</span>`);
                    currentUser = null;
                    break;
                    
                default:
                    this.printHTML('<span class="error">Unknown chat command. Use "chat help" for usage.</span>');
            }
        },
        help: 'Terminal-based chat application'
    });
    
    return terminal;
}

/**
 * File manager example
 */
export function fileManagerExample() {
    const terminal = quickStart('#terminal', {
        welcome: `
            <h2>📁 Advanced File Manager</h2>
            <p>Enhanced file operations with search, copy, move, and more!</p>
            <p>Type <span class="cmd">fm help</span> for file manager commands</p>
        `
    });
    
    terminal.registerCommand('fm', {
        func: async function(argv) {
            if (argv.help || argv.h) {
                this.printHTML(`
                    <span class="cmd">fm</span>: File Manager commands
                    <br>Usage:
                    <br>  fm search <pattern> - Search for files
                    <br>  fm tree - Show directory tree
                    <br>  fm copy <src> <dest> - Copy file/directory
                    <br>  fm move <src> <dest> - Move file/directory
                    <br>  fm size [path] - Show size information
                    <br>  fm find <name> - Find files by name
                `);
                return;
            }
            
            const action = argv._[0];
            
            switch (action) {
                case 'search':
                    const pattern = argv._[1];
                    if (!pattern) {
                        this.printHTML('<span class="error">Search pattern required</span>');
                        return;
                    }
                    
                    const results = this.vfs.whereis(pattern);
                    if (results.length === 0) {
                        this.printHTML(`<span class="info">No files matching "${pattern}" found</span>`);
                    } else {
                        this.printHTML(`<span class="success">Found ${results.length} results:</span>`);
                        results.forEach(node => {
                            const path = this.vfs._absolute_path(node);
                            const type = node.type === 'dir' ? '📁' : '📄';
                            this.printHTML(`  ${type} ${path}`);
                        });
                    }
                    break;
                    
                case 'tree':
                    this.printHTML('<span class="cmd">Directory Tree:</span>');
                    this._showTree(this.vfs.cwd, '', true);
                    break;
                    
                case 'copy':
                    const srcPath = argv._[1];
                    const destPath = argv._[2];
                    
                    if (!srcPath || !destPath) {
                        this.printHTML('<span class="error">Source and destination required</span>');
                        return;
                    }
                    
                    try {
                        const srcNode = this.vfs._resolve_path(srcPath);
                        const destParent = this.vfs._resolve_path(destPath);
                        this.vfs.cp(srcNode, destParent);
                        this.printHTML(`<span class="success">✓ Copied ${srcPath} to ${destPath}</span>`);
                    } catch (error) {
                        this.printHTML(`<span class="error">Copy failed: ${error.message}</span>`);
                    }
                    break;
                    
                case 'move':
                    const mvSrc = argv._[1];
                    const mvDest = argv._[2];
                    
                    if (!mvSrc || !mvDest) {
                        this.printHTML('<span class="error">Source and destination required</span>');
                        return;
                    }
                    
                    try {
                        const srcNode = this.vfs._resolve_path(mvSrc);
                        const destParent = this.vfs._resolve_path(mvDest);
                        this.vfs.mv(srcNode, destParent);
                        this.printHTML(`<span class="success">✓ Moved ${mvSrc} to ${mvDest}</span>`);
                    } catch (error) {
                        this.printHTML(`<span class="error">Move failed: ${error.message}</span>`);
                    }
                    break;
                    
                case 'size':
                    const sizePath = argv._[1] || '.';
                    try {
                        const node = this.vfs._resolve_path(sizePath);
                        const size = this._calculateSize(node);
                        const humanSize = this._formatBytes(size);
                        
                        this.printHTML(`<span class="info">Size of ${sizePath}:</span>`);
                        this.printHTML(`  Size: ${humanSize} (${size} bytes)`);
                        
                        if (node.type === 'dir') {
                            const fileCount = this._countFiles(node);
                            this.printHTML(`  Files: ${fileCount.files}`);
                            this.printHTML(`  Directories: ${fileCount.dirs}`);
                        }
                    } catch (error) {
                        this.printHTML(`<span class="error">Size calculation failed: ${error.message}</span>`);
                    }
                    break;
                    
                case 'find':
                    const findName = argv._[1];
                    if (!findName) {
                        this.printHTML('<span class="error">Filename required</span>');
                        return;
                    }
                    
                    const found = [];
                    this._findByName(this.vfs.tree.root, findName, found);
                    
                    if (found.length === 0) {
                        this.printHTML(`<span class="info">No files named "${findName}" found</span>`);
                    } else {
                        this.printHTML(`<span class="success">Found ${found.length} files:</span>`);
                        found.forEach(node => {
                            const path = this.vfs._absolute_path(node);
                            const type = node.type === 'dir' ? '📁' : '📄';
                            this.printHTML(`  ${type} ${path}`);
                        });
                    }
                    break;
                    
                default:
                    this.printHTML('<span class="error">Unknown file manager command. Use "fm help" for usage.</span>');
            }
        },
        help: 'Advanced file manager with search, copy, move operations'
    });
    
    // Helper methods for file manager
    terminal._showTree = function(node, prefix = '', isRoot = false) {
        if (isRoot) {
            const icon = node.type === 'dir' ? '📁' : '📄';
            this.printHTML(`${icon} ${node.key}`);
        }
        
        const children = node.children || [];
        children.forEach((child, index) => {
            const isLast = index === children.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const icon = child.type === 'dir' ? '📁' : '📄';
            
            this.printHTML(`${prefix}${connector}${icon} ${child.key}`);
            
            if (child.type === 'dir' && child.children.length > 0) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                this._showTree(child, newPrefix);
            }
        });
    };
    
    terminal._calculateSize = function(node) {
        if (node.type === 'file') {
            return node.size || 0;
        }
        
        let totalSize = 0;
        if (node.children) {
            for (const child of node.children) {
                totalSize += this._calculateSize(child);
            }
        }
        return totalSize;
    };
    
    terminal._countFiles = function(node) {
        let files = 0;
        let dirs = 0;
        
        if (node.children) {
            for (const child of node.children) {
                if (child.type === 'dir') {
                    dirs++;
                    const subCount = this._countFiles(child);
                    files += subCount.files;
                    dirs += subCount.dirs;
                } else {
                    files++;
                }
            }
        }
        
        return { files, dirs };
    };
    
    terminal._findByName = function(node, name, results) {
        if (node.key.toLowerCase().includes(name.toLowerCase())) {
            results.push(node);
        }
        
        if (node.children) {
            for (const child of node.children) {
                this._findByName(child, name, results);
            }
        }
    };
    
    terminal._formatBytes = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return terminal;
}

/**
 * Game example - Simple text adventure
 */
export function gameExample() {
    const terminal = quickStart('#terminal', {
        welcome: `
            <div style="text-align: center; color: #f39c12;">
                <h2>🗡️ Terminal Adventure</h2>
                <p>A simple text-based adventure game</p>
                <p>Type <span class="cmd">game start</span> to begin your quest!</p>
            </div>
        `,
        theme: 'dark'
    });
    
    let gameState = {
        started: false,
        currentRoom: 'forest',
        inventory: [],
        health: 100,
        score: 0,
        rooms: {
            forest: {
                name: 'Enchanted Forest',
                description: 'You are in a mystical forest. Tall trees surround you, and you hear strange sounds in the distance.',
                items: ['sword', 'potion'],
                exits: { east: 'cave', north: 'village' }
            },
            cave: {
                name: 'Dark Cave',
                description: 'A dark and damp cave. You can barely see anything. Water drips from the ceiling.',
                items: ['treasure'],
                exits: { west: 'forest' },
                monster: true
            },
            village: {
                name: 'Peaceful Village',
                description: 'A small village with friendly inhabitants. You see smoke rising from chimneys.',
                items: ['map'],
                exits: { south: 'forest' }
            }
        }
    };
    
    terminal.registerCommand('game', {
        func: async function(argv) {
            if (argv.help || argv.h) {
                this.printHTML(`
                    <span class="cmd">game</span>: Text adventure game
                    <br>Commands:
                    <br>  game start - Start new game
                    <br>  game look - Look around
                    <br>  game go <direction> - Move in direction
                    <br>  game take <item> - Take an item
                    <br>  game inventory - Show inventory
                    <br>  game status - Show health and score
                    <br>  game help - Show this help
                `);
                return;
            }
            
            const action = argv._[0];
            
            if (!gameState.started && action !== 'start') {
                this.printHTML('<span class="error">Start a new game first with "game start"</span>');
                return;
            }
            
            switch (action) {
                case 'start':
                    gameState.started = true;
                    gameState.currentRoom = 'forest';
                    gameState.inventory = [];
                    gameState.health = 100;
                    gameState.score = 0;
                    
                    this.printHTML(`
                        <div style="border: 2px solid #f39c12; padding: 10px; margin: 10px 0;">
                            <h3>🌟 Welcome to Terminal Adventure! 🌟</h3>
                            <p>Your quest begins now. Use commands like 'game look', 'game go <direction>', and 'game take <item>' to play.</p>
                        </div>
                    `);
                    this._showRoom();
                    break;
                    
                case 'look':
                    this._showRoom();
                    break;
                    
                case 'go':
                    const direction = argv._[1];
                    if (!direction) {
                        this.printHTML('<span class="error">Specify a direction (north, south, east, west)</span>');
                        return;
                    }
                    
                    const currentRoom = gameState.rooms[gameState.currentRoom];
                    if (currentRoom.exits[direction]) {
                        gameState.currentRoom = currentRoom.exits[direction];
                        this.printHTML(`<span class="info">You go ${direction}...</span>`);
                        this._showRoom();
                        
                        // Check for monster encounter
                        if (gameState.rooms[gameState.currentRoom].monster && !gameState.inventory.includes('sword')) {
                            this.printHTML(`
                                <span class="error">🐉 A fierce monster attacks you!</span>
                                <span class="error">You need a weapon to defend yourself!</span>
                                <span class="error">You flee back to safety...</span>
                            `);
                            gameState.currentRoom = 'forest';
                            gameState.health -= 20;
                        }
                    } else {
                        this.printHTML('<span class="error">You cannot go that way!</span>');
                    }
                    break;
                    
                case 'take':
                    const item = argv._[1];
                    if (!item) {
                        this.printHTML('<span class="error">Specify an item to take</span>');
                        return;
                    }
                    
                    const room = gameState.rooms[gameState.currentRoom];
                    if (room.items.includes(item)) {
                        room.items = room.items.filter(i => i !== item);
                        gameState.inventory.push(item);
                        gameState.score += 10;
                        this.printHTML(`<span class="success">✓ You take the ${item}</span>`);
                        
                        if (item === 'treasure') {
                            gameState.score += 50;
                            this.printHTML(`
                                <div style="border: 2px solid #2ecc71; padding: 10px; margin: 10px 0;">
                                    <h3>🏆 Congratulations! 🏆</h3>
                                    <p>You found the treasure! Your final score: ${gameState.score}</p>
                                    <p>Thanks for playing Terminal Adventure!</p>
                                </div>
                            `);
                        }
                    } else {
                        this.printHTML(`<span class="error">There is no ${item} here</span>`);
                    }
                    break;
                    
                case 'inventory':
                    if (gameState.inventory.length === 0) {
                        this.printHTML('<span class="info">Your inventory is empty</span>');
                    } else {
                        this.printHTML('<span class="cmd">Inventory:</span>');
                        gameState.inventory.forEach(item => {
                            this.printHTML(`  🎒 ${item}`);
                        });
                    }
                    break;
                    
                case 'status':
                    this.printHTML(`
                        <span class="cmd">Status:</span>
                        <br>❤️  Health: ${gameState.health}/100
                        <br>⭐ Score: ${gameState.score}
                        <br>📍 Location: ${gameState.rooms[gameState.currentRoom].name}
                    `);
                    break;
                    
                default:
                    this.printHTML('<span class="error">Unknown game command. Use "game help" for available commands.</span>');
            }
        },
        help: 'Simple text-based adventure game'
    });
    
    // Helper method to show current room
    terminal._showRoom = function() {
        const room = gameState.rooms[gameState.currentRoom];
        
        this.printHTML(`
            <div style="border: 1px solid #3498db; padding: 10px; margin: 10px 0;">
                <h3>📍 ${room.name}</h3>
                <p>${room.description}</p>
                ${room.items.length > 0 ? `<p><strong>Items here:</strong> ${room.items.map(item => `🎁 ${item}`).join(', ')}</p>` : ''}
                <p><strong>Exits:</strong> ${Object.keys(room.exits).join(', ')}</p>
            </div>
        `);
    };
    
    return terminal;
}

// Export all examples
export default {
    basicExample,
    advancedExample,
    multipleTerminalsExample,
    customCommandExample,
    pluginExample,
    performanceExample,
    debugExample,
    tutorialExample,
    chatApplicationExample,
    fileManagerExample,
    gameExample
}