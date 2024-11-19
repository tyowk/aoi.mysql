import chalk from 'chalk';
/**
 * Logger function
 *
 * @param {any} messages - The message to log.
 * @param {any} title - The title of the log.
 * @return {Promise<undefined>} - UNDEFINED.
 * @throws {Error} - Throw an error if the logger is failed.
 */
export async function Logger(messages, title) {
    try {
        if (!Array.isArray(messages))
            messages = [messages];
        const strip = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
        title = title && title.text ? title : { text: "", textColor: "cyan" };
        ;
        const totalwidth = process.stdout?.columns || 80;
        const bordercolor = chalk.white;
        const maxwidth = Math.max(...messages.map((msg) => strip(typeof msg === "string" ? msg : msg.text).length), strip(title.text).length);
        const msgwidth = Math.min(maxwidth, totalwidth - 4);
        const bordertop = bordercolor(`╭${"─".repeat(msgwidth + 2)}╮`);
        const wrapText = (text, width) => {
            const words = text.split(" ");
            let lines = [];
            let current = words[0];
            for (let i = 1; i < words.length; i++) {
                if (strip(current).length + strip(words[i]).length + 1 <= width) {
                    current += " " + words[i];
                }
                else {
                    lines.push(current);
                    current = words[i];
                }
            }
            lines.push(current);
            return lines;
        };
        const newmessage = (msg) => {
            const text = typeof msg === "string" ? msg : msg.text;
            const textcolor = msg.textColor ? chalk[msg.textColor] : chalk.white;
            const wrapped = wrapText(text, msgwidth);
            const msgs = wrapped.map((line) => {
                const padding = msgwidth - strip(line).length;
                const padded = msg.centered !== false ? " ".repeat(Math.abs(Math.floor(padding / 2))) + line + " ".repeat(Math.abs(Math.ceil(padding / 2))) : line + " ".repeat(Math.abs(padding));
                return `│ ${textcolor(padded)} │`;
            });
            return msgs;
        };
        const titlemsg = title.text ? newmessage(title) : [];
        const msgs = messages.flatMap(newmessage);
        console.log(bordertop);
        titlemsg.forEach((line) => console.log(line));
        msgs.forEach((line) => console.log(line));
        console.log(bordercolor(`╰${"─".repeat(Math.abs(msgwidth) + 2)}╯`));
    }
    catch (err) {
        console.error(err);
    }
}
