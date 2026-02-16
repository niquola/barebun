// Database helpers — array formatters/parsers for Bun SQL.
// Bun's sql(data) doesn't serialize JS arrays for PostgreSQL array columns,
// so we convert them to PostgreSQL array literal format before insert/update.

/** Convert a JS value to PostgreSQL array literal if it's an array. */
function toPgArrayLiteral(val: unknown): string {
  if (!Array.isArray(val)) return String(val);
  const items = val.map((v) => {
    if (v === null || v === undefined) return "NULL";
    if (v instanceof Date) return v.toISOString();
    const s = String(v);
    // Quote if contains comma, quote, backslash, space, or braces
    if (/[,\\"{}()\s]/.test(s) || s === "") {
      return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    }
    return s;
  });
  return "{" + items.join(",") + "}";
}

/**
 * Preprocess a data object for sql(data), converting array fields to PG literals.
 * @param data - The data object
 * @param arrayCols - Set of column names that are array types
 */
export function prepareForSql<T extends Record<string, unknown>>(
  data: T,
  arrayCols: ReadonlySet<string>,
): T {
  let result: Record<string, unknown> | null = null;
  for (const key of Object.keys(data)) {
    if (arrayCols.has(key) && Array.isArray(data[key])) {
      if (!result) result = { ...data };
      result[key] = toPgArrayLiteral(data[key]);
    }
  }
  return (result ?? data) as T;
}

/**
 * Parse a PostgreSQL array literal string into a JS array of strings.
 * Bun SQL doesn't parse some array types (e.g. uuid[]).
 */
export function parsePgArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val !== "string") return [];
  const s = val.trim();
  if (!s.startsWith("{") || !s.endsWith("}")) return [];
  const inner = s.slice(1, -1);
  if (inner === "") return [];
  const result: string[] = [];
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === '"') {
      // Quoted element
      let j = i + 1;
      let elem = "";
      while (j < inner.length) {
        if (inner[j] === '\\' && j + 1 < inner.length) {
          elem += inner[j + 1];
          j += 2;
        } else if (inner[j] === '"') {
          j++;
          break;
        } else {
          elem += inner[j];
          j++;
        }
      }
      result.push(elem);
      i = j;
      if (i < inner.length && inner[i] === ',') i++;
    } else {
      // Unquoted element
      const end = inner.indexOf(',', i);
      const elem = end === -1 ? inner.slice(i) : inner.slice(i, end);
      result.push(elem);
      i = end === -1 ? inner.length : end + 1;
    }
  }
  return result;
}
