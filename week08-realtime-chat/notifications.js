
/* =========================================
   通知系統
   notifications.js
   本機展示版本
========================================= */

const NOTIFICATIONS_KEY = "chat-demo-notifications";

// 讀取通知資料
function getAllNotifications() {
    try {
        const saved = localStorage.getItem(NOTIFICATIONS_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return parsed;
            }
        }
    } catch (error) {
        console.error("讀取通知失敗：", error);
    }

    return {};
}

// 儲存通知資料
function saveNotifications(data) {
    try {
        localStorage.setItem(
            NOTIFICATIONS_KEY,
            JSON.stringify(data)
        );
        return true;
    } catch (error) {
        console.error("儲存通知失敗：", error);
        return false;
    }
}

// 新增通知
function addNotification(username, type, message) {
    const data = getAllNotifications();

    if (!Array.isArray(data[username])) {
        data[username] = [];
    }

    data[username].unshift({
        id: Date.now().toString() +
            Math.random().toString(36).slice(2, 8),
        type: type,
        message: message,
        read: false,
        time: new Date().toLocaleString("zh-TW")
    });

    return saveNotifications(data);
}

// 取得指定會員的通知
function getNotifications(username) {
    const data = getAllNotifications();

    return Array.isArray(data[username])
        ? [...data[username]]
        : [];
}

// 取得未讀通知數量
function getUnreadNotificationCount(username) {
    return getNotifications(username).filter(
        notification => !notification.read
    ).length;
}

// 將單一通知標記為已讀
function markNotificationRead(username, notificationId) {
    const data = getAllNotifications();

    if (!Array.isArray(data[username])) {
        return false;
    }

    const notification = data[username].find(
        item => item.id === notificationId
    );

    if (!notification) {
        return false;
    }

    notification.read = true;

    return saveNotifications(data);
}

// 將所有通知標記為已讀
function markAllNotificationsRead(username) {
    const data = getAllNotifications();

    if (!Array.isArray(data[username])) {
        return true;
    }

    data[username].forEach(notification => {
        notification.read = true;
    });

    return saveNotifications(data);
}

// 刪除單一通知
function deleteNotification(username, notificationId) {
    const data = getAllNotifications();

    if (!Array.isArray(data[username])) {
        return false;
    }

    data[username] = data[username].filter(
        item => item.id !== notificationId
    );

    return saveNotifications(data);
}

// 清空所有通知
function clearNotifications(username) {
    const data = getAllNotifications();

    data[username] = [];

    return saveNotifications(data);
}
