#!/usr/bin/env python3
"""最小 Agent（Anthropic Messages API，只用標準函式庫）
執行：
    export ANTHROPIC_API_KEY=金鑰
    python3 agent_anthropic.py
"""
import datetime
import json
import os
import sys
import urllib.request

API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-5-5"

TOOLS = [
    {
        "name": "get_time",
        "description": "取得目前的本地時間（ISO 格式）。",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "word_count",
        "description": "計算一段文字的字元數（不含空白）。",
        "input_schema": {
            "type": "object",
            "properties": {"text": {"type": "string", "description": "要計算的文字"}},
            "required": ["text"],
        },
    },
]


def run_tool(name, args):
    """真正執行工具的地方 —— 模型只是『提出需求』。"""
    try:
        if name == "get_time":
            return datetime.datetime.now().isoformat(timespec="seconds")
        if name == "word_count":
            return str(len("".join(args["text"].split())))
        return f"錯誤：沒有名為 {name} 的工具"
    except Exception as e:                      # 錯誤也回報給模型，讓它自己調整
        return f"工具執行失敗：{e}"


def call_api(messages):
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        sys.exit("請先設定環境變數 ANTHROPIC_API_KEY")
    body = {"model": MODEL, "max_tokens": 1000, "tools": TOOLS, "messages": messages}
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode(),
        headers={
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def agent(task, max_steps=6):
    messages = [{"role": "user", "content": task}]
    for step in range(1, max_steps + 1):
        resp = call_api(messages)
        messages.append({"role": "assistant", "content": resp["content"]})
        print(f"[step {step}] stop_reason={resp['stop_reason']}")

        if resp["stop_reason"] != "tool_use":          # 模型說做完了
            return "".join(b["text"] for b in resp["content"] if b["type"] == "text")

        results = []
        for block in resp["content"]:
            if block["type"] == "tool_use":
                print(f"   -> 呼叫 {block['name']}({block['input']})")
                out = run_tool(block["name"], block["input"])
                results.append({"type": "tool_result",
                                "tool_use_id": block["id"], "content": out})
        messages.append({"role": "user", "content": results})
    return "（達到步數上限，已停止）"


if __name__ == "__main__":
    task = "現在幾點？另外，『人工智慧代理』這幾個字有幾個字元？"
    print(agent(task))
