import {
    startNotificationListener,
    stopNotificationListener,
    getNotifications,
    getUnreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications
} from "./notifications.js";
import {
    markPrivateMessagesRead,
    getUnreadPrivateCount,
    areMyPrivateMessagesRead,
    startReadStatusListener,
    stopReadStatusListener
} from "./read-status.js";
import {
    createGroup,
    getUserGroups,
    getGroup,
    inviteFriendToGroup,
    sendGroupMessage,
    getGroupMessages,
    leaveGroup,
    deleteGroup,
    startGroupListener,
    stopGroupListener,
    startGroupMessageListener,
    stopGroupMessageListener
} from "./groups.js";
import {
    getPublicMessages,
    sendPublicMessage,
    startPublicChatListener,
    stopPublicChatListener
} from "./public-chat.js";
import {
    getPrivateChatId,
    getPrivateMessages,
    sendPrivateMessage,
    startPrivateChatListener,
    stopPrivateChatListener
} from "./private-chat.js";
import { auth } from "./firebase.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import {
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    getFriendRequests,
    removeFriend,
    startFriendshipListener,
    stopFriendshipListener
} from "./friends.js";

/* =========================================
   即時聊天與社群平台
   script.js
========================================= */

const SESSION_KEY = "chat-demo-session";
const currentUser = sessionStorage.getItem(SESSION_KEY);

if (!currentUser) {
    window.location.replace("auth.html");
} else {
    initializeChat();
}

function initializeChat() {
        startNotificationListener(
        currentUser,
        () => {
            renderNotifications();
        },
        error => {
            console.error("通知即時同步失敗：", error);
        }
    ).catch(error => {
        console.error("啟動通知監聽失敗：", error);
    });
    startGroupListener(
    currentUser,
    () => {
        if (currentGroupId && !getGroup(currentGroupId)) {
            switchChannel("general");
        }

        renderGroups();
        renderGroupMembers();
        renderMessages();
    },
    error => {
        console.error("群組即時同步失敗：", error);
    }
).catch(error => {
    console.error("啟動群組監聽失敗：", error);
});

    let previousFriendsKey = null;

startFriendshipListener(
    currentUser,
    () => {
        renderFriendRequests();
        renderFriends();
        renderGroupMembers();

        const friends = getFriends(currentUser);
        const friendsKey = JSON.stringify(
            [...friends].sort()
        );

        if (friendsKey !== previousFriendsKey) {
            previousFriendsKey = friendsKey;

            startReadStatusListener(
                currentUser,
                friends,
                () => {
                    renderFriends();
                    renderMessages();
                },
                error => {
                    console.error("已讀同步失敗：", error);
                }
            ).catch(error => {
                console.error("啟動已讀監聽失敗：", error);
            });
        }
    },
    error => {
        console.error("好友即時同步失敗：", error);
    }
).catch(error => {
    console.error("啟動好友監聽失敗：", error);
});

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

        logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);

        stopFriendshipListener();
stopPrivateChatListener();
stopPublicChatListener();
stopGroupListener();
stopGroupMessageListener();
stopReadStatusListener();
stopNotificationListener();

        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem("chat-firebase-uid");

        window.location.replace("auth.html");

    } catch (error) {
        console.error("登出失敗：", error);
        alert("登出失敗，請稍後再試");
    }
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

    // 只顯示自己傳送的私人訊息已讀狀態
    if (
        currentPrivateFriend !== null &&
        currentGroupId === null &&
        message.author === currentUser
    ) {
        const readStatus = document.createElement("div");

        const isRead = areMyPrivateMessagesRead(
            currentUser,
            currentPrivateFriend,
            message
        );

        readStatus.textContent =
            message.hasPendingWrites
                ? "傳送中..."
                : isRead
                    ? "✓✓ 已讀"
                    : "✓ 未讀";

        readStatus.style.fontSize = "12px";
        readStatus.style.marginTop = "4px";
        readStatus.style.color =
            isRead ? "#57f287" : "#949ba4";

        content.appendChild(readStatus);
    }

    messageDiv.append(avatar, content);

    return messageDiv;
}

    // =====================================
    // 顯示聊天紀錄
    // =====================================

    function renderMessages() {
    messagesContainer.innerHTML = "";

    let messages = [];

    // 群組聊天
    if (currentGroupId !== null) {
        messages = getGroupMessages(
            currentGroupId,
            currentUser
        );

    // Firebase 私人聊天
    } else if (currentPrivateFriend !== null) {
        messages = getPrivateMessages(
            currentUser,
            currentPrivateFriend
        );

    // Firebase 公共聊天室
    } else {
        messages = getPublicMessages(currentChannel);
    }

    messages.forEach(message => {
        messagesContainer.appendChild(
            createMessageElement(message)
        );
    });

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;
}

    // =====================================
    // 公共聊天：跨分頁訊息同步
    // =====================================

    
    // =====================================
    // 傳送訊息
    // =====================================

    let isSendingMessage = false;

