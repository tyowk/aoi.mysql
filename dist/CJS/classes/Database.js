"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const promise_1 = require("mysql2/promise");
const Logger_1 = require("./Logger");
const Functions_1 = require("./Functions");
const events_1 = __importDefault(require("events"));
const package_json_1 = __importDefault(require("../../../package.json"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * @class Database
 * @extends {EventEmitter}
 *
 * @param {any} client - The client instance.
 * @param {any} options - The configuration options for database.
 * @return {any} - The database instance.
 * @throws {Error} - Throw an error if the database is not configured.
 */
class Database extends events_1.default {
    _client;
    _db;
    _connection;
    _options;
    _logger;
    _variable;
    /**
     * Creates an instance of Database.
     *
     * @param {any} client - The client instance.
     * @param {any} options - Configuration options for database.
     * @return {any} - UNDEFINED
     * @throws {Error} - Throws an error if the setup fails
     */
    constructor(client, options) {
        super();
        this._client = client;
        this._options = options;
        this._logger = Logger_1.Logger;
        this._variable = client?.variableManager;
        this._db = {
            pool: (0, promise_1.createPool)(options.url || options),
            tables: [...options.tables, '__aoijs_vars__']
        };
        if (options.keepAoiDB && !client.options?.disableAoiDB) {
            client.mysql = {};
            new Functions_1.Functions(client, options.debug);
            this._functionsBind(client.mysql);
            client.options.disableAoiDB = false;
            options.keepAoiDB = true;
        }
        else if (!options.keepAoiDB && client.options?.disableAoiDB) {
            client.db = {};
            this._functionsBind(client.db);
            client.options.disableAoiDB = true;
            options.keepAoiDB = false;
        }
        else {
            this._logger([
                { text: ` `, textColor: 'white' },
                { text: `If you only want to use MySQL, you need to add "disableAoiDB" in the client options and set it to "true".`, textColor: 'red' },
                { text: ` `, textColor: 'white' },
                { text: `But if you want to keep using your aoi.db database, you need to add "keepAoiDB" in the database options and set it to "true".`, textColor: 'red' }
            ], { text: ' Aoi.MySQL ', textColor: 'cyan' });
            process.exit(1);
        }
        this._connect();
    }
    /**
     * Connects to the database.
     *
     * @return {any} - UNDEFINED.
     * @throws {Error} - Throws an error if the connection fails.
     */
    async _connect() {
        try {
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] :: connecting database...`);
            if (!this._client)
                throw new Error('Client instance is not defined.');
            if (!this._options)
                throw new Error('Missing database settings in options.');
            if (!this._options.tables || this._options.tables.length === 0)
                throw new Error('No variable tables specified in options. Please provide at least one table.');
            if (this._options.tables.includes('__aoijs_vars__'))
                throw new Error('"__aoijs_vars__" is reserved as a table name and cannot be used.');
            this._connection = await this._db.pool?.getConnection();
            for (const table of this._db.tables) {
                this.prepare(table);
            }
            this.emit('connect', this._options.keepAoiDB ? this._client.mysql : this._client.db, this._client);
            const res = await (await fetch('https://registry.npmjs.org/aoi.mysql')).json();
            const logger = [
                { text: `Latency: ${await this.ping()}ms`, textColor: 'green' },
                { text: `Successfully connected to MySQL database`, textColor: 'blue' },
                { text: `Installed on v${package_json_1.default.version || '0.0.0'}`, textColor: 'blue' }
            ];
            if (!res.versions[package_json_1.default.version] || res['dist-tags'].dev === package_json_1.default.version || package_json_1.default.version.includes('dev')) {
                logger.push({ text: ' ', textColor: 'white' });
                logger.push({ text: 'This is a development version.', textColor: 'red' });
                logger.push({ text: 'Some features may be incomplete or unstable.', textColor: 'red' });
            }
            else if (package_json_1.default.version !== res['dist-tags'].latest) {
                logger.push({ text: ' ', textColor: 'white' });
                logger.push({ text: 'Outdated version detected!', textColor: 'red' });
                logger.push({ text: 'Update with "npm i aoi.mysql@latest"', textColor: 'red' });
            }
            this._logger(logger, { text: ' Aoi.MySQL ', textColor: 'cyan' });
        }
        catch (err) {
            this._handleError(err, 'failed');
        }
    }
    /**
     * Add a variables.
     *
     * @param {object} data - The variables data.
     * @param {string} table - The table name.
     * @return {undefined} - UNDEFINED.
     * @throws {Error} - Throw an error if the function is crashed.
     */
    variables(data, table) {
        try {
            const db = this._options.keepAoiDB ? this._client.mysql : this._client.db;
            table = table || db.tables[0];
            if (!data || typeof data !== 'object' || !table)
                return;
            if (!db)
                throw new Error('You need to initialize the database first before add variables.');
            for (const [name, value] of Object.entries(data)) {
                this._variable.add({ name, value, table });
            }
        }
        catch (err) {
            this._handleError(err);
        }
    }
    /**
     * Checking if the table exists.
     *
     * @param {string} table - The table name.
     * @return {boolean} - Returns true if the table exists, otherwise false.
     */
    async isTableExists(table) {
        const [rows] = await this._db.pool?.query(`SHOW TABLES LIKE ?`, [table]);
        return rows.length > 0;
    }
    /**
     * Prepares a table.
     *
     * @param {string} table - The table name.
     * @return {Promise<undefined>} - UNDEFINED.
     * @throws {Error} - Throws an error if the table cannot be prepared.
     */
    async prepare(table) {
        try {
            if (!this._db.tables.includes(table))
                throw new Error(`Table "${table}" is not defined in options. Please provide it!`);
            if (await this.isTableExists(table))
                return;
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] preparing table ${chalk_1.default.cyan(table || 'unknown')}...`);
            await this._db.pool?.query(`CREATE TABLE IF NOT EXISTS \`${table}\` (
                    \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
                    \`value\` LONGTEXT NOT NULL
                );`);
            this._connection?.release();
            return;
        }
        catch (err) {
            this._handleError(err);
        }
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
                this._connection?.release();
                const result = rows.length > 0 ? rows[0] : null;
                if (this._options.debug)
                    console.log(`[${chalk_1.default.blue('DEBUG')}] returning get(${table}, ${queryKey}) => `, result);
                return result;
            }
            if (!this._variable.has(key, table))
                return null;
            const defaultValue = this._variable.get(key, table)?.default;
            const [rows] = await this._db.pool?.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [queryKey]);
            this._connection?.release();
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
            this._connection?.release();
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
                this._connection?.release();
                return;
            }
            if (this._options.debug)
                console.log(`[${chalk_1.default.blue('DEBUG')}] rechieving drop(${table})`);
            await this._db.pool?.query(`DROP TABLE IF EXISTS \`${table}\``);
            this._connection?.release();
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
            if (keysToDelete.length === 0) {
                this._connection?.release();
                return;
            }
            const placeholders = keysToDelete.map(() => '?').join(',');
            await this._db.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` IN (${placeholders})`, keysToDelete);
            this._connection?.release();
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
            this._connection?.release();
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
            this._connection?.release();
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
            this._connection?.release();
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
            this._connection?.release();
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
        if (type === 'failed') {
            this.emit('disconnect', err, this._options.keepAoiDB ? this._client.mysql : this._client.db, this._client);
            this._logger([
                { text: `Failed to connect to MySQL database`, textColor: 'red' },
                { text: err.message, textColor: 'white' }
            ], { text: ' Aoi.MySQL ', textColor: 'cyan' });
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
