/**
 * @class Functions
 * @classdesc This class is used to load all custom functions from the ./functions folder.
 *
 * @param {any} client - The client instance.
 * @param {boolean} debug? - Whether to enable debug mode.
 * @returns {undefined} - UNDEFINED.
 */
export declare class Functions {
    constructor(client: any, debug?: boolean, basePath?: string);
    debug(type: string, file: string): any;
}
