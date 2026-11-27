
import re
from importlib import import_module

# 載入上一個步驟建立的工具
tools = import_module("04_tools")


def agent(prompt):
    # 擷取使用者輸入的數字
    numbers = re.findall(r"-?\d+(?:\.\d+)?", prompt)

    # 判斷是否需要加法工具
    if "加" in prompt or "+" in prompt:
        if len(numbers) >= 2:
            result = tools.add(
                float(numbers[0]), float(numbers[1])
            )
            return f"使用加法工具，計算結果：{result}"
        return "請輸入兩個數字。"

    # 判斷是否需要乘法工具
    elif "乘" in prompt or "*" in prompt:
        if len(numbers) >= 2:
            result = tools.multiply(
                float(numbers[0]), float(numbers[1])
            )
            return f"使用乘法工具，計算結果：{result}"
        return "請輸入兩個數字。"

    # 判斷是否需要時間工具
    elif "時間" in prompt or "幾點" in prompt:
        result = tools.get_current_time()
        return f"使用時間工具，目前時間：{result}"

    else:
        return "目前沒有適合執行此任務的工具。"


print("===== 離線 Agent 助手 =====")
print("支援加法、乘法、時間查詢")
print("輸入 exit 結束程式")

while True:
    prompt = input("\n使用者：")

    if prompt.lower() == "exit":
        print("Agent 已關閉")
        break

    response = agent(prompt)
    print("Agent：", response)
