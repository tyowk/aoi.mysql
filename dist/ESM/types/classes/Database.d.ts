import EventEmitter from 'events';
/**
 * @class Database
 * @extends {EventEmitter}
 *
 * @param {any} client - The client instance.
 * @param {any} options - The configuration options for database.
 * @return {any} - The database instance.
 * @throws {Error} - Throw an error if the database is not configured.
 */
export declare class Database extends EventEmitter {
    private _client;
    private _db;
    private _connection;
    private _options;
    private _logger;
    private _variable;
    /**
     * Creates an instance of Database.
     *
     * @param {any} client - The client instance.
     * @param {any} options - Configuration options for database.
     * @return {any} - UNDEFINED
     * @throws {Error} - Throws an error if the setup fails
     */
    constructor(client: any, options: any);
    /**
     * Connects to the database.
     *
     * @return {any} - UNDEFINED.
     * @throws {Error} - Throws an error if the connection fails.
     */
    private _connect;
    /**
     * Add a variables.
     *
     * @param {object} data - The variables data.
     * @param {string} table - The table name.
     * @return {undefined} - UNDEFINED.
     * @throws {Error} - Throw an error if the function is crashed.
     */
    variables(data: object, table?: string): undefined;
    /**
     * Checking if the table exists.
     *
     * @param {string} table - The table name.
     * @return {boolean} - Returns true if the table exists, otherwise false.
     */
    isTableExists(table: string): Promise<boolean>;
    /**
     * Prepares a table.
     *
     * @param {string} table - The table name.
     * @return {Promise<undefined>} - UNDEFINED.
     * @throws {Error} - Throws an error if the table cannot be prepared.
     */
    prepare(table: string): Promise<undefined>;
    /**
     * Get a value from the database.
     *
     * @param {string} table - The table name.
     * @param {string} key - The key of the value.
     * @param {number} id? - The identification of the value (optional).
     * @return {Promise<object|null>} - The value.
     * @throws {Error} - Throw an error if the value cannot be retrieved.
     */
    get(table: string, key: string, id?: number, aoivars?: string[]): Promise<object | null>;
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
    set(table: string, key: string, id: number, value: any): Promise<undefined>;
    /**
     * Drop a table or delete a variable from the database.
     *
     * @param {string} table - The table name.
     * @param {string} variable? - The variable name (optional).
     * @return {Promise<undefined>} - UNDEFINED.
     * @throws {Error} - Throw an error if the table cannot be dropped.
     */
    drop(table: string, variable?: string): Promise<undefined>;
    /**
     * Delete many variables from the database.
     *
     * @param {string} table - The table name.
     * @param {query} query - The query to be executed.
     * @return {Promise<undefined>} - UNDEFINED.
     * @throws {Error} - Throw an error if the variables cannot be deleted.
     */
    deleteMany(table: string, query: (row: any) => boolean): Promise<undefined>;
    /**
    * Delete a variable from the database.
    *
    * @param {string} table - The table name.
    * @param {string} key - The key of the variable.
    * @param {number} id - The identification of the variable.
    * @return {Promise<undefined>} - UNDEFINED.
    * @throws {Error} - Throw an error if the variable cannot be deleted.
    */
    delete(table: string, key: string, id: number): Promise<undefined>;
    /**
     * Find many variables from the database.
     *
     * @param {string} table - The table name.
     * @param {any} query - The query to be executed.
     * @param {number} limit? - The maximum number of results to return (optional).
     * @return {Promise<object|null>} - The value of the variables.
     * @throws {Error} - Throw an error if the variables cannot be retrieved.
     */
    findMany(table: string, query: (row: any) => boolean, limit?: number): Promise<object | null>;
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
    all(table: string, filter: (row: any) => boolean, list?: number, sort?: 'asc' | 'desc'): Promise<object | null>;
    /**
     * Ping the database.
     *
     * @return {Promise<number>} - The ping time (in milliseconds).
     * @throws {Error} - Throw an error if the database cannot be pingged.
    */
    ping(start?: number): Promise<number>;
    /**
     * Handle errors of the classes.
     *
     * @param {any} err - The error to be handled.
     * @param {string} type? - The type of error (optional).
     * @return {undefined} - UNDEFINED.
     */
    private _handleError;
    /**
     * Bind the database functions to the aoi.js client.
     *
     * @param {any} db - The database to be bound.
     * @return {undefined} - UNDEFINED.
     * @throws {Error} - Throw an error if the functions cannot be bound.
     */
    private _functionsBind;
    /**
     * Emit events of the database.
     *
     * @param {any} pool - The pool to be emitted.
     * @return {undefined} - UNDEFINED.
     * @throws {Error} - Throw an error if the events cannot be emitted.
     */
    private _emitEvents;
}
/**
 *  made with ♥️ by Tyowk.
 *
 *  CREDITS:
 *   - Time classes:  =>  https://github.com/aoijs/aoi.js/blob/v6/src/core/Time.js
 *   - Logger Function  =>  https://github.com/aoijs/aoi.js/blob/v6/src/classes/AoiError.js
 *   - All database related custom functions  =>  https://github.com/aoijs/aoi.js/blob/v6/src/functions
 */
