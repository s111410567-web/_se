import os
import time

import psycopg2
from flask import Flask, jsonify, render_template

app = Flask(__name__)


def get_database_connection():
    """連接 PostgreSQL，失敗時等待後重試。"""
    last_error = None

    for attempt in range(10):
        try:
            return psycopg2.connect(
                host=os.getenv("DB_HOST", "db"),
                port=os.getenv("DB_PORT", "5432"),
                database=os.getenv("DB_NAME", "course_db"),
                user=os.getenv("DB_USER", "student"),
                password=os.getenv("DB_PASSWORD", "docker123")
            )
        except psycopg2.OperationalError as error:
            last_error = error
            print(f"資料庫尚未準備完成，第 {attempt + 1} 次重新連線...")
            time.sleep(2)

    raise last_error


def initialize_database():
    """建立課程資料表並加入預設資料。"""
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            course_code VARCHAR(20) UNIQUE NOT NULL,
            course_name VARCHAR(100) NOT NULL,
            teacher VARCHAR(50) NOT NULL,
            credits INTEGER NOT NULL
        );
    """)

    default_courses = [
        ("CS201", "計算機結構", "王老師", 3),
        ("CS202", "資訊系統管理", "李老師", 3),
        ("EE201", "電路學", "陳老師", 3),
        ("CS203", "TCP 協定", "林老師", 3),
        ("CS204", "現代軟體工程", "張老師", 3)
    ]

    for course in default_courses:
        cursor.execute("""
            INSERT INTO courses (
                course_code,
                course_name,
                teacher,
                credits
            )
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (course_code) DO NOTHING;
        """, course)

    connection.commit()
    cursor.close()
    connection.close()


@app.route("/")
def home():
    """顯示系統首頁及資料庫中的課程。"""
    try:
        initialize_database()

        connection = get_database_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT course_code, course_name, teacher, credits
            FROM courses
            ORDER BY course_code;
        """)

        courses = cursor.fetchall()

        cursor.close()
        connection.close()

        return render_template(
            "index.html",
            student_name="禚鎮龍",
            student_id="111410567",
            courses=courses,
            database_status="PostgreSQL 連線成功"
        )

    except Exception as error:
        return render_template(
            "index.html",
            student_name="禚鎮龍",
            student_id="111410567",
            courses=[],
            database_status=f"資料庫連線失敗：{error}"
        )


@app.route("/health")
def health():
    """供 Docker 或管理者確認服務狀態。"""
    return jsonify({
        "status": "healthy",
        "service": "course-web-service"
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )