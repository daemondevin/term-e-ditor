import { InteractiveSession } from '../session.js';

export class Composer extends InteractiveSession {
    constructor(terminal) {
        super(terminal);
        this.prompt = '<span class="composer-prompt">composer> </span>';
        this.state = 'idle';
        this.currentList = [];
        this.listPage = 0;
        this.listPerPage = 5;
        this.currentItem = null;
        this.listType = null;
    }

    printHeader() {
        this.header = [
            "   ______                                           ",
            "  / ____/___  ____ ___  ____  ____  ________  _____ ",
            " / /   / __ \\/ __ `__ \\/ __ \\/ __ \\/ ___/ _ \\/ ___/ ",
            "/ /___/ /_/ / / / / / / /_/ / /_/ (__  )  __/ /     ",
            "\\____/\\____/_/ /_/ /_/ .___/\\____/____/\\___/_/     ",
            "                    /_/                            ",
            "Composer version 2.8.10 2025-07-10 19:08:33        "
        ].join('\n') + '\n\n';
        this.terminal.print(this.header);
    }

    async handleInput(line) {
        const cmd = line.trim().toLowerCase();
        if (!cmd) return;

        if (this.state === 'list') {
            if (cmd === 'next') return this._showListPage(this.listPage + 1);
            if (cmd === 'prev') return this._showListPage(this.listPage - 1);
            if (cmd === 'quit' || cmd === 'exit') {
                this.state = 'idle';
                this.terminal.printInfo(`Exited package list view.`);
                return;
            }
            const idx = parseInt(cmd, 10);
            if (!isNaN(idx)) {
                const item = this.currentList[this.listPage * this.listPerPage + idx];
                if (item) {
                    await this._showDetail(item);
                } else {
                    this.terminal.printWarning(`Invalid index: ${cmd}`);
                }
                return;
            }
            this.terminal.printWarning("List commands: index number, 'next', 'prev', 'quit'");
            return;
        }

        if (this.state === 'detail') {
            if (cmd === 'back') {
                this.state = 'list';
                this._showListPage(this.listPage);
                return;
            }
            if (cmd === 'quit' || cmd === 'exit') {
                this.state = 'idle';
                this.terminal.printInfo("Exited detail view.");
                return;
            }
            this.terminal.printWarning("Detail commands: 'back', 'quit'");
            return;
        }

        // idle mode
        const [main, ...args] = line.trim().split(/\s+/);
        switch (main) {
            case 'exit':
            case 'quit':
                this.terminal.popSession();
                return;

            case 'search':
                await this._search(args.join(" "));
                break;

            default:
                this.terminal.printWarning("Commands: search <query>, exit");
        }
    }

    async _search(query) {
        if (!query) {
            this.terminal.printWarning("Usage: search <query>");
            return;
        }

        try {
            const url = `https://packagist.org/search.json?q=${encodeURIComponent(query)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (!data.results.length) {
                this.terminal.printWarning("No packages found.");
                return;
            }

            this.currentList = data.results;
            this.listPage = 0;
            this.listType = "packages";
            this.state = 'list';
            this._showListPage(0);
        } catch (err) {
            this.terminal.printError(`Failed: ${err.message}`);
        }
    }

    _showListPage(page) {
        if (page < 0 || page * this.listPerPage >= this.currentList.length) {
            this.terminal.printWarning("No more pages.");
            return;
        }

        this.listPage = page;
        this.terminal.clear();
        this.printHeader();
        this.terminal.printInfo(
            `Packages (page ${page + 1} of ${Math.ceil(this.currentList.length / this.listPerPage)})`
        );

        const start = page * this.listPerPage;
        const end = start + this.listPerPage;
        const slice = this.currentList.slice(start, end);

        slice.forEach((pkg, i) => {
            this.terminal.printHTML(
                `<b>[${i}] ${pkg.name}</b> — ${pkg.description || "No description"}`
            );
        });

        this.terminal.newLine();
        this.terminal.printInfo("Commands: index number, 'next', 'prev', 'quit'");
    }

    async _showDetail(item) {
        try {
            const url = `https://repo.packagist.org/p2/${item.name}.json`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const versions = data.packages[item.name];
            const latest = versions[0];

            this.state = 'detail';
            this.currentItem = item;
            this.terminal.clear();
            this.printHeader();

            this.terminal.printHTML(
                `<b>${item.name}</b><br>
                 Description: ${item.description || "No description"}<br>
                 Latest: ${latest.version}<br>
                 ${latest.homepage ? `Homepage: <a href="${latest.homepage}" target="_blank">${latest.homepage}</a><br>` : ""}
                 ${latest.source?.url ? `Source: <a href="${latest.source.url}" target="_blank">${latest.source.url}</a><br>` : ""}`
            );

            if (latest.authors) {
                this.terminal.printHTML("<b>Authors:</b><br>");
                latest.authors.forEach(a => {
                    this.terminal.printHTML(`- ${a.name || "Unknown"} ${a.email || ""}`);
                });
            }

            if (latest.require) {
                this.terminal.printHTML("<b>Requires:</b><br>");
                Object.entries(latest.require).forEach(([dep, ver]) => {
                    this.terminal.printHTML(`- ${dep}: ${ver}`);
                });
            }

            if (latest['require-dev']) {
                this.terminal.printHTML("<b>Dev Requires:</b><br>");
                Object.entries(latest['require-dev']).forEach(([dep, ver]) => {
                    this.terminal.printHTML(`- ${dep}: ${ver}`);
                });
            }

            this.terminal.newLine();
            this.terminal.printInfo("Detail view — Commands: 'back', 'quit'");
        } catch (err) {
            this.terminal.printError(`Failed: ${err.message}`);
        }
    }

    onEnter() {
        this.printHeader();
        this.terminal.printHTML('<span class="info">Composer Session started. Commands: search <query>, exit</span>');
    }

    onExit() {
        this.terminal.printHTML('<span class="info">Exiting Composer Session...</span>');
    }
}
