
from google import genai
from google.genai import types
from getpass import getpass
from importlib import import_module

tools = import_module("04_tools")


def add(a: float, b: float) -> float:
    """計算兩個數字的加法。"""
    return tools.add(a, b)


def multiply(a: float, b: float) -> float:
    """計算兩個數字的乘法。"""
    return tools.multiply(a, b)


def get_current_time() -> str:
    """取得目前的日期與時間。"""
    return tools.get_current_time()


api_key = getpass("請輸入 Gemini API Key：")
client = genai.Client(api_key=api_key)

config = types.GenerateContentConfig(
    tools=[add, multiply, get_current_time],
    system_instruction=(
        "你是一個 AI Agent。"
        "請根據使用者的任務選擇適當的工具，"
        "並使用繁體中文回答。"
    )
)

print("===== LLM Agent 助手 =====")
print("支援計算、時間查詢及一般問答")
print("輸入 exit 結束程式")

while True:
    prompt = input("\n使用者：")

    if prompt.lower() == "exit":
        print("Agent 已關閉")
        break

    try:
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config=config
        )

        print("Agent：", response.text)

    except Exception as e:
        print("發生錯誤：", e)
