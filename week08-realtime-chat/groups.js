
/* =========================================
   群組聊天資料管理
   groups.js
   本機展示版本
========================================= */

const GROUPS_KEY = "chat-demo-groups";

// 讀取所有群組
function getAllGroups() {
    try {
        const saved = localStorage.getItem(GROUPS_KEY);

        if (!saved) {
            return {};
        }

        const parsed = JSON.parse(saved);

        if (
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed)
        ) {
            return parsed;
        }
    } catch (error) {
        console.error("讀取群組失敗：", error);
    }

    return {};
}

// 儲存群組
function saveGroups(groups) {
    try {
        localStorage.setItem(
            GROUPS_KEY,
            JSON.stringify(groups)
        );

        return true;
    } catch (error) {
        console.error("儲存群組失敗：", error);
        return false;
    }
}

// 建立群組
function createGroup(owner, groupName) {
    const name = groupName.trim();

    if (!name) {
        return {
            success: false,
            message: "請輸入群組名稱"
        };
    }

    if (name.length > 30) {
        return {
            success: false,
            message: "群組名稱不能超過30個字"
        };
    }

    const groups = getAllGroups();

    const groupId =
        "group-" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 8);

    groups[groupId] = {
        id: groupId,
        name: name,
        owner: owner,
        members: [owner],
        messages: [],
        createdAt: Date.now()
    };

    if (!saveGroups(groups)) {
        return {
            success: false,
            message: "建立群組失敗"
        };
    }

    return {
        success: true,
        message: "群組建立成功",
        groupId: groupId
    };
}

// 取得指定會員加入的群組
function getUserGroups(username) {
    const groups = getAllGroups();

    return Object.values(groups).filter(group => {
        return (
            Array.isArray(group.members) &&
            group.members.includes(username)
        );
    });
}

// 取得指定群組
function getGroup(groupId) {
    const groups = getAllGroups();

    return groups[groupId] || null;
}

// 邀請好友加入群組
function inviteFriendToGroup(groupId, inviter, friend) {
    const groups = getAllGroups();
    const group = groups[groupId];

    if (!group) {
        return "找不到群組";
    }

    if (!group.members.includes(inviter)) {
        return "你不是群組成員";
    }

    if (!getFriends(inviter).includes(friend)) {
        return "只能邀請自己的好友";
    }

    if (group.members.includes(friend)) {
        return "對方已經在群組中";
    }

    // 本機示範：直接加入，不經過邀請確認
    group.members.push(friend);

    if (!saveGroups(groups)) {
        return "邀請失敗";
    }

    return "已將好友加入群組";
}

// 傳送群組訊息
function sendGroupMessage(groupId, sender, text) {
    const messageText = text.trim();
    const groups = getAllGroups();
    const group = groups[groupId];

    if (!group || !messageText) {
        return false;
    }

    if (!group.members.includes(sender)) {
        return false;
    }

    if (!Array.isArray(group.messages)) {
        group.messages = [];
    }

    group.messages.push({
        author: sender,
        text: messageText,
        time: new Date().toLocaleTimeString("zh-TW", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }),
        timestamp: Date.now()
    });

    return saveGroups(groups);
}

// 取得群組訊息
function getGroupMessages(groupId, username) {
    const group = getGroup(groupId);

    if (!group || !group.members.includes(username)) {
        return [];
    }

    return Array.isArray(group.messages)
        ? [...group.messages]
        : [];
}

// 離開群組
function leaveGroup(groupId, username) {
    const groups = getAllGroups();
    const group = groups[groupId];

    if (!group) {
        return "找不到群組";
    }

    if (!group.members.includes(username)) {
        return "你不是群組成員";
    }

    if (group.owner === username) {
        return "群組建立者不能直接離開，請先解散群組";
    }

    group.members = group.members.filter(
        member => member !== username
    );

    if (!saveGroups(groups)) {
        return "離開群組失敗";
    }

    return "已離開群組";
}

// 解散群組
function deleteGroup(groupId, username) {
    const groups = getAllGroups();
    const group = groups[groupId];

    if (!group) {
        return "找不到群組";
    }

    if (group.owner !== username) {
        return "只有群組建立者可以解散群組";
    }

    delete groups[groupId];

    if (!saveGroups(groups)) {
        return "解散群組失敗";
    }

    return "群組已解散";
}
