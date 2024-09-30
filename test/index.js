const { AoiClient } = require('aoi.js');
const { Database } = require('../src/index.js');
require('dotenv').config();

const client = new AoiClient({
    token: process.env.TOKEN,
    prefix: process.env.PREFIX,
    intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'MessageContent'],
    events: ['onMessage', 'onInteractionCreate'],
    disableAoiDB: true
});

const db = new Database(client, {
    url: process.env.DATABASE,
    tables: ['test']
});
