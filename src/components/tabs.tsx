type Tab = {
  id: string;
  label: string;
  content: string;
};

export function Tabs({ tabs, signal = "tab" }: { tabs: Tab[]; signal?: string }) {
  const first = tabs[0]?.id || "";
  return (
    <div data-signals={`{"${signal}":"${first}"}`}>
      <div class="flex border-b border-gray-200" role="tablist">
        {tabs.map((tab) => (
          <button
            role="tab"
            class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-3 border-transparent -mb-px cursor-pointer"
            data-class={`{"!border-blue-600 !text-blue-600": $${signal} === '${tab.id}'}`}
            data-on:click={`$${signal} = '${tab.id}'`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div class="mt-4">
        {tabs.map((tab) => (
          <div
            role="tabpanel"
            data-show={`$${signal} === '${tab.id}'`}
            style="display: none"
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
