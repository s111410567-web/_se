
/* 私人訊息已讀狀態 - 本機展示版本 */

const READ_STATUS_KEY = "chat-demo-read-status";

function getAllReadStatus() {
    try {
        return JSON.parse(
            localStorage.getItem(READ_STATUS_KEY) || "{}"
        ) || {};
    } catch (error) {
        console.error("讀取已讀狀態失敗：", error);
        return {};
    }
}

function saveReadStatus(data) {
    try {
        localStorage.setItem(
            READ_STATUS_KEY,
            JSON.stringify(data)
        );
        return true;
    } catch (error) {
        console.error("儲存已讀狀態失敗：", error);
        return false;
    }
}

// 記錄使用者已經讀到第幾則訊息
function markPrivateMessagesRead(username, friend) {
    const messages = getPrivateMessages(username, friend);
    const chatId = getPrivateChatId(username, friend);
    const data = getAllReadStatus();

    if (!data[chatId]) {
        data[chatId] = {};
    }

    data[chatId][username] = messages.length;

    return saveReadStatus(data);
}

// 取得對方尚未閱讀的私人訊息數量
function getUnreadPrivateCount(username, friend) {
    const messages = getPrivateMessages(username, friend);
    const chatId = getPrivateChatId(username, friend);
    const data = getAllReadStatus();

    const readPosition = data[chatId]?.[username] || 0;

    return messages.slice(readPosition).filter(
        message => message.author === friend
    ).length;
}

// 判斷自己最後一則傳出的訊息是否已讀
function areMyPrivateMessagesRead(username, friend) {
    const messages = getPrivateMessages(username, friend);
    const chatId = getPrivateChatId(username, friend);
    const data = getAllReadStatus();

    let lastSentIndex = -1;

    messages.forEach((message, index) => {
        if (message.author === username) {
            lastSentIndex = index;
        }
    });

    if (lastSentIndex === -1) {
        return false;
    }

    const friendReadPosition = data[chatId]?.[friend] || 0;

    return friendReadPosition > lastSentIndex;
}
