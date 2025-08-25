/**
 * @fileoverview Base classes for interactive sessions within the terminal.
 * @module session
 */

/**
 * Base class for an interactive session.
 * A session takes over the terminal's input handling to provide a dedicated
 * environment, like a REPL or a command-specific interactive mode.
 */
export class InteractiveSession {
    /**
     * @param {import('./terminal.js').default} terminal The terminal instance.
     */
    constructor(terminal) {
        /** @protected */
        this.terminal = terminal;
        this.ps1_backup = null;

        /**
         * The prompt to display for this session. Can be a string or a function
         * that returns a string.
         * @type {string|(() => string)}
         */
        this.prompt = '> ';
    }

    /**
     * Handles a line of input from the user.
     * This method is called by the terminal when the user enters a command
     * while this session is active.
     * @param {string} line The line of input.
     * @returns {Promise<void>}
     */
    async handleInput(line) {
        this.terminal.print(`Default session handler received: ${line}`);
    }

    /**
     * Called when the session is activated and pushed onto the session stack.
     * Use this to print welcome messages or set up initial state.
     */
    onEnter() {}

    /**
     * Called when the session is deactivated and popped from the session stack.
     * Use this for cleanup.
     */
    onExit() {}
}

/**
 * Manages the stack of interactive sessions for a terminal.
 */
export class SessionManager {
    constructor() {
        /** @private @type {InteractiveSession[]} */
        this.sessionStack = [];
    }

    /** @param {import('./terminal.js').default} terminal */
    init(terminal) {
        /** @private */
        this.terminal = terminal;
    }

    push(session) {
        this.sessionStack.push(session);
        session.onEnter();
        this.ps1_backup = this.terminal._promptPS1.innerHTML;
        this.terminal.setPrompt(session.prompt);
    }

    pop() {
        const session = this.sessionStack.pop();
        if (session) {
            session.onExit();
        }
        this.terminal.setPrompt(this.ps1_backup);
        this.ps1_backup = null;
    }

    isActive() { return this.sessionStack.length > 0; }
    getCurrent() { return this.sessionStack.length > 0 ? this.sessionStack[this.sessionStack.length - 1] : null; }
}
