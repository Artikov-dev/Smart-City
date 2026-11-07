const enabled = process.stdout.isTTY === true && !process.env.NO_COLOR;

const paint = (code: string) => (text: string | number) =>
    enabled ? `\x1b[${code}m${text}\x1b[0m` : String(text);

export const color = {
    bold: paint("1"),
    dim: paint("2"),
    red: paint("31"),
    green: paint("32"),
    yellow: paint("33"),
    blue: paint("34"),
    magenta: paint("35"),
    cyan: paint("36"),
    gray: paint("90"),
};

const ANSI = /\x1b\[[0-9;]*m/g;

export const visibleLength = (text: string) => text.replace(ANSI, "").length;

export const pad = (text: string, width: number) => text + " ".repeat(Math.max(0, width - visibleLength(text)));

export function box(title: string, lines: string[] = [], tint = color.cyan) {
    const width = Math.max(44, visibleLength(title) + 4, ...lines.map(l => visibleLength(l) + 2));
    const top = tint("╭─ ") + color.bold(title) + tint(` ${"─".repeat(width - visibleLength(title) - 3)}╮`);
    const body = lines.map(line => `${tint("│")} ${pad(line, width - 2)} ${tint("│")}`);
    const bottom = tint(`╰${"─".repeat(width)}╯`);
    return [top, ...body, bottom].join("\n");
}

export function bar(percent: number, size = 20) {
    const filled = Math.max(0, Math.min(size, Math.round((percent / 100) * size)));
    const tint = percent > 100 ? color.red : percent >= 80 ? color.yellow : color.green;
    return tint("█".repeat(filled)) + color.gray("░".repeat(size - filled)) + " " + tint(`${percent.toFixed(0)}%`);
}

export const option = (key: number, label: string) => `  ${color.cyan(`[${String(key).padStart(2)}]`)} ${label}`;
export const prompt = (question: string) => `${color.cyan("›")} ${question}`;

export const ok = (message: string) => console.log(`  ${color.green("✔")} ${message}`);
export const fail = (message: string) => console.log(`  ${color.red("✖")} ${message}`);
export const warn = (message: string) => console.log(`  ${color.yellow("!")} ${message}`);
export const item = (message: string) => console.log(`  ${color.cyan("▸")} ${message}`);
export const note = (message: string) => console.log(`  ${color.gray(message)}`);
