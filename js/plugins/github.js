import { InteractiveSession } from '../session.js';

export class GitHubCli extends InteractiveSession {
    constructor(terminal) {
        super(terminal);
        this.prompt = '<span class="github-prompt">github> </span>';
        this.state = 'idle';
        this.currentList = [];
        this.listPage = 0;
        this.listPerPage = 5;
        this.listType = null;
        this.currentItem = null; // For detail view
    }
    
    printHeader() {
        this.header = `` +
            `┌───────┌──┌──┐ ┌───┌───┐     ┌──┐   \n` +
            `|       ├──|  └─|   |   ├──┐──|  └──┐\n` +
            `|   ┌───|  |   ─│   ╵   |  ╵  |  ─  |\n` +
            `|   |   ├──└────|   _   ├─────└─────┘\n` +
            `|   └─  |       |   |   |  Terminal  \n` +
            `|       |       |   |   |    v.1.0.0 \n` +
            `└───────┘       └───└───┘            \n\n`,
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
                this.terminal.printInfo(`Exited ${this.listType} list view.`);
                return;
            }

            const idx = parseInt(cmd, 10);
            if (!isNaN(idx)) {
                const item = this.currentList[this.listPage * this.listPerPage + idx];
                if (item) {
                    this._showDetail(item);
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

        // Normal idle mode
        const [main, ...args] = line.trim().split(/\s+/);
        switch (main) {
            case 'exit':
            case 'quit':
                this.terminal.popSession();
                return;

            case 'user':
                await this._fetchUser(args[0]);
                break;

            case 'repo':
                await this._fetchRepo(args[0]);
                break;

            case 'issues':
                await this._fetchList(`https://api.github.com/repos/${args[0]}/issues`, 'issues');
                break;

            case 'pulls':
                await this._fetchList(`https://api.github.com/repos/${args[0]}/pulls`, 'pull requests');
                break;

            case 'commits':
                await this._fetchList(`https://api.github.com/repos/${args[0]}/commits`, 'commits');
                break;

            case 'releases':
                await this._fetchList(`https://api.github.com/repos/${args[0]}/releases`, 'releases');
                break;

            case 'search':
                await this._handleSearch(args);
                break;

            default:
                this.terminal.printWarning(
                    "Commands: user, repo, issues, pulls, commits, releases, search repos|users, exit"
                );
        }
    }

    async _fetchUser(username) {
        if (!username) {
            this.terminal.printWarning("Usage: user <username>");
            return;
        }
        await this._fetchAndPrint(`https://api.github.com/users/${username}`, data => {
            this.terminal.printHTML(
                `<b>${data.login}</b> (${data.name || "No name"})<br>
                 Followers: ${data.followers}, Following: ${data.following}<br>
                 Public Repos: ${data.public_repos}<br>
                 Bio: ${data.bio || "No bio"}<br>
                 Profile: <a href="${data.html_url}" target="_blank">${data.html_url}</a>`
            );
        });
    }

    async _fetchRepo(repo) {
        if (!repo || !repo.includes("/")) {
            this.terminal.printWarning("Usage: repo <owner>/<name>");
            return;
        }
        await this._fetchAndPrint(`https://api.github.com/repos/${repo}`, data => {
            this.terminal.printHTML(
                `<b>${data.full_name}</b><br>
                 ${data.stargazers_count} | 🍴 ${data.forks_count} | ${data.watchers_count}<br>
                 Issues: ${data.open_issues_count}<br>
                 Default Branch: ${data.default_branch}<br>
                 Description: ${data.description || "No description"}<br>
                 Repo: <a href="${data.html_url}" target="_blank">${data.html_url}</a>`
            );
        });
    }

    async _fetchList(url, type) {
        await this._fetchAndPrint(url, data => {
            if (!data.length) {
                this.terminal.printWarning(`No ${type}.`);
                return;
            }
            this.currentList = data;
            this.listPage = 0;
            this.listType = type;
            this.state = 'list';
            this._showListPage(0);
        });
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
            `${this.listType} (page ${page + 1} of ${Math.ceil(this.currentList.length / this.listPerPage)})`
        );

        const start = page * this.listPerPage;
        const end = start + this.listPerPage;
        const slice = this.currentList.slice(start, end);

        slice.forEach((item, i) => {
            if (this.listType === 'issues' || this.listType === 'pull requests') {
                this.terminal.printHTML(`<b>[${i}] #${item.number}</b> ${item.title} — ${item.user.login}`);
            } else if (this.listType === 'commits') {
                this.terminal.printHTML(`<b>[${i}] ${item.sha.substring(0, 7)}</b> ${item.commit.message}`);
            } else if (this.listType === 'releases') {
                this.terminal.printHTML(`<b>[${i}] ${item.name || item.tag_name}</b> — ${item.published_at}`);
            } else if (this.listType === 'repos') {
                this.terminal.printHTML(`<b>[${i}] ${item.full_name}</b> — ${item.description || "No description"}`);
            } else if (this.listType === 'users') {
                this.terminal.printHTML(`<b>[${i}] ${item.login}</b> — <a href="${item.html_url}" target="_blank">${item.html_url}</a>`);
            }
        });

        this.terminal.newLine();
        this.terminal.printInfo("Commands: index number, 'next', 'prev', 'quit'");
    }

