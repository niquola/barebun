import type { Context } from "../system.ts";
import { Layout, html } from "../layout.tsx";

type Table = { schema: string; name: string; type: string; est_rows: number; columns: number };
type Column = { name: string; type: string; nullable: string; default_value: string | null };

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
      column_name as name,
      data_type as type,
      is_nullable as nullable,
      column_default as default_value
    FROM information_schema.columns
    WHERE table_schema = ${schema} AND table_name = ${table}
    ORDER BY ordinal_position
  `;
}

function TablesIndex({ tables }: { tables: Table[] }) {
  return (
    <Layout title="Tables">
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

function TableDetail({ schema, table, columns }: { schema: string; table: string; columns: Column[] }) {
  return (
    <Layout title={`${schema}.${table}`}>
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
            <th class="py-2 font-semibold">Default</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((c) => (
            <tr class="border-b border-gray-100">
              <td class="py-2 pr-4 font-medium">{c.name}</td>
              <td class="py-2 pr-4 text-gray-600">{c.type}</td>
              <td class="py-2 pr-4 text-gray-500">{c.nullable === "YES" ? "yes" : "no"}</td>
              <td class="py-2 text-gray-500 font-mono text-xs">{c.default_value ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}

export function routes(ctx: Context) {
  return {
    "/tables": async () => {
      const tables = await listTables(ctx);
      return html(<TablesIndex tables={tables} />);
    },
    "/tables/:schema/:table": async (req: Request & { params: Record<string, string> }) => {
      const { schema, table } = req.params;
      const columns = await listColumns(ctx, schema, table);
      if (columns.length === 0) return new Response("Not found", { status: 404 });
      return html(<TableDetail schema={schema} table={table} columns={columns} />);
    },
  };
}
