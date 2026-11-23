const en = {
  // Header
  "app.title": "Exam Prep Knowledge Tutor",
  "app.subtitle": "Any topic, four sections: Knowledge · Exam Points & Papers · Key Points · Mind Map · Running on EdgeOne Makers",

  // Empty state
  "empty.title": "Exam Prep Knowledge Tutor",
  "empty.hint": "I'm your exam-prep tutor. Send me a topic (e.g. \"number base conversion\" or \"stacks & queues\") and I'll reply in four sections: 📚 Knowledge, 🎯 Exam Points & Past Papers, ⚠️ Key Points & Pitfalls, plus a 🧠 knowledge-only mind map.",
  "empty.features": "Knowledge · Exam Points & Papers · Key Points · Mind Map",

  // Chat input
  "chat.placeholder": "Type a topic...  ⏎ Send · Shift+⏎ Newline",
  "chat.hint": "Powered by OpenAI Agents SDK + EdgeOne Makers",

  // Preset questions
  "preset.1": "Break down \"number base conversion\" with exam points and past-paper analysis.",
  "preset.2": "Explain \"stacks and queues\" — analyze key points with typical exam questions.",

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
