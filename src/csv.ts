import {createReadStream, type ReadStream} from 'node:fs';
import {Readable} from 'node:stream';
import {TransformStream, ReadableStream} from 'node:stream/web';
import {TransformStreamDefaultController} from 'stream/web';

export async function* readCSV(filePath: string): AsyncGenerator<string[], void, unknown> {
    const readStream = createReadStream(filePath, {encoding: 'utf-8'});
    const csvTransform = getCSVTransformStream();
    const lineStream = Readable.toWeb(readStream).pipeThrough(csvTransform);

    for await (const line of lineStream) {
        yield line;
    }

    return;
}

function getCSVTransformStream() {
    /**
     * @see https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch09s13.html
     */
    const CSVLineRegex = /(|\r?\n|^)([^",\r\n]+|"(?:[^"]|"")*")?/g;
    let previous = '';

    /**
     * @see https://2ality.com/2022/06/web-streams-nodejs.html#example%3A-transforming-a-stream-of-arbitrary-chunks-to-a-stream-of-lines
     */
    return new TransformStream<string, string[]>({
        transform(chunk, controller) {
            let startSearch = previous.length;
            previous += chunk;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                // Works for EOL === '\n' and EOL === '\r\n'
                const eolIndex = previous.indexOf('\n', startSearch);

                if (eolIndex < 0) {
                    break;
                }

                // line includes the EOL
                const line = previous.slice(0, eolIndex + 1);
                previous = previous.slice(eolIndex + 1);
                startSearch = 0;

                extractRow(line, controller);
            }
        },
        flush(controller) {
            // Clean up and enqueue any text we’re still holding on to
            if (previous.length > 0) {
                extractRow(previous, controller);
            }
        }
    });

    function extractRow(value: string, controller: TransformStreamDefaultController<string[]>): string[] | undefined {

        const row = value
            .replaceAll(/\r|\n/g, '')
            .match(CSVLineRegex)
            ?.filter(Boolean);

        if (row === undefined) {
            return;
        }

        controller.enqueue(row);
    }
}

/**
 * Polyfill an experimental method `toWeb` of `Readable`
 *
 * @see https://nodejs.org/api/stream.html#streamreadabletowebstreamreadable
 * @see https://github.com/xuset/readable-stream-node-to-web
 */
Readable.toWeb = Readable.toWeb ?? function toWeb(nodeStream: ReadStream): ReadableStream {
    let destroyed = false;
    const listeners: Record<string, (...args: any[]) => void> = {};

    return new ReadableStream({
        start(controller) {
            listeners['data'] = onData;
            listeners['end'] = onData;
            listeners['end'] = onDestroy;
            listeners['close'] = onDestroy;
            listeners['error'] = onDestroy;

            for (const name in listeners) {
                nodeStream.on(name, listeners[name]);
            }

            nodeStream.pause();

            function onData(chunk: unknown) {
                if (destroyed) {
                    return;
                }

                controller.enqueue(chunk);
                nodeStream.pause();
            }

            function onDestroy(err: Error) {
                if (destroyed) {
                    return;
                }

                destroyed = true;

                for (const name in listeners) {
                    nodeStream.removeListener(name, listeners[name]);
                }

                if (err) {
                    controller.error(err);
                } else {
                    controller.close();
                }
            }
        },
        pull() {
            if (destroyed) {
                return;
            }

            nodeStream.resume();
        },
        cancel() {
            destroyed = true;

            for (const name in listeners) {
                nodeStream.removeListener(name, listeners[name]);
            }

            nodeStream.push(null);
            nodeStream.pause();

            if (nodeStream.destroy) {
                nodeStream.destroy();
            } else if (nodeStream.close) {
                nodeStream.close();
            }
        }
    });
};
