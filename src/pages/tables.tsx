import type { Context } from "../system.ts";
import { Layout, html } from "../layout.tsx";
import type { Session, SessionUser } from "../lib/auth.ts";
import { DataTable, Badge, type Column as TableCol } from "../components/table.tsx";
import { Breadcrumb } from "../components/breadcrumb.tsx";

type Table = { schema: string; name: string; type: string; est_rows: number; columns: number };
type Column = { name: string; type: string; nullable: string; default_value: string | null; comment: string | null };

async function listTables(ctx: Context): Promise<Table[]> {
  return await ctx.sql`
    SELECT
      t.table_schema as schema,
      t.table_name as name,
      t.table_type as type,
      COALESCE(s.n_live_tup, 0)::int as est_rows,
      (SELECT count(*)::int FROM information_schema.columns c
       WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as columns
    FROM information_schema.tables t
    LEFT JOIN pg_stat_user_tables s
      ON s.schemaname = t.table_schema AND s.relname = t.table_name
    WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
    ORDER BY t.table_schema, t.table_name
  `;
}

async function listColumns(ctx: Context, schema: string, table: string): Promise<Column[]> {
  return await ctx.sql`
    SELECT
      c.column_name as name,
      c.data_type as type,
      c.is_nullable as nullable,
      c.column_default as default_value,
      col_description(
        (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass,
        c.ordinal_position
      ) as comment
    FROM information_schema.columns c
    WHERE c.table_schema = ${schema} AND c.table_name = ${table}
    ORDER BY c.ordinal_position
  `;
}

const tableColumns: TableCol<Table>[] = [
  { key: "schema", label: "Schema", render: (t) => t.schema },
  { key: "name", label: "Table", render: (t) => `<a href="/tables/${t.schema}/${t.name}" class="font-medium text-indigo-600 hover:text-indigo-900">${t.name}</a>` },
  { key: "type", label: "Type", render: (t) => t.type },
  { key: "columns", label: "Columns", render: (t) => String(t.columns) },
  { key: "est_rows", label: "Est. Rows", render: (t) => String(t.est_rows) },
];

function TablesIndex({ tables, user }: { tables: Table[]; user?: SessionUser | null }) {
  return (
    <Layout title="Tables" user={user} activePath="/tables">
      <DataTable
        title="Database tables"
        description="All tables in the database with column counts and estimated row counts."
        columns={tableColumns}
        rows={tables}
        empty="No tables found."
      />
    </Layout>
  );
}

const columnColumns: TableCol<Column>[] = [
  { key: "name", label: "Column", render: (c) => `<span class="font-medium text-gray-900">${c.name}</span>` },
  { key: "type", label: "Type", render: (c) => c.type },
  { key: "nullable", label: "Nullable", render: (c) => c.nullable === "YES" ? "yes" : "no" },
  { key: "default", label: "Default", render: (c) => c.default_value ? `<code class="font-mono text-xs">${c.default_value}</code>` : "" },
  { key: "comment", label: "Comment", render: (c) => c.comment ?? "" },
];

function TableDetail({ schema, table, columns, user }: { schema: string; table: string; columns: Column[]; user?: SessionUser | null }) {
  return (
    <Layout title={`${schema}.${table}`} user={user} activePath="/tables">
      <Breadcrumb crumbs={[
        { label: "Tables", href: "/tables" },
        { label: `${schema}.${table}` },
      ]} />
      <DataTable
        columns={columnColumns}
        rows={columns}
        empty="No columns found."
      />
    </Layout>
  );
}

async function tablesIndex(ctx: Context, { user }: Session, req: Request) {
  const tables = await listTables(ctx);
  return html(<TablesIndex tables={tables} user={user} />);
}

async function tableDetail(ctx: Context, { user }: Session, req: Request & { params: { schema: string; table: string } }) {
  const { schema, table } = req.params;
  const columns = await listColumns(ctx, schema, table);
  if (columns.length === 0) return new Response("Not found", { status: 404 });
  return html(<TableDetail schema={schema} table={table} columns={columns} user={user} />);
}

export const routes = {
  "/tables": tablesIndex,
  "/tables/:schema/:table": tableDetail,
};
