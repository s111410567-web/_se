
import urllib.request
import urllib.error
import time


def check_website(url, timeout=10):
    """
    檢查網站狀態、HTTP 狀態碼與回應時間。
    """

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    start_time = time.perf_counter()

    try:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "WebsiteStatusChecker/1.0"}
        )

        with urllib.request.urlopen(request, timeout=timeout) as response:
            status_code = response.getcode()

        response_time = round(
            (time.perf_counter() - start_time) * 1000, 2
        )

        return {
            "url": url,
            "status": "正常" if 200 <= status_code < 400 else "異常",
            "status_code": status_code,
            "response_time_ms": response_time,
            "error": None
        }

    except urllib.error.HTTPError as error:
        return {
            "url": url,
            "status": "異常",
            "status_code": error.code,
            "response_time_ms": round(
                (time.perf_counter() - start_time) * 1000, 2
            ),
            "error": str(error)
        }

    except (urllib.error.URLError, TimeoutError, ValueError) as error:
        return {
            "url": url,
            "status": "無法連線",
            "status_code": None,
            "response_time_ms": None,
            "error": str(error)
        }


def main():
    print("=== Website Status Checker ===")

    url = input("請輸入網站網址：").strip()

    if not url:
        print("錯誤：網址不能為空。")
        return

    result = check_website(url)

    print("\n=== 檢查結果 ===")
    print("網站網址：", result["url"])
    print("網站狀態：", result["status"])
    print("HTTP 狀態碼：", result["status_code"])
    print("回應時間：", result["response_time_ms"], "ms")

    if result["error"]:
        print("錯誤訊息：", result["error"])


if __name__ == "__main__":
    main()
