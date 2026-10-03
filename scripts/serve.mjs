// Minimal static file server for the demo and browser tests (no Python needed).
// Usage: node scripts/serve.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.argv[2] || process.env.PORT || 8080);

const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".cjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
};

createServer(async (req, res) => {
    try {
        const url = new URL(req.url || "/", "http://localhost");
        let path = normalize(join(root, decodeURIComponent(url.pathname)));
        if (path !== root && !path.startsWith(root + sep)) {
            res.writeHead(403).end("Forbidden");
            return;
        }
        if ((await stat(path).catch(() => null))?.isDirectory()) {
            path = join(path, "index.html");
        }
        if (url.pathname === "/") path = join(root, "mintwaterfall-example.html");
        const body = await readFile(path);
        res.writeHead(200, {
            "Content-Type": types[extname(path)] || "application/octet-stream",
            "Cache-Control": "no-store",
        });
        res.end(body);
    } catch {
        res.writeHead(404).end("Not found");
    }
}).listen(port, () => {
    console.log(`Serving ${root} at http://localhost:${port}/`);
});
