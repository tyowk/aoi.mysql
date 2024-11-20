"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Functions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * @class Functions
 * @classdesc This class is used to load all custom functions from the ./functions folder.
 *
 * @param {any} client - The client instance.
 * @param {boolean} debug? - Whether to enable debug mode.
 * @returns {undefined} - UNDEFINED.
 */
class Functions {
    constructor(client, debug, basePath = path_1.default.join(__dirname, '..', 'functions')) {
        try {
            const files = fs_1.default.readdirSync(basePath);
            for (const file of files) {
                const filePath = path_1.default.join(basePath, file);
                const func = require(filePath);
                if (fs_1.default.statSync(filePath).isDirectory()) {
                    this.constructor(client, filePath);
                }
                else {
                    try {
                        if (!func || typeof func !== 'function') {
                            this.debug('error', file);
                            continue;
                        }
                        if (debug)
                            this.debug('success', file);
                        client.functionManager.createFunction({
                            name: `$${file.split('.')[0]}`,
                            type: 'djs',
                            code: func
                        });
                    }
                    catch (err) {
                        if (debug)
                            this.debug('error', file);
                    }
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    debug(type, file) {
        if (type === 'success') {
            return console.log('[' + chalk_1.default.blue('DEBUG') + ']'
                + chalk_1.default.gray(' :: Function loaded: ')
                + chalk_1.default.cyan(`$${file.split('.')[0]}`));
        }
        else if (type === 'error') {
            return console.log('[' + chalk_1.default.blue('DEBUG') + ']'
                + chalk_1.default.gray(' :: Failed to Load: ')
                + chalk_1.default.red(`$${file.split('.')[0]}`));
        }
    }
}
exports.Functions = Functions;
