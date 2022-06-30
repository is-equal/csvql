import {createReadStream} from 'node:fs';
import {createInterface} from 'node:readline';

export async function *readCSV(filePath: string): AsyncGenerator<string[], void, unknown> {
    const reader = createInterface({
        input: createReadStream(filePath, {encoding: 'utf-8'}),
    });

    const CSVLineRegex = /"([\w\d\s\W:]+)"|([\w\d\s.\-_();:/]+)/gi;

    for await (const line of reader) {
        yield line.match(CSVLineRegex) as unknown as string[];
    }

    return;
}