async function sendMessage(event) {
    event.preventDefault();

    if (isSendingMessage) return;

    const text = messageInput.value.trim();

    if (!text) return;

    const targetFriend = currentPrivateFriend;
    const targetGroup = currentGroupId;
    const targetChannel = currentChannel;

    isSendingMessage = true;

    try {
        // 群組聊天
        if (targetGroup !== null) {
            const success = await sendGroupMessage(
                targetGroup,
                currentUser,
                text
            );

            if (!success) {
                alert("群組訊息傳送失敗");
                return;
            }

        // Firebase 私人聊天
        } else if (targetFriend !== null) {

            if (text.length > 2000) {
                alert("私人訊息不得超過 2000 字元");
                return;
            }

            const success = await sendPrivateMessage(
                currentUser,
                targetFriend,
                text
            );

            if (!success) {
                alert("私人訊息傳送失敗");
                return;
            }

        // 公共聊天室
        // Firebase 公共聊天室
} else {
    if (text.length > 2000) {
        alert("公共訊息不得超過 2000 字元");
        return;
    }

    const success = await sendPublicMessage(
        targetChannel,
        currentUser,
        text
    );

    if (!success) {
        alert("公共訊息傳送失敗");
        return;
    }
}

        renderMessages();

        if (
            currentPrivateFriend === targetFriend &&
            currentGroupId === targetGroup &&
            currentChannel === targetChannel
        ) {
            if (messageInput.value.trim() === text) {
                messageInput.value = "";
            }

            messageInput.focus();
        }

    } catch (error) {
        console.error("訊息傳送失敗：", error);
        alert("訊息傳送失敗，請稍後再試");

    } finally {
        isSendingMessage = false;
    }
}
    // =====================================
    // 切換一般聊天頻道
    // =====================================

    function switchChannel(channelId) {
    if (!Object.prototype.hasOwnProperty.call(
        channelNames,
        channelId
    )) return;

    stopPrivateChatListener();
    stopGroupMessageListener();

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

    // 啟動 Firebase 公共聊天室即時監聽
    startPublicChatListener(
        channelId,

        () => {
            if (
                currentChannel === channelId &&
                currentPrivateFriend === null &&
                currentGroupId === null
            ) {
                renderMessages();
            }
        },

        (error) => {
            console.error("公共聊天室同步失敗：", error);
        }

    ).catch(error => {
        console.error("啟動公共聊天室失敗：", error);
    });

    renderMessages();
}

    // =====================================
    // 左側四個圖示點擊功能
    // =====================================

    const serverChannelButtons =
        document.querySelectorAll(
            ".server-icon[data-target-channel]"
        );

    serverChannelButtons.forEach(button => {
        button.addEventListener("click", () => {
            const channelId =
                button.dataset.targetChannel;

            switchChannel(channelId);
        });
    });

    // =====================================
    // 左側 + 按鈕：新增社群
    // =====================================

    const addServerButton =
        document.getElementById("addServerButton");

    if (addServerButton) {
        addServerButton.addEventListener("click", () => {

            if (groupNameInput) {
                groupNameInput.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                groupNameInput.focus();

                groupNameInput.style.outline =
                    "2px solid #5865f2";
            }
        });
    }

    // =====================================
    // 開啟私人聊天
    // =====================================

    document.addEventListener("visibilitychange", () => {
    if (
        document.visibilityState === "visible" &&
        currentPrivateFriend !== null &&
        currentGroupId === null
    ) {
        const friend = currentPrivateFriend;

        markPrivateMessagesRead(
            currentUser,
            friend,
            () =>
                currentPrivateFriend === friend &&
                currentGroupId === null
        );
    }
});
    function openPrivateChat(friend) {
    if (!getFriends(currentUser).includes(friend)) {
        showFriendMessage("對方不是好友，無法聊天");
        return;
    }

    stopPublicChatListener();
    stopGroupMessageListener();
    
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

    // 啟動 Firebase 私人訊息即時監聽
    startPrivateChatListener(
        currentUser,
        friend,

        () => {
    if (
        currentPrivateFriend === friend &&
        currentGroupId === null
    ) {
        renderMessages();

        if (document.visibilityState === "visible") {
            markPrivateMessagesRead(
    currentUser,
    friend,
    () =>
        currentPrivateFriend === friend &&
        currentGroupId === null
);
        }
    }
},

        (error) => {
            console.error("私人聊天同步失敗：", error);
            showFriendMessage("私人聊天同步失敗");
        }

    ).catch(error => {
        console.error("啟動私人聊天失敗：", error);
    });

    renderMessages();
    messageInput.focus();
}
    // =====================================
    // 好友管理
    // =====================================

    function showFriendMessage(message) {
        if (friendMessage) {
            friendMessage.textContent = message;
        }
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

    // PART 1 END    
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

            const acceptButton = createButton("接受", async () => {
                try {
                    const result = await acceptFriendRequest(
                        currentUser,
                        sender
                    );

                    showFriendMessage(result);

                    renderFriendRequests();
                    renderFriends();
                    renderGroupMembers();

                } catch (error) {
                    console.error("接受好友邀請失敗：", error);
                    showFriendMessage("接受好友邀請失敗，請稍後再試");
                }
            });

            const rejectButton = createButton("拒絕", async () => {
                try {
                    const result = await rejectFriendRequest(
                        currentUser,
                        sender
                    );

                    showFriendMessage(result);

                    renderFriendRequests();
                    renderFriends();

                } catch (error) {
                    console.error("拒絕好友邀請失敗：", error);
                    showFriendMessage("拒絕好友邀請失敗，請稍後再試");
                }
            });

            item.append(name, acceptButton, rejectButton);
            requestsList.appendChild(item);
        });
    }

    // =====================================
    // 顯示好友列表
    // =====================================

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

