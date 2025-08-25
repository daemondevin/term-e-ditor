import { Parser, ParserCache } from './parser.js';
import VirtualFileSystem from './vfs.js';
import CommandManager from './command.js';
import { SessionManager } from './session.js';
import { DEFAULT_FS, DEFAULT_ENV, DEFAULT_ALIASES } from './filesystem-data.js';

export class TerminalEmulator {
    /**
     * Create a new terminal emulator
     * @param {string|Element} element - DOM element or CSS selector
     * @param {VirtualFileSystem} filesystem - Virtual filesystem instance
     * @param {Object} options - Configuration options
     */
    constructor(element, filesystem, options = {}) {
        // Element validation and setup
        this._validateAndSetupElement(element);
        
        // Performance optimizations
        this._parserCache = new ParserCache();
        this._pathCache = new Map();
        this._maxCacheSize = 100;
        this._scrollTimeout = null;
        
        // Configuration management
        this._initializeConfiguration(options);
        this._initializeVFS(filesystem);
        this._initializeDOMElements();
        this._initializeSessionManager();
        this._initializeCommands();
        this._bindEventHandlers();
        
        // State management
        this._initializeState();
        
        // Apply initial settings
        this._applyInitialSettings();
    }

    /**
     * Validate and setup DOM element
     * @param {string|Element} element - Element to setup
     * @private
     */
    _validateAndSetupElement(element) {
        if (typeof element === 'string') {
            this.containerNode = document.querySelector(element);
            if (!this.containerNode) {
                throw new Error(`Invalid CSS selector: "${element}" not found`);
            }
        } else if (element instanceof Element) {
            this.containerNode = element;
        } else {
            throw new Error('Constructor requires a DOM Element or valid CSS selector');
        }
    }

    /**
     * Initialize configuration with defaults
     * @param {Object} options - User options
     * @private
     */
    _initializeConfiguration(options) {
        const defaults = {
            welcome: "<span class=\"host\">TERM[E]DITOR BASH</span>&mdash;v1.0\nA good place to start would be to type <span class=\"cmd\">wizard</span> or <span class=\"cmd\">help</span>..",
            theme: "onedark",
            maxHistorySize: 1000,
            cursorType: '_',
            cursor: '$',
            textSize: '1em',
            fontFamily: 'monospace',
            forceFocus: true,
            overflow: 'auto',
            whiteSpace: 'break-spaces'
        };

        // Merge with user options
        this.opts = { ...defaults, ...options };
        
        // Initialize preferences (assuming global prefs object)
        if (typeof prefs !== 'undefined') {
            this.prefs = prefs;
            this.prefs.has = this.prefs.contains || this.prefs.has;
            
            if (this.prefs.has("prefs")) {
                this.opts = { ...this.opts, ...this.prefs.get("prefs") };
            }
            this.prefs.set("prefs", this.opts);
        }
    }

    /**
     * Initialize virtual file system
     * @param {VirtualFileSystem} filesystem - VFS instance
     * @private
     */
    _initializeVFS(filesystem) {
        this.vfs = filesystem || new VirtualFileSystem();
        
        // Initialize with default structure if empty
        if (!this.vfs.tree.root) {
            this.vfs.initStructure(DEFAULT_FS, null);
            this._createStandardDirectories();
        }
        
        this.vfs.cwd = this.vfs.cwd || this.vfs.tree.root;
        
        // Environment variables
        this.env = { ...DEFAULT_ENV };
        this.env.PWD = this.vfs._absolute_path(this.vfs.cwd);
        
        // User information
        this.user = {
            name: 'demo',
            cash: 1000,
            uid: 1000,
            gid: 1000,
            home: '/home/demo',
            shell: '/bin/bash',
            permissions: ['user'],
            games: []
        };
        
        // Update environment with user info
        this.env.USER = this.user.name;
        this.env.HOME = this.user.home;
    }

