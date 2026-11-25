/* =========================================
   公共聊天室資料管理
   Firebase 雲端即時同步版本
========================================= */

import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

let publicMessageCache = new Map();
let unsubscribePublicChat = null;
let listenerGeneration = 0;

// 取得指定頻道的訊息
function getPublicMessages(channel) {
    return [
        ...(publicMessageCache.get(channel) || [])
    ];
}

// 停止公共聊天室監聽
function stopPublicChatListener() {
    listenerGeneration++;

    if (unsubscribePublicChat) {
        unsubscribePublicChat();
        unsubscribePublicChat = null;
    }

    publicMessageCache.clear();
}

// 啟動公共聊天室即時監聽
async function startPublicChatListener(
    channel,
    onChange,
    onError = console.error
) {
    stopPublicChatListener();

    const generation = listenerGeneration;

    await auth.authStateReady();

    if (!auth.currentUser) {
        throw new Error("請先登入");
    }

    if (generation !== listenerGeneration) {
        return;
    }

    const messagesRef = collection(
        db,
        "publicChats",
        channel,
        "messages"
    );

    const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc")
    );

    unsubscribePublicChat = onSnapshot(
        messagesQuery,

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

            publicMessageCache.set(
                channel,
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

            publicMessageCache.delete(channel);

            if (typeof onChange === "function") {
                onChange();
            }

            onError(error);
        }
    );
}

// 傳送公共聊天室訊息
async function sendPublicMessage(
    channel,
    username,
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
        await auth.authStateReady();

        const user = auth.currentUser;

        if (!user) {
            throw new Error("請先登入");
        }

        if (
            user.email !==
            username + "@chat.example.com"
        ) {
            throw new Error("登入身分不符");
        }

        await addDoc(
            collection(
                db,
                "publicChats",
                channel,
                "messages"
            ),

            {
                author: username,
                senderUid: user.uid,
                text: messageText,
                timestamp: Date.now(),
                createdAt: serverTimestamp()
            }
        );

        return true;

    } catch (error) {
        console.error(
            "公共訊息傳送失敗：",
            error
        );

        return false;
    }
}

// 匯出功能
export {
    getPublicMessages,
    sendPublicMessage,
    startPublicChatListener,
    stopPublicChatListener
};