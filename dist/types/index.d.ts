import EventEmitter from 'events';
export declare class Database extends EventEmitter {
    _client: any;
    _options: any;
    _logger: any;
    _variable: any;
    constructor(client: any, options: any);
    private _connect;
    prepare(table: string): Promise<void>;
    get(table: string, key: string, id?: undefined): Promise<any>;
    set(table: string, key: string, id: number, value: any): Promise<void>;
    drop(table: string, variable: string): Promise<void>;
    deleteMany(table: string, query: any): Promise<void>;
    delete(table: string, key: string, id: number): Promise<void>;
    findMany(table: string, query: any, limit: number): Promise<any>;
    all(table: string, filter: any, list?: number, sort?: string): Promise<any>;
    ping(): Promise<number>;
    private _handleError;
}
