# 专升本知识整理 Agent（基于 EdgeOne Makers）

把 EdgeOne Makers 的 OpenAI Agents Starter 模板改造成了**专升本辅导老师 Agent**：
你发一个知识点（比如「进制转换」「栈和队列」），它会输出：

- 📌 核心概念 → ⭐ 重点内容 → 🔥 难点内容 → ⚠️ 易错点 → 📝 常见题型 → 💡 备考建议
- 最后自动生成一张**可交互的思维导图**（markmap 渲染，可缩放展开）

---

## 一、这次改了什么（对比原模板）

| 位置 | 原模板 | 现在 |
|------|--------|------|
| `agents/chat/index.py` | 天气/翻译等 4 个示例工具 | 专升本辅导老师人设，`tools=[]`（纯知识整理），按「分析→重难点→思维导图」三阶段工作 |
| `src/components/MindmapView.tsx` | 不存在（新增） | 拦截 ` ```mindmap ` 代码块，流式时显示"生成中…"，结束后渲染 markmap SVG |
| `src/components/ChatBubble.tsx` | 普通 Markdown 渲染 | 增加对 `mindmap` 代码块的拦截 |
| `src/App.tsx` | 4 盏工具灯 | 3 盏工作流阶段灯（📖 分析 → ⭐ 提炼 → 🧠 导图） |
| `src/i18n/zh.ts` / `en.ts` | 模板文案 | 专升本场景文案 + 2 个预设提问 |
| `index.html` | 模板标题 | 「专升本知识整理 Agent」 |

markmap 通过 CDN 动态加载（jsDelivr → unpkg → npmmirror 三源兜底），不用装 npm 包。

---

## 二、部署到 EdgeOne Makers（分步操作）

> 原理：代码推到你的 GitHub Fork → Makers 控制台绑定这个仓库 → 以后每次 Push 自动重新部署。

### 第 1 步：把本地改好的代码推到你的 Fork

你的 Fork 仓库是：`https://github.com/544615300/travel-decision-agent`

在本项目文件夹（`makers-agent`）打开 Git Bash 或 PowerShell，依次执行：

```bash
# 1. 把远程地址从腾讯官方模板换成你自己的 Fork
git remote set-url origin https://github.com/544615300/travel-decision-agent.git

# 2. 暂存所有改动
git add .

# 3. 提交
git commit -m "改造为专升本知识整理 Agent（含思维导图）"

# 4. 推送（会弹出 GitHub 登录窗口，登录你的账号 544615300）
git push origin main
```

> 💡 如果 `git push` 报 `fetch first` 错误，先执行 `git pull origin main --allow-unrelated-histories` 再推。

### 第 2 步：获取模型 API Key（免费）

1. 打开 [Makers 控制台](https://console.cloud.tencent.com/edgeone/makers)。
2. 进入 **Makers → Models → API Key**，点「新建」。
3. 复制生成的 Key（`mk-` 开头）。

> 模板内置 `@makers/deepseek-v4-flash` 免费模型，验证阶段够用。

### 第 3 步：在 Makers 控制台创建项目

1. 打开 [Makers 控制台](https://console.cloud.tencent.com/edgeone/makers)。
2. 点 **创建项目 / Import Project** → 选择 **GitHub**。
3. 第一次会要求授权 GitHub，授权后选择你自己的仓库 `544615300/travel-decision-agent`。
4. 框架会自动识别为 `openai-agents-sdk`（来自 `edgeone.json`），直接确认。
5. 在**环境变量**里添加：

| 变量名 | 值 |
|--------|-----|
| `AI_GATEWAY_API_KEY` | 第 2 步拿到的 Key |
| `AI_GATEWAY_BASE_URL` | `https://ai-gateway.edgeone.link/v1` |
| `AI_GATEWAY_MODEL` | `@makers/deepseek-v4-flash`（可留空，默认就是这个） |

6. 点 **部署**，等 1~3 分钟出预览链接。

### 第 4 步：验收

打开部署好的网页，点预设问题「帮我整理『进制转换』这个知识点…」：

- ✅ 顶部三盏灯依次亮起：📖 分析知识点 → ⭐ 提炼重难点 → 🧠 生成思维导图
- ✅ 回复包含 📌核心概念 / ⭐重点 / 🔥难点 / ⚠️易错点 等分段
- ✅ 最后出现一张可缩放的思维导图

---

## 三、本地开发（可选）

前置依赖：Node.js ≥ 18、Python ≥ 3.10、EdgeOne CLI（`npm i -g edgeone`）。

```bash
npm install
pip install -r requirements.txt
cp .env.example .env       # 填入 AI_GATEWAY_API_KEY / AI_GATEWAY_BASE_URL
edgeone makers dev
```

---

## 四、项目结构

```text
makers-agent/
├── agents/                          # 有状态的 Agent Functions（Python）
│   ├── chat/index.py               # POST /chat —— SSE 流式聊天（专升本老师人设）
│   ├── chat/stop.py                # POST /chat/stop —— 中断当前生成
│   ├── _logger.py                  # 日志工具（私有）
│   └── _tools.py                   # 原模板示例工具（现已不引用，可删）
├── cloud-functions/                 # 无状态云函数
│   └── history/index.py            # POST /history —— 拉取对话历史
├── src/                             # React + Vite + TypeScript 前端
│   ├── App.tsx                     # 主应用 + 3 盏工作流阶段灯
│   ├── components/
│   │   ├── ChatBubble.tsx          # Markdown 渲染 + mindmap 代码块拦截
│   │   ├── MindmapView.tsx         # 思维导图组件（markmap CDN 加载）
│   │   └── ...
│   └── i18n/                        # 中英文案
├── edgeone.json                     # framework=openai-agents-sdk
└── requirements.txt                 # Python 依赖
```

> 以 `_` 开头的文件是私有模块，不会暴露为公开路由。

## 资源

- [EdgeOne Makers Agents 文档](https://cloud.tencent.com/document/product/1552/132759)
- [EdgeOne Makers 快速开始](https://cloud.tencent.com/document/product/1552/132786)
- [Makers Models](https://cloud.tencent.com/document/product/1552/132748)

## License

MIT.
