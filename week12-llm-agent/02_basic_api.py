
import urllib.request
import json

# API 網址
url = "https://jsonplaceholder.typicode.com/posts/1"

# 發送 API 請求
with urllib.request.urlopen(url, timeout=15) as response:
    data = json.loads(response.read().decode("utf-8"))

# 顯示 API 回傳結果
print("API 呼叫成功！")
print("使用者 ID：", data["userId"])
print("文章 ID：", data["id"])
print("標題：", data["title"])
print("內容：", data["body"])
