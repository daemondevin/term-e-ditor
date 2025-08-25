import { InteractiveSession } from '../session.js';

export class GitHubCli extends InteractiveSession {
    constructor(terminal, user) {
        super(terminal);
        this.user = user;
        this.gitLoc = `~/github/${this.user}`;
        this.prompt = this.gitLoc + ' $ ';
        self = this;
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
    
    cmd = {
        help: {
            func: async function(argv) {
                self.terminal.printHTML(`Available commands: whois, open, gitk, help, ls, cd, clear, git`);
                self.terminal.newLine();
            },
            help: "<span class=\"cmd\">help</span>: Shows available commands"
        },
        
        whois: {
            func: async function(argv) {
                    const company = self.gitUserData.company || "No Company";
                    const name = self.gitUserData.name || self.gitUserData.login;
                    const blog = self.gitUserData.blog || "No Blog";
                    const url = self.gitUserData.blog || "#";
                    self.terminal.print(`${name}, ${company} (${self.gitUserData.login})`);
                    self.terminal.print(`Blog: ${url}`);
                    if (self.gitUserData.email) {
                        self.terminal.print(`Email: ${self.gitUserData.email}`);
                    }
            },
            help: "<span class=\"cmd\">whois</span>: Display information about the current user"
        },

        open: {
            func: async function(argv) {
                const where = self.gitLoc.split("/");
                if (where.length === 3) {
                    window.open(`http://github.com/${self.gitUserData.login}`);
                } else {
                    window.open(`http://github.com/${self.gitUserData.login}/${where[3]}`);
                }
            },
            help: "<span class=\"cmd\">open</span>: Open current location in a new window"
        },

        gitk: {
            func: async function(argv) {
                const where = self.gitLoc.split("/");
                if (where.length === 3) {
                    self.terminal.print("Can't run 'gitk' at the user level. Enter a repo.");
                } else {
                    window.open(`http://github.com/${self.gitUserData.login}/${where[3]}/network`);
                }
            },
            help: "<span class=\"cmd\">gitk</span>: Open current repo's network graph in a new window"
        },

        ls: {
            func: async function(argv) {
                if (!self.gitUserData.repos || self.gitUserData.repos.length === 0) {
                    self.terminal.print("No repositories found.");
                } else {
                    self.gitUserData.repos.forEach(repo => {
                        self.terminal.print(`${repo.name} - ${repo.html_url}`);
                    });
                }
            },
            help: "<span class=\"cmd\">ls</span>: Show the current user's repo list"
        },

        cd: {
            func: async function(argv) {
                const repo = cmd.args[0];
                const repos = (self.gitUserData.repos || []).map(r => r.name);
                if (!repo) {
                    self.terminal.print("Usage: cd <repo>");
                } else if (repo === "..") {
                    self.gitLoc = `~/github/${self.gitUserData.login}`;
                    self.terminal.print(self.gitLoc);
                } else if (repos.includes(repo)) {
                    self.gitLoc = `~/github/${self.gitUserData.login}/${repo}`;
                    self.terminal.print(self.gitLoc);
                } else {
                    self.terminal.print("No such repository!");
                }
            },
            help: "<span class=\"cmd\">cd</span>: Change current location to a repo"
        },

        clear: {
            func: async function(argv) {
                self.terminal.clear();
            },
            help: "<span class=\"cmd\">clear</span>: clear the terminal's screen"
        },

        git: {
            func: async function(argv) {
                let args = Array.from(arguments).slice(1);
                console.log(args);
                const where = self.gitLoc.split("/");
                const sub = args[0];

                if (sub === "log") {
                    if (where.length === 3) {
                        self.terminal.print("Enter a repo to run git log.");
                    } else {
                        fetch(`https://api.github.com/repos/${self.gitUserData.login}/${where[3]}/commits`)
                            .then(res => res.json())
                            .then(data => {
                                data.forEach(repo => {
                                    self.terminal.print(`commit ${repo.sha}`);
                                    self.terminal.print(`Author: ${repo.commit.author.name} <${repo.commit.author.email}>`);
                                    self.terminal.print(`Date: ${repo.commit.author.date}`);
                                    self.terminal.print(repo.commit.message);
                                    self.terminal.newLine();
                                });
                            });
                    }
                } else if (sub === "diff") {
                    if (where.length === 3) {
                        self.terminal.print("Enter a repo to run git diff.");
                    } else {
                        const sha = cmd.args[1];
                        if (!sha) {
                            self.terminal.print("Usage: git diff <sha>");
                        } else {
                            fetch(`https://api.github.com/repos/${self.gitUserData.login}/${where[3]}/commits/${sha}`)
                                .then(res => res.json())
                                .then(data => {
                                    self.terminal.print(`commit ${data.sha}`);
                                    self.terminal.print(data.commit.message);
                                    self.terminal.print("Modified:");
                                    data.files.forEach(f => self.terminal.print(`* ${f.filename}`));
                                });
                        }
                    }
                } else {
                    self.terminal.print("Usage: git log | git diff <sha>");
                }
            }
        }
    }

    async handleInput(line) {

        let cmd = line.trim();
        if (cmd === 'exit' || cmd === 'quit') {
            this.terminal.clear();
            this.terminal.popSession();
            return;
        }

        if (Object.hasOwn(this.cmd, cmd)) {
            await this.cmd[cmd].func();
            this.terminal.newLine();
        }

    }    

    async onEnter() {

        this.printHeader();
        
        fetch(`https://api.github.com/users/${this.user}`)
        .then(res => res.json())
        .then(data => {
            fetch(`https://api.github.com/users/${this.user}/repos`)
                .then(res => res.json())
                .then(repos => {
                    data.repos = repos;
                    this.gitUserData = data;
                    this.terminal.print(`Welcome to ~/github/${data.login}/`);
                    this.terminal.print("Type 'help' for commands.");
                });
        });
        
    }

    onExit() {
        this.terminal.printHTML('<span class="info">Exiting GitHub Cli REPL...</span>');
        this .terminal.clear();
    }
};
