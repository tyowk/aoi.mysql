const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const error = (msg) => console.error(`[${chalk.red('BACKUP')}] :: ${msg}`);
const success = (msg) => console.log(`[${chalk.green('BACKUP')}] :: ${msg}`);
const backupProcess = (msg) => console.log(`[${chalk.yellow('PROCESS')}] :: ${msg}`);
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async (options, db) => {
    const backupDir = path.join(process.cwd(), options.backup.directory);
    if (!fs.existsSync(backupDir)) return error(`The "${chalk.red(options.backup.directory)}" folder does not exist.`);
    const directories = fs.readdirSync(backupDir);
    let totalKeys = 0;
    let index = 1;
    success(`${chalk.cyan('Starting backup...')}`);

    for (const dir of directories) {
        if (["reference", ".backup", "transaction"].includes(dir)) continue;
        const dirPath = path.join(backupDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
            const files = fs.readdirSync(dirPath);
            success(`Found ${chalk.cyan(files.length)} files in ${dir}.`);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const databaseData = fs.readFileSync(filePath);
                const data = JSON.parse(databaseData);
                totalKeys += Object.keys(data).length;
            };
        };
    };
    
    success(`Estimated time for backup: ${chalk.cyan((totalKeys * 75) / 1000)} seconds.`);
    success(chalk.yellow('This may take a while depending on the amount of data. Canceling will lose current progress.'));
    success(`Found ${chalk.cyan(totalKeys)} keys to transfer.`);
    
    for (const dir of directories) {
        if (["reference", ".backup", "transaction"].includes(dir)) continue;
        const dirPath = path.join(backupDir, dir);

        if (fs.statSync(dirPath).isDirectory()) {
            const files = fs.readdirSync(dirPath);
            success('Getting ready to backup (this may take a while depending on the amount of data)...');

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const databaseData = fs.readFileSync(filePath);
                const data = JSON.parse(databaseData);
                await delay(1000);
                const tableName = file.split("_scheme_")[0];
                success(`[${(file.split("_scheme_")[1])?.replace('.sql', '')}]: Transferring data from table ${chalk.cyan(tableName)}...`);
                await delay(2000);
                for (const [key, value] of Object.entries(data)) {
                    const start = process.hrtime.bigint();
                    console.log(' ');
                    backupProcess(`[${index}/${totalKeys}]: Processing ${chalk.cyan(key)}...`);

                    if (!value.hasOwnProperty("value") || !key) {
                        error(`[${index}/${totalKeys}]: No data found for ${chalk.red(key)}`);
                        console.log(' ');
                        continue;
                    }
                    backupProcess(`[${index}/${totalKeys}]: Setting ${chalk.cyan(key)} to '${chalk.cyan(value.value).slice(0, 15)}'`);
                    try {
                        const keySplit = key.split('_');
                        await db.set(tableName, keySplit[0], keySplit[1], value.value);
                        const end = (Number(process.hrtime.bigint() - start) / 1e6).toFixed(2);
                        backupProcess(`[${index}/${totalKeys}] [${end}ms]: ${chalk.cyan(key)} processed successfully.`);
                        console.log(' ');
                    } catch (err) {
                        error(`[${index}/${totalKeys}]: Failed to write ${chalk.red(key)}: ${err.message}`);
                        console.log(' ');
                    }
                    index++;
                }
            }
        }
    }
    success(`${chalk.cyan('Transfer completed!')}`);
};

/**
 * CREDITS
 * Thanks to fafa ✨
 * https://github.com/faf4a/aoi.mongo
 */
