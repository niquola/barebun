import type { Context } from "../system.ts";
import { Layout, html } from "../layout.tsx";
import type { Session, SessionUser } from "../lib/auth.ts";

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

function TablesIndex({ tables, user }: { tables: Table[]; user?: SessionUser | null }) {
  return (
    <Layout title="Tables" user={user}>
      <h1 class="text-3xl font-bold mb-6">Database Tables</h1>
      {tables.length === 0
        ? <p class="text-gray-500">No tables found.</p>
        : <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b border-gray-300 text-left">
                <th class="py-2 pr-4 font-semibold">Schema</th>
                <th class="py-2 pr-4 font-semibold">Table</th>
                <th class="py-2 pr-4 font-semibold">Type</th>
                <th class="py-2 pr-4 font-semibold text-right">Columns</th>
                <th class="py-2 font-semibold text-right">Est. Rows</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-2 pr-4 text-gray-500">{t.schema}</td>
                  <td class="py-2 pr-4">
                    <a href={`/tables/${t.schema}/${t.name}`} class="text-blue-600 hover:text-blue-800 font-medium">
                      {t.name}
                    </a>
                  </td>
                  <td class="py-2 pr-4 text-gray-500">{t.type}</td>
                  <td class="py-2 pr-4 text-right">{t.columns}</td>
                  <td class="py-2 text-right">{t.est_rows}</td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </Layout>
  );
}

function TableDetail({ schema, table, columns, user }: { schema: string; table: string; columns: Column[]; user?: SessionUser | null }) {
  return (
    <Layout title={`${schema}.${table}`} user={user}>
      <div class="mb-4">
        <a href="/tables" class="text-blue-600 hover:text-blue-800 text-sm">&larr; All tables</a>
      </div>
      <h1 class="text-3xl font-bold mb-1">{table}</h1>
      <p class="text-gray-500 mb-6">{schema}</p>
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-gray-300 text-left">
            <th class="py-2 pr-4 font-semibold">Column</th>
            <th class="py-2 pr-4 font-semibold">Type</th>
            <th class="py-2 pr-4 font-semibold">Nullable</th>
            <th class="py-2 pr-4 font-semibold">Default</th>
            <th class="py-2 font-semibold">Comment</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((c) => (
            <tr class="border-b border-gray-100">
              <td class="py-2 pr-4 font-medium">{c.name}</td>
              <td class="py-2 pr-4 text-gray-600">{c.type}</td>
              <td class="py-2 pr-4 text-gray-500">{c.nullable === "YES" ? "yes" : "no"}</td>
              <td class="py-2 pr-4 text-gray-500 font-mono text-xs">{c.default_value ?? ""}</td>
              <td class="py-2 text-gray-400 text-xs">{c.comment ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
