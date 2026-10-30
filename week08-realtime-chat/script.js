
/* =========================================
   即時聊天與社群平台
   script.js 完整版
   本機展示版本
========================================= */

const SESSION_KEY = "chat-demo-session";
const currentUser = sessionStorage.getItem(SESSION_KEY);

if (!currentUser) {
    window.location.replace("auth.html");
} else {
    initializeChat();
}

function initializeChat() {
    // =====================================
    // 取得網頁元素
    // =====================================

    const messageForm = document.getElementById("messageForm");
    const messageInput = document.getElementById("messageInput");
    const messagesContainer = document.getElementById("messages");
    const chatTitle = document.getElementById("chatTitle");
    const channels = document.querySelectorAll(".channel");

    const searchInput = document.getElementById("friendSearchInput");
    const addFriendButton = document.getElementById("addFriendButton");
    const friendMessage = document.getElementById("friendMessage");
    const requestsList = document.getElementById("friendRequestsList");
    const friendsList = document.getElementById("friendsList");

    const groupNameInput = document.getElementById("groupNameInput");
    const createGroupButton = document.getElementById("createGroupButton");
    const groupMessage = document.getElementById("groupMessage");
    const groupsList = document.getElementById("groupsList");
    const groupInvitePanel = document.getElementById("groupInvitePanel");
    const groupMembersList = document.getElementById("groupMembersList");
    const groupFriendSelect = document.getElementById("groupFriendSelect");
    const inviteGroupFriendButton = document.getElementById("inviteGroupFriendButton");
    const leaveGroupButton = document.getElementById("leaveGroupButton");

    const storageKey = "realtime-chat-messages-" + currentUser;

    let currentChannel = "general";
    let currentPrivateFriend = null;
    let currentGroupId = null;

    const channelNames = {
        general: "# 一般聊天",
        programming: "# 程式討論",
        gaming: "# 遊戲交流",
        friend1: "👤 小明（示範）",
        friend2: "👤 小華（示範）"
    };

    const defaultMessages = {
        general: [
            {
                author: "小明",
                text: "大家早安！歡迎來到聊天平台。",
                time: "09:30"
            },
            {
                author: "小華",
                text: "今天有人想一起討論程式設計嗎？",
                time: "09:35"
            }
        ],
        programming: [],
        gaming: [],
        friend1: [],
        friend2: []
    };

    // =====================================
    // 會員資訊與登出
    // =====================================

    const userPanel = document.querySelector(".user-panel");

    if (userPanel) {
        userPanel.innerHTML = "";

        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = currentUser.charAt(0);

        const info = document.createElement("div");

        const username = document.createElement("strong");
        username.textContent = currentUser;

        const status = document.createElement("div");
        status.textContent = "🟢 在線上";
        status.style.fontSize = "12px";
        status.style.color = "#949ba4";

        info.append(username, status);

        const logoutButton = document.createElement("button");
        logoutButton.type = "button";
        logoutButton.textContent = "登出";
        logoutButton.style.marginLeft = "auto";
        logoutButton.style.cursor = "pointer";

        logoutButton.addEventListener("click", () => {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.replace("auth.html");
        });

        userPanel.append(avatar, info, logoutButton);
    }

    const memberSidebar = document.querySelector(".member-sidebar");

    if (memberSidebar) {
        const firstMember = memberSidebar.querySelector(".member");

        if (firstMember) {
            const avatar = firstMember.querySelector(".avatar");
            const name = firstMember.querySelector("span");

            if (avatar) avatar.textContent = currentUser.charAt(0);
            if (name) name.textContent = currentUser;
        }
    }

    // =====================================
    // 一般聊天資料
    // =====================================

    function loadMessages() {
        try {
            const saved = localStorage.getItem(storageKey);

            if (saved) {
                const parsed = JSON.parse(saved);

                if (parsed && typeof parsed === "object") {
                    const result = {};

                    Object.keys(channelNames).forEach(channel => {
                        result[channel] = Array.isArray(parsed[channel])
                            ? parsed[channel]
                            : [];
                    });

                    return result;
                }
            }
        } catch (error) {
            console.error("讀取聊天紀錄失敗：", error);
        }

        return structuredClone(defaultMessages);
    }

    let chatMessages = loadMessages();

    function saveMessages() {
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify(chatMessages)
            );
            return true;
        } catch (error) {
            console.error("儲存聊天紀錄失敗：", error);
            return false;
        }
    }

    function getCurrentTime() {
        return new Date().toLocaleTimeString("zh-TW", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    }

    // =====================================
    // 建立訊息畫面
    // =====================================

    function createMessageElement(message) {
        const messageDiv = document.createElement("div");
        messageDiv.className = "message";

        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = String(message.author).charAt(0);

        const content = document.createElement("div");
        content.className = "message-content";

        const author = document.createElement("div");
        author.className = "message-author";
        author.textContent = message.author;

        const time = document.createElement("span");
        time.className = "message-time";
        time.textContent = message.time || "";

        const text = document.createElement("div");
        text.className = "message-text";
        text.textContent = message.text;

        author.appendChild(time);
        content.append(author, text);
        messageDiv.append(avatar, content);

        return messageDiv;
    }

    // =====================================
    // 顯示聊天紀錄
    // =====================================

    function renderMessages() {
        messagesContainer.innerHTML = "";

        let messages = [];

        if (currentGroupId !== null) {
            messages = getGroupMessages(
                currentGroupId,
                currentUser
            );
        } else if (currentPrivateFriend !== null) {
            messages = getPrivateMessages(
                currentUser,
                currentPrivateFriend
            );
        } else {
            messages = chatMessages[currentChannel] || [];
        }

        messages.forEach(message => {
            messagesContainer.appendChild(
                createMessageElement(message)
            );
        });

if (currentPrivateFriend !== null) {
    const status = document.createElement("div");

    status.style.textAlign = "right";
    status.style.fontSize = "12px";
    status.style.color = "#949ba4";
    status.style.padding = "8px 15px";

    const hasSentMessages = messages.some(
        message => message.author === currentUser
    );

    if (hasSentMessages) {
        status.textContent = areMyPrivateMessagesRead(
            currentUser,
            currentPrivateFriend
        ) ? "✓ 已讀" : "✓ 未讀";

        messagesContainer.appendChild(status);
    }
}

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;
    }

    // =====================================
    // 傳送訊息
    // =====================================

    function sendMessage(event) {
        event.preventDefault();

        const text = messageInput.value.trim();

        if (!text) return;

        if (currentGroupId !== null) {
            const success = sendGroupMessage(
                currentGroupId,
                currentUser,
                text
            );

            if (!success) {
                alert("群組訊息傳送失敗");
                return;
            }

        
} else if (currentPrivateFriend !== null) {
    const success = sendPrivateMessage(
        currentUser,
        currentPrivateFriend,
        text
    );

    if (!success) {
        alert("私人訊息傳送失敗");
        return;
    }

    // 私人訊息傳送成功，通知收件者
    addNotification(
        currentPrivateFriend,
        "private_message",
        "💬 " + currentUser + " 傳送了一則私人訊息給你"
    );

} else {

            chatMessages[currentChannel].push({
                author: currentUser,
                text: text,
                time: getCurrentTime()
            });

            if (!saveMessages()) {
                alert("訊息儲存失敗");
                return;
            }
        }

if (currentPrivateFriend !== null) {
    markPrivateMessagesRead(
        currentUser,
        currentPrivateFriend
    );
}

renderMessages();
messageInput.value = "";
messageInput.focus();
    }

    // =====================================
    // 切換一般聊天頻道
    // =====================================

    function switchChannel(channelId) {
        if (!Object.prototype.hasOwnProperty.call(
            channelNames, channelId
        )) return;

        currentPrivateFriend = null;
        currentGroupId = null;
        currentChannel = channelId;

        chatTitle.textContent = channelNames[channelId];
        messageInput.placeholder = "輸入訊息...";

        channels.forEach(channel => {
            channel.classList.toggle(
                "active",
                channel.dataset.channel === channelId
            );
        });

        if (groupInvitePanel) {
            groupInvitePanel.style.display = "none";
        }

        renderGroups();
        renderMessages();
    }

    // =====================================
    // 開啟私人聊天
    // =====================================

    function openPrivateChat(friend) {
        if (!getFriends(currentUser).includes(friend)) {
            showFriendMessage("對方不是好友，無法聊天");
            return;
        }

        currentPrivateFriend = friend;
        currentGroupId = null;

        chatTitle.textContent = "🔒 與 " + friend + " 的私人聊天";
        messageInput.placeholder = "傳送私人訊息給 " + friend;

        channels.forEach(channel => {
            channel.classList.remove("active");
        });

        if (groupInvitePanel) {
            groupInvitePanel.style.display = "none";
        }

renderGroups();
markPrivateMessagesRead(currentUser, friend);
renderMessages();
messageInput.focus();
    }

    // =====================================
    // 好友管理
    // =====================================

    function showFriendMessage(message) {
        if (friendMessage) friendMessage.textContent = message;
    }

    function createButton(text, onClick) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.style.margin = "4px";
        button.style.padding = "5px 8px";
        button.style.cursor = "pointer";
        button.addEventListener("click", onClick);
        return button;
    }

    function renderFriendRequests() {
        if (!requestsList) return;

        requestsList.innerHTML = "";
        const requests = getFriendRequests(currentUser);

        if (requests.length === 0) {
            requestsList.textContent = "目前沒有好友邀請";
            return;
        }

        requests.forEach(sender => {
            const item = document.createElement("div");
            const name = document.createElement("div");
            name.textContent = sender;

            const acceptButton = createButton("接受", () => {
                showFriendMessage(
                    acceptFriendRequest(currentUser, sender)
                );
                renderFriendRequests();
                renderFriends();
                renderGroupMembers();
            });

            const rejectButton = createButton("拒絕", () => {
                showFriendMessage(
                    rejectFriendRequest(currentUser, sender)
                );
                renderFriendRequests();
            });

            item.append(name, acceptButton, rejectButton);
            requestsList.appendChild(item);
        });
    }

    function renderFriends() {
        if (!friendsList) return;

        friendsList.innerHTML = "";
        const friends = getFriends(currentUser);

        if (friends.length === 0) {
            friendsList.textContent = "目前沒有好友";
            return;
        }

        friends.forEach(friend => {
            const item = document.createElement("div");
            const name = document.createElement("div");
            name.textContent = "👤 " + friend;

            const chatButton = createButton("聊天", () => {
                openPrivateChat(friend);
            });

            const removeButton = createButton("刪除", () => {
                if (!confirm("確定刪除好友 " + friend + " 嗎？")) {
                    return;
                }

                showFriendMessage(
                    removeFriend(currentUser, friend)
                );

                renderFriends();
                renderGroupMembers();

                if (currentPrivateFriend === friend) {
                    switchChannel("general");
                }
            });

            item.append(name, chatButton, removeButton);
            friendsList.appendChild(item);
        });
    }

    
