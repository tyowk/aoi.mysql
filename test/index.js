const { AoiClient } = require('aoi.js');
const { Database } = require('../dist/index.js');
require('dotenv').config();

const client = new AoiClient({
    token: process.env.TOKEN,
    prefix: '!',
    intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'MessageContent'],
    events: ['onMessage', 'onInteractionCreate'],
    disableAoiDB: true // ⚠️ IMPORTANT
});


const db = new Database(client, {
    url: process.env.DATABASE,
    tables: ['test']
}); // DATABASE SETTINGS

db.once('ready', (client, db) => {
    console.log('database ready!');
}); // READY EVENT

db.on('error', (err, db, client) => {
    console.log('error: ' + err);
}); // ERROR EVENT


client.variables({
    test: 'value'
}, 'test'); // ⚠️ IMPORTANT

client.loadCommands('./test/commands/', true);
