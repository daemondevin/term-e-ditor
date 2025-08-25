import { InteractiveSession } from '../session.js';

/**
 * Text editor session example
 */
export class TextEditor extends InteractiveSession {
    constructor(terminal, filename = 'untitled.txt') {
        super(terminal);
        this.filename = filename;
        this.content = [];
        this.currentLine = 0;
        this.prompt = ':';
        this.mode = 'command'; // 'command' or 'insert'
    }

    async handleInput(line) {
        if (this.mode === 'command') {
            await this._handleCommand(line);
        } else {
            await this._handleInsert(line);
        }
    }

    async _handleCommand(line) {
        const cmd = line.trim();
        
        switch (cmd) {
            case 'q':
            case 'quit':
                this.terminal.popSession();
                break;
            case 'w':
            case 'write':
                await this._saveFile();
                break;
            case 'wq':
                await this._saveFile();
                this.terminal.popSession();
                break;
            case 'i':
            case 'insert':
                this.mode = 'insert';
                this.terminal.setPrompt('-- INSERT --');
                this.terminal.printHTML('<span class="editor-mode">-- INSERT MODE -- (Ctrl+C to exit insert mode)</span>');
                break;
            case 'l':
            case 'list':
                this._showContent();
                break;
            default:
                this.terminal.printHTML(`<span class="error">Unknown command: ${cmd}</span>`);
                this.terminal.printHTML('<span class="info">Commands: i(nsert), w(rite), q(uit), wq, l(ist)</span>');
        }
    }

    async _handleInsert(line) {
        // In a real editor, you'd handle Ctrl+C differently
        // This is a simplified version where typing 'ESC' exits insert mode
        if (line.trim() === 'ESC') {
            this.mode = 'command';
            this.terminal.setPrompt(this.prompt);
            this.terminal.printHTML('<span class="editor-mode">-- COMMAND MODE --</span>');
        } else {
            this.content.push(line);
            this.terminal.printHTML(`<span class="editor-line">${this.content.length}: ${line}</span>`);
        }
    }

    _showContent() {
        if (this.content.length === 0) {
            this.terminal.printHTML('<span class="info">[Empty file]</span>');
        } else {
            this.content.forEach((line, index) => {
                this.terminal.printHTML(`<span class="editor-line">${index + 1}: ${line}</span>`);
            });
        }
    }

    async _saveFile() {
        // In a real implementation, you'd save to the VFS
        try {
            const fileContent = this.content.join('\n');
            // this.terminal.vfs.writeFile(this.filename, fileContent);
            this.terminal.printHTML(`<span class="success">"${this.filename}" written (${this.content.length} lines)</span>`);
        } catch (error) {
            this.terminal.printHTML(`<span class="error">Failed to save: ${error.message}</span>`);
        }
    }

    onEnter() {
        this.terminal.printHTML(`<span class="info">Simple text editor - editing "${this.filename}"</span>`);
        this.terminal.printHTML('<span class="info">Commands: i(nsert), w(rite), q(uit), wq, l(ist)</span>');
    }

    onExit() {
        this.terminal.printHTML(`<span class="info">Closing editor...</span>`);
    }
}