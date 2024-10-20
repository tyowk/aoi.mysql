import chalk from 'chalk';

export async function Logger (messages: any, title: any) {
    if (!Array.isArray(messages)) {
        messages = [messages];
    }
    const strip = (str: any) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
    title = title && title.text ? title : { text: "", textColor: "cyan" };;
    const totalwidth = process.stdout?.columns || 80;
    const bordercolor = chalk.white;
    const maxwidth = Math.max(...messages.map((msg: any) => strip(typeof msg === "string" ? msg : msg.text).length), strip(title.text).length);
    const msgwidth = Math.min(maxwidth, totalwidth - 4);
    const bordertop = bordercolor(`╭${"─".repeat(msgwidth + 2)}╮`);
    const wrapText = (text: any, width: any) => {
        const words = text.split(" ");
        let lines: any = [];
        let current: any = words[0];

        for (let i = 1; i < words.length; i++) {
            if (strip(current).length + strip(words[i]).length + 1 <= width) {
                current += " " + words[i];
            } else {
                lines.push(current);
                current = words[i];
            }
        }
        lines.push(current);
        return lines;
    };

    const newmessage = (msg: any) => {
        const text = typeof msg === "string" ? msg : msg.text;
        const textcolor = msg.textColor ? (chalk as any)[msg.textColor] : chalk.white;
        const wrapped = wrapText(text, msgwidth);
        const msgs = wrapped.map((line: any) => {
            const padding = msgwidth - strip(line).length;
            const padded = msg.centered !== false ? " ".repeat(Math.abs(Math.floor(padding / 2))) + line + " ".repeat(Math.abs(Math.ceil(padding / 2))) : line + " ".repeat(Math.abs(padding));
            return `│ ${textcolor(padded)} │`;
        });
        return msgs;
    };;

    const titlemsg = title.text ? newmessage(title) : [];
    const msgs = messages.flatMap(newmessage);
    console.log(bordertop);
    titlemsg.forEach((line: any) => console.log(line));
    msgs.forEach((line: any) => console.log(line));
    console.log(bordercolor(`╰${"─".repeat(Math.abs(msgwidth) + 2)}╯`));
}

// @   CONSOLE LOG CODE FROM AOI.JS
// @   https://github.com/aoijs/aoi.js/tree/v6/src/classes/AoiError.js