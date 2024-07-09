const { createPool } = require('mysql2/promise');
const { createConsoleMessage } = require('aoi.js/src/classes/AoiError');
const EventEmitter = require('events');

exports.Database = class AoiMySQL extends EventEmitter {
    constructor(client, options) {
        super();
        this._client = client;
        this._options = options;
        this._variable = this._client?.variableManager?.cache;
        this._connect();
    }

    async _connect() {
        try {
            if (!this._client) throw new Error('Client instance is not defined.');
            if (!this._options?.url) throw new Error('Missing MySQL server URI in options.');
            if (!this._options?.tables || this._options?.tables.length === 0) throw new Error('No variable tables specified in options. Please provide at least one table.');
            if (this._options?.tables.includes('__aoijs_vars__')) throw new Error('AoiMySQL: "__aoijs_vars__" is reserved as a table name and cannot be used.');
            
            this._client.db = createPool(this._options.url);
            this._client.db.tables = [...this._options.tables, '__aoijs_vars__'];
            for (const table of this._client.db.tables) {
                await this._createTableIfNotExists(table);
            }

            this._assignMethods();
            this.emit('ready', this._client, this._client?.db);
            await createConsoleMessage([
                { text: `Latency: ${await this.ping()}ms`, textColor: 'white' },
                { text: `Successfully connected to MySQL`, textColor: 'white' },
                { text: `Installed on v${require('../package.json').version || '0.0.0'}`, textColor: 'green' }
            ], 'white', { text: ' aoi.mysql ', textColor: 'cyan' });

        } catch (err) {
            this.emit('error', err, this._client.db, this._client);
            await createConsoleMessage([
                { text: `Failed to connect to MySQL`, textColor: 'red' },
                { text: err.message, textColor: 'white' }
            ], 'white', { text: ' aoi.mysql ', textColor: 'cyan' });
            process.exit(0);
        }
    }

    async _createTableIfNotExists(table) {
        try {
            await this._client.db.query(
                `CREATE TABLE IF NOT EXISTS \`${table}\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`key\` VARCHAR(255) NOT NULL UNIQUE,
                    \`value\` LONGTEXT NOT NULL
                );`
            );
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }

    async get(table, key, id = undefined) {
        try {
            const value = this._variable?.get(`${key}_${table}`)?.default;
            await this._createTableIfNotExists(table);
            const [rows] = await this._client.db.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [`${key}_${id}`]);
            return rows.length > 0 ? { value: rows[0].value } : (value ? { value } : null);
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }

    async set(table, key, id, value) {
        try {
            await this._createTableIfNotExists(table);
            await this._client.db.query(
                `INSERT INTO \`${table}\` (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`, 
                [`${key}_${id}`, value, value]
            );
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }

    async drop(table, variable) {
        try {
            if (variable) {
                await this._client.db.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [variable]);
            } else {
                await this._client.db.query(`DROP TABLE IF EXISTS \`${table}\``);
            }
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }

    async deleteMany(table, query) {
        try {
            await this._createTableIfNotExists(table);
            let [rows] = await this._client.db.query(`SELECT * FROM \`${table}\``);
            rows = rows.filter(query).map(row => row.id);
            if (!rows.length > 0) return;
            const placeholders = rows.map(() => '?').join(',');
            await this._client.db.query(`DELETE FROM \`${table}\` WHERE id IN (${placeholders})`, rows);
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }

    async delete(table, key, id) {
        try {
            await this._createTableIfNotExists(table);
            await this._client.db.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [`${key}_${id}`]);
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }

    async findMany(table, query, limit) {
        try {
            await this._createTableIfNotExists(table);
            let [rows] = await this._client.db.query(`SELECT * FROM \`${table}\``);
            if (typeof query === 'function') rows = rows.filter(query);
            if (limit) rows = rows.slice(0, limit);
            return rows.map(row => ({...row, data: { value: row.value }}));
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
            throw err;
        }
    }

    async all(table, filter, list = 100, sort = 'asc') {
        try {
            await this._createTableIfNotExists(table);
            const [rows] = await this._client.db.query(`SELECT * FROM \`${table}\``);
            let results = rows.filter(filter).map(row => ({ key: row.key, value: row.value }));
            if (sort && sort.toLowerCase() === 'desc') {
                results.sort((a, b) => (a.value < b.value ? 1 : -1));
            } else if (sort && sort.toLowerCase() === 'asc') {
                results.sort((a, b) => (a.value > b.value ? 1 : -1));
            }
            return results.slice(0, list);
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }

    async findOne(table, query) {
        try {
            await this._createTableIfNotExists(table);
            const [rows] = await this._client.db.query(`SELECT * FROM \`${table}\` WHERE ${query} LIMIT 1`);
            return rows.length > 0 ? rows[0] : null;
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }

    async ping() {
        try {
            const start = Date.now();
            await this._client.db.query('SELECT 1');
            return Date.now() - start;
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
            return -1;
        }
    }

    _assignMethods() {
        try {
            this._client.db.get = this.get.bind(this);
            this._client.db.set = this.set.bind(this);
            this._client.db.drop = this.drop.bind(this);
            this._client.db.delete = this.delete.bind(this);
            this._client.db.deleteMany = this.deleteMany.bind(this);
            this._client.db.findOne = this.findOne.bind(this);
            this._client.db.findMany = this.findMany.bind(this);
            this._client.db.all = this.all.bind(this);
            this._client.db.type = 'aoi.mysql';
            this._client.db.by = 'Made with ♥️ by Tyowk';
            this._client.db.db = {
                pool: this._client.db.pool,
                avgPing: this.ping.bind(this),
                ready: true,
                readyAt: Date.now(),
                by: this._client.db.by,
                type: this._client.db.type
            };
        } catch (err) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        }
    }
};
