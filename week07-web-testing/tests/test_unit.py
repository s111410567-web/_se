
import pytest

from app import (
    validate_login,
    find_course,
    enroll_course,
    drop_course,
    enrollments
)


@pytest.fixture(autouse=True)
def reset_data():
    """每次測試前清空選課紀錄"""
    enrollments.clear()
    yield
    enrollments.clear()


# 測試 1：正確帳號密碼
def test_login_success():
    assert validate_login("student01", "123456") is True


# 測試 2：錯誤密碼
def test_login_wrong_password():
    assert validate_login("student01", "wrong") is False


# 測試 3：不存在的學生
def test_login_unknown_student():
    assert validate_login("unknown", "123456") is False


# 測試 4：查詢存在的課程
def test_find_course_success():
    course = find_course(1)
    assert course is not None
    assert course["name"] == "計算機結構"


# 測試 5：查詢不存在的課程
def test_find_course_not_found():
    assert find_course(999) is None


# 測試 6：正常選課
def test_enroll_success():
    success, message = enroll_course("student01", 1)

    assert success is True
    assert message == "選課成功"
    assert 1 in enrollments["student01"]


# 測試 7：不可重複選課
def test_enroll_duplicate():
    enroll_course("student01", 1)

    success, message = enroll_course("student01", 1)

    assert success is False
    assert message == "不可重複選課"


# 測試 8：選擇不存在的課程
def test_enroll_invalid_course():
    success, message = enroll_course("student01", 999)

    assert success is False
    assert message == "課程不存在"


# 測試 9：正常退選
def test_drop_success():
    enroll_course("student01", 1)

    success, message = drop_course("student01", 1)

    assert success is True
    assert message == "退選成功"
    assert 1 not in enrollments["student01"]


# 測試 10：退選未選修的課程
def test_drop_not_enrolled():
    success, message = drop_course("student01", 1)

    assert success is False
    assert message == "尚未選修此課程"
