"""
Agent handler — EdgeOne Makers
========================================

The file path agents/chat/index.py is auto-mapped to **POST /chat**.

业务：广东专升本知识点整理 Agent
用户输入一个知识点 → 生成「四大板块」结构化讲义

输出约定（供前端分板块渲染）：
  @@@ 知识梳理                 → 知识讲解（思维导图只基于这一部分构图）
  @@@ 广东专升本考点与真题解析   → 考点 + 真题 + 真题解析
  @@@ 重难点与易错点             → 重点 / 难点 / 易错点 / 备考建议
  @@@ 思维导图                 → ```mindmap 代码块（前端用 markmap 渲染）
  前端按 @@@ 标记切成 Tab 板块；若解析不到标记则降级为整段 Markdown 渲染。
"""

from typing import Any, AsyncGenerator
import asyncio
import json
import os

from dotenv import load_dotenv
from openai import AsyncOpenAI
from openai.types.responses import ResponseTextDeltaEvent
from agents import Agent, OpenAIChatCompletionsModel, Runner

from .._logger import create_logger


load_dotenv()

logger = create_logger("chat")


# ========== LLM Model ==========
# 支持任意 OpenAI 兼容网关：
#   - EdgeOne Makers 内置免费模型（默认）
#   - 阿里云百炼 / 智谱 GLM / DeepSeek / Kimi 等（改 .env 即可）
llm_client = AsyncOpenAI(
    api_key=os.getenv("AI_GATEWAY_API_KEY"),
    base_url=os.getenv("AI_GATEWAY_BASE_URL"),
)

llm_model = OpenAIChatCompletionsModel(
    model=os.getenv("AI_GATEWAY_MODEL", "@makers/deepseek-v4-flash"),
    openai_client=llm_client,
)


# ========== Agent ==========
INSTRUCTIONS = """你是「广东专升本知识点整理 Agent」，专门帮助备考广东省普通专升本（原专插本）的考生，把一个知识点整理成结构化的四板块复习讲义。

当用户输入一个知识点（例如：定积分的应用、TCP 三次握手、借贷记账法）时，严格按下面四板块格式输出，不要输出格式以外的开场白或寒暄。

【最重要的硬性要求 · 必读】必须依次输出下面 4 个板块，每个板块用一行 `@@@ 板块名` 作为分隔标记，标记必须单独占一行、原样照抄、一个都不能少、不能改名、不能合并、不能用别的东西代替。这是给前端分栏用的，格式错了页面就没法分板块。

@@@ 知识梳理
## 核心概念
用通俗语言解释这个知识点是什么，2-3 句话，照顾基础薄弱的学生。
## 知识结构
- 用 3-6 个小标题或列表，把该知识点的分类、组成、关键公式/定理、来龙去脉讲清楚
- 这部分是「纯知识」，只讲是什么、怎么来的、彼此什么关系，不要写考点、真题、重难点

@@@ 广东专升本考点与真题解析
## 对应考点
- 结合广东省普通专升本该科目的考试大纲/常见考查方式，列出 2-4 条该知识点对应的高频考点、考查角度与常考题型（选择/填空/计算/简答等）
## 真题演练
- 编写 1-2 道贴合广东专升本风格的代表性真题或改编题，写清题干
## 真题解析
- 对上面每一道题给出逐步解题思路与最终答案，并点明用到的知识点、易踩的坑
- 若不确定真实原题年份，用「典型题 / 改编题」表述，不要编造具体年份和分值，讲解要实在

【本板块硬性要求】必须结合「广东专升本」的实际考试语境来写考点和题目，不要写成泛泛而谈的通用知识点，也不要把「知识梳理」里的内容原样重复一遍。

@@@ 重难点与易错点
## ⭐ 重点（考试高频）
- 列出 3-5 个必须掌握的要点，每条一句话加简短说明
## 🔥 难点（易丢分）
- 列出 2-4 个学生最容易卡壳的地方，说明为什么难、怎么突破
## ⚠️ 易错点提醒
- 列出 2-3 个考试中常见的错误做法或陷阱
## 💡 备考建议
- 给出 2-3 条针对这个知识点的具体复习建议

@@@ 思维导图
紧接着输出一个 mindmap 代码块，格式如下（代码块里只能有导图，不能有解释文字）：

```mindmap
# 知识点名称
## 一级分支
### 二级节点
## 另一个一级分支
### 二级节点
```

【思维导图硬性要求 · 只画知识】
1. 思维导图**只反映「知识梳理」板块的知识结构**（概念、分类/组成、关键公式、彼此关系），**严禁**把考点、真题、真题解析、重难点、易错点、备考建议画进导图
2. mindmap 代码块必须且只能有一个，用 ```mindmap 开头、``` 结尾，放在本板块标记之后
3. 第一级 # 有且只有一个（知识点名称）；二级 ## 建议 3-6 个；三级 ### 若干；总节点数 12-28 个
4. 每个节点是一行精炼短语，不要长句子，不要编号

【其他规则】
- 全程使用简体中文，讲解通俗
- 四个板块标记 `@@@ 知识梳理`、`@@@ 广东专升本考点与真题解析`、`@@@ 重难点与易错点`、`@@@ 思维导图` 顺序固定，缺一不可；每个板块内容尽量精简，宁可短也不要把标记写漏
- 若用户是在追问、追问细节或闲聊（不是新知识点），就正常用中文简短回答，不必套用上述四板块格式，也不要输出 mindmap 代码块
- 如果用户只打了招呼，简短介绍自己是广东专升本知识点整理助手，并举例说明可以输入什么
"""

