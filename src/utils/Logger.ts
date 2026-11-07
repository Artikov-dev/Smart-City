export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface LogEntry {
    time: string;
    level: LogLevel;
    message: string;
}

export class Logger {
    private static instance: Logger | null = null;
    private entries: LogEntry[] = [];
    private echo = false;

    private constructor() {}

    static getInstance(): Logger {
        if (!Logger.instance) Logger.instance = new Logger();
        return Logger.instance;
    }

    setEcho(echo: boolean) { this.echo = echo; }

    info(message: string) { this.write("INFO", message); }
    warn(message: string) { this.write("WARN", message); }
    error(message: string) { this.write("ERROR", message); }

    getEntries() { return [...this.entries]; }
    getLast(count: number) { return this.entries.slice(-count); }
    clear() { this.entries = []; }

    private write(level: LogLevel, message: string) {
        const entry: LogEntry = { time: new Date().toLocaleTimeString("en-GB"), level, message };
        this.entries.push(entry);
        if (this.echo) console.log(`[${entry.time}] ${level}: ${message}`);
    }
}
