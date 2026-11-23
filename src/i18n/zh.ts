const zh = {
  // Header
  "app.title": "专升本知识整理",
  "app.subtitle": "四大板块拆解知识点 · 知识梳理 / 考点真题 / 重难点 / 思维导图 · 运行在 EdgeOne Makers",

  // Empty state
  "empty.title": "广东专升本知识整理 Agent",
  "empty.hint": "我是你的广东专升本辅导老师。发我一个知识点（比如「进制转换」「栈和队列」），我会分四大板块输出：📚 知识梳理、🎯 广东考点·真题解析、⚠️ 重难点与易错点，最后配一张 🧠 知识思维导图。",
  "empty.features": "知识梳理 · 广东考点真题 · 重难点易错 · 知识思维导图",

  // Chat input
  "chat.placeholder": "输入知识点…  ⏎ 发送 · Shift+⏎ 换行",
  "chat.hint": "由 OpenAI Agents SDK + EdgeOne Makers 驱动",

  // Preset questions
  "preset.1": "帮我整理『进制转换』这个知识点，结合广东专升本考点和真题讲解",
  "preset.2": "整理数据结构里的『栈和队列』，结合广东专升本真题分析重难点",

  // Workflow stage indicators
  "stage.analyze": "分析知识点",
  "stage.keypoints": "提炼重难点",
  "stage.mindmap": "生成思维导图",

  // Mindmap
  "mindmap.generating": "思维导图生成中…",

  // Status & errors
  "status.error": "⚠️ 请求失败，请检查后端服务是否启动。",
  "status.stopped": "⏹ *已停止生成*",
  "status.backendError": "⚠️ 后端中断请求失败，服务端可能仍在运行。",

  // Debug panel
  "debug.title": "传输流",
  "debug.events": "事件",
  "debug.clear": "清除",
  "debug.empty": "等待 SSE 事件...",
  "debug.emptyHint": "发送消息后，所有原始后端数据将在此处显示。",

  // Conversation sidebar
  "sidebar.label": "会话列表",
  "sidebar.title": "会话",
  "sidebar.newChat": "新建聊天",
  "sidebar.loading": "正在加载会话...",
  "sidebar.loadMore": "加载更多",
  "sidebar.loadingMore": "加载中...",
  "sidebar.emptyTitle": "暂无会话",
  "sidebar.emptyHint": "点击「新建聊天」开始第一段对话。",
  "sidebar.delete": "删除会话",
  "sidebar.deleteConfirm": "确定要永久删除这个会话吗？此操作不可恢复。",

  // Aria labels (button hover/screen-reader)
  "aria.send": "发送",
  "aria.clearHistory": "清除历史",
  "aria.stopGeneration": "停止生成",

  // Language toggle
  "lang.switch": "English",

  // ─── Floating bottom-right action badges ─────────────────────────────
  "floatingLink.deploy": "一键部署",
  "floatingLink.github": "GitHub",
} as const;

export default zh;
