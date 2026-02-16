# Live Reload

WebSocket-based live reload for development. Browser auto-reloads when server restarts.

## How it works

1. Server generates a `buildId` (`Date.now().toString(36)`) at startup
2. Client connects via WebSocket to `/__reload`, receives buildId
3. `bun --watch` detects file change → kills process → restarts
4. Old WS connections drop → client reconnects after 500ms
5. Client gets new buildId → `location.reload()`

## Why `--watch` not `--hot`

- `--watch` kills and restarts the process → WS connections properly drop
- `--hot` keeps the process alive and re-executes modules → WS connections survive → client never detects the change

## Server side (`src/lib/livereload.ts`)

```ts
export const buildId = Date.now().toString(36);

export const liveReloadWs = {
  open(ws) { ws.send(buildId); },
  message() {},
};

export const liveReloadScript = `<script>...</script>`;
```

## Wiring

In `src/index.tsx`:
```ts
// WebSocket upgrade in fetch fallback
fetch(req, server) {
  if (new URL(req.url).pathname === "/__reload") {
    if (server.upgrade(req)) return;
  }
  // ...
},
websocket: liveReloadWs,
```

In `src/layout.tsx`:
```tsx
import { liveReloadScript } from "./lib/livereload.ts";
// Included in <head> of every page
{liveReloadScript}
```

## Client side

```js
var id = null;
function connect() {
  var ws = new WebSocket("ws://" + location.host + "/__reload");
  ws.onmessage = function(e) {
    if (id && id !== e.data) location.reload();
    id = e.data;
  };
  ws.onclose = function() {
    setTimeout(connect, 500);
  };
}
connect();
```

On first connect: stores buildId. On reconnect with different buildId: reloads. On connection loss: retries every 500ms.
