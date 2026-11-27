
# Week 12 - Basic LLM Simulation

def llm(prompt):
    if "你好" in prompt:
        return "你好！我是 AI 助手。"
    elif "Python" in prompt:
        return "Python 是一種常用的程式語言。"
    elif "Agent" in prompt:
        return "Agent 是能夠使用工具並執行任務的 AI 系統。"
    else:
        return "我目前無法回答這個問題。"


while True:
    prompt = input("使用者：")

    if prompt == "exit":
        print("結束對話")
        break

    response = llm(prompt)
    print("AI：", response)
