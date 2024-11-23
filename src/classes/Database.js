const { createConsoleMessage } = require("aoi.js/src/classes/AoiError");
const { createPool } = require("mysql2/promise");
const { Functions } = require("./Functions");
const EventEmitter = require("events");
const chalk = require("chalk");

class Database extends EventEmitter {
    constructor(client, options) {
        super();
        options.tables = options.tables || ['main'];
        options.debug = options.debug || false;
        options.keepAoiDB = options.keepAoiDB || false;
        Object.assign(this, {
            client: client,
            options: options,
            pool: createPool(options.url || options.uri || options),
            tables: [...options.tables, '__aoijs_vars__']
        };
        
        if (options.keepAoiDB && !client.options?.disableAoiDB) {
            this.client.mysql = {};
            new Functions(client, options.debug);
            this.#functionsBind(this.client.mysql);
            this.client.options.disableAoiDB = false;
            options.keepAoiDB = true;
        } else if (!options.keepAoiDB && client.options?.disableAoiDB) {
            this.client.db = {};
            this.#functionsBind(this.client.db);
            this.client.options.disableAoiDB = true;
            options.keepAoiDB = false;
        } else {
            createConsoleMessage([
                { text: ` `, textColor: 'white' },
                { text: `If you only want to use MySQL, you need to add "disableAoiDB" in the client options and set it to "true".`, textColor: 'red' },
                { text: ` `, textColor: 'white' },
                { text: `But if you want to keep using your aoi.db database, you need to add "keepAoiDB" in the database options and set it to "true".`, textColor: 'red' }
            ], { text: ' aoijs.mysql ', textColor: 'cyan' });
            process.exit(1);
        }
        this.#connect();
    }
    
    async #connect() {
        try {
            this.emit('debug', `[${chalk.blue('DEBUG')}] :: connecting database...`);
            if (!this.client) throw new Error('Client instance is not defined.');
            if (!this.options) throw new Error('Missing database settings in options.');
            if (!this.options.tables || this.options.tables.length === 0) throw new Error('No variable tables specified in options. Please provide at least one table.');
            if (this.options.tables.includes('__aoijs_vars__')) throw new Error('"__aoijs_vars__" is reserved as a table name and cannot be used.');
            for (const table of this.tables) { this.prepare(table) };
            this.emit('connect', this.options.keepAoiDB ? this.client.mysql : this.client.db, this.client);
            if (this.client?.aoiOptions?.aoiLogs === false) return;
            createConsoleMessage([
                { text: `Latency: ${await this.ping()}ms`, textColor: 'green' },
                { text: `Successfully connected to MySQL database`, textColor: 'blue' },
            ], { text: ' aoijs.mysql ', textColor: 'cyan' });
        } catch (err) { this.#handleError(err, 'failed') }
    }
    
    variables(data, table = this.tables[0] || 'main') {
        try {
            const db = this.options.keepAoiDB ? this.client.mysql : this.client.db;
            if (!data || typeof data !== 'object' || !table) return;
            if (!db) throw new Error('You need to initialize the database first before add variables.');
            for (const [name, value] of Object.entries(data)) { this.client?.variableManager?.add({ name, value, table }) }
        } catch (err) { this._handleError(err) }
    }
    
    async isTableExists(table) {
        const [rows] = await this.pool?.query(`SHOW TABLES LIKE ?`, [table]);
        return rows.length > 0;
    }
    
    async prepare(table) {
        try {
            if (!this.tables.includes(table)) throw new Error(`Table "${table}" is not defined in options. Please provide it!`);
            if (await this.isTableExists(table)) return;
            this.emit('debug', `[${chalk.blue('DEBUG')}] preparing table ${chalk.cyan(table || 'unknown')}...`);
            await this._db.pool?.query(`CREATE TABLE IF NOT EXISTS \`${table}\` (
                    \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
                    \`value\` LONGTEXT NOT NULL
                );`);
            return;
        } catch (err) { this._handleError(err) }
    }
    /**
     * Get a value from the database.
     *
     * @param {string} table - The table name.
     * @param {string} key - The key of the value.
     * @param {number} id? - The identification of the value (optional).
     * @return {Promise<object|null>} - The value.
     * @throws {Error} - Throw an error if the value cannot be retrieved.
     */
    async get(table, key, id, aoivars = ['cooldown', 'setTimeout', 'ticketChannel']) {
        try {
            if (!await this.isTableExists(table))
                this.prepare(table);
            const queryKey = `${key}_${id}`;
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving get(${table}, ${queryKey})`);
            if (aoivars.includes(key)) {
                const [rows] = await this._db.pool?.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [queryKey]);
                const result = rows.length > 0 ? rows[0] : null;
                if (this._options.debug)
                    console.log(`[${chalk_1.default.blue('DEBUG')}] returning get(${table}, ${queryKey}) => `, result);
                return result;
            }
            if (!this._variable.has(key, table))
                return null;
            const defaultValue = this._variable.get(key, table)?.default;
            const [rows] = await this._db.pool?.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [queryKey]);
            const result = rows.length > 0 ? rows[0] : (defaultValue ? { value: defaultValue } : null);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] returning get(${table}, ${queryKey}) => `, result);
            return result;
        }
        catch (err) {
            this._handleError(err);
            return null;
        }
    }
    /**
     * Insert or update a value in the database.
     *
     * @param {string} table - The table name.
     * @param {string} key - The key of the value.
     * @param {number} id - The identification of the value.
     * @params {any} value - The value to be inserted or updated
     * @return {Promise<undefined>} - UNDEFINED.
     * @throws {Error} - Throw an error if the value cannot be inserted or updated.
     */
    async set(table, key, id, value) {
        try {
            if (!await this.isTableExists(table))
                this.prepare(table);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving set(${table}, ${key}_${id}, ${value})`);
            await this._db.pool?.query(`INSERT INTO \`${table}\` (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`, [`${key}_${id}`, value, value]);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] returning set(${table}, ${key}_${id}, ${value}) => value updated`);
            return;
        }
        catch (err) {
            this._handleError(err);
        }
    }
    /**
     * Drop a table or delete a variable from the database.
     *
     * @param {string} table - The table name.
     * @param {string} variable? - The variable name (optional).
     * @return {Promise<undefined>} - UNDEFINED.
     * @throws {Error} - Throw an error if the table cannot be dropped.
     */
    async drop(table, variable) {
        try {
            if (!await this.isTableExists(table))
                this.prepare(table);
            if (variable) {
                if (this._options.debug)
                    console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving drop(${table}, ${variable})`);
                await this._db.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [variable]);
                if (this._options.debug)
                    console.log(`[${chalk_1.default.blue('DEBUG')}] returning drop(${table}, ${variable}) => variable deleted`);
                return;
            }
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving drop(${table})`);
            await this._db.pool?.query(`DROP TABLE IF EXISTS \`${table}\``);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] returning drop(${table}) => table deleted`);
            return;
        }
        catch (err) {
            this._handleError(err);
        }
    }
    /**
     * Delete many variables from the database.
     *
     * @param {string} table - The table name.
     * @param {query} query - The query to be executed.
     * @return {Promise<undefined>} - UNDEFINED.
     * @throws {Error} - Throw an error if the variables cannot be deleted.
     */
    async deleteMany(table, query) {
        try {
            if (!await this.isTableExists(table))
                this.prepare(table);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving deleteMany(${table}, ${query})`);
            const [rows] = await this._db.pool?.query(`SELECT * FROM \`${table}\``);
            const keysToDelete = rows.filter(query).map((row) => row.key);
            if (keysToDelete.length === 0) return;
            const placeholders = keysToDelete.map(() => '?').join(',');
            await this._db.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` IN (${placeholders})`, keysToDelete);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] returning deleteMany(${table}, ${query}) => deleted`);
            return;
        }
        catch (err) {
            this._handleError(err);
        }
    }
    /**
    * Delete a variable from the database.
    *
    * @param {string} table - The table name.
    * @param {string} key - The key of the variable.
    * @param {number} id - The identification of the variable.
    * @return {Promise<undefined>} - UNDEFINED.
    * @throws {Error} - Throw an error if the variable cannot be deleted.
    */
    async delete(table, key, id) {
        try {
            if (!await this.isTableExists(table))
                this.prepare(table);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving delete(${table}, ${key}_${id})`);
            await this._db.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [`${key}_${id}`]);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] returning delete(${table}, ${key}_${id}) => deleted`);
            return;
        }
        catch (err) {
            this._handleError(err);
        }
    }
    /**
     * Find many variables from the database.
     *
     * @param {string} table - The table name.
     * @param {any} query - The query to be executed.
     * @param {number} limit? - The maximum number of results to return (optional).
     * @return {Promise<object|null>} - The value of the variables.
     * @throws {Error} - Throw an error if the variables cannot be retrieved.
     */
    async findMany(table, query, limit) {
        try {
            if (!await this.isTableExists(table))
                this.prepare(table);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving findMany(${table}, ${query}, ${limit})`);
            let [rows] = await this._db.pool?.query(`SELECT * FROM \`${table}\``);
            if (typeof query === 'function')
                rows = rows.filter(query);
            if (limit)
                rows = rows.slice(0, limit);
            const result = rows.map((row) => ({ ...row, data: { value: row.value } }));
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] returning findMany(${table}, ${query}, ${limit}) => `, result);
            return result;
        }
        catch (err) {
            this._handleError(err);
            return null;
        }
    }
    /**
     * Select all variables value from the database.
     *
     * @param {stribg} table - The table name.
     * @param {any} filter - The filter to be executed.
     * @param {number} list - The maximum number of results to return.
     * @param {string} sort - The sorting order, default is 'asc'.
     * @return {Promise<object|null>} - The all value of the variables.
     * @throws {Error} - Throw an error if the variables cannot be retrieved.
     */
    async all(table, filter, list = 100, sort = 'asc') {
        try {
            if (!await this.isTableExists(table))
                this.prepare(table);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving all(${table}, ${filter}, ${list}, ${sort})`);
            const [rows] = await this._db.pool?.query(`SELECT * FROM \`${table}\` ORDER BY \`value\` ${sort.toUpperCase()}`);
            const results = rows.filter(filter).map((row) => ({ key: row.key, value: row.value }));
            const result = results.slice(0, list);
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] returning all(${table}, ${filter}, ${list}, ${sort}) => `, result);
            return result;
        }
        catch (err) {
            this._handleError(err);
            return null;
        }
    }
    /**
     * Ping the database.
     *
     * @return {Promise<number>} - The ping time (in milliseconds).
     * @throws {Error} - Throw an error if the database cannot be pingged.
    */
    async ping(start = Date.now()) {
        try {
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving ping()`);
            await this._db.pool?.query('SELECT 1');
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] returning ping() => ${Date.now() - start}ms`);
            return Date.now() - start;
        }
        catch (err) {
            this._handleError(err);
            return -1;
        }
    }
    /**
     * Handle errors of the classes.
     *
     * @param {any} err - The error to be handled.
     * @param {string} type? - The type of error (optional).
     * @return {undefined} - UNDEFINED.
     */
    _handleError(err, type) {
        this.emit('error', err, this._options.keepAoiDB ? this._client.mysql : this._client.db, this._client);
        if (this._client?.aoiOptions?.suppressAllErrors === true) return;
        if (type === 'failed') {
            this.emit('disconnect', err, this._options.keepAoiDB ? this._client.mysql : this._client.db, this._client);
            this._logger([
                { text: `Failed to connect to MySQL database`, textColor: 'red' },
                { text: err.message, textColor: 'white' }
            ], { text: ' aoijs.mysql ', textColor: 'cyan' });
            return process.exit(1);
        }
        throw new Error(err);
    }
    /**
     * Bind the database functions to the aoi.js client.
     *
     * @param {any} db - The database to be bound.
     * @return {undefined} - UNDEFINED.
     * @throws {Error} - Throw an error if the functions cannot be bound.
     */
    _functionsBind(db) {
        try {
            this._emitEvents(this._db.pool);
            db.pool = this._db.pool;
            db.query = this._db.pool.query.bind(this._db.pool);
            db.tables = this._db.tables;
            db.get = this.get.bind(this);
            db.set = this.set.bind(this);
            db.drop = this.drop.bind(this);
            db.delete = this.delete.bind(this);
            db.deleteMany = this.deleteMany.bind(this);
            db.findMany = this.findMany.bind(this);
            db.all = this.all.bind(this);
            db.type = 'aoi.mysql';
            db.db = {
                avgPing: this.ping.bind(this),
                ready: true,
                readyAt: Date.now()
            };
        }
        catch (err) {
            this._handleError(err);
        }
    }
    /**
     * Emit events of the database.
     *
     * @param {any} pool - The pool to be emitted.
     * @return {undefined} - UNDEFINED.
     * @throws {Error} - Throw an error if the events cannot be emitted.
     */
    _emitEvents(pool) {
        try {
            pool.on('acquire', (connection) => this.emit('acquire', connection));
            pool.on('connection', (connection) => this.emit('connection', connection));
            pool.on('release', (connection) => this.emit('release', connection));
            pool.on('enqueue', () => this.emit('enqueue'));
        }
        catch (err) {
            this._handleError(err);
        }
    }
}
exports.Database = Database;
/**
 *  made with ♥️ by Tyowk.
 *
 *  CREDITS:
 *   - Time classes:  =>  https://github.com/aoijs/aoi.js/blob/v6/src/core/Time.js
 *   - Logger Function  =>  https://github.com/aoijs/aoi.js/blob/v6/src/classes/AoiError.js
 *   - All database related custom functions  =>  https://github.com/aoijs/aoi.js/blob/v6/src/functions
 */
