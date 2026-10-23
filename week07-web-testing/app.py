
from flask import Flask, jsonify, request, render_template

app = Flask(__name__)

# 模擬學生資料
students = {
    "student01": {
        "password": "123456",
        "name": "測試學生"
    }
}

# 課程資料
courses = [
    {"id": 1, "name": "計算機結構", "credits": 3},
    {"id": 2, "name": "電路學", "credits": 3},
    {"id": 3, "name": "現代軟體工程", "credits": 3},
    {"id": 4, "name": "資訊系統管理", "credits": 3},
    {"id": 5, "name": "TCP 協定", "credits": 3}
]

# 學生選課紀錄
enrollments = {}


def validate_login(username, password):
    """驗證學生帳號密碼"""
    student = students.get(username)
    return student is not None and student["password"] == password


def find_course(course_id):
    """依照課程編號尋找課程"""
    return next(
        (course for course in courses if course["id"] == course_id),
        None
    )


def enroll_course(username, course_id):
    """學生選課"""
    if username not in students:
        return False, "學生不存在"

    if find_course(course_id) is None:
        return False, "課程不存在"

    selected = enrollments.setdefault(username, [])

    if course_id in selected:
        return False, "不可重複選課"

    selected.append(course_id)
    return True, "選課成功"


def drop_course(username, course_id):
    """學生退選"""
    selected = enrollments.get(username, [])

    if course_id not in selected:
        return False, "尚未選修此課程"

    selected.remove(course_id)
    return True, "退選成功"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if validate_login(username, password):
        return jsonify({
            "success": True,
            "message": "登入成功",
            "username": username
        })

    return jsonify({
        "success": False,
        "message": "帳號或密碼錯誤"
    }), 401


@app.route("/api/courses", methods=["GET"])
def get_courses():
    return jsonify(courses)


@app.route("/api/enroll", methods=["POST"])
def enroll():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    course_id = data.get("course_id")

    success, message = enroll_course(username, course_id)

    return jsonify({
        "success": success,
        "message": message
    }), 200 if success else 400


@app.route("/api/drop", methods=["POST"])
def drop():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    course_id = data.get("course_id")

    success, message = drop_course(username, course_id)

    return jsonify({
        "success": success,
        "message": message
    }), 200 if success else 400


@app.route("/api/enrollments/<username>", methods=["GET"])
def get_enrollments(username):
    if username not in students:
        return jsonify({"error": "學生不存在"}), 404

    selected_ids = enrollments.get(username, [])
    selected_courses = [
        course for course in courses
        if course["id"] in selected_ids
    ]

    return jsonify(selected_courses)


if __name__ == "__main__":
    app.run(debug=True)