const unreadCount = getUnreadPrivateCount(
    currentUser,
    friend
);

if (unreadCount > 0) {
    const unreadBadge = document.createElement("span");

    unreadBadge.textContent =
        unreadCount > 99 ? "99+" : unreadCount;

    unreadBadge.style.backgroundColor = "#ed4245";
    unreadBadge.style.color = "#ffffff";
    unreadBadge.style.borderRadius = "12px";
    unreadBadge.style.padding = "2px 7px";
    unreadBadge.style.marginLeft = "8px";
    unreadBadge.style.fontSize = "12px";
    unreadBadge.style.fontWeight = "bold";

    name.appendChild(unreadBadge);
}

            const chatButton = createButton("聊天", () => {
                openPrivateChat(friend);
            });

            const removeButton = createButton("刪除", async () => {
                if (!confirm("確定刪除好友 " + friend + " 嗎？")) {
                    return;
                }

                try {
                    const result = await removeFriend(
                        currentUser,
                        friend
                    );

                    showFriendMessage(result);

                    renderFriends();
                    renderGroupMembers();

                    if (
                        result === "已刪除好友" &&
                        currentPrivateFriend === friend
                    ) {
                        switchChannel("general");
                    }

                } catch (error) {
                    console.error("刪除好友失敗：", error);
                    showFriendMessage("刪除好友失敗，請稍後再試");
                }
            });

            item.append(name, chatButton, removeButton);
            friendsList.appendChild(item);
        });
    }

    // =====================================
    // 發送好友邀請
    // =====================================

    if (addFriendButton && searchInput) {
        addFriendButton.addEventListener("click", async () => {
            const targetUsername = searchInput.value.trim();

            let result;

            try {
                result = await sendFriendRequest(
                    currentUser,
                    targetUsername
                );

            } catch (error) {
                console.error("好友邀請失敗：", error);
                showFriendMessage("雲端連線失敗，請稍後再試");
                return;
            }

            showFriendMessage(result);

            if (result === "好友邀請已送出") {
                

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
        if (groupMessage) {
            groupMessage.textContent = message;
        }
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

    // =====================================
    // 開啟群組聊天
    // =====================================

    function openGroupChat(groupId) {
    const group = getGroup(groupId);

    if (!group || !group.members.includes(currentUser)) {
        showGroupMessage("你不是這個群組的成員");
        renderGroups();
        return;
    }

    stopPrivateChatListener();
    stopPublicChatListener();
    stopGroupMessageListener();

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

    startGroupMessageListener(
        groupId,
        currentUser,
        () => {
            if (currentGroupId === groupId) {
                renderMessages();
            }
        },
        error => {
            console.error("群組訊息同步失敗：", error);
        }
    ).catch(error => {
        console.error("啟動群組訊息監聽失敗：", error);
    });

    messageInput.focus();
}
    // =====================================
    // 顯示群組成員
    // =====================================

    function renderGroupMembers() {
        if (
            currentGroupId === null ||
            !groupMembersList ||
            !groupFriendSelect
        ) {
            return;
        }

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

    // =====================================
    // 建立群組
    // =====================================

    if (createGroupButton && groupNameInput) {
        createGroupButton.addEventListener("click", async () => {
            const result = await createGroup(
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

    // =====================================
    // 邀請好友加入群組
    // =====================================

    if (inviteGroupFriendButton) {
    inviteGroupFriendButton.addEventListener("click", async () => {
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

        const result = await inviteFriendToGroup(
            currentGroupId,
            currentUser,
            friend
        );

        showGroupMessage(result);

        renderGroupMembers();
    });
}

    // =====================================
    // 離開群組與解散群組
    // =====================================

    if (leaveGroupButton) {
    leaveGroupButton.addEventListener("click", async () => {
        if (!currentGroupId) return;

        const group = getGroup(currentGroupId);

        if (!group) return;

        const isOwner = group.owner === currentUser;

        const question = isOwner
            ? "確定要解散群組「" + group.name + "」嗎？解散後將無法存取群組訊息。"
            : "確定要離開群組「" + group.name + "」嗎？";

        if (!confirm(question)) return;

        const result = isOwner
            ? await deleteGroup(currentGroupId, currentUser)
            : await leaveGroup(currentGroupId, currentUser);

        showGroupMessage(result);

        if (
            result === "群組已解散" ||
            result === "已離開群組"
        ) {
            switchChannel("general");
        }
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

    // =====================================
    // 本機跨分頁資料同步
    // =====================================

    window.addEventListener("storage", event => {

        if (event.key === "chat-demo-read-status") {
            if (currentPrivateFriend !== null) {
                renderMessages();
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
    // 初始化聊天畫面
    // =====================================

    renderFriendRequests();
renderFriends();
switchChannel(currentChannel);
    // =====================================
    // 通知中心介面
    // =====================================

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

                readButton.addEventListener("click", async () => {
    const success = await markNotificationRead(
        currentUser,
        notification.id
    );

    if (!success) {
        alert("標記已讀失敗，請稍後再試");
    }
});

                item.appendChild(readButton);
            }

            list.appendChild(item);
        });
    }

    // =====================================
    // 全部通知標記已讀
    // =====================================

    document.getElementById(
    "markAllNotificationsButton"
)?.addEventListener("click", async () => {

    if (!currentUser) return;

    const success = await markAllNotificationsRead(
        currentUser
    );

    if (!success) {
        alert("全部標記已讀失敗，請稍後再試");
    }
});

    // =====================================
    // 清空通知
    // =====================================

    document.getElementById(
    "clearNotificationsButton"
)?.addEventListener("click", async () => {

    if (!currentUser) return;

    if (confirm("確定要清空所有通知嗎？")) {

        const success = await clearNotifications(
            currentUser
        );

        if (!success) {
            alert("清空通知失敗，請稍後再試");
        }
    }
});

    // =====================================
    // 初始化通知中心
    // =====================================

    renderNotifications();

}

// PART 2 END