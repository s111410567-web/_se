
/* =========================================
   私人聊天資料管理
   本機示範版本
========================================= */

const PRIVATE_CHAT_KEY = "chat-demo-private-messages";

// 產生兩個會員共用的聊天室 ID
function getPrivateChatId(user1, user2) {
    return JSON.stringify(
        [user1, user2].sort()
    );
}

// 讀取所有私人聊天紀錄
function getAllPrivateMessages() {
    try {
        const saved = localStorage.getItem(PRIVATE_CHAT_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        }
    } catch (error) {
        console.error("讀取私人訊息失敗：", error);
    }

    return {};
}

// 取得指定兩人的聊天紀錄
function getPrivateMessages(user1, user2) {
    const data = getAllPrivateMessages();
    const chatId = getPrivateChatId(user1, user2);

    return Array.isArray(data[chatId])
        ? [...data[chatId]]
        : [];
}

// 儲存私人訊息
function sendPrivateMessage(sender, receiver, text) {
    const messageText = text.trim();

    if (!messageText) {
        return false;
    }

    // 必須是好友才能聊天
    if (!getFriends(sender).includes(receiver)) {
        console.warn("對方不是好友，無法傳送私人訊息");
        return false;
    }

    const data = getAllPrivateMessages();
    const chatId = getPrivateChatId(sender, receiver);

    if (!Array.isArray(data[chatId])) {
        data[chatId] = [];
    }

    const message = {
        author: sender,
        text: messageText,
        time: new Date().toLocaleTimeString("zh-TW", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }),
        timestamp: Date.now()
    };

    data[chatId].push(message);

    try {
        localStorage.setItem(
            PRIVATE_CHAT_KEY,
            JSON.stringify(data)
        );

        return true;
    } catch (error) {
        console.error("儲存私人訊息失敗：", error);
        return false;
    }
}
