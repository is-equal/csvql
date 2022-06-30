import {table as renderTable} from 'table';

export function createTable(data: string[][]): string {
    return renderTable(data, {
        border: {
            topBody: '─',
            topJoin: '┬',
            topLeft: '┌',
            topRight: '┐',

            bottomBody: '─',
            bottomJoin: '┴',
            bottomLeft: '└',
            bottomRight: '┘',

            bodyLeft: '│',
            bodyRight: '│',
            bodyJoin: '│',

            joinBody: '─',
            joinLeft: '├',
            joinRight: '┤',
            joinJoin: '┼'
        },
        singleLine: false,
        columns: getColumnsRenderConfig(data)
    });
}

function getColumnsRenderConfig(data: string[][]): { width: number }[] {
    const maxColumns = process.stdout.columns;
    const columnsConfig = data[0].map((_, column) => ({
        width: data.reduce<number>((value, item: any) => Math.max(value, item[column].toString().length), 0)
    }));
    const tableGaps = (columnsConfig.length - 1) * 3 + 4;
    const columnConsumed = columnsConfig.reduce((value, {width}) => value + width, tableGaps);

    if (columnConsumed > maxColumns) {
        let biggestColumn = 0;

        for (const [index, {width}] of Object.entries(columnsConfig)) {
            if (Math.max(width) >= biggestColumn) {
                biggestColumn = parseInt(index, 10);
            }
        }

        const column = columnsConfig[biggestColumn];
        const diff = maxColumns - columnConsumed;

        column.width += diff;
    }

    return columnsConfig;
}
