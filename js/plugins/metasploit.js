/**
 * metasploit.js
 * A safe, non-actionable mock Metasploit-style REPL.
 *
 * IMPORTANT: This is purely a UI/learning mock. It performs no network activity,
 * produces no real exploits/payloads, and contains only placeholder text.
 */

import { InteractiveSession } from '../session.js';

export class Metasploit extends InteractiveSession {
    constructor(terminal) {
        super(terminal);
        this.prompt = '<span class="msf-prompt">msf> </span>';

        // Session state
        this.state = 'idle'; // idle | module (when a module is 'used') | running
        this.module = null; // currently 'used' module (object)
        this.moduleOptions = {}; // options set by the user
        this.sessions = []; // fake sessions (post-exploitation)
        this.fakeModules = this._buildFakeModuleIndex(); // small fake DB
    }
    
    printHeader() {
        this.header = [
            "                                  ::::::::::::::                       ",                    
            "                  ::-==++*********************************++=--:       ",                    
            "            =+*******************************************************=:",                    
            "           :+********************************************************+:",                    
            "           :+***+          :+************************=          =****+:",                    
            "           :+***+             :+******************=             =****+:",                    
            "           :+***+                :=***********+-                =****+:",                    
            "           :+***+                    =******-                   =****+:",                    
            "           :+***+                       =:                      =****+:",                    
            "           :+***+         =*-                        =*:        =****+:",                    
            "           :+***+         =****=:                -+****:        =****+:",                    
            "           :+***+         =*******+:         :+********:        =****+:",                    
            "           :+***+         =*********:       :+*********:        =****+:",                    
            "           :+***+         =*********:       :+*********:        =****+:",                    
            "           :+****         =*********:       :+*********:        =****+:",                    
            "           :+****         =*********:       :+*********:        +****+:",                    
            "           :+****=        =*********:       :+*********:        *****+:",                    
            "            -+****-       =****************************:       +*****- ",                    
            "              +****+:     =****************************:     =*****+   ",                    
            "                =****+-   =****************************:  :+*****-     ",                    
            "                  :=****+-=****************************:=*****=:       ",                    
            "                     :=+**********************************+-           ",                    
            "                         :+****************************+:              ",                    
            "                             -**********************=                  ",                    
            "                                :=+*************+-                     ",                    
            "                                    -+******+-                         ",                    
            "                                        ::                             "
        ].join('\n') + '\n\n';                    

        this.terminal.print(this.header);
    }
    
    onEnter() {
        this.terminal.clear();
        this.printHeader();
        this.terminal.printHTML('<span class="info">Metasploit REPL started. Type `help` for commands. Type `exit` to quit.</span>');
    }

    onExit() {
        this.terminal.printHTML('<span class="info">Exiting Metasploit REPL...</span>');
    }

    async handleInput(line) {
        const raw = line.trim();
        if (!raw) return;

        // Global exit
        if (raw.toLowerCase() === 'exit' || raw.toLowerCase() === 'quit') {
            this.terminal.popSession();
            return;
        }

        // Basic parsing: split first token
        const [cmd, ...rest] = raw.split(/\s+/);
        const argline = rest.join(' ');

        // If a module is active, allow module-specific verbs
        if (this.state === 'module') {
            switch (cmd.toLowerCase()) {
                case 'info':
                    this._cmdInfo();
                    return;
                case 'set':
                    this._cmdSet(argline);
                    return;
                case 'show':
                    return this._cmdShow(argline);
                case 'run':
                case 'exploit':
                case 'launch':
                    return this._cmdRun();
                case 'back':
                case 'unset':
                    if (cmd.toLowerCase() === 'unset') { this._cmdUnset(argline); return; }
                    this._cmdBack();
                    return;
                case 'help':
                    this._printModuleHelp();
                    return;
                default:
                    // allow global commands even when module is active
                    break;
            }
        }

        // Global commands
        switch (cmd.toLowerCase()) {
            case 'help':
                this._printHelp();
                break;
            case 'search':
                this._cmdSearch(argline);
                break;
            case 'use':
                this._cmdUse(argline);
                break;
            case 'show':
                this._cmdShow(argline);
                break;
            case 'sessions':
                this._cmdSessions();
                break;
            case 'version':
                this.terminal.printInfo('Metasploit Mock v0.1 (safe mock)');
                break;
            default:
                this.terminal.printWarning(`Unknown command: ${cmd}. Type 'help' for a list.`);
        }
    }

