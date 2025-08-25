import { InteractiveSession } from '../session.js';

/**
 * Python REPL session
 */
export class PythonREPL extends InteractiveSession {
    constructor(terminal) {
        super(terminal);
        this.prompt = '<span class="python-prompt">>>> </span>';
        this.multilinePrompt = '<span class="python-prompt">... </span>';
        this.buffer = '';
        this.inMultiline = false;
    }

    async handleInput(line) {
        // Handle exit commands
        if (line.trim() === 'exit()' || line.trim() === 'quit()') {
            this.terminal.popSession();
            return;
        }

        // Simple multiline detection (very basic)
        if (line.endsWith(':') || this.inMultiline) {
            this.buffer += line + '\n';
            this.inMultiline = true;
            
            // If line is empty, execute the buffer
            if (line.trim() === '') {
                await this._executePython(this.buffer);
                this.buffer = '';
                this.inMultiline = false;
                this.terminal.setPrompt();
            } else {
                this.terminal.setPrompt(this.multilinePrompt);
            }
        } else {
            // Execute single line
            await this._executePython(line);
        }
    }

    async _executePython(code) {
        // This is a mock Python interpreter
        // In a real implementation, you'd send this to a Python backend
        try {
            // Simple arithmetic evaluation
            if (/^[\d\s+\-*/.()]+$/.test(code.trim())) {
                const result = eval(code.trim());
                this.terminal.printHTML(`<span class="python-output">${result}</span>`);
            } else if (code.trim().startsWith('print(')) {
                // Extract content from print()
                const match = code.match(/print\((.*)\)/);
                if (match) {
                    let content = match[1];
                    // Remove quotes if present
                    content = content.replace(/^["']|["']$/g, '');
                    this.terminal.printHTML(`<span class="python-output">${content}</span>`);
                }
            } else {
                this.terminal.printHTML(`<span class="python-output"># Executed: ${code}</span>`);
            }
        } catch (error) {
            this.terminal.printHTML(`<span class="error">Python Error: ${error.message}</span>`);
        }
    }

    onEnter() {
        this.terminal.printHTML('<span class="info">Python 3.9.0 REPL started. Type exit() to quit.</span>');
    }

    onExit() {
        this.terminal.printHTML('<span class="info">Exiting Python REPL...</span>');
    }
}