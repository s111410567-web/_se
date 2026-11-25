/* =========================================
   私人聊天資料管理
   Firebase 雲端即時同步版本
========================================= */

import { auth, db } from "./firebase.js";

import { getFriends } from "./friends.js";

import {
    collection,
    doc,
    getDoc,
    writeBatch,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

let privateMessageCache = new Map();
let unsubscribePrivateChat = null;
let listenerGeneration = 0;

// 產生共用聊天室 ID
function getPrivateChatId(user1, user2) {
    return [user1, user2].sort().join(":");
}

// 取得目前登入會員
async function requireUser(username) {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
        throw new Error("請先登入");
    }

    if (user.email !== username + "@chat.example.com") {
        throw new Error("登入身分不符");
    }

    return user;
}

// 取得私人聊天紀錄
function getPrivateMessages(user1, user2) {
    const chatId = getPrivateChatId(user1, user2);

    return [
        ...(privateMessageCache.get(chatId) || [])
    ];
}

// 停止私人聊天監聽
function stopPrivateChatListener() {
    listenerGeneration++;

    if (unsubscribePrivateChat) {
        unsubscribePrivateChat();
        unsubscribePrivateChat = null;
    }

    privateMessageCache.clear();
}

// 啟動私人聊天即時監聽
async function startPrivateChatListener(
    user1,
    user2,
    onChange,
    onError = console.error
) {
    stopPrivateChatListener();

    const generation = listenerGeneration;

    await requireUser(user1);

    if (generation !== listenerGeneration) {
        return;
    }

    const chatId = getPrivateChatId(user1, user2);

    const messagesRef = collection(
        db,
        "privateChats",
        chatId,
        "messages"
    );

    const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc")
    );

    unsubscribePrivateChat = onSnapshot(
    messagesQuery,

    { includeMetadataChanges: true },

    (snapshot) => {
            if (generation !== listenerGeneration) {
                return;
            }

            const messages = snapshot.docs.map(
                (messageDoc) => {
                    const data = messageDoc.data();

                    const timestamp =
                        data.createdAt?.toMillis()
                        ?? data.timestamp
                        ?? Date.now();

                    return {
    id: messageDoc.id,
    author: data.author,
    text: data.text,
    senderUid: data.senderUid,
    receiverUid: data.receiverUid,
    createdAt: data.createdAt ?? null,
    hasPendingWrites: messageDoc.metadata.hasPendingWrites,

                        time: new Date(timestamp)
                            .toLocaleTimeString("zh-TW", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                            }),

                        timestamp: timestamp
                    };
                }
            );

            privateMessageCache.set(
                chatId,
                messages
            );

            if (typeof onChange === "function") {
                onChange();
            }
        },

        (error) => {
            if (generation !== listenerGeneration) {
                return;
            }

            privateMessageCache.delete(chatId);

            if (typeof onChange === "function") {
                onChange();
            }

            onError(error);
        }
    );
}

// 傳送私人訊息
async function sendPrivateMessage(
    sender,
    receiver,
    text
) {
    const messageText = String(text).trim();

    if (!messageText) {
        return false;
    }

    if (messageText.length > 2000) {
        return false;
    }

    try {
        const user = await requireUser(sender);

        // 必須是好友才能聊天
        if (!getFriends(sender).includes(receiver)) {
            console.warn("對方不是好友");
            return false;
        }

        const receiverSnapshot = await getDoc(
            doc(db, "users", receiver)
        );

        if (!receiverSnapshot.exists()) {
            return false;
        }

        const receiverUid =
            receiverSnapshot.data().uid;

        const chatId = getPrivateChatId(
            sender,
            receiver
        );

        // 建立私人訊息文件
        const messageRef = doc(
            collection(
                db,
                "privateChats",
                chatId,
                "messages"
            )
        );

        // 建立通知文件
        const notificationRef = doc(
            db,
            "users",
            receiver,
            "notifications",
            "private_message_" + messageRef.id
        );

        // 建立 Firebase 批次寫入
        const batch = writeBatch(db);

        // 寫入私人訊息
        batch.set(messageRef, {
            author: sender,
            receiver: receiver,
            senderUid: user.uid,
            receiverUid: receiverUid,
            text: messageText,
            timestamp: Date.now(),
            createdAt: serverTimestamp()
        });

        // 寫入接收者的通知
        batch.set(notificationRef, {
            type: "private_message",
            message: "💬 " + sender + " 傳送了一則私人訊息給你",
            sender: sender,
            senderUid: user.uid,
            receiverUid: receiverUid,
            sourceId: chatId,
            messageId: messageRef.id,
            read: false,
            createdAt: serverTimestamp()
        });

        // 同時提交訊息與通知
        await batch.commit();

        return true;

    } catch (error) {
        console.error(
            "傳送私人訊息失敗：",
            error
        );

        return false;
    }
}

// 匯出功能
export {
    getPrivateChatId,
    getPrivateMessages,
    sendPrivateMessage,
    startPrivateChatListener,
    stopPrivateChatListener
};