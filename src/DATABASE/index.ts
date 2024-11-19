export { Database } from './classes/Database';

export enum Events {
    Connect = 'connect',
    Ready = 'connect',
    Disconnect = 'disconnect',
    Close = 'disconnect',
    Error = 'error',
    Acquire = 'acquire',
    Release = 'release',
    Connection = 'connection',
    Enqueue = 'enqueue',
}