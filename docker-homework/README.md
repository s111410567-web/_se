# 第六週 Docker 使用作業

## 學生資料

- 姓名：禚鎮龍
- 學號：111410567
- 系級：資訊工程學系二年級
- 作業主題：Docker 微服務課程資料管理系統

---

## 一、專案介紹

本專案使用 Docker Compose 建立一個簡易的課程資料管理系統，並將不同功能拆分成三個獨立服務：

1. Nginx：作為 Web Server 與反向代理伺服器。
2. Flask：使用 Python 建立後端網頁系統。
3. PostgreSQL：負責儲存課程資料。

使用者進入網頁後，請求會先進入 Nginx，再由 Nginx 將請求轉送至 Flask。Flask 會連接 PostgreSQL 資料庫，讀取課程資料並顯示於網頁上。

---

## 二、系統架構

系統的資料傳遞流程如下：

瀏覽器 → Nginx → Flask → PostgreSQL

### 各服務功能

| 服務名稱 | 使用技術 | 功能 |
|---|---|---|
| nginx | Nginx | 接收瀏覽器請求並轉發給 Flask |
| web | Python、Flask、Gunicorn | 執行後端程式並產生網頁 |
| db | PostgreSQL | 儲存課程資料 |
| volume | Docker Volume | 保存資料庫內容 |

---

## 三、專案目錄

```text
docker-homework
├── app
│   ├── templates
│   │   └── index.html
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── nginx
│   └── nginx.conf
├── compose.yaml
└── README.md
```

### 檔案說明

- `app.py`：Flask 後端主程式。
- `index.html`：系統的網頁畫面。
- `requirements.txt`：Python 套件清單。
- `Dockerfile`：建立 Flask 容器映像檔。
- `nginx.conf`：Nginx 反向代理設定。
- `compose.yaml`：同時管理 Nginx、Flask 與 PostgreSQL。
- `README.md`：專案說明與 Docker 學習紀錄。

---

## 四、使用技術

- Docker
- Docker Compose
- Python
- Flask
- Gunicorn
- PostgreSQL
- Nginx
- HTML
- CSS

---

## 五、系統功能

本系統具備以下功能：

- 顯示學生姓名與學號。
- 顯示目前系統與資料庫連線狀態。
- 自動建立 PostgreSQL 課程資料表。
- 第一次執行時自動加入課程資料。
- 從 PostgreSQL 讀取並顯示課程資料。
- 使用 Nginx 作為反向代理。
- 使用 Docker Compose 同時啟動三個服務。
- 使用 Docker Volume 保存資料庫資料。
- 提供 `/health` 健康檢查網址。

---

## 六、預設課程資料

系統啟動後會自動加入以下課程：

| 課程代碼 | 課程名稱 | 課程類型 |
|---|---|---|
| CS201 | 計算機結構 | 專業必修 |
| CS202 | 資訊系統管理 | 專業必修 |
| EE201 | 電路學 | 專業必修 |
| CS203 | TCP 協定 | 專業選修 |
| CS204 | 現代軟體工程 | 專業選修 |

---

## 七、執行方式

### 1. 啟動 Docker Desktop

執行專案前，需要先確認電腦已經安裝並啟動 Docker Desktop。

### 2. 進入專案資料夾

在 VS Code 終端機輸入：

```powershell
cd .\_se\docker-homework
```

如果終端機原本已經位於 `_se` 資料夾，則輸入：

```powershell
cd .\docker-homework
```

### 3. 建立並啟動所有容器

```powershell
docker compose up --build -d
```

參數說明：

- `up`：建立並啟動服務。
- `--build`：重新建立 Flask 映像檔。
- `-d`：讓容器在背景執行。

### 4. 查看容器狀態

```powershell
docker compose ps
```

正常情況下可以看到以下三個服務正在執行：

- db
- web
- nginx

### 5. 開啟系統網頁

使用瀏覽器進入：

http://localhost:8080

### 6. 測試健康檢查

使用瀏覽器進入：

http://localhost:8080/health

正常情況下會顯示 JSON 格式的系統狀態。

### 7. 查看執行紀錄

```powershell
docker compose logs
```

持續查看最新紀錄：

```powershell
docker compose logs -f
```

按下 `Ctrl + C` 可以停止查看紀錄，但不會關閉容器。

### 8. 停止並移除容器

```powershell
docker compose down
```

### 9. 停止容器並刪除資料庫資料

```powershell
docker compose down -v
```

注意：加入 `-v` 會刪除 PostgreSQL Volume，原本的資料庫資料也會被移除。

