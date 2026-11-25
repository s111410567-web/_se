/* =========================================
   通知系統
   Firebase 雲端即時同步版本
========================================= */

import { auth, db } from "./firebase.js";

import {
    collection,
    doc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    deleteDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

let notificationCache = [];
let unsubscribeNotifications = null;
let listenerGeneration = 0;
let activeUsername = null;

// 確認登入身分
async function requireUser(username) {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (
        !user ||
        user.email !== username + "@chat.example.com"
    ) {
        throw new Error("登入身分不符");
    }

    return user;
}

// 停止通知監聽
function stopNotificationListener() {
    listenerGeneration++;

    if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
    }

    notificationCache = [];
    activeUsername = null;
}

// 啟動通知即時監聽
async function startNotificationListener(
    username,
    onChange,
    onError = console.error
) {
    stopNotificationListener();

    const generation = listenerGeneration;

    await requireUser(username);

    if (generation !== listenerGeneration) {
        return;
    }

    activeUsername = username;

    const notificationsQuery = query(
        collection(
            db,
            "users",
            username,
            "notifications"
        ),
        orderBy("createdAt", "desc")
    );

    unsubscribeNotifications = onSnapshot(
        notificationsQuery,

        snapshot => {
            if (generation !== listenerGeneration) {
                return;
            }

            notificationCache = snapshot.docs.map(
                notificationDoc => {
                    const data = notificationDoc.data();

                    return {
                        id: notificationDoc.id,
                        type: data.type,
                        message: data.message,
                        read: data.read === true,

                        time: data.createdAt
                            ? data.createdAt
                                .toDate()
                                .toLocaleString("zh-TW")
                            : "同步中..."
                    };
                }
            );

            onChange?.();
        },

        error => {
            if (generation !== listenerGeneration) {
                return;
            }

            notificationCache = [];

            onChange?.();
            onError(error);
        }
    );
}

// 取得指定會員的通知
function getNotifications(username) {
    if (username !== activeUsername) {
        return [];
    }

    return [...notificationCache];
}

// 取得未讀通知數量
function getUnreadNotificationCount(username) {
    return getNotifications(username).filter(
        notification => !notification.read
    ).length;
}

// 將單一通知標記為已讀
async function markNotificationRead(
    username,
    notificationId
) {
    try {
        await requireUser(username);

        await updateDoc(
            doc(
                db,
                "users",
                username,
                "notifications",
                notificationId
            ),
            {
                read: true
            }
        );

        return true;

    } catch (error) {
        console.error("更新通知失敗：", error);
        return false;
    }
}

// 將所有通知標記為已讀
async function markAllNotificationsRead(username) {
    try {
        await requireUser(username);

        const notifications =
            getNotifications(username).filter(
                notification => !notification.read
            );

        for (
            let i = 0;
            i < notifications.length;
            i += 400
        ) {
            const batch = writeBatch(db);

            notifications
                .slice(i, i + 400)
                .forEach(notification => {
                    batch.update(
                        doc(
                            db,
                            "users",
                            username,
                            "notifications",
                            notification.id
                        ),
                        {
                            read: true
                        }
                    );
                });

            await batch.commit();
        }

        return true;

    } catch (error) {
        console.error("全部標記已讀失敗：", error);
        return false;
    }
}

// 刪除單一通知
async function deleteNotification(
    username,
    notificationId
) {
    try {
        await requireUser(username);

        await deleteDoc(
            doc(
                db,
                "users",
                username,
                "notifications",
                notificationId
            )
        );

        return true;

    } catch (error) {
        console.error("刪除通知失敗：", error);
        return false;
    }
}

// 清空所有通知
async function clearNotifications(username) {
    try {
        await requireUser(username);

        const notifications =
            getNotifications(username);

        for (
            let i = 0;
            i < notifications.length;
            i += 400
        ) {
            const batch = writeBatch(db);

            notifications
                .slice(i, i + 400)
                .forEach(notification => {
                    batch.delete(
                        doc(
                            db,
                            "users",
                            username,
                            "notifications",
                            notification.id
                        )
                    );
                });

            await batch.commit();
        }

        return true;

    } catch (error) {
        console.error("清空通知失敗：", error);
        return false;
    }
}

// 匯出功能
export {
    startNotificationListener,
    stopNotificationListener,
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications
};