if (addFriendButton && searchInput) {
    addFriendButton.addEventListener("click", () => {
        const targetUsername = searchInput.value.trim();

        const result = sendFriendRequest(
            currentUser,
            targetUsername
        );

        showFriendMessage(result);

        if (result === "好友邀請已送出") {
            // 成功發送好友邀請後，通知對方
            addNotification(
                targetUsername,
                "friend_request",
                "👤 " + currentUser + " 邀請你成為好友"
            );

            searchInput.value = "";
            renderNotifications();
        }

        renderFriendRequests();
        renderFriends();
    });

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            addFriendButton.click();
        }
    });
}

    // =====================================
    // 群組管理
    // =====================================

    function showGroupMessage(message) {
        if (groupMessage) groupMessage.textContent = message;
    }

    function renderGroups() {
        if (!groupsList) return;

        groupsList.innerHTML = "";

        const groups = getUserGroups(currentUser);

        if (groups.length === 0) {
            groupsList.textContent = "目前沒有群組";
            return;
        }

        groups.forEach(group => {
            const item = document.createElement("div");
            item.style.marginBottom = "8px";

            const openButton = createButton(
                "👥 " + group.name,
                () => openGroupChat(group.id)
            );

            if (currentGroupId === group.id) {
                openButton.style.background = "#5865f2";
                openButton.style.color = "white";
            }

            item.appendChild(openButton);
            groupsList.appendChild(item);
        });
    }

    function openGroupChat(groupId) {
        const group = getGroup(groupId);

        if (!group || !group.members.includes(currentUser)) {
            showGroupMessage("你不是這個群組的成員");
            renderGroups();
            return;
        }

        currentGroupId = groupId;
        currentPrivateFriend = null;

        chatTitle.textContent = "👥 " + group.name;
        messageInput.placeholder = "傳送訊息到 " + group.name;

        channels.forEach(channel => {
            channel.classList.remove("active");
        });

        if (groupInvitePanel) {
            groupInvitePanel.style.display = "block";
        }

        renderGroups();
        renderGroupMembers();
        renderMessages();
        messageInput.focus();
    }

    function renderGroupMembers() {
        if (
            currentGroupId === null ||
            !groupMembersList ||
            !groupFriendSelect
        ) return;

        const group = getGroup(currentGroupId);

        if (!group || !group.members.includes(currentUser)) {
            switchChannel("general");
            return;
        }

        groupMembersList.textContent =
            "成員：" + group.members.join("、") +
            "（建立者：" + group.owner + "）";

        groupFriendSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "選擇要邀請的好友";
        groupFriendSelect.appendChild(defaultOption);

        const availableFriends = getFriends(currentUser).filter(
            friend => !group.members.includes(friend)
        );

        availableFriends.forEach(friend => {
            const option = document.createElement("option");
            option.value = friend;
            option.textContent = friend;
            groupFriendSelect.appendChild(option);
        });

        if (leaveGroupButton) {
            leaveGroupButton.textContent =
                group.owner === currentUser
                    ? "解散群組"
                    : "離開群組";
        }
    }

    if (createGroupButton && groupNameInput) {
        createGroupButton.addEventListener("click", () => {
            const result = createGroup(
                currentUser,
                groupNameInput.value
            );

            showGroupMessage(result.message);

            if (result.success) {
                groupNameInput.value = "";
                renderGroups();
                openGroupChat(result.groupId);
            }
        });

        groupNameInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                createGroupButton.click();
            }
        });
    }

    