agent = Agent(
    name="Zhuanshengben Tutor",
    instructions=INSTRUCTIONS,
    tools=[],
    model=llm_model,
)

# 工作流阶段指示灯（前端 ToolIndicators 用）
WORKFLOW_STAGES = ["analyze_subject", "key_points", "mindmap"]


# ========== SSE Helper ==========
def sse_event(event: str, data: dict) -> str:
    """Format a single SSE event."""
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# ========== Event Stream Generator ==========
async def _event_stream(
    message: str,
    session=None,
    cancel_signal: asyncio.Event | None = None,
) -> AsyncGenerator[str, None]:
    """Async generator that yields SSE frames from the agent stream."""

    # 依次点亮工作流阶段灯，给用户「Agent 正在分步骤工作」的反馈
    for stage in WORKFLOW_STAGES:
        if cancel_signal and cancel_signal.is_set():
            break
        yield sse_event("tool_called", {"tool": stage})

    result = Runner.run_streamed(agent, input=message, session=session)

    async for event in result.stream_events():
        if cancel_signal and cancel_signal.is_set():
            break

        if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
            yield sse_event("text_delta", {"delta": event.data.delta})

        elif event.type == "run_item_stream_event" and event.name == "tool_called":
            tool_name = (
                getattr(event.item, "name", None)
                or getattr(getattr(event.item, "raw_item", None), "name", None)
            )
            if tool_name:
                yield sse_event("tool_called", {"tool": tool_name})


# ========== Core Handler ==========
async def handler(context: Any) -> AsyncGenerator[str, None]:
    """EdgeOne Makers entry point — 保留模板的会话记忆与中断能力。"""
    request = context.request
    body = request.body
    message = body.get("message") if isinstance(body, dict) else None

    if not message:
        yield sse_event("error", {"message": "'message' is required"})
        yield sse_event("done", {})
        return

    raw_user_id = ""
    if isinstance(body, dict):
        raw_user_id = body.get("userId") or body.get("user_id") or ""
    user_id = str(raw_user_id).strip() or None

    cid = context.conversation_id
    logger.log(f"[request] cid={cid}, uid={user_id or '-'}, message={message[:50]!r}")

    # 首轮写入用户索引，供左侧会话列表展示
    if user_id and cid:
        try:
            existing = await context.store.get_messages(conversation_id=cid, limit=1)
            already_indexed = bool(existing)
        except Exception as e:
            logger.error(f"[user-index] probe failed: {type(e).__name__}: {e}")
            already_indexed = False

        if not already_indexed:
            try:
                await context.store.append_message(
                    conversation_id=cid,
                    role="user",
                    content=message,
                    user_id=user_id,
                )
            except Exception as e:
                logger.error(f"[user-index] write failed: {type(e).__name__}: {e}")

    session = context.store.openai_session(cid) if cid else None

    cancel_signal = request.signal
    stopped = False

    try:
        async for frame in _event_stream(message, session, cancel_signal):
            if cancel_signal.is_set():
                stopped = True
                break
            yield frame
    except asyncio.CancelledError:
        stopped = True
        logger.log("[stream] cancelled")
    except Exception as e:
        logger.error(f"[stream] error: {type(e).__name__}: {e}")
        detail: Any = str(e)
        status: Any = None
        response = getattr(e, "response", None)
        if response is not None:
            status = getattr(response, "status_code", None)
            try:
                body_text = response.text if hasattr(response, "text") else None
                if callable(body_text):
                    body_text = body_text()
                if body_text:
                    try:
                        detail = json.loads(body_text)
                    except (json.JSONDecodeError, ValueError, TypeError):
                        detail = body_text
            except Exception:
                pass
        body_attr = getattr(e, "body", None)
        if body_attr and detail == str(e):
            detail = body_attr
        yield sse_event("error", {
            "message": str(e),
            "errorType": type(e).__name__,
            "status": status,
            "detail": detail,
        })
    finally:
        yield sse_event("done", {"stopped": stopped})
