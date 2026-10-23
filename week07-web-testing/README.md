
# 第七週：網站應用程式測試

## 專案名稱
大學課程管理系統

## 專案介紹
使用 Python Flask 建立大學課程管理網站，
提供學生登入、課程查詢、選課與退選功能。

## 使用技術
- Python Flask
- HTML / CSS / JavaScript
- pytest
- Playwright
- Node.js

## 測試項目

### 1. 單元測試（Unit Testing）
使用 pytest 測試伺服器端功能。

測試內容：
- 學生登入驗證
- 課程查詢
- 學生選課
- 重複選課檢查
- 學生退選

### 2. 系統測試（System Testing）
使用 Flask Test Client 測試 Web API。

測試內容：
- POST /api/login
- GET /api/courses
- POST /api/enroll
- POST /api/drop
- GET /api/enrollments/<username>

### 3. E2E 測試
使用 Playwright 無頭瀏覽器模擬操作。

測試內容：
- 網站首頁顯示
- 學生登入成功
- 登入失敗
- 學生選課
- 學生退選
- 學生登出

## 安裝與執行

安裝 Python 套件：

    python -m pip install -r requirements.txt

啟動網站：

    python app.py

執行單元測試：

    python -m pytest tests/test_unit.py -v

執行 API 系統測試：

    python -m pytest tests/test_api.py -v

安裝 Playwright：

    npm install
    npx playwright install chromium

執行 E2E 測試：

    npm run test:e2e

注意：執行 E2E 測試前，
需要先啟動 Flask 網站。

## 測試案例數量
- 單元測試：10 個
- 系統測試：10 個
- E2E 測試：6 個
- 總計：26 個

## 測試狀態
測試程式碼已建立，尚待實際執行驗證。
