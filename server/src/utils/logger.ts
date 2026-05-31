import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const transports: winston.transport[] = [
    new winston.transports.Console(
        isProduction
            ? undefined
            : { format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }
    ),
];

// Containers log to stdout; file logging is opt-in for bare-metal deployments.
if (process.env.LOG_TO_FILE === 'true') {
    transports.push(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    );
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'taskflow-api' },
    transports,
});

export default logger;
