/* =========================================
   私人訊息已讀狀態
   Firebase 雲端即時同步版本
========================================= */

import { auth, db } from "./firebase.js";

import {
    getPrivateChatId,
    getPrivateMessages
} from "./private-chat.js";

import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
    runTransaction
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

let readStatusCache = new Map();
let unreadMessageCache = new Map();

let readListeners = [];
let listenerGeneration = 0;

// 比較 Firebase 伺服器時間
function compareTime(a, b) {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;

    return (
        a.seconds - b.seconds ||
        a.nanoseconds - b.nanoseconds
    );
}

// 停止已讀監聽
function stopReadStatusListener() {
    listenerGeneration++;

    readListeners.forEach(unsubscribe => {
        unsubscribe();
    });

    readListeners = [];
    readStatusCache.clear();
    unreadMessageCache.clear();
}

// 啟動已讀與未讀監聽
async function startReadStatusListener(
    username,
    friends,
    onChange,
    onError = console.error
) {
    stopReadStatusListener();

    const generation = listenerGeneration;

    await auth.authStateReady();

    const user = auth.currentUser;

    if (
        !user ||
        user.email !== username + "@chat.example.com"
    ) {
        return;
    }

    if (generation !== listenerGeneration) {
        return;
    }

    for (const friend of friends) {
        const chatId = getPrivateChatId(
            username,
            friend
        );

        const statusRef = collection(
            db,
            "privateChats",
            chatId,
            "readStatus"
        );

        const unsubscribeStatus = onSnapshot(
            statusRef,

            snapshot => {
                if (generation !== listenerGeneration) {
                    return;
                }

                const statuses = {};

                snapshot.docs.forEach(statusDoc => {
                    statuses[statusDoc.id] =
                        statusDoc.data();
                });

                readStatusCache.set(
                    chatId,
                    statuses
                );

                onChange?.();
            },

            error => {
                if (generation !== listenerGeneration) {
                    return;
                }

                readStatusCache.delete(chatId);
                onChange?.();
                onError(error);
            }
        );

        readListeners.push(unsubscribeStatus);

        const messagesQuery = query(
            collection(
                db,
                "privateChats",
                chatId,
                "messages"
            ),

            where("receiverUid", "==", user.uid)
        );

        const unsubscribeMessages = onSnapshot(
            messagesQuery,

            snapshot => {
                if (generation !== listenerGeneration) {
                    return;
                }

                const messages = snapshot.docs
                    .map(messageDoc => ({
                        id: messageDoc.id,
                        ...messageDoc.data()
                    }))
                    .filter(message => message.createdAt);

                unreadMessageCache.set(
                    chatId,
                    messages
                );

                onChange?.();
            },

            error => {
                if (generation !== listenerGeneration) {
                    return;
                }

                unreadMessageCache.delete(chatId);
                onChange?.();
                onError(error);
            }
        );

        readListeners.push(unsubscribeMessages);
    }
}

// 將私人訊息標記為已讀
async function markPrivateMessagesRead(
    username,
    friend,
    isChatActive = () => false
) {
    if (document.visibilityState !== "visible") {
        return false;
    }

    try {
        await auth.authStateReady();

        const user = auth.currentUser;

        if (
            !user ||
            user.email !== username + "@chat.example.com"
        ) {
            return false;
        }

        if (
            !isChatActive() ||
            document.visibilityState !== "visible"
        ) {
            return false;
        }

        const messages = getPrivateMessages(
            username,
            friend
        ).filter(message =>
            message.receiverUid === user.uid &&
            message.createdAt &&
            !message.hasPendingWrites
        );

        if (!messages.length) {
            return false;
        }

        const latest = messages.reduce(
            (a, b) =>
                compareTime(a.createdAt, b.createdAt) >= 0
                    ? a
                    : b
        );

        const chatId = getPrivateChatId(
            username,
            friend
        );

        const statusRef = doc(
            db,
            "privateChats",
            chatId,
            "readStatus",
            username
        );

        return await runTransaction(
            db,

            async transaction => {
                const snapshot =
                    await transaction.get(statusRef);

                if (
                    !isChatActive() ||
                    document.visibilityState !== "visible"
                ) {
                    return false;
                }

                if (snapshot.exists()) {
                    const previous =
                        snapshot.data().lastReadAt;

                    if (
                        compareTime(
                            previous,
                            latest.createdAt
                        ) >= 0
                    ) {
                        return true;
                    }
                }

                transaction.set(statusRef, {
                    username: username,
                    uid: user.uid,
                    lastReadAt: latest.createdAt,
                    lastReadMessageId: latest.id
                });

                return true;
            }
        );

    } catch (error) {
        console.error("更新已讀狀態失敗：", error);
        return false;
    }
}
// 計算未讀私人訊息數量
function getUnreadPrivateCount(username, friend) {
    const chatId = getPrivateChatId(
        username,
        friend
    );

    const statuses =
        readStatusCache.get(chatId) || {};

    const lastReadAt =
        statuses[username]?.lastReadAt || null;

    const messages =
        unreadMessageCache.get(chatId) || [];

    return messages.filter(message =>
        compareTime(
            message.createdAt,
            lastReadAt
        ) > 0
    ).length;
}

// 判斷對方是否已讀指定的私人訊息
function areMyPrivateMessagesRead(
    username,
    friend,
    message
) {
    const chatId = getPrivateChatId(
        username,
        friend
    );

    const statuses =
        readStatusCache.get(chatId) || {};

    const friendReadAt =
        statuses[friend]?.lastReadAt || null;

    if (
        !message ||
        message.author !== username ||
        !friendReadAt ||
        !message.createdAt ||
        message.hasPendingWrites
    ) {
        return false;
    }

    return compareTime(
        friendReadAt,
        message.createdAt
    ) >= 0;
}
// 匯出功能
export {
    markPrivateMessagesRead,
    getUnreadPrivateCount,
    areMyPrivateMessagesRead,
    startReadStatusListener,
    stopReadStatusListener
};