---

## 八、Docker 學習紀錄

### 1. Docker 是什麼

Docker 是一種容器化工具，可以將程式、套件、執行環境與設定檔包裝在一起。這樣可以減少不同電腦環境造成的執行問題。

### 2. Image 是什麼

Image 中文稱為映像檔，是建立 Container 的範本。映像檔會包含程式執行需要的作業環境、套件與檔案。

本專案使用的映像檔包含：

- `python:3.13-slim`
- `postgres:17-alpine`
- `nginx:alpine`

### 3. Container 是什麼

Container 中文稱為容器，是由 Image 建立出來的執行環境。每個容器都可以獨立執行自己的服務。

本專案包含三個主要容器：

- Nginx 容器
- Flask 容器
- PostgreSQL 容器

### 4. Dockerfile 是什麼

Dockerfile 是建立 Docker Image 的設定檔。本專案的 Dockerfile 會執行以下工作：

1. 使用 Python 映像檔。
2. 建立 `/app` 工作目錄。
3. 複製 `requirements.txt`。
4. 安裝 Flask、psycopg2 與 Gunicorn。
5. 複製程式檔案。
6. 使用 Gunicorn 啟動 Flask。

### 5. Docker Compose 是什麼

Docker Compose 可以透過一個 YAML 檔案，同時設定與管理多個容器。

本專案使用 `compose.yaml` 同時管理：

- Nginx
- Flask
- PostgreSQL
- PostgreSQL Volume
- 容器之間的連線關係

### 6. Volume 是什麼

Container 被刪除後，容器內的資料通常也會消失。Docker Volume 可以將重要資料保存在容器外部。

本專案使用 `postgres_data` 保存 PostgreSQL 資料，因此重新啟動或重新建立容器後，資料仍然可以保留。

### 7. Port 是什麼

Port Mapping 可以將電腦的連接埠對應到容器的連接埠。

本專案的設定為：

```text
8080:80
```

代表：

- 電腦使用 Port 8080。
- Nginx 容器使用 Port 80。
- 使用者透過 `http://localhost:8080` 開啟系統。

### 8. Reverse Proxy 是什麼

Reverse Proxy 中文稱為反向代理。瀏覽器不會直接連接 Flask，而是先連接 Nginx，再由 Nginx 將請求轉送至 Flask。

這種架構可以集中處理網頁請求，也方便未來加入 HTTPS、負載平衡與其他服務。

### 9. Health Check 是什麼

Health Check 可以檢查服務是否已經準備完成。

本專案會使用 `pg_isready` 檢查 PostgreSQL。只有資料庫準備完成後，Flask 服務才會開始執行。

---

## 九、容器之間的連線

Docker Compose 會自動為專案建立內部網路，各個服務可以直接使用服務名稱互相連線。

例如 Flask 連接資料庫時，主機名稱不是 `localhost`，而是：

```text
db
```

Nginx 連接 Flask 時，使用：

```text
web:5000
```

其中：

- `db` 是 PostgreSQL 的服務名稱。
- `web` 是 Flask 的服務名稱。
- `5000` 是 Flask 服務使用的連接埠。

---

## 十、操作紀錄

1. 在 VS Code 建立 `docker-homework` 專案資料夾。
2. 建立 Flask 後端程式。
3. 建立 HTML 與 CSS 網頁。
4. 建立 Python 套件清單。
5. 使用 Dockerfile 建立 Flask 映像檔。
6. 建立 PostgreSQL 資料庫服務。
7. 建立 Nginx 反向代理服務。
8. 使用 Docker Compose 整合所有服務。
9. 啟動容器並測試系統網頁。
10. 將作業提交至 GitHub。

---

## 十一、執行結果

完成啟動後，系統可以透過以下網址開啟：

http://localhost:8080

網頁會顯示：

- 學生姓名
- 學號
- 系統服務介紹
- PostgreSQL 連線狀態
- 課程資料表

---

## 十二、心得

透過本次作業，我了解 Docker Image、Container、Dockerfile、Docker Compose、Volume、Port Mapping 與反向代理的基本概念。

原本需要分別安裝及設定 Python、PostgreSQL 與 Nginx，使用 Docker 後，可以透過 `docker compose up` 一次建立並啟動所有服務。Docker 也能讓不同電腦使用相同的執行環境，減少環境設定不同而無法執行程式的問題。

這次作業讓我實際完成一個由 Nginx、Flask 與 PostgreSQL 組成的簡易微服務系統，也更了解不同服務之間如何透過 Docker 網路互相連線。