    /**
     * Create standard Unix directories
     * @private
     */
    _createStandardDirectories() {
        try {
            this.vfs.cd("/");
            this.vfs.mkdir("usr");
            this.vfs.cd("usr");
            this.vfs.mkdir("bin");
            this.vfs.cd("bin");
            this.vfs.cd("/home/demo");
        } catch (e) {
            console.warn("Could not set initial directory:", e.message);
        }
    }

    /**
     * Initialize DOM elements
     * @private
     */
    _initializeDOMElements() {
        this.terminal = this.containerNode;
        this.container = document.createElement("pre");
        this.container.classList.add("container", "blink");
        this.container.dataset.cursorType = this.opts.cursorType;
        
        this.stdout = document.createElement('div');
        this.stdout.className = "stdout";
        
        this.stdin = document.createElement('span');
        this.stdin.className = "stdin";
        
        this.stdinLine = document.createElement('span');
        this.stdinLine.className = "stdin-line";
        
        this._promptPS1 = document.createElement('span');
        this._promptPS1.className = "ps1";
        
        // Build DOM structure
        this.stdin.appendChild(this._promptPS1);
        this.stdin.appendChild(this.stdinLine);
        this.container.appendChild(this.stdout);
        this.container.appendChild(this.stdin);
        this.terminal.appendChild(this.container);
        
        // Apply styles
        this.container.style.overflowY = this.opts.overflow;
        this.container.style.whiteSpace = this.opts.whiteSpace;
    }

    /**
     * Initialize session manager
     * @private
     */
    _initializeSessionManager() {
        this.sessionManager = new SessionManager();
        this.sessionManager.init(this);
    }

    /**
     * Initialize command system
     * @private
     */
    _initializeCommands() {
        this.commandManager = this.commandManager || new CommandManager();
        this.commandManager.registerBuiltins();
        //const url = new URL('cmds/userCommands.json', import.meta.url).href;
        //this.commandManager.load(url);
        // Create legacy commands object for backward compatibility
        this.commands = {};
        for (const commandName of this.commandManager.list()) {
            const command = this.commandManager.get(commandName);
            this.commands[commandName] = {
                name: command.name,
                type: command.type,
                mime: command.mime,
                help: command.help,
                func: async (argv) => {
                    await command.execute(this, argv);
                }
            };
        }
        
        // Add aliases
        for (const [alias, commandName] of Object.entries(DEFAULT_ALIASES)) {
            if (this.commands[commandName]) {
                this.commands[alias] = this.commands[commandName];
            }
        }
    }

    /**
     * Bind event handlers
     * @private
     */
    _bindEventHandlers() {
        this._keydownHandler = this._handleKeydown.bind(this);
        this._keypressHandler = this._handleKeypress.bind(this);
        this._clickHandler = this._handleClick.bind(this);
        
        document.addEventListener("keydown", this._keydownHandler);
        document.addEventListener("keypress", this._keypressHandler);
        this.container.addEventListener("click", this._clickHandler);
    }

    /**
     * Initialize state variables
     * @private
     */
    _initializeState() {
        this.sudo = false; 
        this.allowInput = true;
        this.command = '';
        this.commandHistory = this.prefs?.get("cmdHistory") || [];
        this.historyIndex = this.commandHistory.length;
        
        // Prompt types
        this.PROMPT_INPUT = 1;
        this.PROMPT_PASSWORD = 2;
        this.PROMPT_CONFIRM = 3;
        this.PROMPT_PAUSE = 4;
    }