if (inviteGroupFriendButton) {
    inviteGroupFriendButton.addEventListener("click", () => {
        if (!currentGroupId) return;

        const friend = groupFriendSelect.value;

        if (!friend) {
            showGroupMessage("請先選擇好友");
            return;
        }

        const group = getGroup(currentGroupId);

        if (!group) {
            showGroupMessage("找不到群組");
            return;
        }

        const wasMember = group.members.includes(friend);

        const result = inviteFriendToGroup(
            currentGroupId,
            currentUser,
            friend
        );

        showGroupMessage(result);

        const updatedGroup = getGroup(currentGroupId);

        // 確認好友確實成功加入群組才發通知
        if (
            !wasMember &&
            updatedGroup &&
            updatedGroup.members.includes(friend)
        ) {
            addNotification(
                friend,
                "group_invite",
                "👥 " + currentUser +
                " 邀請你加入群組「" +
                group.name + "」"
            );
        }

        renderGroupMembers();
    });
}


    if (leaveGroupButton) {
        leaveGroupButton.addEventListener("click", () => {
            if (!currentGroupId) return;

            const group = getGroup(currentGroupId);
            if (!group) return;

            const isOwner = group.owner === currentUser;

            const question = isOwner
                ? "確定要解散群組「" + group.name + "」嗎？所有群組訊息都會刪除。"
                : "確定要離開群組「" + group.name + "」嗎？";

            if (!confirm(question)) return;

            const result = isOwner
                ? deleteGroup(currentGroupId, currentUser)
                : leaveGroup(currentGroupId, currentUser);

            showGroupMessage(result);
            switchChannel("general");
        });
    }

    // =====================================
    // 事件監聽
    // =====================================

    messageForm.addEventListener("submit", sendMessage);

    channels.forEach(channel => {
        channel.addEventListener("click", () => {
            switchChannel(channel.dataset.channel);
        });
    });

    window.addEventListener("storage", event => {
        if (event.key === "chat-demo-read-status") {
    if (currentPrivateFriend !== null) {
        renderMessages();
    }
}
        if (event.key === "chat-demo-friends") {
            renderFriendRequests();
            renderFriends();
            renderGroupMembers();

            if (
                currentPrivateFriend !== null &&
                !getFriends(currentUser).includes(currentPrivateFriend)
            ) {
                switchChannel("general");
            }
        }

        if (event.key === "chat-demo-private-messages") {
    if (currentPrivateFriend !== null) {
        markPrivateMessagesRead(
            currentUser,
            currentPrivateFriend
        );
        renderMessages();
    }
}

        if (event.key === "chat-demo-groups") {
            renderGroups();

            if (currentGroupId !== null) {
                const group = getGroup(currentGroupId);

                if (!group || !group.members.includes(currentUser)) {
                    switchChannel("general");
                } else {
                    renderGroupMembers();
                    renderMessages();
                }
            }
        }
    });

    // =====================================
    // 初始化
    // =====================================

    renderMessages();
    renderFriendRequests();
    renderFriends();
    renderGroups();
}

