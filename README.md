<h1 align="center">Aoi.MySQL</h1>
<br>
<div align="center">
    
[![NPM downloads](https://img.shields.io/npm/dt/aoi.mysql.svg?color=3182b0&style=for-the-badge)](https://npmjs.org/package/aoi.mysql)&nbsp;&nbsp;
[![NPM version](http://img.shields.io/npm/v/aoi.mysql.svg?color=3182b0&style=for-the-badge)](http://npmjs.org/package/aoi.mysql)&nbsp;&nbsp;

</div>
<br>
<p align="center">Aoi.MySQL makes it simple to connect your Aoi.js Discord bot to a MySQL database. With support for mysql2, you get reliable and fast database operations, perfect for any Aoi.js bot project.</p>
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
    token: 'client_token',
    prefix: 'client_prefix',
    intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'MessageContent'],
    events: ['onMessage', 'onInteractionCreate'],
    disableAoiDB: true // ⚠️ This is important, ensure it's set to true. You can't use both at once.
});

const db = new Database(client, {
    url: 'mysql://...', // your MySQL server uri
    tables: ['main']
});


// rest of your index.js..
```

<br>
<br>
<div align="center">
    <a href="https://aoi.js.org">
<img src="https://aoi.js.org/_astro/icon_new.C4KTn9Lv_Z232q1W.webp" width="100">
    </a><br>
    <a href="https://aoi.js.org/invite">
<img src="https://img.shields.io/discord/773352845738115102?logo=discord&logoColor=white&color=3182b0&style=for-the-badge">
    </a>
</div>
