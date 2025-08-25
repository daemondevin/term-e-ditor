/**
 * @fileoverview Default filesystem structure for the terminal emulator
 * @module filesystem-data
 */

/**
 * Default filesystem structure with common Unix-like directories and files
 */
export const DEFAULT_FS = {
    "key": "~",
    "type": "dir",
    "permissions": "rwxr-xr-x",
    "modified": "23.03.2024  02:54",
    "contents": [
        {
            "key": "bin",
            "type": "dir",
            "permissions": "rwxr-xr-x",
            "modified": "23.03.2024  02:54",
            "contents": [
                {
                    "key": "bash",
                    "type": "exec",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "mime": "application/x-executable",
                    "contents": "#!/bin/bash\n# Bash shell executable"
                },
                {
                    "key": "ls",
                    "type": "exec",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "mime": "application/x-executable",
                    "contents": "#!/bin/bash\n# List directory contents"
                },
                {
                    "key": "cat",
                    "type": "exec",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "mime": "application/x-executable",
                    "contents": "#!/bin/bash\n# Display file contents"
                }
            ]
        },
        {
            "key": "etc",
            "type": "dir",
            "permissions": "rwxr-xr-x",
            "modified": "23.03.2024  02:54",
            "contents": [
                {
                    "key": "passwd",
                    "type": "file",
                    "permissions": "rw-r--r--",
                    "modified": "23.03.2024  02:54",
                    "mime": "text/plain",
                    "contents": "root:x:0:0:root:/root:/bin/bash\ndemo:x:1000:1000:Demo User:/home/demo:/bin/bash\nguest:x:1001:1001:Guest User:/home/guest:/bin/bash"
                },
                {
                    "key": "hosts",
                    "type": "file",
                    "permissions": "rw-r--r--",
                    "modified": "23.03.2024  02:54",
                    "mime": "text/plain",
                    "contents": "127.0.0.1\tlocalhost\n127.0.1.1\tterminal-emulator\n::1\tlocalhost ip6-localhost ip6-loopback"
                },
                {
                    "key": "nginx.conf",
                    "type": "config",
                    "permissions": "rw-r--r--",
                    "modified": "23.03.2024  02:54",
                    "mime": "text/plain",
                    "contents": "# Nginx configuration\nserver {\n    listen 80;\n    server_name localhost;\n    root /var/www;\n    index index.html;\n}"
                },
                {
                    "key": "apache.conf",
                    "type": "config",
                    "permissions": "rw-r--r--",
                    "modified": "23.03.2024  02:54",
                    "mime": "text/plain",
                    "contents": "# Apache configuration\n<VirtualHost *:80>\n    DocumentRoot /var/www\n    ServerName localhost\n    ErrorLog /var/log/error.log\n    CustomLog /var/log/access.log combined\n</VirtualHost>"
                },
                {
                    "key": "fstab",
                    "type": "file",
                    "permissions": "rw-r--r--",
                    "modified": "23.03.2024  02:54",
                    "mime": "text/plain",
                    "contents": "# Static information about the filesystems\n/dev/sda1 / ext4 defaults 0 1\n/dev/sda2 /home ext4 defaults 0 2"
                }
            ]
        },
        {
            "key": "usr",
            "type": "dir",
            "permissions": "rwxr-xr-x",
            "modified": "23.03.2024  02:54",
            "contents": [
                {
                    "key": "bin",
                    "type": "dir",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "contents": [
                        {
                            "key": "git",
                            "type": "exec",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "mime": "application/x-executable",
                            "contents": "#!/bin/bash\n# Git version control system"
                        },
                        {
                            "key": "node",
                            "type": "exec",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "mime": "application/x-executable",
                            "contents": "#!/bin/bash\n# Node.js runtime"
                        },
                        {
                            "key": "python3",
                            "type": "exec",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "mime": "application/x-executable",
                            "contents": "#!/bin/bash\n# Python 3 interpreter"
                        }
                    ]
                },
                {
                    "key": "lib",
                    "type": "dir",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "contents": [
                        {
                            "key": "libc.so.6",
                            "type": "lib",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "mime": "application/x-sharedlib",
                            "contents": "# Standard C library"
                        }
                    ]
                },
                {
                    "key": "share",
                    "type": "dir",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "contents": [
                        {
                            "key": "doc",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": [
                                {
                                    "key": "README.md",
                                    "type": "file",
                                    "permissions": "rw-r--r--",
                                    "modified": "23.03.2024  02:54",
                                    "mime": "text/markdown",
                                    "contents": "# Terminal Emulator Documentation\n\nWelcome to the virtual terminal emulator!\n\n## Getting Started\n\n- Type `help` to see available commands\n- Use `ls` to list directory contents\n- Navigate with `cd [directory]`\n- Create files with `touch [filename]`\n- View files with `cat [filename]`\n\n## Tips\n\n- Use Tab for autocompletion (when implemented)\n- Use up/down arrows to navigate command history\n- Type `clear` to clear the screen"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "key": "var",
            "type": "dir",
            "permissions": "rwxr-xr-x",
            "modified": "23.03.2024  02:54",
            "contents": [
                {
                    "key": "log",
                    "type": "dir",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "contents": [
                        {
                            "key": "access.log",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/plain",
                            "contents": "127.0.0.1 - - [23/Mar/2024:02:54:00 +0000] \"GET / HTTP/1.1\" 200 1234\n127.0.0.1 - - [23/Mar/2024:02:54:05 +0000] \"GET /index.html HTTP/1.1\" 200 5678"
                        },
                        {
                            "key": "error.log",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/plain",
                            "contents": "[2024-03-23 02:54:00] ERROR: File not found: /nonexistent.html\n[2024-03-23 02:54:15] WARNING: High memory usage detected"
                        },
                        {
                            "key": "system.log",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/plain",
                            "contents": "[2024-03-23 02:54:00] INFO: System started\n[2024-03-23 02:54:01] INFO: Network interface up\n[2024-03-23 02:54:02] INFO: Services initialized"
                        }
                    ]
                },
                {
                    "key": "www",
                    "type": "dir",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "contents": [
                        {
                            "key": "index.html",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/html",
                            "contents": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Welcome to the Webroot</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 40px; }\n        h1 { color: #333; }\n        .info { background: #f0f0f0; padding: 20px; border-radius: 5px; }\n    </style>\n</head>\n<body>\n    <h1>Welcome to the Webroot</h1>\n    <div class=\"info\">\n        <p>This is the default web server document root.</p>\n        <p>Server is running and ready to serve content.</p>\n    </div>\n</body>\n</html>"
                        },
                        {
                            "key": "styles.css",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/css",
                            "contents": "/* Default stylesheet */\nbody {\n    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n    line-height: 1.6;\n    margin: 0;\n    padding: 20px;\n    background-color: #f4f4f4;\n}\n\n.container {\n    max-width: 800px;\n    margin: 0 auto;\n    background: white;\n    padding: 20px;\n    border-radius: 10px;\n    box-shadow: 0 0 10px rgba(0,0,0,0.1);\n}"
                        }
                    ]
                },
                {
                    "key": "tmp",
                    "type": "dir",
                    "permissions": "rwxrwxrwx",
                    "modified": "23.03.2024  02:54",
                    "contents": [
                        {
                            "key": ".keep",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/plain",
                            "contents": "# This file keeps the tmp directory in version control"
                        }
                    ]
                }
            ]
        },
        {
            "key": "home",
            "type": "dir",
            "permissions": "rwxr-xr-x",
            "modified": "23.03.2024  02:54",
            "contents": [
                {
                    "key": "guest",
                    "type": "dir",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "contents": [
                        {
                            "key": ".bashrc",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/plain",
                            "contents": "# ~/.bashrc: executed by bash for non-login shells\n\n# Prompt customization\nPS1='\\u@\\h:\\w\\$ '\n\n# Aliases\nalias ll='ls -l'\nalias la='ls -la'\nalias ..='cd ..'\n\n# Environment variables\nexport EDITOR=nano\nexport PAGER=less"
                        },
                        {
                            "key": "Documents",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": [
                                {
                                    "key": "TermPaper.doc",
                                    "type": "text",
                                    "permissions": "rw-r--r--",
                                    "modified": "23.03.2024  02:54",
                                    "mime": "application/msword",
                                    "contents": "# Term Paper: Virtual File Systems\n\n## Introduction\n\nVirtual file systems provide an abstraction layer that allows applications to access different file system types through a unified interface.\n\n## Key Concepts\n\n- Abstraction layer\n- Unified interface\n- Multiple backend support\n- Performance optimization\n\n## Conclusion\n\nVFS implementations are crucial for modern operating systems and applications requiring flexible file access patterns."
                                },
                                {
                                    "key": "notes.txt",
                                    "type": "file",
                                    "permissions": "rw-r--r--",
                                    "modified": "23.03.2024  02:54",
                                    "mime": "text/plain",
                                    "contents": "Personal Notes\n==============\n\n- Remember to backup important files\n- Terminal commands to practice:\n  * ls -la (detailed listing)\n  * find . -name \"*.txt\" (find text files)\n  * grep -r \"search term\" . (recursive search)\n  * tar -czf archive.tar.gz directory/ (create archive)\n\n- Project ideas:\n  * Build a simple web scraper\n  * Create a file organizer script\n  * Develop a backup automation tool"
                                }
                            ]
                        },
                        {
                            "key": "Music",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": [
                                {
                                    "key": "playlist.m3u",
                                    "type": "file",
                                    "permissions": "rw-r--r--",
                                    "modified": "23.03.2024  02:54",
                                    "mime": "audio/x-mpegurl",
                                    "contents": "#EXTM3U\n#EXTINF:240,Artist - Song Title 1\nsong1.mp3\n#EXTINF:180,Artist - Song Title 2\nsong2.mp3"
                                }
                            ]
                        },
                        {
                            "key": "Photos",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": [
                                {
                                    "key": "avatar.jpg",
                                    "type": "img",
                                    "permissions": "rw-r--r--",
                                    "modified": "23.03.2024  02:54",
                                    "mime": "image/jpeg",
                                    "contents": "# This would contain binary image data\n# For demo purposes, this is a text placeholder"
                                },
                                {
                                    "key": "vacation",
                                    "type": "dir",
                                    "permissions": "rwxr-xr-x",
                                    "modified": "23.03.2024  02:54",
                                    "contents": [
                                        {
                                            "key": "beach.jpg",
                                            "type": "img",
                                            "permissions": "rw-r--r--",
                                            "modified": "23.03.2024  02:54",
                                            "mime": "image/jpeg",
                                            "contents": "# Beach vacation photo placeholder"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "key": "Videos",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": []
                        },
                        {
                            "key": "Downloads",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": [
                                {
                                    "key": "GoogleDrive.zip",
                                    "type": "archive",
                                    "permissions": "rw-r--r--",
                                    "modified": "23.03.2024  02:54",
                                    "mime": "application/x-zip-compressed",
                                    "contents": "# This would contain binary archive data\n# Archive contents: documents, photos, etc."
                                },
                                {
                                    "key": "software.deb",
                                    "type": "package",
                                    "permissions": "rw-r--r--",
                                    "modified": "23.03.2024  02:54",
                                    "mime": "application/vnd.debian.binary-package",
                                    "contents": "# Debian package file placeholder"
                                }
                            ]
                        }
                    ]
                },
                {
                    "key": "demo",
                    "type": "dir",
                    "permissions": "rwxr-xr-x",
                    "modified": "23.03.2024  02:54",
                    "contents": [
                        {
                            "key": ".bashrc",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/plain",
                            "contents": "# Demo user bash configuration\n\n# Custom prompt with colors\nPS1='\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '\n\n# Useful aliases\nalias grep='grep --color=auto'\nalias ls='ls --color=auto'\nalias ll='ls -alF'\nalias la='ls -A'\nalias l='ls -CF'\n\n# History settings\nHISTCONTROL=ignoreboth\nHISTSIZE=1000\nHISTFILESIZE=2000\n\n# Make less more friendly\nexport LESS=\"-R\"\nexport LESSOPEN=\"| /usr/bin/lesspipe %s\"\nexport LESSCLOSE=\"/usr/bin/lesspipe %s %s\""
                        },
                        {
                            "key": ".profile",
                            "type": "file",
                            "permissions": "rw-r--r--",
                            "modified": "23.03.2024  02:54",
                            "mime": "text/plain",
                            "contents": "# ~/.profile: executed by the command interpreter for login shells.\n\n# Set PATH\nPATH=\"$HOME/bin:$HOME/.local/bin:$PATH\"\n\n# Set default editor\nexport EDITOR=nano\n\n# Set terminal type\nexport TERM=xterm-256color"
                        },
                        {
                            "key": "Documents",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": [
                                {
                                    "key": "welcome.txt",
                                    "type": "file",
                                    "permissions": "rw-r--r--",
                                    "modified": "23.03.2024  02:54",
                                    "mime": "text/plain",
                                    "contents": "Welcome to the Terminal Emulator!\n\nThis is a fully functional virtual terminal with:\n\n✓ File system operations (ls, cd, mkdir, rm, etc.)\n✓ File editing capabilities (cat, touch)\n✓ Command history (use up/down arrows)\n✓ Multiple themes and customization options\n✓ Built-in help system\n\nTry these commands to get started:\n- help: Show available commands\n- ls -la: List files with details\n- cat /usr/share/doc/README.md: Read documentation\n- theme -l: List available themes\n- pwd: Show current directory\n\nHave fun exploring!"
                                }
                            ]
                        },
                        {
                            "key": "Music",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": []
                        },
                        {
                            "key": "Photos",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": []
                        },
                        {
                            "key": "Videos",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": []
                        },
                        {
                            "key": "Projects",
                            "type": "dir",
                            "permissions": "rwxr-xr-x",
                            "modified": "23.03.2024  02:54",
                            "contents": [
                                {
                                    "key": "web-app",
                                    "type": "dir",
                                    "permissions": "rwxr-xr-x",
                                    "modified": "23.03.2024  02:54",
                                    "contents": [
                                        {
                                            "key": "package.json",
                                            "type": "file",
                                            "permissions": "rw-r--r--",
                                            "modified": "23.03.2024  02:54",
                                            "mime": "application/json",
                                            "contents": "{\n  \"name\": \"terminal-web-app\",\n  \"version\": \"1.0.0\",\n  \"description\": \"A web-based terminal emulator\",\n  \"main\": \"index.js\",\n  \"scripts\": {\n    \"start\": \"node index.js\",\n    \"dev\": \"nodemon index.js\",\n    \"test\": \"jest\"\n  },\n  \"dependencies\": {\n    \"express\": \"^4.18.2\",\n    \"socket.io\": \"^4.7.2\"\n  },\n  \"devDependencies\": {\n    \"nodemon\": \"^3.0.1\",\n    \"jest\": \"^29.6.2\"\n  }\n}"
                                        },
                                        {
                                            "key": "README.md",
                                            "type": "file",
                                            "permissions": "rw-r--r--",
                                            "modified": "23.03.2024  02:54",
                                            "mime": "text/markdown",
                                            "contents": "# Terminal Web App\n\nA modern web-based terminal emulator with advanced features.\n\n## Features\n\n- Full filesystem simulation\n- Command history and autocomplete\n- Multiple themes\n- Real-time collaboration (planned)\n- Plugin system (planned)\n\n## Installation\n\n```bash\nnpm install\nnpm start\n```\n\n## Usage\n\nOpen your browser and navigate to `http://localhost:3000`\n\n## Contributing\n\nContributions are welcome! Please read the contributing guidelines first."
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "key": "root",
            "type": "dir",
            "permissions": "rwx------",
            "modified": "23.03.2024  02:54",
            "contents": [
                {
                    "key": ".bashrc",
                    "type": "file",
                    "permissions": "rw-------",
                    "modified": "23.03.2024  02:54",
                    "mime": "text/plain",
                    "contents": "# Root user bash configuration\n\n# Root prompt (red for warning)\nPS1='\\[\\033[01;31m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]# '\n\n# Safety aliases\nalias rm='rm -i'\nalias cp='cp -i'\nalias mv='mv -i'\n\n# System administration aliases\nalias ll='ls -alF'\nalias la='ls -A'\nalias l='ls -CF'\nalias ports='netstat -tuln'\nalias services='systemctl list-units --type=service'\n\n# Environment\nexport EDITOR=nano\nexport PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
                },
                {
                    "key": "system-info.txt",
                    "type": "file",
                    "permissions": "rw-------",
                    "modified": "23.03.2024  02:54",
                    "mime": "text/plain",
                    "contents": "System Information\n==================\n\nOS: Virtual Terminal OS v1.0\nKernel: Virtual 5.15.0\nArchitecture: x86_64\nMemory: 8GB (simulated)\nStorage: 500GB (simulated)\n\nInstalled Services:\n- Web Server (nginx)\n- Database (simulated)\n- Terminal Emulator\n\nLast Boot: 2024-03-23 02:54:00\nUptime: Running since initialization\n\nSecurity Status: All systems operational"
                }
            ]
        }
    ]
};

/**
 * Sample user data for demonstration
 */
export const SAMPLE_USERS = [
    {
        name: 'root',
        pass: null,
        uid: 0,
        gid: 0,
        home: '/root',
        shell: '/bin/bash',
        permissions: ['admin', 'sudo']
    },
    {
        name: 'demo',
        pass: null,
        uid: 1000,
        gid: 1000,
        home: '/home/demo',
        shell: '/bin/bash',
        permissions: ['user']
    },
    {
        name: 'guest',
        pass: null,
        uid: 1001,
        gid: 1001,
        home: '/home/guest',
        shell: '/bin/bash',
        permissions: ['guest']
    }
];

/**
 * File type mappings for MIME types and extensions
 */
export const FILE_TYPES = {
    'text/plain': ['.txt', '.log', '.conf', '.cfg', '.ini'],
    'text/html': ['.html', '.htm'],
    'text/css': ['.css'],
    'text/javascript': ['.js', '.mjs'],
    'text/markdown': ['.md', '.markdown'],
    'application/json': ['.json'],
    'application/xml': ['.xml'],
    'application/pdf': ['.pdf'],
    'application/zip': ['.zip'],
    'application/x-tar': ['.tar'],
    'application/gzip': ['.gz'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/svg+xml': ['.svg'],
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'video/mp4': ['.mp4'],
    'video/avi': ['.avi']
};

/**
 * Default system environment variables
 */
export const DEFAULT_ENV = {
    PATH: '/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin',
    HOME: '/home/demo',
    USER: 'demo',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8',
    PWD: '/home/demo',
    OLDPWD: null,
    PS1: '\\u@\\h \\[~\\w\\] \\$ ',
    EDITOR: 'nano',
    PAGER: 'less'
};

/**
 * Command aliases for convenience
 */
export const DEFAULT_ALIASES = {
    'll': 'ls -l',
    'la': 'ls -la',
    'l': 'ls -CF',
    '..': 'cd ..',
    '...': 'cd ../..',
    'grep': 'grep --color=auto',
    'dir': 'ls',
    'cls': 'clear',
    'md': 'mkdir',
    'rd': 'rmdir'
};

export default DEFAULT_FS;