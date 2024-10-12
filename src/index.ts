import { createPool } from 'mysql2/promise';
import { createConsoleMessage } from 'aoi.js/src/classes/AoiError';
import EventEmitter from 'events';

export class Database extends EventEmitter {
    _client: any;
    _options: any;
    _variable: any;
    
    constructor(client: any, options: any) {
        super();
        this._client = client;
        this._options = options;
        this._variable = this._client?.variableManager;
        this._connect();
    }

    private async _connect() {
        try {
            if (!this._client) throw new Error('Client instance is not defined.');
            if (!this._options?.url) throw new Error('Missing MySQL server URI in options.');
            if (!this._options?.tables || this._options?.tables.length === 0) throw new Error('No variable tables specified in options. Please provide at least one table.');
            if (this._options?.tables.includes('__aoijs_vars__')) throw new Error('"__aoijs_vars__" is reserved as a table name and cannot be used.');
            this._client.db = createPool(this._options.url);
            this._client.db.tables = [...this._options.tables, '__aoijs_vars__'];
            for (const table of this._client.db.tables) { await this._createTableIfNotExists(table); }
            this._assignMethods();
            this.emit('ready', this._client, this._client?.db);
            createConsoleMessage([
                { text: `Latency: ${await this.ping()}ms`, textColor: 'white' },
                { text: `Successfully connected to MySQL`, textColor: 'white' },
                { text: `Installed on v${require('../package.json').version || '0.0.0'}`, textColor: 'green' }
            ], 'white', { text: ' aoi.mysql ', textColor: 'cyan' });

        } catch (err) {
            this._handleError(err, 2);
        }
    }

    public async _createTableIfNotExists(table: string) {
        try {
            await this._client.db.query(
                `CREATE TABLE IF NOT EXISTS \`${table}\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`key\` VARCHAR(255) NOT NULL UNIQUE,
                    \`value\` LONGTEXT NOT NULL
                );`
            );
        } catch (err) {
            this._handleError(err, 1);
        }
    }

    public async get(table: string, key: string, id = undefined) {
        try {
            const aoivars = ["cooldown", "setTimeout", "ticketChannel"];
            await this._createTableIfNotExists(table);
            if (aoivars.includes(key)) {
                const [rows] = await this._client.db.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [`${key}_${id}`]);
                return rows.length > 0 ? rows[0] : null;
            } else {
                if (!this._variable?.has(key, table)) return null;
                const value = this._variable?.get(key, table)?.default;
                const [rows] = await this._client.db.query(`SELECT value FROM \`${table}\` WHERE \`key\` = ?`, [`${key}_${id}`]);
                return rows.length > 0 ? rows[0] : (value ? { value } : null);
            }
        } catch (err) {
            this._handleError(err, 1);
            return null;
        }
    }

    public async set(table: string, key: string, id: number, value: any) {
        try {
            await this._createTableIfNotExists(table);
            await this._client.db.query(
                `INSERT INTO \`${table}\` (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?`, 
                [`${key}_${id}`, value, value]
            );
        } catch (err) {
            this._handleError(err, 1);
        }
    }

    public async drop(table: string, variable: string) {
        try {
            if (variable) {
                await this._client.db.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [variable]);
            } else {
                await this._client.db.query(`DROP TABLE IF EXISTS \`${table}\``);
            }
        } catch (err) {
            this._handleError(err, 1);
        }
    }

    public async deleteMany(table: string, query: any) {
        try {
            await this._createTableIfNotExists(table);
            let [rows] = await this._client.db.query(`SELECT * FROM \`${table}\``);
            rows = rows.filter(query).map((row: any) => row.id);
            if (rows.length === 0) return;
            const placeholders = rows.map(() => '?').join(',');
            await this._client.db.query(`DELETE FROM \`${table}\` WHERE id IN (${placeholders})`, rows);
        } catch (err) {
            this._handleError(err, 1);
        }
    }

    public async delete(table: string, key: string, id: number) {
        try {
            await this._createTableIfNotExists(table);
            await this._client.db.query(`DELETE FROM \`${table}\` WHERE \`key\` = ?`, [`${key}_${id}`]);
        } catch (err) {
            this._handleError(err, 1);
        }
    }

    public async findMany(table: string, query: any, limit: number) {
        try {
            await this._createTableIfNotExists(table);
            let [rows] = await this._client.db.query(`SELECT * FROM \`${table}\``);
            if (typeof query === 'function') rows = rows.filter(query);
            if (limit) rows = rows.slice(0, limit);
            return rows.map((row: any) => ({...row, data: { value: row.value }}));
        } catch (err) {
            this._handleError(err, 1);
            return null;
        }
    }

    public async all(table: string, filter: any, list = 100, sort = 'asc') {
        try {
            await this._createTableIfNotExists(table);
            const [rows] = await this._client.db.query(`SELECT * FROM \`${table}\` ORDER BY \`value\` ${sort.toUpperCase()}`);
            let results = rows.filter(filter).map((row: any) => ({ key: row.key, value: row.value }));
            return results.slice(0, list);
        } catch (err) {
            this._handleError(err, 1);
            return null;
        }
    }

    public async ping() {
        try {
            const start = Date.now();
            await this._client.db.query('SELECT 1');
            return Date.now() - start;
        } catch (err) {
            this._handleError(err, 1);
            return -1;
        }
    }

    private _assignMethods() {
        try {
            this._client.db.get = this.get.bind(this);
            this._client.db.set = this.set.bind(this);
            this._client.db.drop = this.drop.bind(this);
            this._client.db.delete = this.delete.bind(this);
            this._client.db.deleteMany = this.deleteMany.bind(this);
            this._client.db.findMany = this.findMany.bind(this);
            this._client.db.all = this.all.bind(this);
            this._client.db.type = 'aoi.mysql';
            this._client.db.db = {
                avgPing: this.ping.bind(this),
                ready: true,
                readyAt: Date.now(),
            };
        } catch (err) {
            this._handleError(err, 1);
        }
    }

    private async _handleError(err: any, type: number) {
        if (type == 1) {
            console.error(err);
            this.emit('error', err, this._client.db, this._client);
        } else if (type == 2) {
            this.emit('error', err, this._client.db, this._client);
            createConsoleMessage([
                { text: `Failed to connect to MySQL`, textColor: 'red' },
                { text: err.message, textColor: 'white' }
            ], 'white', { text: ' aoi.mysql ', textColor: 'cyan' });
            process.exit(1);
        }
    }
}