    _showDetail(item) {
        this.state = 'detail';
        this.currentItem = item;
        this.terminal.clear();
        this.printHeader();

        if (this.listType === 'issues' || this.listType === 'pull requests') {
            this.terminal.printHTML(
                `<b>#${item.number}</b> ${item.title}<br>
                 State: ${item.state}<br>
                 By: ${item.user.login}<br>
                 ${item.body ? `<pre>${item.body.slice(0, 500)}</pre>` : "No body"}`
            );
        } else if (this.listType === 'commits') {
            this.terminal.printHTML(
                `<b>${item.sha}</b><br>
                 Author: ${item.commit.author.name}<br>
                 Date: ${item.commit.author.date}<br>
                 <pre>${item.commit.message}</pre>`
            );
        } else if (this.listType === 'releases') {
            this.terminal.printHTML(
                `<b>${item.name || item.tag_name}</b><br>
                 Published: ${item.published_at}<br>
                 <pre>${item.body?.slice(0, 500) || "No description"}</pre>`
            );
        } else if (this.listType === 'repos') {
            this.terminal.printHTML(
                `<b>${item.full_name}</b><br>
                 Stars: ${item.stargazers_count}, Forks: ${item.forks_count}<br>
                 <pre>${item.description || "No description"}</pre>`
            );
        } else if (this.listType === 'users') {
            this.terminal.printHTML(
                `<b>${item.login}</b><br>
                 Profile: <a href="${item.html_url}" target="_blank">${item.html_url}</a>`
            );
        }

        this.terminal.newLine();
        this.terminal.printInfo("Detail view — Commands: 'back', 'quit'");
    }

    async _handleSearch(args) {
        if (args.length < 2) {
            this.terminal.printWarning("Usage: search repos <query> OR search users <query>");
            return;
        }
        const type = args[0];
        const query = args.slice(1).join(" ");

        if (type === 'repos') {
            await this._fetchAndPrint(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`, data => {
                this.currentList = data.items;
                this.listPage = 0;
                this.listType = 'repos';
                this.state = 'list';
                this._showListPage(0);
            });
        } else if (type === 'users') {
            await this._fetchAndPrint(`https://api.github.com/search/users?q=${encodeURIComponent(query)}`, data => {
                this.currentList = data.items;
                this.listPage = 0;
                this.listType = 'users';
                this.state = 'list';
                this._showListPage(0);
            });
        } else {
            this.terminal.printWarning("Search type must be 'repos' or 'users'");
        }
    }

    async _fetchAndPrint(url, callback) {
        try {
            const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            callback(data);
        } catch (err) {
            this.terminal.printError(`Failed: ${err.message}`);
        }
    }

    onEnter() {
        this.printHeader();
        this.terminal.printHTML('<span class="info">GitHub Session started.\nCommands: user, repo, issues, pulls, commits, releases, search repos|users, exit</span>');
    }

    onExit() {
        this.terminal.printHTML('<span class="info">Exiting GitHub Session...</span>');
    }
}
