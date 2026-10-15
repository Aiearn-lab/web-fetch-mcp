#!/usr/bin/env node
/**
 * web-fetch-mcp — URL → 干净正文（agent 研究与信息采集刚需）
 * 知微工作室 · Zhiwei Studio · 2026-10-15 · v1.0.0
 *
 * 提供 1 个工具：
 *   fetch_url   抓取网页并提取干净正文（去广告/导航/脚本/样式），适合 agent 做研究
 *
 * 为什么做这个：AgentPact 本地 527 个需求里 research(51) + data(44) 是最大类，
 * 而"抓网页→干净正文"是研究与数据工作的第一步，agent 刚需、零依赖。
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "web-fetch-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

function decodeEntities(s) {
  return s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#x?[0-9a-fA-F]+;/g, " ");
}

async function fetchClean(url, maxLen) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; web-fetch-mcp/1.0)" },
    redirect: "follow",
  });
  const finalUrl = res.url;
  const ct = res.headers.get("content-type") || "";
  const raw = await res.text();
  if (!ct.includes("text/html")) {
    return { url: finalUrl, contentType: ct, text: raw.slice(0, maxLen),
             length: raw.length, truncated: raw.length > maxLen };
  }
  let html = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(nav|header|footer|aside|form|svg)[\s\S]*?<\/\1>/gi, "");
  const title = decodeEntities(((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").trim());
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  text = decodeEntities(text)
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
  return { url: finalUrl, title, text: text.slice(0, maxLen),
           length: text.length, truncated: text.length > maxLen };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "fetch_url",
      description: "抓取网页并提取干净正文（去广告/导航/脚本/样式），适合 agent 做研究与信息采集",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "要抓取的网页 URL" },
          maxLength: { type: "number", description: "返回正文最大字符数，默认 8000" },
        },
        required: ["url"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a } = req.params;
  if (name === "fetch_url") {
    try {
      const r = await fetchClean(a.url, a.maxLength === undefined ? 8000 : Number(a.maxLength));
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
    } catch (e) {
      return { content: [{ type: "text", text: "error: " + (e && e.message ? e.message : String(e)) }], isError: true };
    }
  }
  return { content: [{ type: "text", text: "unknown tool: " + name }], isError: true };
});

const transport = new StdioServerTransport();
await server.connect(transport);
