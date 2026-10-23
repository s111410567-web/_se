
import pytest

from app import app, enrollments


@pytest.fixture
def client():
    """建立 Flask API 測試客戶端"""
    app.config["TESTING"] = True
    enrollments.clear()

    with app.test_client() as test_client:
        yield test_client

    enrollments.clear()


# 測試 1：登入成功
def test_api_login_success(client):
    response = client.post("/api/login", json={
        "username": "student01",
        "password": "123456"
    })

    assert response.status_code == 200
    assert response.json["success"] is True
    assert response.json["message"] == "登入成功"


# 測試 2：登入失敗
def test_api_login_failure(client):
    response = client.post("/api/login", json={
        "username": "student01",
        "password": "wrong"
    })

    assert response.status_code == 401
    assert response.json["success"] is False


# 測試 3：取得課程列表
def test_api_get_courses(client):
    response = client.get("/api/courses")

    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 5


# 測試 4：正常選課
def test_api_enroll_success(client):
    response = client.post("/api/enroll", json={
        "username": "student01",
        "course_id": 1
    })

    assert response.status_code == 200
    assert response.json["success"] is True


# 測試 5：重複選課
def test_api_enroll_duplicate(client):
    client.post("/api/enroll", json={
        "username": "student01",
        "course_id": 1
    })

    response = client.post("/api/enroll", json={
        "username": "student01",
        "course_id": 1
    })

    assert response.status_code == 400
    assert response.json["message"] == "不可重複選課"


# 測試 6：不存在的課程
def test_api_enroll_invalid_course(client):
    response = client.post("/api/enroll", json={
        "username": "student01",
        "course_id": 999
    })

    assert response.status_code == 400
    assert response.json["message"] == "課程不存在"


# 測試 7：查詢已選課程
def test_api_get_enrollments(client):
    client.post("/api/enroll", json={
        "username": "student01",
        "course_id": 1
    })

    response = client.get("/api/enrollments/student01")

    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["name"] == "計算機結構"


# 測試 8：正常退選
def test_api_drop_success(client):
    client.post("/api/enroll", json={
        "username": "student01",
        "course_id": 1
    })

    response = client.post("/api/drop", json={
        "username": "student01",
        "course_id": 1
    })

    assert response.status_code == 200
    assert response.json["success"] is True


# 測試 9：退選未選修課程
def test_api_drop_not_enrolled(client):
    response = client.post("/api/drop", json={
        "username": "student01",
        "course_id": 1
    })

    assert response.status_code == 400
    assert response.json["success"] is False


# 測試 10：查詢不存在的學生
def test_api_unknown_student(client):
    response = client.get("/api/enrollments/unknown")

    assert response.status_code == 404
    assert response.json["error"] == "學生不存在"
