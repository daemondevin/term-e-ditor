/**
 * @fileoverview Tree data structure for the virtual file system
 * @module tree
 */

/**
 * Tree node with optimized child lookup performance
 */
export class TreeNode {
    /**
     * Create a new tree node
     * @param {string} key - Node key/name
     * @param {Object} properties - Additional node properties
     */
    constructor(key, properties = {}) {
        this.key = key;
        this.parent = null;
        this.children = [];
        this._childrenMap = new Map(); // O(1) child lookup optimization
        
        // Apply additional properties
        Object.assign(this, properties);
    }

    /**
     * Insert a child node
     * @param {TreeNode} child - Child node to insert
     * @throws {Error} If child is not a TreeNode instance
     */
    insert(child) {
        if (!(child instanceof TreeNode)) {
            throw new Error('Child must be a TreeNode instance');
        }

        // Check for duplicate keys
        if (this._childrenMap.has(child.key)) {
            throw new Error(`Child with key '${child.key}' already exists`);
        }

        this.children.push(child);
        this._childrenMap.set(child.key, child);
        child.parent = this;
    }

    /**
     * Remove a child node
     * @param {TreeNode} child - Child node to remove
     * @returns {boolean} True if child was removed
     */
    delete(child) {
        if (!(child instanceof TreeNode)) {
            return false;
        }

        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            this._childrenMap.delete(child.key);
            child.parent = null;
            return true;
        }
        return false;
    }

    /**
     * Find direct child by key (O(1) lookup)
     * @param {string} key - Key to search for
     * @returns {TreeNode|null} Found child or null
     */
    findChild(key) {
        return this._childrenMap.get(key) || null;
    }

    /**
     * Check if direct child exists
     * @param {string} key - Key to check
     * @returns {boolean} True if child exists
     */
    hasChild(key) {
        return this._childrenMap.has(key);
    }

    /**
     * Get all child keys
     * @returns {Array<string>} Array of child keys
     */
    getChildKeys() {
        return Array.from(this._childrenMap.keys());
    }

    /**
     * Search recursively for nodes matching pattern
     * @param {string} pattern - Search pattern (supports wildcards * and .)
     * @returns {Array<TreeNode>} Array of matching nodes
     */
    search(pattern) {
        const results = [];
        
        // Optimize for exact matches (most common case)
        if (pattern.indexOf('*') === -1 && pattern.indexOf('.') === -1) {
            if (this.key === pattern) {
                results.push(this);
            }
        } else {
            // Use regex for complex patterns
            const regexPattern = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
            if (regexPattern.test(this.key)) {
                results.push(this);
            }
        }
        
        // Search children recursively
        for (const child of this.children) {
            results.push(...child.search(pattern));
        }
        
        return results;
    }

    /**
     * Find direct children matching pattern
     * @param {string} pattern - Search pattern
     * @returns {Array<TreeNode>} Array of matching children
     */
    find(pattern) {
        if (pattern.indexOf('*') === -1 && pattern.indexOf('.') === -1) {
            // Exact match - use map lookup
            const child = this.findChild(pattern);
            return child ? [child] : [];
        }
        
        // Pattern match - filter children
        const regexPattern = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
        return this.children.filter(child => regexPattern.test(child.key));
    }

    /**
     * Get node depth from root
     * @returns {number} Node depth
     */
    getDepth() {
        let depth = 0;
        let current = this.parent;
        while (current) {
            depth++;
            current = current.parent;
        }
        return depth;
    }

    /**
     * Get path from root to this node
     * @returns {Array<string>} Array of keys forming path
     */
    getPath() {
        const path = [];
        let current = this;
        while (current) {
            path.unshift(current.key);
            current = current.parent;
        }
        return path;
    }

    /**
     * Get absolute path as string
     * @param {string} separator - Path separator (default: '/')
     * @returns {string} Absolute path
     */
    getAbsolutePath(separator = '/') {
        const pathParts = this.getPath();
        // Remove root key if it's not meaningful
        if (pathParts[0] === '~' || pathParts[0] === '') {
            pathParts[0] = '';
        }
        return pathParts.join(separator) || separator;
    }

    /**
     * Check if this node is ancestor of another node
     * @param {TreeNode} node - Node to check
     * @returns {boolean} True if this is ancestor of node
     */
    isAncestorOf(node) {
        let current = node.parent;
        while (current) {
            if (current === this) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    /**
     * Check if this node is descendant of another node
     * @param {TreeNode} node - Node to check
     * @returns {boolean} True if this is descendant of node
     */
    isDescendantOf(node) {
        return node.isAncestorOf(this);
    }

    /**
     * Get all descendants of this node
     * @returns {Array<TreeNode>} Array of descendant nodes
     */
    getDescendants() {
        const descendants = [];
        const stack = [...this.children];
        
        while (stack.length > 0) {
            const node = stack.pop();
            descendants.push(node);
            stack.push(...node.children);
        }
        
        return descendants;
    }

    /**
     * Get size of subtree (number of descendants)
     * @returns {number} Subtree size
     */
    getSubtreeSize() {
        let size = 1; // Count self
        for (const child of this.children) {
            size += child.getSubtreeSize();
        }
        return size;
    }

    /**
     * Clone this node and its subtree
     * @param {boolean} deep - Whether to deep clone (default: true)
     * @returns {TreeNode} Cloned node
     */
    clone(deep = true) {
        // Clone properties (shallow copy)
        const properties = {};
        Object.keys(this).forEach(key => {
            if (!['key', 'parent', 'children', '_childrenMap'].includes(key)) {
                properties[key] = this[key];
            }
        });

        const cloned = new TreeNode(this.key, properties);

        if (deep) {
            // Clone children recursively
            for (const child of this.children) {
                cloned.insert(child.clone(true));
            }
        }

        return cloned;
    }

    /**
     * Convert node to JSON representation
     * @param {boolean} includeChildren - Include children in output
     * @returns {Object} JSON representation
     */
    toJSON(includeChildren = true) {
        const json = {
            key: this.key
        };

        // Include additional properties
        Object.keys(this).forEach(key => {
            if (!['parent', 'children', '_childrenMap'].includes(key) && key !== 'key') {
                json[key] = this[key];
            }
        });

        if (includeChildren && this.children.length > 0) {
            json.children = this.children.map(child => child.toJSON(true));
        }

        return json;
    }

    /**
     * Get string representation of node
     * @returns {string} String representation
     */
    toString() {
        return `TreeNode(${this.key}, children: ${this.children.length})`;
    }
}

/**
 * Tree structure with root node and utility methods
 */
export class TreeStructure {
    /**
     * Create a new tree structure
     */
    constructor() {
        this.root = null;
    }

    /**
     * Insert a node into the tree
     * @param {string} key - Node key
     * @param {TreeNode|string|null} parent - Parent node, parent key, or null for root
     * @param {Object} properties - Node properties
     * @returns {TreeNode} Inserted node
     * @throws {Error} If insertion fails
     */
    insert(key, parent = null, properties = {}) {
        if (!key) {
            throw new TypeError("Missing argument: key");
        }

        const node = new TreeNode(key, properties);

        if (!parent && !this.root) {
            // Creating root node
            this.root = node;
        } else if (!parent && this.root) {
            throw new Error("TreeStructure already has a root. Please specify the node's parent.");
        } else {
            // Find parent node
            let parentNodes;
            
            if (parent instanceof TreeNode) {
                parentNodes = [parent];
            } else if (typeof parent === 'string') {
                parentNodes = this.search(parent);
            } else if (Array.isArray(parent)) {
                parentNodes = parent;
            } else {
                throw new Error("Invalid parent specification");
            }

            if (!parentNodes || !parentNodes.length) {
                throw new Error("Parent node not found");
            }

            parentNodes[0].insert(node);
        }

        return node;
    }

    /**
     * Delete a node from the tree
     * @param {TreeNode|string} node - Node to delete or node key
     * @returns {boolean} True if node was deleted
     * @throws {Error} If deletion fails
     */
    delete(node) {
        if (!node) {
            throw new TypeError("Missing argument: node");
        }

        let targets;
        
        if (node instanceof TreeNode) {
            targets = [node];
        } else if (typeof node === 'string') {
            targets = this.search(node);
        } else {
            throw new Error("Invalid node specification");
        }

        if (!targets || !targets.length) {
            throw new Error("Target node not found");
        }

        let deletedCount = 0;
        for (const target of targets) {
            if (target === this.root) {
                this.root = null;
                deletedCount++;
            } else if (target.parent) {
                target.parent.delete(target);
                deletedCount++;
            }
        }

        return deletedCount > 0;
    }

    /**
     * Search for nodes by key pattern
     * @param {string} key - Search pattern
     * @returns {Array<TreeNode>|null} Found nodes or null
     */
    search(key) {
        return key && this.root ? this.root.search(key) : null;
    }

    /**
     * Find node by exact key match
     * @param {string} key - Exact key to find
     * @returns {TreeNode|null} Found node or null
     */
    findByKey(key) {
        if (!key || !this.root) return null;
        
        const results = this.root.search(key);
        return results && results.length > 0 ? results[0] : null;
    }

    /**
     * Traverse tree breadth-first
     * @param {Function} callback - Callback function for each node
     */
    traverseBFS(callback) {
        if (!this.root || typeof callback !== 'function') return;

        const queue = [this.root];
        
        while (queue.length > 0) {
            const node = queue.shift();
            callback(node);
            queue.push(...node.children);
        }
    }

    /**
     * Traverse tree depth-first (pre-order)
     * @param {Function} callback - Callback function for each node
     */
    traverseDFS(callback) {
        if (!this.root || typeof callback !== 'function') return;

        const stack = [this.root];
        
        while (stack.length > 0) {
            const node = stack.pop();
            callback(node);
            // Add children in reverse order to maintain left-to-right processing
            for (let i = node.children.length - 1; i >= 0; i--) {
                stack.push(node.children[i]);
            }
        }
    }

    /**
     * Get tree levels for level-order visualization
     * @returns {Array<Array<TreeNode>>} Array of levels
     */
    getLevels() {
        if (!this.root) return [];

        const levels = [];
        const queue = [{ node: this.root, level: 0 }];
        
        while (queue.length > 0) {
            const { node, level } = queue.shift();
            
            if (!levels[level]) {
                levels[level] = [];
            }
            
            levels[level].push(node);
            
            for (const child of node.children) {
                queue.push({ node: child, level: level + 1 });
            }
        }
        
        return levels;
    }

    /**
     * Get tree statistics
     * @returns {Object} Tree statistics
     */
    getStats() {
        if (!this.root) {
            return {
                nodeCount: 0,
                maxDepth: 0,
                leafCount: 0
            };
        }

        let nodeCount = 0;
        let maxDepth = 0;
        let leafCount = 0;

        this.traverseDFS(node => {
            nodeCount++;
            const depth = node.getDepth();
            maxDepth = Math.max(maxDepth, depth);
            if (node.children.length === 0) {
                leafCount++;
            }
        });

        return {
            nodeCount,
            maxDepth,
            leafCount
        };
    }

    /**
     * Convert tree to JSON representation
     * @returns {Object|null} JSON representation
     */
    toJSON() {
        return this.root ? this.root.toJSON() : null;
    }

    /**
     * Create tree from JSON representation
     * @param {Object} json - JSON representation
     * @returns {TreeStructure} New tree structure
     */
    static fromJSON(json) {
        const tree = new TreeStructure();
        
        if (!json) return tree;

        function insertNode(nodeData, parent = null) {
            const { key, children, ...properties } = nodeData;
            const node = tree.insert(key, parent, properties);
            
            if (children && Array.isArray(children)) {
                for (const childData of children) {
                    insertNode(childData, node);
                }
            }
            
            return node;
        }

        insertNode(json);
        return tree;
    }

    /**
     * Clear the entire tree
     */
    clear() {
        this.root = null;
    }

    /**
     * Check if tree is empty
     * @returns {boolean} True if tree is empty
     */
    isEmpty() {
        return this.root === null;
    }

    /**
     * Get string representation of tree
     * @returns {string} String representation
     */
    toString() {
        if (!this.root) return "Empty Tree";
        
        const stats = this.getStats();
        return `Tree(root: ${this.root.key}, nodes: ${stats.nodeCount}, depth: ${stats.maxDepth})`;
    }
}

export default TreeStructure;