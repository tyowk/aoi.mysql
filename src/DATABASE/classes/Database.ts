import { createPool } from 'mysql2/promise';
import { Logger } from './Logger';
import { Functions } from './Functions';
import EventEmitter from 'events';
import pkg from '../../../package.json';
import chalk from 'chalk';

/**
 * @class Database
 * @extends {EventEmitter}
 * 
 * @param {any} client - The client instance.
 * @param {any} options - The configuration options for database.
 * @return {any} - The database instance.
 * @throws {Error} - Throw an error if the database is not configured.
 */

export class Database extends EventEmitter {
    private _client: any;
    private _db: any;
    private _connection: any;
    private _options: any;
    private _logger: any;
    private _variable: any;

    /**
     * Creates an instance of Database.
     *
     * @param {any} client - The client instance.
     * @param {any} options - Configuration options for database.
     * @return {any} - UNDEFINED
     * @throws {Error} - Throws an error if the setup fails
     */
    
    constructor(client: any, options: any) {
        super();
        this._client = client;
        this._options = options;
        this._logger = Logger;
        this._variable = client?.variableManager;
        this._db = {
            pool: createPool(options.url || options),
            tables: [...options.tables, '__aoijs_vars__']
        };
        
        if (options.keepAoiDB && !client.options?.disableAoiDB) {
            client.mysql = {};
            new Functions(client, options.debug);
            this._functionsBind(client.mysql);
            client.options.disableAoiDB = false;
            options.keepAoiDB = true;
        } else if (!options.keepAoiDB && client.options?.disableAoiDB) {
            client.db = {};
            this._functionsBind(client.db);
            client.options.disableAoiDB = true;
            options.keepAoiDB = false;
        } else {
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
    
    private async _connect(): Promise<undefined> {
        try {
            if (this._options.debug)
                console.log(`[${chalk.blue('DEBUG')}] :: connecting database...`);
            if (!this._client)
                throw new Error('Client instance is not defined.');
            if (!this._options)
                throw new Error('Missing database settings in options.');
            if (!this._options.tables || this._options.tables.length === 0)
                throw new Error('No variable tables specified in options. Please provide at least one table.');
            if (this._options.tables.includes('__aoijs_vars__'))
                throw new Error('"__aoijs_vars__" is reserved as a table name and cannot be used.');
            
            this._connection = await this._db.pool?.getConnection();
            for (const table of this._db.tables) { this.prepare(table); }
            this.emit('connect', this._options.keepAoiDB ? this._client.mysql : this._client.db, this._client);
            const res = await (await fetch('https://registry.npmjs.org/aoi.mysql')).json();
            const logger = [
                { text: `Latency: ${await this.ping()}ms`, textColor: 'green' },
                { text: `Successfully connected to MySQL database`, textColor: 'blue' },
                { text: `Installed on v${pkg.version || '0.0.0'}`, textColor: 'blue' }
            ];

            if (!res.versions[pkg.version] || res['dist-tags'].dev === pkg.version || pkg.version.includes('dev')) {
                logger.push({ text: ' ', textColor: 'white' });
                logger.push({ text: 'This is a development version.', textColor: 'red' });
                logger.push({ text: 'Some features may be incomplete or unstable.', textColor: 'red' });
            } else if (pkg.version !== res['dist-tags'].latest) {
                logger.push({ text: ' ', textColor: 'white' });
                logger.push({ text: 'Outdated version detected!', textColor: 'red' });
                logger.push({ text: 'Update with "npm i aoi.mysql@latest"', textColor: 'red' });
            }
            this._logger(logger, { text: ' Aoi.MySQL ', textColor: 'cyan' });
        } catch (err) { this._handleError(err, 'failed') }
    }

    /**
     * Add a variables.
     *
     * @param {object} data - The variables data.
     * @param {string} table - The table name.
     * @return {undefined} - UNDEFINED.
     * @throws {Error} - Throw an error if the function is crashed.
     */

    public variables(data: object, table?: string): undefined {
        try {
            const db = this._options.keepAoiDB ? this._client.mysql : this._client.db
            table = table || db.tables[0];
            if (!data || typeof data !== 'object' || !table) return;
            if (!db) throw new Error('You need to initialize the database first before add variables.');
            for (const [name, value] of Object.entries(data)) {
                this._variable.add({ name, value, table });
            }
        } catch (err) { this._handleError(err) }
    }

    /**
     * Checking if the table exists.
     *
     * @param {string} table - The table name.
     * @return {boolean} - Returns true if the table exists, otherwise false.
     */

    public async isTableExists(table: string): Promise<boolean> {
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

    public async prepare(table: string): Promise<undefined> {
        try {
            if (!this._db.tables.includes(table)) throw new Error(`Table "${table}" is not defined in options. Please provide it!`);
            if (await this.isTableExists(table)) return;
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] preparing table ${chalk.cyan(table || 'unknown')}...`);
            
            await this._db.pool?.query(
                `CREATE TABLE IF NOT EXISTS \`${table}\` (
                    \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
                    \`value\` LONGTEXT NOT NULL
                );`
            );
            
            this._connection?.release();
            return;
        } catch (err) {
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

    public async get(table: string, key: string, id?: number, aoivars = ['cooldown', 'setTimeout', 'ticketChannel']): Promise<object|null> {
        try {
            if (!await this.isTableExists(table)) this.prepare(table);
            const queryKey = `${key}_${id}`;
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving get(${table}, ${queryKey})`);
            
            if (aoivars.includes(key)) {
                const [rows] = await this._db.pool?.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [queryKey]);
                this._connection?.release();
                const result = rows.length > 0 ? rows[0] : null;
                if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning get(${table}, ${queryKey}) => `, result);
                return result;
            }

            if (!this._variable.has(key, table)) return null;
            const defaultValue = this._variable.get(key, table)?.default;
            const [rows] = await this._db.pool?.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [queryKey]);
            this._connection?.release();
            const result = rows.length > 0 ? rows[0] : (defaultValue ? { value: defaultValue } : null);
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning get(${table}, ${queryKey}) => `, result);
            return result;
        } catch (err) {
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

    public async set(table: string, key: string, id: number, value: any): Promise<undefined> {
        try {
            if (!await this.isTableExists(table)) this.prepare(table);
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving set(${table}, ${key}_${id}, ${value})`);
                
            await this._db.pool?.query(
                `INSERT INTO \`${table}\` (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`, 
                [`${key}_${id}`, value, value]
            );
            
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning set(${table}, ${key}_${id}, ${value}) => value updated`);
            this._connection?.release();
            return;
        } catch (err) {
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

    public async drop(table: string, variable?: string): Promise<undefined> {
        try {
            if (!await this.isTableExists(table)) this.prepare(table);
            if (variable) {
                if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving drop(${table}, ${variable})`);
                await this._db.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [variable]);
                if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning drop(${table}, ${variable}) => variable deleted`);
                this._connection?.release();
                return;
            }
            
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving drop(${table})`);
            await this._db.pool?.query(`DROP TABLE IF EXISTS \`${table}\``);
            this._connection?.release();
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning drop(${table}) => table deleted`);
            return;
        } catch (err) {
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
    
    public async deleteMany(table: string, query: (row: any) => boolean): Promise<undefined> {
        try {
            if (!await this.isTableExists(table)) this.prepare(table);
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving deleteMany(${table}, ${query})`);
            const [rows] = await this._db.pool?.query(`SELECT * FROM \`${table}\``);
            const keysToDelete = rows.filter(query).map((row: any) => row.key);
            if (keysToDelete.length === 0) {
                this._connection?.release();
                return;
            }

            const placeholders = keysToDelete.map(() => '?').join(',');
            await this._db.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` IN (${placeholders})`, keysToDelete);
            this._connection?.release();
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning deleteMany(${table}, ${query}) => deleted`);
            return;
        } catch (err) {
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
    
    public async delete(table: string, key: string, id: number): Promise<undefined> {
        try {
            if (!await this.isTableExists(table)) this.prepare(table);
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving delete(${table}, ${key}_${id})`);
            await this._db.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [`${key}_${id}`]);
            this._connection?.release();
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning delete(${table}, ${key}_${id}) => deleted`);
            return;
        } catch (err) {
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

    public async findMany(table: string, query: (row: any) => boolean, limit?: number): Promise<object|null> {
        try {
            if (!await this.isTableExists(table)) this.prepare(table);
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving findMany(${table}, ${query}, ${limit})`);
            let [rows] = await this._db.pool?.query(`SELECT * FROM \`${table}\``);
            if (typeof query === 'function') rows = rows.filter(query);
            if (limit) rows = rows.slice(0, limit);
            this._connection?.release();
            const result = rows.map((row: any) => ({ ...row, data: { value: row.value } }));
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning findMany(${table}, ${query}, ${limit}) => `, result);
            return result
        } catch (err) {
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
    
    public async all(table: string, filter: (row: any) => boolean, list: number = 100, sort: 'asc' | 'desc' = 'asc'): Promise<object|null> {
        try {
            if (!await this.isTableExists(table)) this.prepare(table);
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving all(${table}, ${filter}, ${list}, ${sort})`);
            const [rows] = await this._db.pool?.query(`SELECT * FROM \`${table}\` ORDER BY \`value\` ${sort.toUpperCase()}`);
            const results = rows.filter(filter).map((row: any) => ({ key: row.key, value: row.value }));
            this._connection?.release();
            const result = results.slice(0, list);
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning all(${table}, ${filter}, ${list}, ${sort}) => `, result);
            return result;
        } catch (err) {
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
    
    public async ping(start = Date.now()): Promise<number> {
        try {
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] rechieving ping()`);
            await this._db.pool?.query('SELECT 1');
            this._connection?.release();
            if (this._options.debug) console.log(`[${chalk.blue('DEBUG')}] returning ping() => ${Date.now() - start}ms`);
            return Date.now() - start;
        } catch (err) {
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

    private _handleError(err: any, type?: string): undefined {
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

    private _functionsBind(db: any): undefined {
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
        } catch (err) {
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

    private _emitEvents(pool: any): undefined {
        try {
            pool.on('acquire', (connection: any) => this.emit('acquire', connection));
            pool.on('connection', (connection: any) => this.emit('connection', connection));
            pool.on('release', (connection: any) => this.emit('release', connection));
            pool.on('enqueue', () => this.emit('enqueue'));
        } catch (err) {
            this._handleError(err);
        }
    }
}


/**
 *  made with ♥️ by Tyowk.
 *
 *  CREDITS:
 *   - Time classes:  =>  https://github.com/aoijs/aoi.js/blob/v6/src/core/Time.js
 *   - Logger Function  =>  https://github.com/aoijs/aoi.js/blob/v6/src/classes/AoiError.js
 *   - All database related custom functions  =>  https://github.com/aoijs/aoi.js/blob/v6/src/functions
 */