/* =========================================
   通知中心介面
========================================= */

function renderNotifications() {
    const list = document.getElementById("notificationsList");
    const badge = document.getElementById("notificationBadge");

    if (!list || !badge || !currentUser) {
        return;
    }

    const notifications = getNotifications(currentUser);
    const unreadCount = getUnreadNotificationCount(currentUser);

    badge.textContent = unreadCount;
    list.innerHTML = "";

    if (notifications.length === 0) {
        list.textContent = "目前沒有通知";
        return;
    }

    notifications.forEach(notification => {
        const item = document.createElement("div");

        item.style.padding = "10px";
        item.style.marginBottom = "8px";
        item.style.borderRadius = "6px";
        item.style.backgroundColor = notification.read
            ? "#35373c"
            : "#404b68";

        const message = document.createElement("div");
        message.textContent = notification.message;

        const time = document.createElement("div");
        time.textContent = notification.time;
        time.style.fontSize = "11px";
        time.style.color = "#b5bac1";
        time.style.marginTop = "5px";

        item.appendChild(message);
        item.appendChild(time);

        if (!notification.read) {
            const readButton = document.createElement("button");

            readButton.type = "button";
            readButton.textContent = "標記已讀";
            readButton.style.marginTop = "6px";

            readButton.addEventListener("click", () => {
                markNotificationRead(
                    currentUser,
                    notification.id
                );
                renderNotifications();
            });

            item.appendChild(readButton);
        }

        list.appendChild(item);
    });
}

// 全部標記已讀
document.getElementById(
    "markAllNotificationsButton"
)?.addEventListener("click", () => {
    if (!currentUser) return;

    markAllNotificationsRead(currentUser);
    renderNotifications();
});

// 清空通知
document.getElementById(
    "clearNotificationsButton"
)?.addEventListener("click", () => {
    if (!currentUser) return;

    if (confirm("確定要清空所有通知嗎？")) {
        clearNotifications(currentUser);
        renderNotifications();
    }
});

// 初始化通知中心
renderNotifications();

// 其他分頁更新通知時同步畫面
window.addEventListener("storage", event => {
    if (event.key === "chat-demo-notifications") {
        renderNotifications();
    }
});
