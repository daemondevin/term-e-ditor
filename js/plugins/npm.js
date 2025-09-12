import { InteractiveSession } from '../session.js';

export class NPM extends InteractiveSession {
    constructor(terminal) {
        super(terminal);
        this.prompt = '<span class="npm-prompt">npm> </span>';
        this.results = [];
        this.state = 'idle'; // idle | results | pager
        this.page = 0;
        this.query = '';
        this.perPage = 5;

        this.lastPackage = null;   // last viewed package
        this.readmeLines = [];     // split README into lines
        this.readmePage = 0;       // current page index
        this.readmePerPage = 20;   // lines per page
    }

    async handleInput(line) {
        const cmd = line.trim().toLowerCase();

        if (cmd === 'exit' || cmd === 'quit') {
            this.terminal.popSession();
            return;
        }

        if (this.state === 'idle') {
            await this._searchPackages(cmd, 0);
        } else if (this.state === 'results') {
            if (cmd === 'next') {
                await this._searchPackages(this.query, this.page + 1);
                return;
            }
            if (cmd === 'prev') {
                if (this.page > 0) {
                    await this._searchPackages(this.query, this.page - 1);
                } else {
                    this.terminal.printWarning("Already on the first page.");
                }
                return;
            }
            if (cmd === 'readme full') {
                if (this.lastPackage?.readme) {
                    this._startReadmePager(this.lastPackage.readme);
                } else {
                    this.terminal.printWarning("No README available. Select a package first.");
                }
                return;
            }

            const idx = parseInt(cmd, 10);
            if (!isNaN(idx) && idx >= 0 && idx < this.results.length) {
                await this._showPackageDetails(this.results[idx].package.name);
            } else {
                this.terminal.printWarning(`Commands: number, 'next', 'prev', 'readme full', or 'exit'`);
            }
        } else if (this.state === 'pager') {
            if (cmd === '' || cmd === 'next') {
                this._showReadmePage(this.readmePage + 1);
            } else if (cmd === 'prev') {
                this._showReadmePage(this.readmePage - 1);
            } else if (cmd === 'quit' || cmd === 'q' || cmd === 'exit') {
                this.terminal.printInfo("Exiting README pager.");
                this.state = 'results';
            } else {
                this.terminal.printWarning("Pager commands: Enter/'next', 'prev', 'quit'");
            }
        }
    }

    async _searchPackages(query, page = 0) {
        if (!query) {
            this.terminal.printWarning("Usage: type a keyword to search npm");
            return;
        }

        this.query = query;
        this.page = page;
        this.terminal.printInfo(`Searching npm for "${query}" (page ${page + 1})...`);

        try {
            const from = page * this.perPage;
            const res = await fetch(
                `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&from=${from}&size=${this.perPage}`
            );
            const data = await res.json();
            this.results = data.objects;

            if (this.results.length === 0) {
                this.terminal.printWarning("No results found.");
                return;
            }

            this.terminal.newLine();
            this.terminal.print("Results:");
            this.results.forEach((r, i) => {
                this.terminal.printHTML(
                    `<span class="info">[${i}]</span> <b>${r.package.name}</b> - ${r.package.description || "No description"}`
                );
            });

            this.terminal.newLine();
            this.terminal.printInfo("Enter a number to view details.");
            this.terminal.printInfo("Commands: 'next', 'prev', 'readme full', 'exit'");
            this.state = 'results';
        } catch (err) {
            this.terminal.printError(`Search failed: ${err.message}`);
        }
    }

    async _showPackageDetails(name) {
        this.terminal.printInfo(`Fetching details for ${name}...`);
        try {
            const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
            const data = await res.json();

            this.lastPackage = data;

            const author = data.author?.name || "Unknown";
            this.terminal.newLine();
            this.terminal.printHTML(`<b>${data.name}</b> v${data.version}<br>Author: ${author}`);
            this.terminal.newLine();

            if (data.readme) {
                const preview = data.readme.split("\n").slice(0, 20).join("\n");
                this.terminal.printHTML(`<pre>${preview}</pre>`);
                this.terminal.printInfo("...truncated README (type 'readme full' to view all)");
            } else {
                this.terminal.printWarning("No README available.");
            }
        } catch (err) {
            this.terminal.printError(`Failed to fetch details: ${err.message}`);
        }
    }

    _startReadmePager(readme) {
        this.readmeLines = readme.split("\n");
        this.readmePage = 0;
        this.state = 'pager';
        this._showReadmePage(0);
    }

    _showReadmePage(page) {
        if (page < 0 || page * this.readmePerPage >= this.readmeLines.length) {
            this.terminal.printWarning("No more pages.");
            return;
        }

        this.readmePage = page;
        const start = page * this.readmePerPage;
        const end = start + this.readmePerPage;
        const chunk = this.readmeLines.slice(start, end).join("\n");

        // Unix `more` behavior: clear screen before showing
        this.terminal.clear();
        this.terminal.printHTML(`<pre>${chunk}</pre>`);
        this.terminal.printInfo(
            `Page ${page + 1} of ${Math.ceil(this.readmeLines.length / this.readmePerPage)} — press Enter/'next' for more, 'prev' for back, 'quit' to exit.`
        );
    }

    onEnter() {
        this.terminal.printHTML('<span class="info">NPM Search Session started. Type a keyword to search. Type exit to quit.</span>');
    }

    onExit() {
        this.terminal.printHTML('<span class="info">Exiting NPM Search Session...</span>');
    }
}
