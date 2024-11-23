const { createConsoleMessage } = require('aoi.js/src/classes/AoiError');
const { createPool } = require('mysql2/promise');
const { Functions } = require('./Functions');
const EventEmitter = require('events');
const chalk = require('chalk');

exports.Database = class Database extends EventEmitter {
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
        });

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
            ], 'white', { text: ' aoijs.mysql ', textColor: 'cyan' });
            process.exit(1);
        }
        this.#connect();
    }

    async #connect() {
        try {
            this.emit('debug', `connecting database...`);
            if (!this.client) throw new Error('Client instance is not defined.');
            if (!this.options) throw new Error('Missing database settings in options.');
            if (!this.options.tables || this.options.tables.length === 0) throw new Error('No variable tables specified in options. Please provide at least one table.');
            if (this.options.tables.includes('__aoijs_vars__')) throw new Error('"__aoijs_vars__" is reserved as a table name and cannot be used.');
            for (const table of this.tables) { await this.prepare(table); };
            this.emit('connect', this.options.keepAoiDB ? this.client.mysql : this.client.db, this.client);
            if (this.client?.aoiOptions?.aoiLogs === false) return;
            createConsoleMessage([
                { text: `Latency: ${await this.ping()}ms`, textColor: 'green' },
                { text: `Successfully connected to MySQL database`, textColor: 'blue' },
            ], 'white', { text: ' aoijs.mysql ', textColor: 'cyan' });
        } catch (err) { this.#handleError(err, 'failed') }
    }

    variables(data, table = this.tables[0] || 'main') {
        try {
            const db = this.options.keepAoiDB ? this.client.mysql : this.client.db;
            if (!data || typeof data !== 'object' || !table) return;
            if (!db) throw new Error('You need to initialize the database first before adding variables.');
            for (const [name, value] of Object.entries(data)) { this.client?.variableManager?.add({ name, value, table }) }
        } catch (err) { this.#handleError(err) }
    }

    async isTableExists(table) {
        const [rows] = await this.pool?.query(`SHOW TABLES LIKE ?`, [table]);
        return rows.length > 0;
    }

    async prepare(table) {
        try {
            if (!this.tables.includes(table)) throw new Error(`Table "${table}" is not defined in options. Please provide it!`);
            if (await this.isTableExists(table)) return;
            this.emit('debug', `retrieving prepare(${table || 'unknown'} table)...`);
            await this.pool?.query(`CREATE TABLE IF NOT EXISTS \`${table}\` (
                    \`key\` VARCHAR(255) NOT NULL PRIMARY KEY,
                    \`value\` LONGTEXT NOT NULL
                );`);
            return;
        } catch (err) { this.#handleError(err) }
    }

    async get(table, key, id, aoivars = ['cooldown', 'setTimeout', 'ticketChannel']) {
        try {
            if (!await this.isTableExists(table)) await this.prepare(table);
            const queryKey = `${key}_${id}`;
            this.emit('debug', `retrieving get(${table}, ${queryKey})`);
            if (aoivars.includes(key)) {
                const [rows] = await this.pool?.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [queryKey]);
                const result = rows.length > 0 ? rows[0] : null;
                this.emit('debug', `returning get(${table}, ${queryKey}) => `, result);
                return result;
            };

            if (!this.client.variableManager.has(key, table)) return null;
            const defaultValue = this.client?.variableManager?.get(key, table)?.default;
            const [rows] = await this.pool?.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [queryKey]);
            const result = rows.length > 0 ? rows[0] : (defaultValue ? { value: defaultValue } : null);
            this.emit('debug', `returning get(${table}, ${queryKey}) => `, result);
            return result;
        } catch (err) { this.#handleError(err); return null }
    }

    async set(table, key, id, value) {
        try {
            if (!await this.isTableExists(table)) await this.prepare(table);
            this.emit('debug', `retrieving set(${table}, ${key}_${id}, ${value})`);
            await this.pool?.query(`INSERT INTO \`${table}\` (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`, [`${key}_${id}`, value, value]);
            this.emit('debug', `returning set(${table}, ${key}_${id}, ${value}) =>`, 'value updated');
            return;
        } catch (err) { this.#handleError(err) }
    }

    async drop(table, variable) {
        try {
            if (!await this.isTableExists(table)) await this.prepare(table);
            if (variable) {
                this.emit('debug', `retrieving drop(${table}, ${variable})`);
                await this.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [variable]);
                this.emit('debug', `returning drop(${table}, ${variable}) => `, 'variable deleted');
                return;
            }

            this.emit('debug', `retrieving drop(${table})`);
            await this.pool?.query(`DROP TABLE IF EXISTS \`${table}\``);
            this.emit('debug', `returning drop(${table}) => `, 'table deleted');
            return;
        } catch (err) { this.#handleError(err) }
    }

    async delete(table, key, id) {
        try {
            if (!await this.isTableExists(table)) await this.prepare(table);
            this.emit('debug', `retrieving delete(${table}, ${key}_${id})`);
            await this.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [`${key}_${id}`]);
            this.emit('debug', `returning delete(${table}, ${key}_${id}) => `, 'deleted');
            return;
        } catch (err) { this.#handleError(err) }
    }

    async deleteMany(table, query) {
        try {
            if (!await this.isTableExists(table)) await this.prepare(table);
            this.emit('debug', `retrieving deleteMany(${table}, ${query})`);
            const [rows] = await this.pool?.query(`SELECT * FROM \`${table}\``);
            const keysToDelete = rows.filter(query).map((row) => row.key);
            if (keysToDelete.length === 0) return;
            const placeholders = keysToDelete.map(() => '?').join(',');
            await this.pool?.query(`DELETE FROM \`${table}\` WHERE \`key\` IN (${placeholders})`, keysToDelete);
            this.emit('debug', `returning deleteMany(${table}, ${query}) => `, 'deleted');
            return;
        } catch (err) { this.#handleError(err) }
    }

    async findMany(table, query, limit) {
        try {
            if (!await this.isTableExists(table)) await this.prepare(table);
            this.emit('debug', `retrieving findMany(${table}, ${query}, ${limit})`);
            let [rows] = await this.pool?.query(`SELECT * FROM \`${table}\``);
            if (typeof query === 'function') rows = rows.filter(query);
            if (limit) rows = rows.slice(0, limit);
            const result = rows.map((row) => ({ ...row, data: { value: row.value }}));
            this.emit('debug', `returning findMany(${table}, ${query}, ${limit}) => `, result);
            return result;
        } catch (err) { this.#handleError(err); return null }
    }

    async findOne(table, key) {
        try {
            if (!await this.isTableExists(table)) await this.prepare(table);
            this.emit('debug', `retrieving findOne(${table}, ${queryKey})`);
            if (!this.client.variableManager.has(key, table)) return null;
            const defaultValue = this.client?.variableManager?.get(key, table)?.default;
            const [rows] = await this.pool?.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [key]);
            const result = rows.length > 0 ? rows[0] : (defaultValue ? { value: defaultValue } : null);
            this.emit('debug', `returning findOne(${table}, ${key}) => `, result);
            return result;
        } catch (err) { this.#handleError(err); return null }
    }

    async all(table, filter, list = 100, sort = 'asc') {
        try {
            if (!await this.isTableExists(table)) await this.prepare(table);
            this.emit('debug', `retrieving all(${table}, ${filter}, ${list}, ${sort})`);
            const [rows] = await this.pool?.query(`SELECT * FROM \`${table}\` ORDER BY \`value\` ${sort.toUpperCase()}`);
            const results = rows.filter(filter).map((row) => ({ key: row.key, value: row.value }));
            const result = results.slice(0, list);
            this.emit('debug', `returning all(${table}, ${filter}, ${list}, ${sort}) => `, result);
            return result;
        } catch (err) { this.#handleError(err); return null }
    }

    async ping(start = Date.now()) {
        try {
            this.emit('debug', `retrieving ping()`);
            await this.pool?.query('SELECT 1');
            this.emit('debug', `returning ping() => `, `${Date.now() - start}ms`);
            return Date.now() - start;
        } catch (err) { this.#handleError(err); return -1 }
    }

    #handleError(err, type) {
        this.emit('error', err, this.options.keepAoiDB ? this.client.mysql : this.client.db, this.client);
        if (this.client?.aoiOptions?.suppressAllErrors === true) return;
        if (type === 'failed') {
            this.emit('disconnect', err, this.options.keepAoiDB ? this.client.mysql : this.client.db, this.client);
            createConsoleMessage([
                { text: `Failed to connect to MySQL database`, textColor: 'red' },
                { text: err.message, textColor: 'white' }
            ], 'white', { text: ' aoijs.mysql ', textColor: 'cyan' });
            process.exit(1);
        }
        throw new Error(err);
    }

    #functionsBind(db) {
        try {
            this.#emitEvents(this.pool);
            db.pool = this.pool;
            db.query = this.pool.query.bind(this.pool);
            db.tables = this.tables;
            db.get = this.get.bind(this);
            db.set = this.set.bind(this);
            db.drop = this.drop.bind(this);
            db.delete = this.delete.bind(this);
            db.deleteMany = this.deleteMany.bind(this);
            db.findMany = this.findMany.bind(this);
            db.findOne = this.findOne.bind(this);
            db.all = this.all.bind(this);
            db.type = 'aoijs.mysql';
            db.db = {
                avgPing: this.ping.bind(this),
                ready: true,
                readyAt: Date.now()
            };
        } catch (err) { this.#handleError(err) }
    }

    #emitEvents(pool) {
        try {
            pool.on('acquire', (connection) => this.emit('acquire', connection));
            pool.on('connection', (connection) => this.emit('connection', connection));
            pool.on('release', (connection) => this.emit('release', connection));
            pool.on('enqueue', () => this.emit('enqueue'));
            if (this.options.debug) {
                this.on('debug', (msg, result) => {
                    if (result) return console.log(`[${chalk.blue('DEBUG')}] :: ${msg}`, result);
                    console.log(`[${chalk.blue('DEBUG')}] :: ${msg}`);
                });
            }
        } catch (err) { this.#handleError(err) }
    }
};
