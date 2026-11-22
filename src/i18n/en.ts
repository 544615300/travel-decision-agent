const en = {
  // Header
  "app.title": "Exam Prep Knowledge Tutor",
  "app.subtitle": "Turn any topic into key/difficult points + a mind map · Running on EdgeOne Makers",

  // Empty state
  "empty.title": "Exam Prep Knowledge Tutor",
  "empty.hint": "I'm your exam-prep tutor. Send me a topic (e.g. \"number base conversion\" or \"stacks & queues\") and I'll break down the core concepts, highlight key & difficult points, warn about common mistakes, and finish with a mind map.",
  "empty.features": "Key Points · Pitfall Alerts · Mind Map",

  // Chat input
  "chat.placeholder": "Type a topic...  ⏎ Send · Shift+⏎ Newline",
  "chat.hint": "Powered by OpenAI Agents SDK + EdgeOne Makers",

  // Preset questions
  "preset.1": "Break down the topic \"number base conversion\" with key points and a mind map.",
  "preset.2": "Explain \"stacks and queues\" — I always mix up their insert/remove rules.",

  // Workflow stage indicators
  "stage.analyze": "Analyze topic",
  "stage.keypoints": "Extract key points",
  "stage.mindmap": "Generate mind map",

  // Mindmap
  "mindmap.generating": "Generating mind map…",

  // Status & errors
  "status.error": "Request failed. Please check if the backend service is running.",
  "status.stopped": "⏹ *Generation stopped*",
  "status.backendError": "Backend abort request failed. The server may still be running.",

  // Debug panel
  "debug.title": "Trace",
  "debug.events": "events",
  "debug.clear": "Clear",
  "debug.empty": "Waiting for SSE events...",
  "debug.emptyHint": "After sending a message, all raw backend data will be displayed here.",

  // Conversation sidebar
  "sidebar.label": "Conversation list",
  "sidebar.title": "Chats",
  "sidebar.newChat": "New chat",
  "sidebar.loading": "Loading conversations...",
  "sidebar.loadMore": "Load more",
  "sidebar.loadingMore": "Loading...",
  "sidebar.emptyTitle": "No conversations yet",
  "sidebar.emptyHint": "Click \"New chat\" to start your first conversation.",
  "sidebar.delete": "Delete conversation",
  "sidebar.deleteConfirm": "Permanently delete this conversation? This cannot be undone.",

  // Aria labels (button hover/screen-reader)
  "aria.send": "Send",
  "aria.clearHistory": "Clear history",
  "aria.stopGeneration": "Stop generation",

  // Language toggle
  "lang.switch": "中文",

  // ─── Floating bottom-right action badges ─────────────────────────────
  "floatingLink.deploy": "Deploy",
  "floatingLink.github": "GitHub",
} as const;

export default en;
