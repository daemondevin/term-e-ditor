# TERM[E]DITOR - Web-Based Terminal Emulator

> A powerful, feature-rich terminal emulator built for the web with a complete virtual filesystem, gaming features, and extensive customization options.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/daemondevin/term-e-ditor)

## 🌟 Features

### Core Terminal Features
- **Full Unix-like Command Set** - ls, cd, cat, mkdir, rm, and many more
- **Virtual File System** - Complete filesystem simulation with persistence
- **Command History** - Navigate through command history with up/down arrows
- **Tab Completion** - Smart command and path completion (coming soon)
- **Multiple Themes** - 8 beautiful themes including OneDark, Dracula, Nord
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Real-time Typing Effects** - Animated command output and interactions

### Advanced Features
- **Interactive Setup Wizard** - Guided onboarding for new users
- **Session Management** -  Create interactive modes (like REPLs, command-specific interfaces, etc.) with proper session stacking
- **Performance Monitoring** - Built-in performance metrics and debugging
- **Multi-terminal Support** - Multiple terminals with shared filesystem
- **User Accounts** - Persistent user profiles with preferences
- **File Operations** - Copy, move, search, and advanced file management

### Gaming & Entertainment
- **Blackjack** - Full-featured card game with betting system
- **Advanced Slots** - 5-reel slot machine with 9 paylines and progressive features
- **Rock Paper Scissors** - Classic game with ASCII art animations
- **Number Guessing** - Strategic guessing game with performance tracking
- **Text Adventure** - Simple RPG-style exploration game
- **User Economy** - Virtual cash system across all games

### Developer Tools
- **Debug Console** - Advanced debugging utilities
- **Performance Profiler** - Command execution timing and optimization
- **Filesystem Validation** - Integrity checking and reporting
- **Custom Commands** - Easy command registration system
- **Event Hooks** - Plugin-based event system

## 🚀 Quick Start

### Basic Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Terminal</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="terminal"></div>
    
    <script type="module">
        import { quickStart } from './js/index.js';
        
        // Create terminal with default settings
        const terminal = quickStart('#terminal');
    </script>
</body>
</html>
```

### Advanced Configuration

```javascript
import { TerminalFactory, VirtualFileSystem } from './js/index.js';

// Custom configuration
const options = {
    theme: 'dracula',
    welcome: 'Welcome to my custom terminal!',
    maxHistorySize: 500,
    textSize: '16px',
    fontFamily: '"Fira Code", monospace',
    user: {
        name: 'developer',
        home: '/home/developer',
        cash: 2000
    }
};

// Create terminal with VFS
const vfs = new VirtualFileSystem();
const terminal = new TerminalEmulator('#terminal', vfs, options);
```

## 📁 File Structure

```
termeditor/
    ├── index.html              # Main HTML file with examples
    ├── README.md               # This file 
    ├─── css/
    │     └── style.css         # Terminal themes and styling
    └─── js/
        ├── index.js            # Main entry point and factory
        ├── terminal.js         # Core terminal emulator class
        ├── vfs.js              # Virtual filesystem implementation
        ├── tree.js             # Tree data structure for filesystem
        ├── parser.js           # Command line parser
        ├── command.js          # Built-in commands and command manager
        ├── utils.js            # Utility functions
        ├── examples.js         # Usage examples and demos
        ├── filesystem-data.js  # Default filesystem structure
        ├── sessions.js         # Session management class
        └─── plugins/
                ├── edit.js         # TextEditor plugin
                ├── github.js       # GitHub Cli plugin
                ├── nodejs.js       # NodeJS REPL plugin
                └── python.js       # Python REPL plugin
```

## 🎮 Built-in Commands

### File System Commands
- `ls [-l] [-a] [path]` - List directory contents
- `cd [path]` - Change directory
- `pwd` - Print working directory
- `mkdir <dir>` - Create directory
- `rm <file>` - Remove file
- `rmdir <dir>` - Remove directory
- `cat <file>` - Display file contents
- `touch <file>` - Create empty file
- `tree [-f] [path]` - Display directory tree

### Utilities
- `clear` - Clear terminal screen
- `help [command]` - Show help information
- `whoami` - Display current user
- `echo <text>` - Display text
- `whereis <name>` - Locate files
- `set <key> <value>` - Set environment variables
- `base64 [-d] <string>` - Encode/decode base64

### Gaming Commands
- `blackjack` - Play blackjack card game
- `slots` - Advanced 5-reel slot machine
- `rps` - Rock Paper Scissors
- `guess` - Number guessing game

### System Commands
- `theme [-l] [theme]` - Change terminal theme
- `wizard [--reset]` - Run setup wizard
- `sysinfo` - Display system information

## 🎨 Available Themes

| Theme | Description |
|-------|-------------|
| `onedark` | Default dark theme with blue accents |
| `dracula` | Popular purple-tinted dark theme |
| `nord` | Cool blue-tinted Arctic theme |
| `nightowl` | Night Owl inspired theme |
| `laserwave` | Synthwave neon theme |
| `greyscale` | Monochromatic grayscale theme |
| `dark` | Classic terminal dark theme |
| `light` | Clean light theme |

```javascript
// Change theme programmatically
terminal.setTheme('dracula');

