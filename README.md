<h1 align="center">Aoi.MySQL</h1>
<p align="center">Aoi.MySQL makes it simple to connect your Aoi.js Discord bot to a MySQL database. With support for MySQL2, you get reliable and fast database operations, perfect for any bot project.</p>
<br>

<h2 align="center">Installation</h2>

```bash
npm install aoi.mysql
```
<br>
<h2 align="center">Setup</h2>

```js
const { AoiClient } = require('aoi.js');
const { AoiMySQL } = require('aoi.mysql');

const client = new AoiClient({
  // ...
  disableAoiDB: true // This is important, ensure it's set to true. You can't use both at once.
});

const database = new AoiMySQL(client, {
    url: 'mysql://....', // your MySQL server uri
    tables: ['main']
});

db.on('ready', (client, db) => {
    // make sure your variables options are in the event listener
    // otherwise the database will not be able to be loaded
    client.variables({
        variable: "value"
    });
});

// rest of your index.js..
```