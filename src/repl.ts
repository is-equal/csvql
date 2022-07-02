import * as readline from 'node:readline';
import * as path from 'node:path';
import chalk from 'chalk';
import {executeQuery} from './query';
import {createTable} from './render';

export interface ReplOptions {
    cwd: string
}

export function repl(options: ReplOptions): void {
    const {cwd} = options;

    const readlineInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: chalk.cyan('> '),
        history: [
            'SELECT app_version, user_agent FROM data WHERE SEMVER(app_version, 2) LIMIT 0,10',
            'SELECT app_version, user_agent FROM data WHERE year = 1997 AND (app_version LIKE \'0.5%\' OR app_version LIKE \'%6%\') LIMIT 0,10',
            'SELECT app_version, user_agent FROM data WHERE year = 1997 AND app_version LIKE \'0.5%\' LIMIT 0,10',
            'SELECT year as model_year, app_version, user_agent FROM data WHERE year = 1997 LIMIT 0,5',
            'SELECT * FROM data WHERE year = 1997 LIMIT 5',
        ]
    });

    readlineInterface.prompt();

    readlineInterface.on('line', lineHandler.bind(readlineInterface, cwd));
}

async function lineHandler(this: readline.Interface, cwd: string, input: string) {
    if (input.trim() === '') {
        return this.prompt();
    }

    if (input.trim() === 'close' || input.trim() === 'exit') {
        return this.close();
    }

    if (input.trim() === 'clear') {
        console.clear();
        return this.prompt();
    }

    try {
        const {source, total, page, pages, header, result} = await executeQuery(input, cwd);

        const renderData = [
            header,
            ...result,
        ];

        const table = createTable(renderData);

        console.log();
        console.log(`${chalk.bold('Table:')} ${chalk.green(path.relative(cwd, source))}`);
        console.log();
        console.log(table);
        console.log(`${chalk.bold('Page:')} ${chalk.white(`${page}/${pages}`)} | ${chalk.bold('Total:')} ${chalk.white(total)}`);
        console.log();
    } catch (error) {
        console.error(chalk.red(error));
        console.error();
    }

    this.prompt();
}
