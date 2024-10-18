<div align="center">
<img src="https://aoimysql.js.org/_astro/icon.wDleH0Vf_Z1xPyP6.webp" width="150">
<h1 align="center">Aoi.MySQL</h1>
<br>

[![NPM downloads](https://img.shields.io/npm/dt/aoi.mysql.svg?color=3182b0&style=for-the-badge)](https://npmjs.com/package/aoi.mysql)&nbsp;&nbsp;
[![NPM version](http://img.shields.io/npm/v/aoi.mysql.svg?color=3182b0&style=for-the-badge)](http://npmjs.com/package/aoi.mysql)&nbsp;&nbsp;
![NPM License](https://img.shields.io/npm/l/aoi.mysql?color=3182b0&style=for-the-badge)
</div>
<br>
<p align="center">Aoi.MySQL makes it simple to connect your Aoi.js Discord bot to a MySQL database. With support for mysql2, you get reliable and fast database operations, perfect for any Aoi.js bot project</p>
<br>
<h2 align="center">Installation</h2>

```bash
npm install aoi.mysql
```
<br>
<h2 align="center">Setup</h2>

```js
const { AoiClient } = require('aoi.js');
const { Database } = require('aoi.mysql');

const client = new AoiClient({
    token: 'TOKEN',
    prefix: 'PREFIX',
    intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'MessageContent'],
    events: ['onMessage', 'onInteractionCreate'],
    disableAoiDB: true // ⚠️ THIS IS IMPORTANT, ensure it's set to true. You can't use both at once.
});

new Database(client, {
    url: 'mysql://...', // YOUR MYSQL SERVER URI
    tables: ['main']
});

client.variables({
    key: 'value' // ⚠️ THIS IS IMPORTANT, you need to place this client variables under database settings.
});



• • •
```
**[❓ DOCUMENTATION](https://aoimysql.js.org)**
<br>
<br>
<h2 align="center">Aoi.DB</h2>
<p align="center">Want to keep your aoi.db database? or transfer your aoi.db database?<br><strong>✋ NOT POSSIBLE YET!</strong></p>
<br>
<br>
<br>
<div align="center">
<img src="https://aoi.js.org/_astro/icon_new.C4KTn9Lv_Z232q1W.webp" width="100">
<br>
<a href="https://aoi.js.org/invite">
<img src="https://img.shields.io/discord/773352845738115102?logo=discord&logoColor=white&color=3182b0&style=for-the-badge">
</a>
<br>
<br>
<br>
Made with ♥️ by <a href="https://github.com/tyowk">Tyowk</a><br>
Inspired by <a href="https://github.com/faf4a">Fafa</a>
</div>
