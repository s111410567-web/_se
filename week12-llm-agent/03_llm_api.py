
from google import genai
from getpass import getpass

# 安全輸入 API Key
api_key = getpass("請輸入 Gemini API Key：")

# 建立 Gemini 客戶端
client = genai.Client(api_key=api_key)

print("===== Gemini AI 助手 =====")
print("輸入 exit 結束程式")

while True:
    prompt = input("\n使用者：")

    if prompt.lower() == "exit":
        print("結束對話")
        break

    try:
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt
        )

        print("AI：", response.text)

    except Exception as e:
        print("發生錯誤：", e)
