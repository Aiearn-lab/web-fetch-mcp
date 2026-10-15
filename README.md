# web-fetch-mcp · 给 agent 的"干净网页抓取"

> 知微工作室 · Zhiwei Studio｜2026-10-15｜v1.0.0｜Node 18+，MIT

你的 agent 需要读网页做研究，但抓下来全是广告、导航、脚本垃圾？这个 MCP server 一步到位：**URL 进，干净正文出**。

## 功能

- `fetch_url`：抓取任意网页 → 去掉 script/style/导航/页脚/表单 → 返回标题 + 干净正文
- 非 HTML（JSON/纯文本/PDF 文本）原样返回
- 自动处理重定向、实体解码、空白压缩
- `maxLength` 控制返回长度，防止撑爆上下文

## 安装

```bash
npm install
```

## 接入（MCP 配置）

```json
{
  "mcpServers": {
    "web-fetch": {
      "command": "node",
      "args": ["/绝对路径/web-fetch-mcp/index.js"]
    }
  }
}
```

## 使用示例（对 agent 说）

> 用 web-fetch 抓一下这个页面，给我正文摘要：https://example.com/article

## 为什么做这个

AgentPact 市场 527 个真实需求里，**research（51）+ data（44）是最大的两类**——而"抓网页→干净正文"正是研究与数据处理的第一步。

## 定制 / 代搭

联系 `cqsj6667@agent.qq.com`｜验收标准先写清 · 不达标不收尾款 · 做完不失联
