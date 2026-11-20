
const FRIENDS_KEY = "chat-demo-friends";
const USERS_KEY = "chat-demo-users";

// 讀取好友資料
function getFriendData() {
    try {
        const saved = localStorage.getItem(FRIENDS_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed && typeof parsed === "object") {
                return parsed;
            }
        }
    } catch (error) {
        console.error("讀取好友資料失敗：", error);
    }

    return {};
}

// 儲存好友資料
function saveFriendData(data) {
    try {
        localStorage.setItem(
            FRIENDS_KEY,
            JSON.stringify(data)
        );

        return true;
    } catch (error) {
        console.error("儲存好友資料失敗：", error);
        return false;
    }
}

// 確保會員有好友資料
function ensureFriendAccount(data, username) {
    if (!data[username]) {
        data[username] = {
            friends: [],
            requests: []
        };
    }

    if (!Array.isArray(data[username].friends)) {
        data[username].friends = [];
    }

    if (!Array.isArray(data[username].requests)) {
        data[username].requests = [];
    }

    return data[username];
}

// 搜尋會員是否存在
function searchUser(username) {
    try {
        const users = JSON.parse(
            localStorage.getItem(USERS_KEY) || "{}"
        );

        return Object.prototype.hasOwnProperty.call(
            users,
            username
        );
    } catch (error) {
        console.error("搜尋會員失敗：", error);
        return false;
    }
}

// 發送好友邀請
function sendFriendRequest(sender, receiver) {
    sender = sender.trim();
    receiver = receiver.trim();

    if (!receiver) {
        return "請輸入會員帳號";
    }

    if (sender === receiver) {
        return "不能加自己為好友";
    }

    if (!searchUser(receiver)) {
        return "找不到這個會員";
    }

    const data = getFriendData();

    const senderData = ensureFriendAccount(data, sender);
    const receiverData = ensureFriendAccount(data, receiver);

    if (senderData.friends.includes(receiver)) {
        return "你們已經是好友";
    }

    if (receiverData.requests.includes(sender)) {
        return "已經發送過好友邀請";
    }

    if (senderData.requests.includes(receiver)) {
        return "對方已經邀請你，請先處理邀請";
    }

    receiverData.requests.push(sender);

    if (!saveFriendData(data)) {
        return "好友邀請儲存失敗";
    }

    return "好友邀請已送出";
}

// 接受好友邀請
function acceptFriendRequest(username, sender) {
    const data = getFriendData();

    const userData = ensureFriendAccount(data, username);
    const senderData = ensureFriendAccount(data, sender);

    if (!userData.requests.includes(sender)) {
        return "找不到好友邀請";
    }

    userData.requests = userData.requests.filter(
        name => name !== sender
    );

    if (!userData.friends.includes(sender)) {
        userData.friends.push(sender);
    }

    if (!senderData.friends.includes(username)) {
        senderData.friends.push(username);
    }

    if (!saveFriendData(data)) {
        return "好友資料儲存失敗";
    }

    return "已接受好友邀請";
}

// 拒絕好友邀請
function rejectFriendRequest(username, sender) {
    const data = getFriendData();

    const userData = ensureFriendAccount(data, username);

    if (!userData.requests.includes(sender)) {
        return "找不到好友邀請";
    }

    userData.requests = userData.requests.filter(
        name => name !== sender
    );

    if (!saveFriendData(data)) {
        return "好友資料儲存失敗";
    }

    return "已拒絕好友邀請";
}

// 取得好友列表
function getFriends(username) {
    const data = getFriendData();
    const userData = ensureFriendAccount(data, username);

    return [...userData.friends];
}

// 取得收到的好友邀請
function getFriendRequests(username) {
    const data = getFriendData();
    const userData = ensureFriendAccount(data, username);

    return [...userData.requests];
}

// 刪除好友
function removeFriend(username, friendName) {
    const data = getFriendData();

    const userData = ensureFriendAccount(data, username);
    const friendData = ensureFriendAccount(data, friendName);

    if (!userData.friends.includes(friendName)) {
        return "對方不是你的好友";
    }

    userData.friends = userData.friends.filter(
        name => name !== friendName
    );

    friendData.friends = friendData.friends.filter(
        name => name !== username
    );

    if (!saveFriendData(data)) {
        return "刪除好友失敗";
    }

    return "已刪除好友";
}