// Or via command
terminal.executeCommand('theme dracula');
```

## 📓 Session Management

The `session.js` module provides a foundation for building and managing terminal applications with multiple interactive modes (like REPLs, command-specific interfaces, etc.) with proper session stacking. The JSDoc documentation is thorough, making it easy to understand its functionality and usage..

### Class Breakdown
The file contains two main classes that work together:

#### 1. `InteractiveSession`
This is a base class or a template for any specific interactive session you might want to create. You wouldn't use this class directly, but instead, you would create new classes that extend it. Refer to the plugins directory for examples.

- `constructor(terminal)`: When a new session is created, it's given a reference to the main `terminal` object. This allows the session to print output, clear the screen, or perform other terminal actions.
- `prompt`: This defines the prompt that the user sees. For a standard shell, it might be `C:\>`, but for a Python session, you'd set it to `>>>`.
- `handleInput(line)`: This is the most important method. When this session is active, any line the user types and enters is sent to this method instead of the terminal's regular command parser. The default implementation just shows a message, but a subclass would override this to do something useful (e.g., evaluate Python code, insert text into a document).
- `onEnter()`: A lifecycle method that's called right when the session becomes active. This is the perfect place to print a welcome message (e.g., "Entering text editor...").
- `onExit()`: The opposite of `onEnter`. It's called just before the session ends, allowing for any necessary cleanup.

#### 2. `SessionManager`
This class is the controller. A single instance of `SessionManager` lives on the terminal and manages which session is currently active.

- `sessionStack`: It uses an array as a "stack." A stack is a _"last-in, first-out"_ data structure. This is a clever design because it allows sessions to be nested. For example, you could be in a Python REPL session and then run a command that opens a text editor session on top of it. When you exit the editor, you're right back in the Python REPL.
- `push(session)`: This method starts a new session. It adds the session to the top of the stack, calls its `onEnter()` method, and tells the terminal to update its prompt.
- `pop()`: This method ends the current session. It removes the session from the top of the stack, calls its `onExit()` method, and updates the prompt to whatever the previous session (or the default terminal) uses.
- `getCurrent()`: A helper method that the terminal uses to get the currently active session from the top of the stack.
- `isActive()`: A simple check to see if there are any sessions on the stack.

#### How It All Works Together
Lets walk-through how it all comes together. We're using the `TextEditor` plugin for this example. Open the file `js/plugins/edit.js` to view its source code to follow along.

1. If a user wanted to run your text editor plugin, they would need to enter a command like `edit myfile.txt`. In order for your plugin to work like that, you would first need to register a referance to the class using `terminal.registerCommand` like so:

    ```javascript
    //import the terminal class
    import { TerminalEmulator } from './js/terminal.js';

    //import your plugin
    import { TextEditor } from './js/plugins/edit.js';
    
    // get a referance to the terminal
    const terminal = new TerminalEmulator('#terminal');

    //register the plugin with the terminal
    terminal.registerCommand("edit", {
        name: 'edit',
        type: 'exec', 
        help: 'Open text editor',
        aliases: ['vi', 'nano', 'vim'],
        func: async (terminal, argv) => {
            const filename = argv._[0] || 'untitled.txt';
            const editorSession = new TextEditor(terminal, filename);
            terminal.pushSession(editorSession);
        }
    });
    ```
2. Now they could type `edit myfile.txt` and the terminal would create a new `TextEditor` session with the instance by calling `terminal.pushSession(editorSession)`.
3. The terminal would then see that a session is active by using `terminal.sessionManager.isActive()` and routes all user input to the current session's `handleInput` method.
4. Now the `TextEditor` session handles any input (e.g., moving the cursor, saving the file) instead of the default terminal's parser.
5. When the user quits the editor (e.g., by typing `:q`), the session's `handleInput` method calls `terminal.sessionManager.pop()` allowing the terminal to return to its normal state.

### Example: Interactive REPL

Here's a very simple custom mock Python REPL example:

```javascript
// import the parent class
import { InteractiveSession } from '../session.js';

class PythonREPL extends InteractiveSession {
    constructor(terminal) {
        // call the parent constructor
        super(terminal);
        //be sure to set the prompt
        this.prompt = '>>> ';
    }

    // process user input
    async handleInput(line) {
        if (line.trim() === 'exit()') {
            this.terminal.sessionManager.pop();
            return;
        }
        // Execute Python code...
        this.terminal.print(`Python: ${line}`);
    }

