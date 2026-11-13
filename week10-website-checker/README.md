
# Website Status Checker

第 10 週現代軟體工程作業：Python 網站狀態檢查套件。

## 專案介紹

Website Status Checker 是一個使用 Python 開發的網站狀態檢查工具。

使用者只需要輸入網站網址，程式就能檢查網站是否正常運作，並顯示 HTTP 狀態碼與回應時間。

本專案使用 Python 內建的 urllib 模組，不需要額外安裝網路請求套件。

## 主要功能

- 檢查網站是否可以正常連線
- 顯示 HTTP 狀態碼
- 計算網站回應時間（毫秒）
- 自動補上 HTTPS
- 處理 HTTP 404 等錯誤
- 處理連線失敗及逾時
- 使用 unittest 進行自動化測試

## 開發環境

- Python 3.9 以上
- Visual Studio Code
- Windows PowerShell
- urllib
- unittest

## 安裝方式

專案發布到 PyPI 後，可以使用以下指令安裝：

```bash
pip install website-status-checker-demo
```

注意：正式發布前，套件尚無法透過 PyPI 安裝。

## 使用方法

安裝套件後，在終端機執行：

```bash
website-checker
```

也可以直接執行原始程式：

```bash
python website_checker.py
```

輸入網站網址，例如：

```text
https://www.google.com
```

執行結果範例：

```text
=== Website Status Checker ===
請輸入網站網址：https://www.google.com

=== 檢查結果 ===
網站網址： https://www.google.com
網站狀態： 正常
HTTP 狀態碼： 200
回應時間： 533.99 ms
```

實際回應時間會依照網路環境而不同。

## 單元測試

本專案使用 Python 內建的 unittest 框架。

執行測試：

```bash
python -m unittest test_website_checker.py -v
```

目前包含四個測試：

1. HTTP 200 正常連線
2. HTTP 404 錯誤處理
3. 網站連線失敗
4. 自動補上 HTTPS

測試結果：

```text
Ran 4 tests

OK
```

## 專案結構

```text
week10-website-checker/
├── website_checker.py
├── test_website_checker.py
├── pyproject.toml
└── README.md
```

## 技術說明

- urllib.request：發送 HTTP 請求
- urllib.error：處理網路連線錯誤
- time.perf_counter：計算回應時間
- unittest：執行單元測試
- unittest.mock：模擬網站回應

## 專案目標

透過開發並發布 Python 套件，學習：

- Python 模組化程式設計
- HTTP 網路請求與錯誤處理
- 單元測試
- Python 套件打包
- PyPI 套件發布流程

## 課程資訊

- 課程：現代軟體工程
- 週次：第 10 週
- 作業：在公開套件庫發布一個套件
- 發布平台：PyPI