    /* -------------------------
       Fake module database
       ------------------------- */
    _buildFakeModuleIndex() {
        return {
            'exploit/mock/http_bad_cookie': {
                name: 'exploit/mock/http_bad_cookie',
                type: 'exploit',
                description: 'Mock HTTP cookie parsing overflow (purely fictional).',
                author: 'mock_author',
                platform: 'linux',
                defaultOptions: {
                    RHOST: { value: '192.0.2.123', desc: 'Target IP (example)', required: true },
                    RPORT: { value: 8080, desc: 'Target port', required: true },
                    VERBOSE: { value: false, desc: 'Verbose mock output', required: false }
                }
            },
            'auxiliary/mock/scanner/slow_ping': {
                name: 'auxiliary/mock/scanner/slow_ping',
                type: 'auxiliary',
                description: 'Mock scanner that simulates discovering trivial hosts.',
                author: 'mock_scanner',
                platform: 'all',
                defaultOptions: {
                    RHOSTS: { value: '192.0.2.0/29', desc: 'Targets', required: true },
                    THREADS: { value: 2, desc: 'Number of mock threads', required: false }
                }
            },
            'payload/mock/shell_reverse': {
                name: 'payload/mock/shell_reverse',
                type: 'payload',
                description: 'Mock reverse shell payload that prints a placeholder string.',
                author: 'mock_payload',
                platform: 'unix',
                defaultOptions: {
                    LHOST: { value: '198.51.100.10', desc: 'Listener IP (example)', required: true },
                    LPORT: { value: 4444, desc: 'Listener port', required: true }
                }
            }
        };
    }

    /* -------------------------
       Helper: safe printing
       ------------------------- */
    _printKeyValues(obj) {
        for (const [k, v] of Object.entries(obj)) {
            this.terminal.printHTML(`<b>${k}</b>: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`);
        }
    }

    /* -------------------------
       Help text
       ------------------------- */
    _printHelp() {
        this.terminal.clear();
        this.printHeader();
        this.terminal.newLine();
        this.terminal.printHTML(`<b>Common commands</b>:
- search <term>                  : Search module index
- use <module>                     : Select a module
- show modules             : List available modules
- show options             : Show options for active module
- sessions                 : List active sessions
- help                     : Show this help
- exit                     : Quit REPL
`);
        if (this.state === 'module') {
            this._printModuleHelp();
        }
    }

    _printModuleHelp() {
        this.terminal.clear();
        this.printHeader();
        this.terminal.newLine();
        this.terminal.printHTML(`<b>Module commands (when a module is in use)</b>:
- info                     : Show module information
- set <option> <value>     : Set a module option (mock-only)
- unset <option>           : Remove a custom option (revert to default)
- show options             : Show current module options
- run | exploit | launch   : Execute simulated run (no real network actions)
- back                     : Exit module (return to top-level)
`);
    }

    /* -------------------------
       Command: search
       ------------------------- */
    _cmdSearch(argline) {
        if (!argline) {
            this.terminal.printWarning('Usage: search <term>');
            return;
        }
        const q = argline.toLowerCase();
        const results = Object.values(this.fakeModules).filter(m => {
            return m.name.includes(q) || (m.description && m.description.toLowerCase().includes(q));
        });

        if (!results.length) {
            this.terminal.printWarning('No modules matched your query.');
            return;
        }

        this.terminal.printInfo(`Found ${results.length} modules:`);
        results.forEach((m, i) => {
            this.terminal.printHTML(`<b>[${i}]</b> ${m.name} — ${m.description}`);
        });
        this.terminal.printInfo("Tip: `use <module_name>` to select a module (e.g. use exploit/mock/http_bad_cookie)");
    }

    /* -------------------------
       Command: use <module>
       ------------------------- */
    _cmdUse(moduleName) {
        if (!moduleName) {
            this.terminal.printWarning('Usage: use <module>');
            return;
        }
        const m = this.fakeModules[moduleName];
        if (!m) {
            this.terminal.printWarning(`Module not found: ${moduleName}`);
            return;
        }
        this.module = JSON.parse(JSON.stringify(m)); // clone to allow option changes
        // initialize options with defaults
        this.moduleOptions = {};
        for (const [k, v] of Object.entries(this.module.defaultOptions || {})) {
            this.moduleOptions[k] = { value: v.value, desc: v.desc, required: v.required };
        }
        this.state = 'module';
        this.terminal.printSuccess(`Using module: ${this.module.name}`);
        this.terminal.printInfo("Type 'show options' to view module options, 'info' for module details.");
    }

    /* -------------------------
       Command: info
       ------------------------- */
    _cmdInfo() {
        if (!this.module) {
            this.terminal.printWarning('No module selected. Use `use <module>`.');
            return;
        }
        this.terminal.printHTML(`<b>${this.module.name}</b> — ${this.module.description}`);
        this.terminal.printHTML(`<b>Type:</b> ${this.module.type}   <b>Platform:</b> ${this.module.platform}   <b>Author:</b> ${this.module.author}`);
        this.terminal.newLine();
        this.terminal.printHTML('<b>Default options</b>:');
        for (const [k, v] of Object.entries(this.module.defaultOptions)) {
            this.terminal.printHTML(`<b>${k}</b> : ${v.value} — ${v.desc} ${v.required ? '(required)' : ''}`);
        }
    }