    // welcome message
    onEnter() {
        this.terminal.print('Python REPL started. Type exit() to quit.');
    }

    // goodbye message
    onExit() {
        this.terminal.print('Python REPL session ended.');
    }
}

// Usage
terminal.sessionManager.push(new PythonREPL(terminal));
```

## 🎯 Examples

### Multiple Terminals with Shared Filesystem

```javascript
import { createSharedTerminals } from './js/index.js';

const terminals = createSharedTerminals([
    { element: '#terminal1', options: { theme: 'dark' } },
    { element: '#terminal2', options: { theme: 'light' } }
]);

// Files created in one terminal appear in the other
terminals[0].executeCommand('echo "Shared file" > test.txt');
terminals[1].executeCommand('cat test.txt'); // Shows "Shared file"
```

### Custom Command Registration

```javascript
// Add a custom datetime command
terminal.registerCommand('datetime', {
    func: function(argv) {
        const now = new Date().toLocaleString();
        this.printHTML(`Current time: <span class="info">${now}</span>`);
    },
    help: 'Display current date and time'
});
```

### Interactive Applications

```javascript
// Create an interactive chat application
terminal.registerCommand('chat', {
    func: async function(argv) {
        const message = await this.prompt('Enter message:');
        const recipient = await this.prompt('Send to:');
        
        this.printHTML(`<span class="success">Message sent to ${recipient}</span>`);
        this.printHTML(`<span class="user">${message}</span>`);
    },
    help: 'Send a chat message'
});
```

## 🛠️ API Reference

### TerminalEmulator Class

#### Constructor
```javascript
new TerminalEmulator(element, filesystem, options)
```

#### Methods
- `print(message)` - Print text to terminal
- `printHTML(content)` - Print HTML content
- `clear()` - Clear terminal screen
- `executeCommand(command)` - Execute command programmatically
- `registerCommand(name, definition)` - Register new command
- `prompt(message)` - Get user input
- `confirm(message)` - Get yes/no confirmation
- `password(message)` - Get hidden password input
- `setTheme(theme)` - Change terminal theme

### VirtualFileSystem Class

#### Methods
- `cd(path)` - Change directory
- `ls(path, options)` - List directory contents
- `pwd()` - Print working directory
- `tree(path)` - Display directory tree
- `mkdir(path)` - Create directory
- `cat(mode, path, content)` - Read/write files
- `rm(path)` - Remove file
- `cp(source, destination)` - Copy file/directory
- `mv(source, destination)` - Move file/directory

## ⚙️ Configuration Options

```javascript
const options = {
    // Appearance
    theme: 'onedark',           // Terminal theme
    textSize: '14px',           // Font size
    fontFamily: 'monospace',    // Font family
    cursorType: 'block',        // Cursor style
    
    // Behavior
    maxHistorySize: 1000,       // Command history limit
    forceFocus: true,           // Auto-focus terminal
    
    // Content
    welcome: 'Welcome!',        // Welcome message
    showWelcome: true,          // Show welcome on load
    
    // User settings
    user: {
        name: 'demo',
        home: '/home/demo',
        cash: 1000
    }
};
```

## 🎮 Gaming System

The terminal includes a complete gaming ecosystem with the following features:

### Economy System
- Users start with $1000 virtual cash
- Win/lose money through various games
- Persistent balance across sessions
- Bonus rewards for achievements

### Game Statistics
Each game tracks detailed statistics:
- Games played
- Win/loss ratios
- High scores
- Achievement progress

### Game Features
- **Blackjack**: Full rules implementation with insurance, splits
- **Slots**: 5-reel system with 9 paylines, progressive features
- **RPS**: Animated battles with ASCII art
- **Guess**: Strategic number guessing with hints

## 🔧 Advanced Features

### Performance Monitoring
```javascript
import { PerformanceMonitor } from './js/index.js';

const monitor = new PerformanceMonitor();
monitor.enable();

// Monitor command execution
const timerId = monitor.start('command_execution');
await terminal.executeCommand('ls');
monitor.end('command_execution', timerId);

console.log(monitor.getMetrics());
```

### Debug Utilities
```javascript
import { DebugUtils } from './js/index.js';

// Log terminal state
DebugUtils.logState(terminal);

// Validate filesystem integrity
const validation = DebugUtils.validateFilesystem(terminal.vfs);

// Benchmark commands
const results = await DebugUtils.benchmarkCommand(terminal, 'ls', 100);
```

## 🌐 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 70+ | ✅ Full |
| Firefox | 65+ | ✅ Full |
| Safari | 12+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| Opera | 57+ | ✅ Full |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

Did you step on a bug while using the terminal? Please open an issue on our [GitHub Issues](https://github.com/daemondevin/term-e-ditor/issues) page and tell us all about it.


---

<p align="center">Made with ❤️ by the TERM[E]DITOR team</p>
