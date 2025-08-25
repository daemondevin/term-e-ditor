/**
 * @fileoverview Virtual File System implementation
 * @module vfs
 */

import { TreeStructure, TreeNode } from './tree.js';

/**
 * Virtual File System with optimized performance
 */
export class VirtualFileSystem {
    /**
     * Create a new virtual file system
     */
    constructor() {
        this.tree = new TreeStructure();
        this.user = 'root';
        this.cwd = null; // Will be set after root is created
        
        // Performance caches
        this._pathCache = new Map();
        this._maxCacheSize = 1000;
        
        // Pre-compile date formatter for better performance
        this._dateFormatter = new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        // UID counter for fallback
        this._uidCounter = 0;
    }

    /**
     * Initialize filesystem structure from JSON data
     * @param {Object} node - JSON node data
     * @param {TreeNode|null} parent - Parent node
     * @returns {TreeNode} Created node
     */
    initStructure(node, parent = null) {
        if (!node || !node.key) {
            throw new Error('Invalid node data: missing key');
        }

        const properties = {
            uid: this.getUid(),
            size: node.type !== "dir" ? (node.contents ? node.contents.length : 0) : 0,
            mime: node.type !== "dir" ? (node.mime || "text/plain") : "inode/directory",
            contents: node.type !== "dir" ? node.contents : null,
            type: node.type || "file",
            permissions: node.permissions || (node.type === "dir" ? "rwxr-xr-x" : "rw-r--r--"),
            modified: node.modified || this.getDate(),
            user: this.user,
            group: this.user
        };
        
        const nodeData = this.tree.insert(node.key, parent, properties);
        
        // Set current working directory to root if not set
        if (!this.cwd && !parent) {
            this.cwd = nodeData;
        }
        
        // Process children
        if (node.contents && Array.isArray(node.contents)) {
            for (const childData of node.contents) {
                this.initStructure(childData, nodeData);
            }
        }
        
        return nodeData;
    }

