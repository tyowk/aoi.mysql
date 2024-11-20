<div align="center">
  <img src="https://raw.githubusercontent.com/tyowk/aoi.mysql/refs/heads/main/.github/uwu.png" width="150">
  <h1>aoijs.mysql</h1>
  <br>

  [![NPM downloads](https://img.shields.io/npm/dt/aoijs.mysql.svg?color=3182b0&style=for-the-badge)](https://npmjs.com/package/aoijs.mysql)&nbsp;&nbsp;
  [![NPM version](http://img.shields.io/npm/v/aoijs.mysql.svg?color=3182b0&style=for-the-badge)](http://npmjs.com/package/aoijs.mysql)&nbsp;&nbsp;
  ![NPM License](https://img.shields.io/npm/l/aoijs.mysql?color=3182b0&style=for-the-badge)
  <br>
  <p>aoijs.mysql makes it effortless to connect your aoi.js Discord bot to a MySQL database. Leveraging the power of mysql2, you get fast and reliable database operations, perfectly suited for any aoi.js bot project.</p>
  <br>
  <h2>🔥  Installation</h2>

```bash
npm install aoijs.mysql
```
<br>
<br>
</div>
<h2 align="center">🛠️  Setup</h2>

```javascript
const { AoiClient } = require('aoi.js');
const { Database } = require('aoijs.mysql');  // Import the Aoi.MySQL package

const client = new AoiClient({
    token: 'YOUR_TOKEN',
    prefix: 'YOUR_PREFIX',
    intents: ['Guilds', 'GuildMessages', 'GuildMembers', 'MessageContent'],
    events: ['onMessage', 'onInteractionCreate'],
    database: { ... },  // Your Aoi.DB options
    disableAoiDB: true | false  // Set to true if using only Aoi.MySQL
});

// Initialize the MySQL Database
new Database(client, {
    url: 'mysql://YOUR_DATABASE_URL',  // Replace with your MySQL server URI
    tables: ['main'],  // Specify your database tables
    keepAoiDB: true | false,  // Set to true to use both aoi.db and MySQL
    debug: true | false  // Set to true for debug information during development
});

// Client variables setup
client.variables({
    key: 'value'  // Define client variables here
});

// Continue with the rest of your bot's setup...
```
<br>
<br>
<br>
<h1 align="center">Aoi.DB</h1>

## 📁  Keep Your Aoi.DB Database
If you have an existing aoi.db database, you can continue to use it alongside aoijs.mysql. Just ensure that your setup is correctly configured:

```javascript
const client = new AoiClient({
    // ... Your client options
    database: { ... },  // Your Aoi.DB options
    disableAoiDB: false  // Must be false to use both databases
});

// Initialize the MySQL Database
new Database(client, {
    // ... Your MySQL database options
    keepAoiDB: true  // This should be set to true
});
```
<br>
<br>

<details>
<summary><h2>💪🏻  Custom Functions</h2></summary>
<br>
  
These 36 custom functions works like a normal existing functions *( only the name and inside the functions are different )* 

And these functions can only work if you set `keepAoiDB` to true<br><br>
```
$mysqlAdvanceCooldown
$mysqlChannelCooldown
$mysqlCloseTicket
$mysqlCooldown
$mysqlCreateTemporaryVar
$mysqlDatabasePing
$mysqlDeleteVar
$mysqlGetChannelVar
$mysqlGetCooldownTime
$mysqlGetGlobalUserVar
$mysqlGetGuildVar
$mysqlGetLeaderboardInfo
$mysqlGetMessageVar
$mysqlGetTimeout
$mysqlGetUserVar
$mysqlGetVar
$mysqlGlobalCooldown
$mysqlGlobalUserLeaderBoard
$mysqlGuildCooldown
$mysqlGuildLeaderBoard
$mysqlIsTicket
$mysqlIsVariableExist
$mysqlNewTicket
$mysqlRawLeaderboard
$mysqlResetGlobalUserVar
$mysqlResetGuildVar
$mysqlResetUserVar
$mysqlSetChannelVar
$mysqlSetGlobalUserVar
$mysqlSetGuildVar
$mysqlSetMessageVar
$mysqlSetUserVar
$mysqlSetVar
$mysqlStopTimeout
$mysqlTimeoutList
$mysqlUserLeaderBoard
```
</details>

## 📂  Migrating from Aoi.DB
If you're considering transferring your aoi.db database to MySQL, **🚫 Migration Is Not Currently Possible!**
<div align="center">
<br>
<br>
<br>
<br>
<br>
<br>
  <img src="https://aoi.js.org/_astro/icon_new.C4KTn9Lv_Z232q1W.webp" width="100">
  <br>
  <a href="https://aoi.js.org/invite">
    <img src="https://img.shields.io/discord/773352845738115102?logo=discord&logoColor=white&color=3182b0&style=for-the-badge">
  </a>
</div>
