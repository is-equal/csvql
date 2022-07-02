declare module 'node-query' {
    function parse(sql: string): SQLParsed;

    interface SQLParsed {
        type: 'select';
        columns: '*' | SQLColumns;
        from: { table: string }[];
        limit: { value: number }[];
        where: SQLExpr;
    }

    type SQLColumns = SQLColumn<{ column: string } | { type: 'aggr_func', name: 'COUNT', args: { expr: { value: string } } }>[];

    type SQLColumn<T> = { expr: T, as: string }

    type SQLExpr =
        AND_Expr
        | OR_Expr
        | EQ_Expr
        | LIKE_Expr
        | NONE_Expr
        | SEMVER_Expr;

    type AND_Expr = IExpression<'AND'>;

    type OR_Expr = IExpression<'OR'>;

    type NONE_Expr = IExpression<'none', unknown>;

    type EQ_Expr = IExpression<'=', number | boolean | string>;

    type LIKE_Expr = IExpression<'LIKE', string>;

    type SEMVER_Expr = IFnExpression<'SEMVER', number | string>;

    interface IFnExpression<Name, Value> {
        type: 'function';
        name: Name;
        args: {
            value: [
                { column: string },
                { value: Value },
            ];
        };
    }

    interface IExpression<Operator, Value> {
        operator: Operator;
        left: Value extends never ? SQLExpr : { column: string };
        right: Value extends never ? SQLExpr : { value: Value };
    }
}