    /* -------------------------
       Command: show <x>
       ------------------------- */
    _cmdShow(argline) {
        const sub = (argline || '').toLowerCase();
        if (sub === 'modules') {
            this.terminal.printInfo('Available modules:');
            Object.values(this.fakeModules).forEach(m => {
                this.terminal.printHTML(`<b>${m.name}</b> — ${m.description}`);
            });
            return;
        }
        if (sub === 'options' || (!sub && this.state === 'module')) {
            if (!this.module) {
                this.terminal.printWarning('No module selected.');
                return;
            }
            this.terminal.printHTML(`<b>Current options for ${this.module.name}</b>`);
            for (const [k, v] of Object.entries(this.moduleOptions)) {
                this.terminal.printHTML(`<b>${k}</b> : ${v.value} — ${v.desc} ${v.required ? '(required)' : ''}`);
            }
            return;
        }
        this.terminal.printWarning(`Unknown show command: ${argline}. Try 'show modules' or 'show options'.`);
    }

    /* -------------------------
       Command: set <option> <value>
       ------------------------- */
    _cmdSet(argline) {
        if (!this.module) {
            this.terminal.printWarning('No module selected.');
            return;
        }
        const [opt, ...rest] = argline.split(/\s+/);
        if (!opt || rest.length === 0) {
            this.terminal.printWarning('Usage: set <OPTION> <VALUE>');
            return;
        }
        const value = rest.join(' ');
        if (!this.moduleOptions[opt]) {
            // allow adding custom option (mock only)
            this.moduleOptions[opt] = { value: value, desc: 'custom option', required: false };
            this.terminal.printSuccess(`Set custom option ${opt} = ${value}`);
            return;
        }
        this.moduleOptions[opt].value = this._coerceValue(value);
        this.terminal.printSuccess(`Set ${opt} = ${this.moduleOptions[opt].value}`);
    }

    _cmdUnset(argline) {
        if (!this.module) { this.terminal.printWarning('No module selected.'); return; }
        const opt = argline.trim();
        if (!opt) { this.terminal.printWarning('Usage: unset <OPTION>'); return; }
        if (this.module.defaultOptions && this.module.defaultOptions[opt]) {
            // revert to default
            this.moduleOptions[opt].value = this.module.defaultOptions[opt].value;
            this.terminal.printInfo(`Reverted ${opt} to default value ${this.moduleOptions[opt].value}`);
            return;
        }
        if (this.moduleOptions[opt]) {
            delete this.moduleOptions[opt];
            this.terminal.printInfo(`Removed custom option ${opt}`);
            return;
        }
        this.terminal.printWarning(`Option not found: ${opt}`);
    }

    _coerceValue(v) {
        // Basic coercion for booleans/numbers in mock
        if (/^(true|false)$/i.test(v)) return v.toLowerCase() === 'true';
        if (/^\d+$/.test(v)) return Number(v);
        return v;
    }

    /* -------------------------
       Command: run / exploit / launch (simulated)
       ------------------------- */
    _cmdRun() {
        if (!this.module) {
            this.terminal.printWarning('No module selected.');
            return;
        }

        // Check required options are set (mock check)
        for (const [k, opt] of Object.entries(this.moduleOptions)) {
            if (opt.required && (opt.value === null || opt.value === undefined || String(opt.value) === '')) {
                this.terminal.printError(`Required option ${k} is not set.`);
                return;
            }
        }

        // Simulate a run with staged fake output
        this.state = 'running';
        this.terminal.printInfo(`[*] Running ${this.module.name} ...`);
        this.terminal.printHTML(`<pre>
-- RUN OUTPUT START --
Connecting to ${this.moduleOptions.RHOST?.value || this.moduleOptions.RHOST || 'TARGET'}:${this.moduleOptions.RPORT?.value || this.moduleOptions.RPORT || 'PORT'}
Sending crafted payload (placeholder)...
Payload returned: OK
-- RUN OUTPUT END --
</pre>
`);
        // Simulate a successful 'session' creation for demonstration
        const fakeId = this.sessions.length + 1;
        this.sessions.push({
            id: fakeId,
            type: 'shell',
            host: this.moduleOptions.RHOST?.value || '192.0.2.123',
            created_at: new Date().toISOString()
        });
        this.terminal.printSuccess(`[+] Session opened: id ${fakeId}`);
        this.state = 'module';
    }

    /* -------------------------
       Command: sessions
       ------------------------- */
    _cmdSessions() {
        if (!this.sessions.length) {
            this.terminal.printWarning('No active sessions.');
            return;
        }
        this.terminal.printHTML('<b>Active sessions</b>');
        this.sessions.forEach(s => {
            this.terminal.printHTML(`<b>${s.id}</b> ${s.type} — host: ${s.host} — created: ${s.created_at}`);
        });
        this.terminal.printInfo("This is mock data only.");
    }

    /* -------------------------
       Command: back (exit module)
       ------------------------- */
    _cmdBack() {
        this.module = null;
        this.moduleOptions = {};
        this.state = 'idle';
        this.terminal.printInfo('Returned to top-level.');
    }
}
