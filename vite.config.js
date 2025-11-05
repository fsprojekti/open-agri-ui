// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sass from "sass";

function describeTarget(target) {
    if (typeof target === "string") return target.replace(/\/$/, "");
    // http-proxy sets .href on URL objects, otherwise compose
    return target?.href || `${target?.protocol}//${target?.host}`;
}

export default defineConfig({
    plugins: [react()],
    css: {
        preprocessorOptions: { scss: { implementation: sass, quietDeps: true } },
    },
    server: {
        proxy: {
            "/gatekeeper": {
                target: "http://209.38.211.183:8001",
                changeOrigin: true,
                secure: false,

                // 1) Log the rewrite mapping (original path -> rewritten path)
                rewrite: (path /*, req */) => {
                    const rewritten = path.replace(/^\/gatekeeper/, "/api"); // or "/api" if that’s your backend
                    console.log(`[REWRITE] ${path} -> ${rewritten}`);
                    return rewritten;
                },

                // 2) Log what *actually* goes upstream (method + full final URL)
                configure(proxy /*, options */) {
                    proxy.on("proxyReq", (proxyReq, req) => {
                        const upstream = describeTarget(proxy.options.target);
                        // req.url is already the *rewritten* path that will be sent upstream
                        console.log(`[PROXY →] ${req.method} ${upstream}${req.url}`);
                        // Optional: log a couple headers (avoid secrets)
                        // console.log("   headers:", proxyReq.getHeader("host"), proxyReq.getHeader("content-type"));
                    });

                    proxy.on("proxyRes", (proxyRes, req) => {
                        const upstream = describeTarget(proxy.options.target);
                        console.log(`[PROXY ←] ${proxyRes.statusCode} ${req.method} ${upstream}${req.url}`);
                    });

                    proxy.on("error", (err, req) => {
                        const upstream = describeTarget(proxy.options.target);
                        console.error(`[PROXY ✖] ${req.method} ${upstream}${req.url} -> ${err.message}`);
                    });
                },
            },

            "/farmcalendar": {
                target: "http://209.38.211.183:8002",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => {
                    const rewritten = path.replace(/^\/farmcalendar/, "/api");
                    console.log(`[REWRITE] ${path} -> ${rewritten}`);
                    return rewritten;
                },
                configure(proxy) {
                    proxy.on("proxyReq", (proxyReq, req) => {
                        const upstream = describeTarget(proxy.options.target);
                        console.log(`[PROXY →] ${req.method} ${upstream}${req.url}`);
                    });
                    proxy.on("proxyRes", (proxyRes, req) => {
                        const upstream = describeTarget(proxy.options.target);
                        console.log(`[PROXY ←] ${proxyRes.statusCode} ${req.method} ${upstream}${req.url}`);
                    });
                },
            },
        },
    },
});
