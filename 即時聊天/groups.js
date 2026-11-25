/* =========================================
   群組聊天資料管理
   Firebase 雲端即時同步版本
========================================= */

import { auth, db } from "./firebase.js";
import { getFriends } from "./friends.js";

import {
    collection,
    doc,
    getDoc,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

let groupCache = new Map();
let groupMessageCache = new Map();

let unsubscribeGroups = null;
let unsubscribeGroupMessages = null;

let groupGeneration = 0;
let messageGeneration = 0;

// 確認登入身分
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

// 停止群組列表監聽
function stopGroupListener() {
    groupGeneration++;

    if (unsubscribeGroups) {
        unsubscribeGroups();
        unsubscribeGroups = null;
    }

    groupCache.clear();
}

// 啟動群組列表即時監聽
async function startGroupListener(
    username,
    onChange,
    onError = console.error
) {
    stopGroupListener();

    const generation = groupGeneration;
    const user = await requireUser(username);

    if (generation !== groupGeneration) {
        return;
    }

    const groupsQuery = query(
        collection(db, "groups"),
        where("memberUids", "array-contains", user.uid),
        where("active", "==", true)
    );

    unsubscribeGroups = onSnapshot(
        groupsQuery,

        snapshot => {
            if (generation !== groupGeneration) {
                return;
            }

            groupCache.clear();

            snapshot.docs.forEach(groupDoc => {
                groupCache.set(groupDoc.id, {
                    ...groupDoc.data(),
                    id: groupDoc.id
                });
            });

            onChange?.();
        },

        error => {
            if (generation !== groupGeneration) {
                return;
            }

            groupCache.clear();
            onChange?.();
            onError(error);
        }
    );
}

// 建立群組
async function createGroup(owner, groupName) {
    const name = String(groupName).trim();

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

    try {
        const user = await requireUser(owner);

        const groupRef = await addDoc(
            collection(db, "groups"),
            {
                name: name,
                owner: owner,
                ownerUid: user.uid,
                members: [owner],
                memberUids: [user.uid],
                active: true,
                createdAt: serverTimestamp()
            }
        );

        return {
            success: true,
            message: "群組建立成功",
            groupId: groupRef.id
        };

    } catch (error) {
        console.error("建立群組失敗：", error);

        return {
            success: false,
            message: "建立群組失敗"
        };
    }
}

// 取得會員加入的群組
function getUserGroups(username) {
    return [...groupCache.values()].filter(
        group =>
            group.active &&
            group.members.includes(username)
    );
}

// 取得指定群組
function getGroup(groupId) {
    return groupCache.get(groupId) || null;
}

// 邀請好友加入群組
async function inviteFriendToGroup(
    groupId,
    inviter,
    friend
) {
    try {
        const user = await requireUser(inviter);

        if (!getFriends(inviter).includes(friend)) {
            return "只能邀請自己的好友";
        }

        const friendSnapshot = await getDoc(
            doc(db, "users", friend)
        );

        if (!friendSnapshot.exists()) {
            return "找不到好友";
        }

        const friendUid = friendSnapshot.data().uid;

        const groupRef = doc(db, "groups", groupId);

        const notificationRef = doc(
            collection(
                db,
                "users",
                friend,
                "notifications"
            )
        );

        return await runTransaction(
            db,
            async transaction => {
                const snapshot =
                    await transaction.get(groupRef);

                if (!snapshot.exists()) {
                    return "找不到群組";
                }

                const group = snapshot.data();

                if (!group.active) {
                    return "群組已解散";
                }

                if (!group.memberUids.includes(user.uid)) {
                    return "你不是群組成員";
                }

                if (group.memberUids.includes(friendUid)) {
                    return "對方已經在群組中";
                }

                if (group.members.length >= 30) {
                    return "群組成員已達上限";
                }

                // 更新群組成員
                transaction.update(groupRef, {
                    members: [...group.members, friend],
                    memberUids: [
                        ...group.memberUids,
                        friendUid
                    ]
                });

                // 同時建立雲端通知
                transaction.set(notificationRef, {
                    type: "group_invite",

                    message:
                        "👥 " + inviter +
                        " 邀請你加入群組「" +
                        group.name + "」",

                    sender: inviter,
                    senderUid: user.uid,
                    receiverUid: friendUid,
                    sourceId: groupId,
                    read: false,
                    createdAt: serverTimestamp()
                });

                return "已將好友加入群組";
            }
        );

    } catch (error) {
        console.error("邀請好友失敗：", error);
        return "邀請失敗";
    }
}

// 停止群組訊息監聽
function stopGroupMessageListener() {
    messageGeneration++;

    if (unsubscribeGroupMessages) {
        unsubscribeGroupMessages();
        unsubscribeGroupMessages = null;
    }

    groupMessageCache.clear();
}

// 啟動群組訊息即時監聽
async function startGroupMessageListener(
    groupId,
    username,
    onChange,
    onError = console.error
) {
    stopGroupMessageListener();

    const generation = messageGeneration;

    await requireUser(username);

    if (generation !== messageGeneration) {
        return;
    }

    const messagesQuery = query(
        collection(
            db,
            "groups",
            groupId,
            "messages"
        ),
        orderBy("createdAt", "asc")
    );

    unsubscribeGroupMessages = onSnapshot(
        messagesQuery,

        snapshot => {
            if (generation !== messageGeneration) {
                return;
            }

            const messages = snapshot.docs.map(
                messageDoc => {
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

            groupMessageCache.set(
                groupId,
                messages
            );

            onChange?.();
        },

        error => {
            if (generation !== messageGeneration) {
                return;
            }

            groupMessageCache.delete(groupId);
            onChange?.();
            onError(error);
        }
    );
}

// 傳送群組訊息
async function sendGroupMessage(
    groupId,
    sender,
    text
) {
    const messageText = String(text).trim();

    if (!messageText || messageText.length > 2000) {
        return false;
    }

    try {
        const user = await requireUser(sender);

        await addDoc(
            collection(
                db,
                "groups",
                groupId,
                "messages"
            ),
            {
                author: sender,
                senderUid: user.uid,
                text: messageText,
                timestamp: Date.now(),
                createdAt: serverTimestamp()
            }
        );

        return true;

    } catch (error) {
        console.error("群組訊息傳送失敗：", error);
        return false;
    }
}

// 取得群組訊息
function getGroupMessages(groupId, username) {
    const group = getGroup(groupId);

    if (!group || !group.members.includes(username)) {
        return [];
    }

    return [
        ...(groupMessageCache.get(groupId) || [])
    ];
}

// 離開群組
async function leaveGroup(groupId, username) {
    try {
        const user = await requireUser(username);

        const groupRef = doc(db, "groups", groupId);

        return await runTransaction(
            db,
            async transaction => {
                const snapshot =
                    await transaction.get(groupRef);

                if (!snapshot.exists()) {
                    return "找不到群組";
                }

                const group = snapshot.data();

                if (!group.active) {
                    return "群組已解散";
                }

                if (!group.memberUids.includes(user.uid)) {
                    return "你不是群組成員";
                }

                if (group.ownerUid === user.uid) {
                    return "群組建立者不能直接離開，請先解散群組";
                }

                transaction.update(groupRef, {
                    members: group.members.filter(
                        member => member !== username
                    ),

                    memberUids: group.memberUids.filter(
                        uid => uid !== user.uid
                    )
                });

                return "已離開群組";
            }
        );

    } catch (error) {
        console.error("離開群組失敗：", error);
        return "離開群組失敗";
    }
}

// 解散群組
async function deleteGroup(groupId, username) {
    try {
        const user = await requireUser(username);

        const groupRef = doc(db, "groups", groupId);

        return await runTransaction(
            db,
            async transaction => {
                const snapshot =
                    await transaction.get(groupRef);

                if (!snapshot.exists()) {
                    return "找不到群組";
                }

                const group = snapshot.data();

                if (group.ownerUid !== user.uid) {
                    return "只有群組建立者可以解散群組";
                }

                if (!group.active) {
                    return "群組已解散";
                }

                transaction.update(groupRef, {
                    active: false
                });

                return "群組已解散";
            }
        );

    } catch (error) {
        console.error("解散群組失敗：", error);
        return "解散群組失敗";
    }
}

// 匯出群組功能
export {
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
};