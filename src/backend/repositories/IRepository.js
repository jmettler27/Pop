export class IRepository {
    /**
     * Get an entity by its ID
     * @param {string} id - The ID of the entity to retrieve
     * @returns {Promise<Object>} The entity data
     */
    async get(id) {
        throw new Error('Method not implemented');
    }

    /**
     * Get all entities
     * @returns {Promise<Array<Object>>} Array of entities
     */
    async getAll() {
        throw new Error('Method not implemented');
    }

    /**
     * Create a new entity
     * @param {Object} data - The entity data to create
     * @returns {Promise<Object>} The created entity
     */
    async create(data) {
        throw new Error('Method not implemented');
    }

    /**
     * Update an existing entity
     * @param {string} id - The ID of the entity to update
     * @param {Object} data - The updated entity data
     * @returns {Promise<Object>} The updated entity
     */
    async update(id, data) {
        throw new Error('Method not implemented');
    }

    /**
     * Delete an entity
     * @param {string} id - The ID of the entity to delete
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Method not implemented');
    }
} 