
from datetime import datetime


# 工具一：加法計算
def add(a, b):
    return a + b


# 工具二：乘法計算
def multiply(a, b):
    return a * b


# 工具三：取得目前時間
def get_current_time():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# 測試工具
if __name__ == "__main__":
    print("===== Agent 工具測試 =====")
    print("加法計算：", add(25, 30))
    print("乘法計算：", multiply(12, 8))
    print("目前時間：", get_current_time())
