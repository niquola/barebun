export type Column<T> = {
  key: string;
  label: string;
  srOnly?: boolean;
  render: (row: T) => string;
};

export type Action<T> = {
  label: string;
  href: (row: T) => string;
  srLabel?: (row: T) => string;
};

/** Status badge pill */
export function Badge({ label, color }: { label: string; color?: "green" | "gray" | "red" | "yellow" | "indigo" }) {
  const colors = {
    green:  "bg-green-50 text-green-700 ring-green-600/20",
    gray:   "bg-gray-50 text-gray-600 ring-gray-500/10",
    red:    "bg-red-50 text-red-700 ring-red-600/10",
    yellow: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-700/10",
  };
  const cls = colors[color || "gray"];
  return (
    <span class={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

/** Data table with header, optional action button, and responsive scroll */
export function DataTable<T>({ title, description, columns, rows, actions, addButton, empty }: {
  title?: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  actions?: Action<T>[];
  addButton?: { label: string; href: string };
  empty?: string;
}) {
  return (
    <div>
      {(title || addButton) && (
        <div class="sm:flex sm:items-center">
          {title && (
            <div class="sm:flex-auto">
              <h2 class="text-base font-semibold text-gray-900">{title}</h2>
              {description && <p class="mt-2 text-sm text-gray-700">{description}</p>}
            </div>
          )}
          {addButton && (
            <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <a
                href={addButton.href}
                class="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {addButton.label}
              </a>
            </div>
          )}
        </div>
      )}
      <div class={title || addButton ? "mt-8 flow-root" : "flow-root"}>
        <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {rows.length === 0
              ? <p class="text-sm text-gray-500 py-8 text-center">{empty || "No data."}</p>
              : (
                <table class="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      {columns.map((col, i) => (
                        col.srOnly
                          ? <th scope="col" class="relative py-3.5 pr-4 pl-3 sm:pr-0"><span class="sr-only">{col.label}</span></th>
                          : <th scope="col" class={
                              i === 0
                                ? "py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                                : "px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                            }>{col.label}</th>
                      ))}
                      {actions && actions.length > 0 && (
                        <th scope="col" class="relative py-3.5 pr-4 pl-3 sm:pr-0">
                          <span class="sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    {rows.map((row) => (
                      <tr>
                        {columns.map((col, i) => (
                          <td class={
                            i === 0
                              ? "py-4 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-0"
                              : "px-3 py-4 text-sm whitespace-nowrap text-gray-500"
                          }>
                            {col.render(row)}
                          </td>
                        ))}
                        {actions && actions.length > 0 && (
                          <td class="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                            {actions.map((a) => (
                              <a href={a.href(row)} class="text-indigo-600 hover:text-indigo-900">
                                {a.label}
                                {a.srLabel && <span class="sr-only">{`, ${a.srLabel(row)}`}</span>}
                              </a>
                            ))}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}
