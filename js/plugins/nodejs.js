import { InteractiveSession } from '../session.js';

export class NodeJS extends InteractiveSession {
    constructor(term) {
        super(term);
        this.prompt = '> ';
        // WARNING: This uses `new Function` and `with`, which is not safe for production.
        // This is for demonstration purposes in a mock environment.
        this.context = { Math };
    }

    onEnter() {
        this.terminal
            .print('Welcome to Node.js v22.17.1 (REPL).')
            .print('Type ".exit" to exit.');
    }

    async handleInput(line) {
        const command = line.trim();
        if (command === '.exit') {
            this.terminal.popSession();
            return;
        }
        if (!command) return;

        try {
            // This is a mock and only evaluates simple expressions.
            const result = new Function('context', `with(context) { return ${command} }`)(this.context);
            this.terminal.print(String(result));
        } catch (e) {
            this.terminal.printError(e.message);
        }
    }
}

