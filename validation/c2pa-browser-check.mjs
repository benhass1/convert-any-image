import { setTimeout as delay } from "node:timers/promises";

const chrome = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const target = chrome.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl);
if (!target) throw new Error("No Chromium page with a debugging endpoint was found.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  const resolver = pending.get(message.id);
  if (resolver) {
    pending.delete(message.id);
    message.error ? resolver.reject(new Error(message.error.message)) : resolver.resolve(message.result);
  }
});

function send(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function pageText() {
  const result = await send("Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true });
  return result.result.value;
}

async function waitFor(labels, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const text = await pageText();
    const match = labels.find((label) => text.includes(label));
    if (match) return match;
    await delay(250);
  }
  throw new Error(`Timed out while waiting for one of: ${labels.join(", ")}`);
}

async function selectFile(filePath) {
  const document = await send("DOM.getDocument");
  const node = await send("DOM.querySelector", { nodeId: document.root.nodeId, selector: "input[type=file]" });
  if (!node.nodeId) throw new Error("View EXIF file input was not found.");
  await send("DOM.setFileInputFiles", { files: [filePath], nodeId: node.nodeId });
}

await send("Page.enable");
await send("Page.navigate", { url: "http://localhost:5173/view-exif" });
await waitFor(["Choose an image to inspect"]);

const fixtures = [
  { name: "credential-present", path: "/home/ubuntu/webdev-static-assets/c2pa-credential-present.jpg", labels: ["CREDENTIAL VALIDATED", "CREDENTIAL FOUND", "VALIDATION ISSUE"] },
  { name: "no-credential", path: "/home/ubuntu/webdev-static-assets/convert-any-image-logo.png", labels: ["No Content Credential was found"] },
  { name: "unsupported", path: "/home/ubuntu/webdev-static-assets/c2pa-unsupported.txt", labels: ["Content Credentials could not be read"] },
];

const results = [];
for (const fixture of fixtures) {
  await selectFile(fixture.path);
  results.push({ fixture: fixture.name, state: await waitFor(fixture.labels) });
}

console.log(JSON.stringify(results, null, 2));
socket.close();
