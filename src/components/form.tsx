// --- Tailwind CSS class constants ---

const inputCls =
  "block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6";

const checkboxCls =
  "col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto";

const radioCls =
  "relative size-4 appearance-none rounded-full border border-gray-300 bg-white before:absolute before:inset-1 before:rounded-full before:bg-white not-checked:before:hidden checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:before:bg-gray-400 forced-colors:appearance-auto forced-colors:before:hidden";

const selectCls =
  "col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6";

const checkSvg = `<svg viewBox="0 0 14 14" fill="none" class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"><path d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-checked:opacity-100" /><path d="M3 7H11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-0 group-has-indeterminate:opacity-100" /></svg>`;

const chevronSvg = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"><path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" /></svg>`;

// --- Components ---

/** Form section with title, description, and a 6-column grid for fields */
export function FormSection({ title, description, children }: {
  title: string;
  description?: string;
  children?: any;
}) {
  return (
    <div class="border-b border-gray-900/10 pb-12">
      <h2 class="text-base/7 font-semibold text-gray-900">{title}</h2>
      {description && <p class="mt-1 text-sm/6 text-gray-600">{description}</p>}
      <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        {children}
      </div>
    </div>
  );
}

/** Grid column wrapper — controls how many columns a field spans */
export function Field({ span, children }: {
  span?: "full" | 2 | 3 | 4;
  children?: any;
}) {
  const cls = span === "full" ? "col-span-full"
    : span === 2 ? "sm:col-span-2"
    : span === 3 ? "sm:col-span-3"
    : "sm:col-span-4";
  return <div class={cls}>{children}</div>;
}

/** Text / email / password / number input */
export function Input({ id, name, label, type, value, placeholder, autocomplete, required, readonly, disabled, hint, prefix }: {
  id: string;
  name?: string;
  label: string;
  type?: string;
  value?: string;
  placeholder?: string;
  autocomplete?: string;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  hint?: string;
  prefix?: string;
}) {
  const inputName = name || id;
  return (
    <>
      <label for={id} class="block text-sm/6 font-medium text-gray-900">{label}</label>
      <div class="mt-2">
        {prefix ? (
          <div class="flex items-center rounded-md bg-white pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
            <div class="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">{prefix}</div>
            <input
              id={id}
              name={inputName}
              type={type || "text"}
              value={value}
              placeholder={placeholder}
              autocomplete={autocomplete}
              required={required}
              readonly={readonly}
              disabled={disabled}
              class="block min-w-0 grow bg-white py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
            />
          </div>
        ) : (
          <input
            id={id}
            name={inputName}
            type={type || "text"}
            value={value}
            placeholder={placeholder}
            autocomplete={autocomplete}
            required={required}
            readonly={readonly}
            disabled={disabled}
            class={readonly
              ? "block w-full rounded-md bg-gray-50 px-3 py-1.5 text-base text-gray-500 outline-1 -outline-offset-1 outline-gray-200 sm:text-sm/6"
              : inputCls}
          />
        )}
      </div>
      {hint && <p class="mt-3 text-sm/6 text-gray-600">{hint}</p>}
    </>
  );
}

/** Textarea */
export function Textarea({ id, name, label, value, rows, placeholder, required, hint }: {
  id: string;
  name?: string;
  label: string;
  value?: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <>
      <label for={id} class="block text-sm/6 font-medium text-gray-900">{label}</label>
      <div class="mt-2">
        <textarea
          id={id}
          name={name || id}
          rows={String(rows || 3)}
          placeholder={placeholder}
          required={required}
          class={inputCls}
        >{value || ""}</textarea>
      </div>
      {hint && <p class="mt-3 text-sm/6 text-gray-600">{hint}</p>}
    </>
  );
}

/** Select dropdown */
export function Select({ id, name, label, value, options, required }: {
  id: string;
  name?: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <>
      <label for={id} class="block text-sm/6 font-medium text-gray-900">{label}</label>
      <div class="mt-2 grid grid-cols-1">
        <select id={id} name={name || id} required={required} class={selectCls}>
          {options.map((o) => (
            <option value={o.value} selected={o.value === value}>{o.label}</option>
          ))}
        </select>
        {chevronSvg}
      </div>
    </>
  );
}

/** Styled checkbox with label and optional description */
export function Checkbox({ id, name, label, description, checked, disabled }: {
  id: string;
  name?: string;
  label: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
}) {
  const descId = description ? `${id}-description` : undefined;
  return (
    <div class="flex gap-3">
      <div class="flex h-6 shrink-0 items-center">
        <div class="group grid size-4 grid-cols-1">
          <input
            id={id}
            name={name || id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            aria-describedby={descId}
            class={checkboxCls}
          />
          {checkSvg}
        </div>
      </div>
      <div class="text-sm/6">
        <label for={id} class="font-medium text-gray-900">{label}</label>
        {description && <p id={descId} class="text-gray-500">{description}</p>}
      </div>
    </div>
  );
}

/** Styled radio button */
export function Radio({ id, name, label, value, checked, disabled }: {
  id: string;
  name: string;
  label: string;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
}) {
  return (
    <div class="flex items-center gap-x-3">
      <input
        id={id}
        name={name}
        type="radio"
        value={value || id}
        checked={checked}
        disabled={disabled}
        class={radioCls}
      />
      <label for={id} class="block text-sm/6 font-medium text-gray-900">{label}</label>
    </div>
  );
}

/** Fieldset with legend and optional description, for grouping checkboxes or radios */
export function Fieldset({ legend, description, children }: {
  legend: string;
  description?: string;
  children?: any;
}) {
  return (
    <fieldset>
      <legend class="text-sm/6 font-semibold text-gray-900">{legend}</legend>
      {description && <p class="mt-1 text-sm/6 text-gray-600">{description}</p>}
      <div class="mt-6 space-y-6">
        {children}
      </div>
    </fieldset>
  );
}

/** File upload drop zone */
export function FileUpload({ id, name, label, accept, hint }: {
  id: string;
  name?: string;
  label: string;
  accept?: string;
  hint?: string;
}) {
  return (
    <>
      <label for={id} class="block text-sm/6 font-medium text-gray-900">{label}</label>
      <div class="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
        <div class="text-center">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="mx-auto size-12 text-gray-300">
            <path d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clip-rule="evenodd" fill-rule="evenodd" />
          </svg>
          <div class="mt-4 flex text-sm/6 text-gray-600">
            <label for={id} class="relative cursor-pointer rounded-md bg-transparent font-semibold text-indigo-600 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600 hover:text-indigo-500">
              <span>Upload a file</span>
              <input id={id} name={name || id} type="file" accept={accept} class="sr-only" />
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>
          {hint && <p class="text-xs/5 text-gray-600">{hint}</p>}
        </div>
      </div>
    </>
  );
}

/** Error alert for form validation errors */
export function FormError({ message }: { message?: string }) {
  if (!message) return "";
  return (
    <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
      {message}
    </p>
  );
}

/** Cancel + Submit button row */
export function FormActions({ submitLabel, cancelHref }: {
  submitLabel?: string;
  cancelHref?: string;
}) {
  return (
    <div class="mt-6 flex items-center justify-end gap-x-6">
      {cancelHref
        ? <a href={cancelHref} class="text-sm/6 font-semibold text-gray-900">Cancel</a>
        : <button type="button" class="text-sm/6 font-semibold text-gray-900">Cancel</button>
      }
      <button type="submit" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
        {submitLabel || "Save"}
      </button>
    </div>
  );
}