    /**
     * Generate unique identifier
     * @returns {string} Unique ID
     */
    getUid() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID().toUpperCase();
        }
        
        // Fallback method
        return `UID-${Date.now()}-${++this._uidCounter}`;
    }

    /**
     * Get current date in filesystem format
     * @returns {string} Formatted date
     */
    getDate() {
        return this._dateFormatter.format(new Date()).replace(',', '');
    }

    /**
     * Resolve path to node with caching
     * @param {string} path - Path to resolve
     * @returns {TreeNode} Resolved node
     * @throws {Error} If path not found
     */
    _resolve_path(path) {
        if (!path || path === '.') return this.cwd;
        if (path === '/') return this.tree.root;
        
        const normalizedPath = this._normalizePath(path);
        
        // Check cache first
        if (this._pathCache.has(normalizedPath)) {
            const cached = this._pathCache.get(normalizedPath);
            // Verify cache validity
            if (cached && cached.parent !== undefined) {
                return cached;
            }
            this._pathCache.delete(normalizedPath);
        }
        
        const result = this._resolvePathUncached(normalizedPath);
        
        // Cache the result
        if (this._pathCache.size >= this._maxCacheSize) {
            const firstKey = this._pathCache.keys().next().value;
            this._pathCache.delete(firstKey);
        }
        this._pathCache.set(normalizedPath, result);
        
        return result;
    }

    /**
     * Normalize path by resolving . and .. segments
     * @param {string} path - Path to normalize
     * @returns {string} Normalized path
     * @private
     */
    _normalizePath(path) {
        if (!path || path === '.') return this._absolute_path(this.cwd);
        if (path === '/') return '/';
        
        const basePath = path.startsWith('/') ? '/' : this._absolute_path(this.cwd);
        const segments = path.split('/').filter(segment => segment && segment !== '.');
        const resolvedSegments = basePath === '/' ? [] : basePath.split('/').filter(Boolean);
        
        for (const segment of segments) {
            if (segment === '..') {
                if (resolvedSegments.length > 0) {
                    resolvedSegments.pop();
                }
            } else {
                resolvedSegments.push(segment);
            }
        }
        
        return '/' + resolvedSegments.join('/');
    }

    /**
     * Resolve path without caching
     * @param {string} normalizedPath - Normalized path
     * @returns {TreeNode} Resolved node
     * @throws {Error} If path not found
     * @private
     */
    _resolvePathUncached(normalizedPath) {
        if (normalizedPath === '/') return this.tree.root;
        
        const segments = normalizedPath.split('/').filter(Boolean);
        let current = this.tree.root;
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const found = current.findChild(segment);
            
            if (!found) {
                const partialPath = '/' + segments.slice(0, i + 1).join('/');
                throw new Error(`Path not found: ${partialPath}`);
            }
            
            current = found;
        }
        
        return current;
    }

    /**
     * Get absolute path of a node
     * @param {TreeNode} node - Node to get path for
     * @returns {string} Absolute path
     */
    _absolute_path(node) {
        if (!node) return '/';
        
        const pathSegments = [];
        let current = node;
        
        while (current && current !== this.tree.root) {
            pathSegments.unshift(current.key);
            current = current.parent;
        }
        
        return '/' + pathSegments.join('/');
    }

    /**
     * Create directory
     * @param {string} path - Directory path to create
     * @throws {Error} If creation fails
     */
    mkdir(path) {
        if (!path) {
            throw new TypeError("Missing argument: path");
        }
        
        const segments = path.replace(/\/+$/g, "").split("/").filter(Boolean);
        let current = path.startsWith('/') ? this.tree.root : this.cwd;
        
        for (const segment of segments) {
            let existing = current.findChild(segment);
            
            if (!existing) {
                const newDir = new TreeNode(segment, {
                    uid: this.getUid(),
                    size: 0,
                    mime: "inode/directory",
                    contents: null,
                    type: "dir",
                    permissions: "rwxr-xr-x",
                    modified: this.getDate(),
                    user: this.user,
                    group: this.user
                });
                
                current.insert(newDir);
                current = newDir;
            } else if (existing.type === "dir") {
                current = existing;
            } else {
                throw new Error(`Cannot create directory '${segment}': File exists`);
            }
        }
        
        this._invalidatePathCache(path);
    }

    /**
     * Remove directory
     * @param {string} path - Directory path to remove
     * @throws {Error} If removal fails
     */
    rmdir(path) {
        if (!path) {
            throw new TypeError("Missing argument: path");
        }
        
        const node = this._resolve_path(path.replace(/\/+$/g, ""));
        
        if (node === this.tree.root) {
            throw new Error("Cannot delete the root directory");
        }
        
        if (node.type !== "dir") {
            throw new Error(`Not a directory: ${node.key}`);
        }
        
        if (node.children.length > 0) {
            throw new Error(`Directory not empty: ${node.key}`);
        }
        
        this.tree.delete(node);
        
        // Update current directory if necessary
        const currentPath = this._absolute_path(this.cwd);
        const nodePath = this._absolute_path(node);
        
        if (currentPath.startsWith(nodePath)) {
            this.cwd = node.parent || this.tree.root;
        }
        
        this._invalidatePathCache(path);
    }

    /**
     * Change current directory
     * @param {string} path - Path to change to
     * @returns {TreeNode} New current directory
     * @throws {Error} If path not found or not a directory
     */
    cd(path) {
        if (!path) {
            throw new TypeError("Missing argument: path");
        }
        
        const targetNode = this._resolve_path(path);
        
        if (targetNode.type !== "dir") {
            throw new Error(`Not a directory: ${path}`);
        }
        
        this.cwd = targetNode;
        return this.cwd;
    }

    /**
     * Read or write file contents
     * @param {string} mode - Operation mode ('', '>', '>>')
     * @param {string} path - File path
     * @param {string} contents - Contents to write (for write modes)
     * @returns {string} File contents (for read mode)
     * @throws {Error} If operation fails
     */
    cat(mode, path, contents) {
        if (!path) {
            throw new TypeError("Missing argument: path");
        }
        
        const segments = path.replace(/\/+$/g, "").split("/");
        const fileName = segments.pop();
        const parentPath = segments.join("/") || (path.startsWith('/') ? '/' : '.');
        
        const parent = this._resolve_path(parentPath);
        let node = parent.findChild(fileName);
        
        if (mode) {
            // Writing mode
            if (!node) {
                // Create new file
                node = new TreeNode(fileName, {
                    type: "file",
                    mime: "text/plain",
                    modified: this.getDate(),
                    uid: this.getUid(),
                    user: this.user,
                    group: this.user,
                    contents: "",
                    permissions: "rw-r--r--"
                });
                parent.insert(node);
            } else if (node.type !== "file") {
                throw new Error(`Not a file: ${path}`);
            }
            
            const newContents = mode === ">" ? contents : (node.contents || "") + contents;
            node.contents = newContents;
            node.size = new Blob([newContents]).size;
            node.modified = this.getDate();
            
            this._invalidatePathCache(path);
        } else {
            // Reading mode
            if (!node) {
                throw new Error(`File not found: ${path}`);
            }
            
            if (node.type !== "file") {
                throw new Error(`Not a file: ${path}`);
            }
            
            return node.contents || "";
        }
    }

    /**
     * Remove file
     * @param {string} path - File path to remove
     * @throws {Error} If removal fails
     */
    rm(path) {
        if (!path) {
            throw new TypeError("Missing argument: path");
        }
        
        const node = this._resolve_path(path.replace(/\/+$/g, ""));
        
        if (node.type !== "file") {
            throw new Error(`Not a file: ${node.key}`);
        }
        
        this.tree.delete(node);
        this._invalidatePathCache(path);
    }

    /**
     * Rename/move file or directory
     * @param {string} oldPath - Current path
     * @param {string} newName - New name
     * @throws {Error} If rename fails
     */
    rn(oldPath, newName) {
        if (!oldPath) {
            throw new TypeError("Missing argument: oldPath");
        }
        if (!newName) {
            throw new TypeError("Missing argument: newName");
        }
        
        const node = this._resolve_path(oldPath);
        
        if (node === this.tree.root) {
            throw new Error("Cannot rename the root directory");
        }
        
        if (node.parent.hasChild(newName)) {
            throw new Error("Name already exists");
        }
        
        // Update the maps
        node.parent._childrenMap.delete(node.key);
        node.key = newName;
        node.parent._childrenMap.set(newName, node);
        
        this._invalidatePathCache(oldPath);
    }

    /**
     * Copy file or directory
     * @param {string|TreeNode} source - Source path or node
     * @param {string|TreeNode} destination - Destination path or node
     * @returns {TreeNode} Copied node
     * @throws {Error} If copy fails
     */
    cp(source, destination) {
        if (!source) {
            throw new TypeError("Missing argument: source");
        }
        if (!destination) {
            throw new TypeError("Missing argument: destination");
        }
        
        const sourceNode = typeof source === "object" ? source : this._resolve_path(source);
        const destNode = typeof destination === "object" ? destination : this._resolve_path(destination);
        
        if (destNode.type !== "dir") {
            throw new Error("Destination must be a directory");
        }
        
        const copyNode = sourceNode.clone(true);
        destNode.insert(copyNode);
        
        // Update metadata
        this._updateNodeMetadata(copyNode);
        
        return copyNode;
    }

    /**
     * Move file or directory
     * @param {string|TreeNode} source - Source path or node
     * @param {string|TreeNode} destination - Destination path or node
     * @returns {TreeNode} Moved node
     * @throws {Error} If move fails
     */
    mv(source, destination) {
        if (!source) {
            throw new TypeError("Missing argument: source");
        }
        if (!destination) {
            throw new TypeError("Missing argument: destination");
        }
        
        const sourceNode = typeof source === "object" ? source : this._resolve_path(source);
        const destNode = typeof destination === "object" ? destination : this._resolve_path(destination);
        
        if (destNode.type !== "dir") {
            throw new Error("Destination must be a directory");
        }
        
        if (sourceNode.isAncestorOf(destNode)) {
            throw new Error("Cannot move directory into itself");
        }
        
        // Remove from current parent
        if (sourceNode.parent) {
            sourceNode.parent.delete(sourceNode);
        }
        
        // Insert into new parent
        destNode.insert(sourceNode);
        
        return sourceNode;
    }

    /**
     * List directory contents
     * @param {string} path - Directory path (optional)
     * @param {Object} options - List options
     * @returns {Array<TreeNode>} Directory contents
     * @throws {Error} If path is not a directory
     */
    ls(path, options = {}) {
        const node = path ? this._resolve_path(path) : this.cwd;
        
        if (node.type !== "dir") {
            throw new Error(`Not a directory: ${path || 'current directory'}`);
        }
        
        let children = node.children;
        
        // Apply filters
        if (!options.all) {
            children = children.filter(child => !child.key.startsWith('.'));
        }
        
        if (options.filesOnly) {
            children = children.filter(child => child.type === 'file');
        }
        
        if (options.dirsOnly) {
            children = children.filter(child => child.type === 'dir');
        }
        
        // Sort if requested
        if (options.sort) {
            children = [...children].sort((a, b) => a.key.localeCompare(b.key));
        }
        
        return children;
    }

    /**
     * Get current working directory path
     * @returns {string} Current working directory path
     */
    pwd() {
        return this._absolute_path(this.cwd);
    }

    /**
     * Search for files/directories
     * @param {string} query - Search query/pattern
     * @returns {Array<TreeNode>} Search results
     * @throws {Error} If query is missing
     */
    whereis(query) {
        if (!query) {
            throw new Error("Missing argument: query");
        }
        
        return this.tree.search(query) || [];
    }

    /**
     * Update node metadata recursively
     * @param {TreeNode} node - Node to update
     * @private
     */
    _updateNodeMetadata(node) {
        node.uid = this.getUid();
        node.modified = this.getDate();
        node.user = this.user;
        node.group = this.user;
        
        for (const child of node.children) {
            this._updateNodeMetadata(child);
        }
    }

    /**
     * Invalidate path cache entries
     * @param {string} path - Path to invalidate
     * @private
     */
    _invalidatePathCache(path) {
        if (this._pathCache.has(path)) {
            this._pathCache.delete(path);
        }
        
        // Invalidate parent paths that might be affected
        const segments = path.split('/');
        for (let i = segments.length - 1; i > 0; i--) {
            const parentPath = segments.slice(0, i).join('/') || '/';
            this._pathCache.delete(parentPath);
        }
    }

    /**
     * Get filesystem statistics
     * @returns {Object} Filesystem statistics
     */
    getStats() {
        const stats = this.tree.getStats();
        
        let totalSize = 0;
        let fileCount = 0;
        let dirCount = 0;
        
        this.tree.traverseDFS(node => {
            if (node.type === 'file') {
                fileCount++;
                totalSize += node.size || 0;
            } else if (node.type === 'dir') {
                dirCount++;
            }
        });
        
        return {
            ...stats,
            totalSize,
            fileCount,
            dirCount,
            cacheSize: this._pathCache.size
        };
    }

    /**
     * Clear caches to free memory
     */
    clearCaches() {
        this._pathCache.clear();
    }

    /**
     * Export filesystem to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return this.tree.toJSON();
    }

    /**
     * Import filesystem from JSON
     * @param {Object} json - JSON data
     */
    fromJSON(json) {
        this.tree = TreeStructure.fromJSON(json);
        this.cwd = this.tree.root;
        this.clearCaches();
    }
}

export default VirtualFileSystem;