    /**
     * Apply initial settings
     * @private
     */
    _applyInitialSettings() {
        this.setTheme(this.opts.theme)
            .setTextSize(this.opts.textSize)
            .setFontFamily(this.opts.fontFamily)
            .setPrompt();
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    _handleKeydown(e) {
        if (!this.allowInput) return;

        const keyCode = e.which || e.keyCode;
        const inputElements = ["INPUT", "TEXTAREA"];
        
        // Backspace handling
        if (keyCode === 8 && !inputElements.includes(e.target.tagName)) {
            e.preventDefault();
            if (this.command !== "") this.erase(1);
        }

        // History navigation
        if (keyCode === 38 || keyCode === 40) {
            e.preventDefault();
            this._handleHistoryNavigation(keyCode === 38 ? 'up' : 'down');
        }

        // Tab completion (placeholder for future implementation)
        if (keyCode === 9) {
            e.preventDefault();
            this._handleTabCompletion();
        }
    }

    /**
     * Handle keypress events
     * @param {KeyboardEvent} e - Keyboard event
     * @private
     */
    async _handleKeypress(e) {
        if (!this.allowInput) return;

        const keyCode = e.which || e.keyCode;

        if (keyCode === 13) { // ENTER
            const clone = this.stdin.cloneNode(true);
            this.stdout.appendChild(clone);
            this.stdinLine.innerHTML = "";
            await this.processCommand();
            this.scrollBottom();
        } else {
            this.scrollBottom();
            this.appendCommand(String.fromCharCode(keyCode));
        }
    }

    /**
     * Handle click events for focus management
     * @param {MouseEvent} e - Mouse event
     * @private
     */
    _handleClick(e) {
        if (this.shouldFocus()) {
            this.focus();
        }
    }

    /**
     * Handle history navigation
     * @param {string} direction - 'up' or 'down'
     * @private
     */
    _handleHistoryNavigation(direction) {
        const historyLength = this.commandHistory.length;
        
        if (direction === 'up') {
            this.historyIndex = Math.max(this.historyIndex - 1, 0);
        } else {
            this.historyIndex = Math.min(this.historyIndex + 1, historyLength - 1);
        }

        const cmd = this.commandHistory[this.historyIndex];
        if (cmd !== undefined) {
            this.clearCommand();
            this.appendCommand(cmd);
        }
    }

    /**
     * Handle tab completion (placeholder)
     * @private
     */
    _handleTabCompletion() {
        // TODO: Implement tab completion
        console.log('Tab completion not yet implemented');
    }

    /**
     * Parse command with caching
     * @param {string} stdin - Command string
     * @returns {Parser} Parser instance
     */
    parseCommand(stdin) {
        return this._parserCache.parse(stdin);
    }

    /**
     * Process current command
     */
    async processCommand() {
        if (!this.command?.trim()) {
            this._finalizeCommand();
            return;
        }

        // Check if we have an active session
        const currentSession = this.sessionManager.getCurrent();
        if (currentSession) {
            // Let the session handle the input
            try {
                await currentSession.handleInput(this.command.trim());
            } catch (error) {
                this.printError('Session error: ').write(`${error.message}`);
            }
            this._finalizeCommand();
            return;
        }

        // Normal command processing when no session is active
        let parser;
        try {
            parser = this.parseCommand(this.command.trim());
        } catch (e) {
            this.printHTML(`<span class="error">Parse error</span>: ${e.message}\n`);
            this._finalizeCommand();
            return;
        }

        await this._executeCommand(parser);
    }

    /**
     * Execute parsed command
     * @param {Parser} parser - Parsed command
     * @private
     */
    async _executeCommand(parser) {
        try {
            if (this.commands[parser.command]) {
                await this.commands[parser.command].func(parser);
            } else {
                this.printHTML(`-bash: <span class="cmd">${parser.command}</span>: <span class="error">command not found</span>\n`);
            }
        } catch (error) {
            this.printHTML(`<span class="error">${parser.command}</span>: ${error.message}\n`);
            console.error(`Command '${parser.command}' error:`, error);
        } finally {
            this._finalizeCommand();
        }
    }

    /**
     * Finalize command execution
     * @private
     */
    _finalizeCommand() {
        if (this.command?.trim()) {
            this.addToHistory(this.command);
        }
        this.command = "";
        this.setPrompt();
    }

    /**
     * Add command to history
     * @param {string} command - Command to add
     */
    addToHistory(command) {
        // Avoid duplicate consecutive commands
        if (this.commandHistory.length > 0 && 
            this.commandHistory[this.commandHistory.length - 1] === command) {
            return;
        }

        this.commandHistory.push(command);
        
        // Limit history size
        if (this.commandHistory.length > this.opts.maxHistorySize) {
            this.commandHistory = this.commandHistory.slice(-this.opts.maxHistorySize);
        }
        
        this.historyIndex = this.commandHistory.length;
        this.prefs?.set("cmdHistory", this.commandHistory);
    }

    /**
     * Print text to terminal
     * @param {string} message - Message to print
     * @returns {TerminalEmulator} Self for chaining
     */
    print(message) {
        const fragment = document.createDocumentFragment();
        const div = document.createElement('div');
        div.textContent = message;
        fragment.appendChild(div);
        this.stdout.appendChild(fragment);
        this.scrollBottom();
        return this;
    }

    /**
     * Print HTML to terminal
     * @param {string} content - HTML content to print
     * @returns {TerminalEmulator} Self for chaining
     */
    printHTML(content) {
        const fragment = document.createDocumentFragment();
        const div = document.createElement('div');
        div.innerHTML = content;
        fragment.appendChild(div);
        this.stdout.appendChild(fragment);
        this.scrollBottom();
        return this;
    }

    /**
     * Print error message
     * @param {string} message - Message to print
     * @return {TerminalEmulator} Self for chaining
     */
    printError(message) {
        this.printHTML(`<span class="error">${message}</span>`);
        return this;
    }

    /**
     * Print success message
     * @param {string} message - Message to print
     * @return {TerminalEmulator} Self for chaining
     */
    printSuccess(message) {
        this.printHTML(`<span class="success">${message}</span>`);
        return this;
    }

    /**
     * Print warning message
     * @param {string} message - Message to print
     * @return {TerminalEmulator} Self for chaining
     */
    printWarning(message) {
        this.printHTML(`<span class="warning">${message}</span>`);
        return this;
    }

    /**
     * Print informational message
     * @param {string} message - Message to print
     * @return {TerminalEmulator} Self for chaining
     */
    printInfo(message) {
        this.printHTML(`<span class="info">${message}</span>`);
        return this;
    }

    /**
     * Write text without newline
     * @param {string} message - Message to write
     * @returns {TerminalEmulator} Self for chaining
     */
    write(message) {
        const span = document.createElement('span');
        span.innerHTML = message;
        this.stdout.appendChild(span);
        this.scrollBottom();
        return this;
    }

    /**
     * Add newline
     * @returns {TerminalEmulator} Self for chaining
     */
    newLine() {
        const br = document.createElement('br');
        this.stdout.appendChild(br);
        this.scrollBottom();
        return this;
    }

    /**
     * Type text with animation
     * @param {string} message - Message to type
     * @param {number} speed - Typing speed in ms
     * @returns {Promise} Typing completion promise
     */
    async type(message, speed = 50) {
        const span = document.createElement('span');
        this.stdout.appendChild(span);
        
        for (const char of message) {
            await new Promise(resolve => setTimeout(resolve, speed));
            span.textContent += char;
            this.scrollBottom();
        }
    }

    /**
     * Scroll to bottom with debouncing
     * @returns {TerminalEmulator} Self for chaining
     */
    scrollBottom() {
        if (!this._scrollTimeout) {
            this._scrollTimeout = requestAnimationFrame(() => {
                this.container.scrollTop = this.container.scrollHeight;
                this._scrollTimeout = null;
            });
        }
        return this;
    }

    /**
     * Clear terminal screen
     * @returns {TerminalEmulator} Self for chaining
     */
    clear() {
        this.stdout.innerHTML = '';
        return this;
    }

    /**
     * Append to current command
     * @param {string} str - String to append
     */
    appendCommand(str) {
        this.stdinLine.insertAdjacentHTML('beforeend', str);
        this.command = (this.command || '') + str;
    }

    /**
     * Erase characters from command
     * @param {number} n - Number of characters to erase
     */
    erase(n) {
        this.command = this.command.slice(0, -n);
        this.stdinLine.innerHTML = this.stdinLine.innerHTML.slice(0, -n);
    }

    /**
     * Clear current command
     */
    clearCommand() {
        if (this.command && this.command.length > 0) {
            this.erase(this.command.length);
        }
    }

    secondaryCommand(bool) {
        bool = bool.toString().toUpperCase();
        this.allowInput = !(bool === 'TRUE' || bool === '1' || bool === 'YES');
        this.secondaryInstance = (bool === 'TRUE' || bool === '1' || bool === 'YES');
        if (bool === 'TRUE' || bool === '1' || bool === 'YES') {
            this.container.classList.remove('blink');
        } else {
            this.container.classList.add('blink');
        }
    }

    /**
     * Set terminal theme
     * @param {string} theme - Theme name
     * @returns {TerminalEmulator} Self for chaining
     */
    setTheme(theme) {
        this.terminal.setAttribute("class", theme);
        this.theme = this.opts.theme = theme;
        this.env.THEME = theme;
        this._savePrefs();
        return this;
    }

    /**
     * Set text size
     * @param {string} size - CSS font size
     * @returns {TerminalEmulator} Self for chaining
     */
    setTextSize(size) {
        this.container.style.fontSize = this.opts.textSize = size;
        this._savePrefs();
        return this;
    }

    /**
     * Set font family
     * @param {string} font - CSS font family
     * @returns {TerminalEmulator} Self for chaining
     */
    setFontFamily(font) {
        this.container.style.fontFamily = this.opts.fontFamily = font;
        this._savePrefs();
        return this;
    }

    /**
     * Set terminal prompt
     * @param {string} ps - Custom prompt or empty for default
     * @returns {TerminalEmulator} Self for chaining
     */
    setPrompt(ps = '') {
        if (!ps) {
            this._promptPS1.innerHTML = this._constructPrompt();
        } else {
            this._promptPS1.innerHTML = ps;
        }
        return this;
    }

    /**
     * Construct default prompt
     * @returns {string} HTML prompt string
     * @private
     */
    _constructPrompt() {
        // Check if a session has overridden the prompt
        const currentSession = this.sessionManager.getCurrent();
        if (currentSession && currentSession.prompt) {
            if (typeof currentSession.prompt === 'function') {
                return currentSession.prompt();
            }
            return currentSession.prompt;
        }

        // Default prompt construction
        const user = `<span class="user">${this.env.USER || 'demo'}</span>`;
        const at = `<span class="at">@</span>`;
        const host = `<span class="host">${this.env.HOSTNAME || 'localhost'}&emsp;</span>`;
        const path = `<span class="path">[${this.path}]&emsp;</span>`;
        const cursor = `<span class="cursor">${this.sudo ? "#" : this.opts.cursor}&emsp;</span>`;
        return user + at + host + path + cursor;
    }

    /**
     * Push a new interactive session
     * @param {InteractiveSession} session - Session to activate
     */
    pushSession(session) {
        this.sessionManager.push(session);
    }

    /**
     * Pop the current interactive session
     */
    popSession() {
        this.sessionManager.pop();
        // Refresh the prompt after popping a session
        this.setPrompt();
    }

    /**
     * Get the currently active session
     * @returns {InteractiveSession|null} Current session or null
     */
    getCurrentSession() {
        return this.sessionManager.getCurrent();
    }

    /**
     * Check if any session is currently active
     * @returns {boolean} True if a session is active
     */
    hasActiveSession() {
        return this.sessionManager.isActive();
    }

    /**
     * Get current path
     * @returns {string} Current working directory path
     */
    get path() {
        return this.vfs._absolute_path(this.vfs.cwd) || '/';
    }

    /**
     * Prompt user for input
     * @param {string} message - Prompt message
     * @param {boolean} type - Whether to use typing animation
     * @returns {Promise<string>} User input
     */
    async prompt(message, type = false) {
        return await this._prompt(message, this.PROMPT_INPUT, type);
    }

    /**
     * Prompt for password (hidden input)
     * @param {string} message - Prompt message
     * @returns {Promise<string>} User input
     */
    async password(message) {
        return await this._prompt(message, this.PROMPT_PASSWORD);
    }

    /**
     * Prompt for confirmation
     * @param {string} message - Confirmation message
     * @param {boolean} type - Whether to use typing animation
     * @returns {Promise<boolean>} User confirmation
     */
    async confirm(message, type = false) {
        return await this._prompt(message, this.PROMPT_CONFIRM, type);
    }

    /**
     * Pause execution (press any key)
     * @param {string} message - Pause message
     * @param {boolean} type - Whether to use typing animation
     * @returns {Promise<void>} Pause completion
     */
    async pause(message, type = false) {
        const ps1_backup = this._promptPS1.innerHTML;
        this.setPrompt(message);
        await this._prompt(message, this.PROMPT_PAUSE, type);
        this.setPrompt(ps1_backup);
    }

    /**
     * Internal prompt implementation
     * @param {string} message - Prompt message
     * @param {number} promptType - Type of prompt
     * @param {boolean} type - Whether to use typing animation
     * @returns {Promise} Prompt result
     * @private
     */
    async _prompt(message, promptType, type = false) {
        return new Promise(async (resolve) => {
            const shouldDisplayInput = (promptType === this.PROMPT_INPUT || promptType === this.PROMPT_CONFIRM);
            const inputField = document.createElement('input');
            
            // Setup input field
            this._setupInputField(inputField);
            
            this.stdinLine.textContent = '';
            this.stdin.appendChild(inputField);
            this.scrollBottom();

            if (message.length && promptType !== this.PROMPT_PAUSE) {
                const displayMessage = promptType === this.PROMPT_CONFIRM ? `${message} (y/n) ` : `${message} `;
                
                if (type) {
                    await this.type(displayMessage, 10);
                } else {
                    this.write(displayMessage);
                }
            }
            
            this._setupInputHandlers(inputField, promptType, shouldDisplayInput, resolve);
            
            if (this.shouldFocus()) {
                inputField.focus();
            }
        });
    }

    /**
     * Setup input field properties
     * @param {HTMLInputElement} inputField - Input element
     * @private
     */
    _setupInputField(inputField) {
        inputField.setAttribute('autocapitalize', 'none');
        inputField.style.cssText = `
            position: relative;
            z-index: -100;
            outline: none;
            border: none;
            opacity: 0;
            top: 0;
            color: var(--fg);
            font-size: var(--fontSize);
            background-color: transparent;
            font-family: var(--fontFamily);
        `;
    }

    /**
     * Setup input event handlers
     * @param {HTMLInputElement} inputField - Input element
     * @param {number} promptType - Prompt type
     * @param {boolean} shouldDisplayInput - Whether to show input
     * @param {Function} resolve - Promise resolve function
     * @private
     */
    _setupInputHandlers(inputField, promptType, shouldDisplayInput, resolve) {
        inputField.onblur = () => {
            this.stdinLine.classList.remove('blink');
            this.stdinLine.removeAttribute('data-cursor-type');
        };

        inputField.onfocus = () => {
            inputField.value = this.stdinLine.textContent;
            this.stdinLine.classList.add('blink');
            this.stdinLine.setAttribute('data-cursor-type', this.opts.cursorType);
        };

        this.container.onclick = () => {
            if (this.shouldFocus()) {
                inputField.focus();
            }
        };

        inputField.onkeyup = async (e) => {
            const keyCode = e.which || e.keyCode;
            const inputValue = inputField.value;
            
            if (shouldDisplayInput && !this.isKeyEnter(e)) {
                this.stdinLine.textContent = inputValue;
            }

            if (promptType === this.PROMPT_CONFIRM && !this.isKeyEnter(e)) {
                if (!this.isKeyYorN(e)) {
                    this.stdinLine.textContent = inputField.value = '';
                    return;
                }
                if (this.stdinLine.textContent.length > 1) {
                    this.stdinLine.textContent = inputField.value = inputValue.slice(-1);
                }
            }

            if (promptType === this.PROMPT_PAUSE) {
                inputField.blur();
                this.stdin.removeChild(inputField);
                this.scrollBottom();
                resolve();
                return;
            }

            if (this.isKeyEnter(e)) {
                inputField.style.display = 'none';
                
                if (shouldDisplayInput) {
                    this.printHTML(this._promptPS1.innerHTML + inputValue);
                }

                if (promptType === this.PROMPT_CONFIRM) {
                    if (!inputValue.length) return;
                    
                    const confirmChar = inputValue.toUpperCase()[0];
                    if (confirmChar === 'Y') {
                        resolve(true);
                    } else if (confirmChar === 'N') {
                        resolve(false);
                    } else {
                        throw new Error(`Invalid input: ${confirmChar}`);
                    }
                } else {
                    resolve(inputValue);
                }
                
                this.stdinLine.textContent = '';
                this.stdin.removeChild(inputField);
                this.scrollBottom();
            }
        };
    }

    /**
     * Check if key is Enter
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {boolean} True if Enter key
     */
    isKeyEnter(event) {
        return event.keyCode === 13 || event.code === 'Enter';
    }

    /**
     * Check if key is Y or N
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {boolean} True if Y or N key
     */
    isKeyYorN(event) {
        if (event.code) {
            return event.code === 'KeyY' || event.code === 'KeyN';
        }

        let keyCode = event.keyCode || event.which;
        if (event.target && (keyCode === 0 || keyCode === 229)) {
            const val = event.target.value;
            keyCode = val.charCodeAt(val.length - 1);
        }
        return [121, 89, 78, 110].includes(keyCode);
    }

    /**
     * Check if terminal should focus
     * @returns {boolean} True if should focus
     */
    shouldFocus() {
        return this.opts.forceFocus ||
               this.container.matches(':focus-within') ||
               this.container.matches(':hover');
    }

    /**
     * Focus terminal
     * @param {boolean} force - Force focus
     * @returns {TerminalEmulator} Self for chaining
     */
    focus(force = false) {
        const lastChild = this.container.lastElementChild;
        if (lastChild && (this.shouldFocus() || force)) {
            lastChild.focus();
        }
        return this;
    }

    /**
     * Execute command programmatically
     * @param {string} command - Command to execute
     */
    async executeCommand(command) {
        this.command = command;
        await this.processCommand();
    }

    /**
     * Register new command
     * @param {string} name - Command name
     * @param {Object} commandDef - Command definition
     */
    async registerCommand(name, commandDef) {
        this.commands[name] = {
            name,
            type: commandDef.type || 'exec',
            mime: commandDef.mime || 'application/x-sharedlib',
            help: commandDef.help || `No help available for ${name}`,
            func: async (argv) => {
                await commandDef.func(this, argv);
            }
        };
    }

    /**
     * Save preferences
     * @private
     */
    _savePrefs() {
        if (this.prefs) {
            this.prefs.set("prefs", this.opts);
        }
    }

    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Sleep promise
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cleanup resources and event handlers
     */
    destroy() {
        document.removeEventListener("keydown", this._keydownHandler);
        document.removeEventListener("keypress", this._keypressHandler);
        this.container.removeEventListener("click", this._clickHandler);
        
        this._parserCache.clear();
        this._pathCache.clear();
        this.vfs.clearCaches();
        
        if (this._scrollTimeout) {
            cancelAnimationFrame(this._scrollTimeout);
        }
    }
}

export default TerminalEmulator;