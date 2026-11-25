import { auth, db } from "./firebase.js";

import {
    collection,
    doc,
    getDoc,
    query,
    where,
    onSnapshot,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// 好友資料快取
let friendshipCache = [];
let unsubscribeListeners = [];
let listenerGeneration = 0;

// 統一帳號格式
function normalizeUsername(username) {
    return String(username || "").trim().toLowerCase();
}

// 確認登入身分
async function requireUser(username) {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
        throw new Error("請先登入");
    }

    if (user.email !== normalizeUsername(username) + "@chat.example.com") {
        throw new Error("登入身分不符");
    }

    return user;
}

// 建立固定的好友關係 ID
function getFriendshipId(username1, username2) {
    return [
        normalizeUsername(username1),
        normalizeUsername(username2)
    ].sort().join(":");
}

// 搜尋雲端會員
async function searchUser(username) {
    username = normalizeUsername(username);

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
        return false;
    }

    await auth.authStateReady();

    const userRef = doc(db, "users", username);
    const snapshot = await getDoc(userRef);

    return snapshot.exists();
}

// 發送好友邀請
async function sendFriendRequest(sender, receiver) {
    sender = normalizeUsername(sender);
    receiver = normalizeUsername(receiver);

    if (!receiver) {
        return "請輸入會員帳號";
    }

    if (sender === receiver) {
        return "不能加自己為好友";
    }

    if (!/^[a-z0-9_]{3,30}$/.test(receiver)) {
        return "找不到這個會員";
    }

    const currentUser = await requireUser(sender);

    const receiverRef = doc(db, "users", receiver);
    const receiverSnapshot = await getDoc(receiverRef);

    if (!receiverSnapshot.exists()) {
        return "找不到這個會員";
    }

    const receiverUid = receiverSnapshot.data().uid;

    const friendshipId = getFriendshipId(
        sender,
        receiver
    );

    const friendshipRef = doc(
        db,
        "friendships",
        friendshipId
    );

    const notificationRef = doc(
        collection(
            db,
            "users",
            receiver,
            "notifications"
        )
    );

    return await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(friendshipRef);

        if (snapshot.exists()) {
            const data = snapshot.data();

            if (data.status === "accepted") {
                return "你們已經是好友";
            }

            if (data.sender === sender) {
                return "已經發送過好友邀請";
            }

            return "對方已經邀請你，請先處理邀請";
        }

        // 建立好友邀請
        transaction.set(friendshipRef, {
            sender: sender,
            receiver: receiver,
            senderUid: currentUser.uid,
            receiverUid: receiverUid,
            status: "pending"
        });

        // 同時建立雲端通知
        transaction.set(notificationRef, {
            type: "friend_request",
            message: "👤 " + sender + " 向你發送好友邀請",
            sender: sender,
            senderUid: currentUser.uid,
            receiverUid: receiverUid,
            sourceId: friendshipId,
            read: false,
            createdAt: serverTimestamp()
        });

        return "好友邀請已送出";
    });
}

// 接受好友邀請
async function acceptFriendRequest(username, sender) {
    username = normalizeUsername(username);
    sender = normalizeUsername(sender);

    const user = await requireUser(username);

    const friendshipRef = doc(
        db,
        "friendships",
        getFriendshipId(username, sender)
    );

    return await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(friendshipRef);

        if (!snapshot.exists()) {
            return "找不到好友邀請";
        }

        const data = snapshot.data();

        if (
            data.receiverUid !== user.uid ||
            data.status !== "pending"
        ) {
            return "找不到好友邀請";
        }

        transaction.update(friendshipRef, {
            status: "accepted"
        });

        return "已接受好友邀請";
    });
}

// 拒絕好友邀請
async function rejectFriendRequest(username, sender) {
    username = normalizeUsername(username);
    sender = normalizeUsername(sender);

    const user = await requireUser(username);

    const friendshipRef = doc(
        db,
        "friendships",
        getFriendshipId(username, sender)
    );

    return await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(friendshipRef);

        if (!snapshot.exists()) {
            return "找不到好友邀請";
        }

        const data = snapshot.data();

        if (
            data.receiverUid !== user.uid ||
            data.status !== "pending"
        ) {
            return "找不到好友邀請";
        }

        transaction.delete(friendshipRef);

        return "已拒絕好友邀請";
    });
}

// 取得好友列表
function getFriends(username) {
    username = normalizeUsername(username);

    return friendshipCache
        .filter(item =>
            item.status === "accepted" &&
            (
                item.sender === username ||
                item.receiver === username
            )
        )
        .map(item =>
            item.sender === username
                ? item.receiver
                : item.sender
        );
}

// 取得收到的好友邀請
function getFriendRequests(username) {
    username = normalizeUsername(username);

    return friendshipCache
        .filter(item =>
            item.receiver === username &&
            item.status === "pending"
        )
        .map(item => item.sender);
}

// 刪除好友
async function removeFriend(username, friendName) {
    username = normalizeUsername(username);
    friendName = normalizeUsername(friendName);

    const user = await requireUser(username);

    const friendshipRef = doc(
        db,
        "friendships",
        getFriendshipId(username, friendName)
    );

    return await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(friendshipRef);

        if (!snapshot.exists()) {
            return "對方不是你的好友";
        }

        const data = snapshot.data();

        if (
            data.status !== "accepted" ||
            (
                data.senderUid !== user.uid &&
                data.receiverUid !== user.uid
            )
        ) {
            return "對方不是你的好友";
        }

        transaction.delete(friendshipRef);

        return "已刪除好友";
    });
}

// 停止雲端監聽
function stopFriendshipListener() {
    listenerGeneration++;

    unsubscribeListeners.forEach(unsubscribe => {
        unsubscribe();
    });

    unsubscribeListeners = [];
    friendshipCache = [];
}

// 即時監聽雲端好友資料
async function startFriendshipListener(
    username,
    onChange,
    onError = console.error
) {
    stopFriendshipListener();

    const generation = listenerGeneration;
    const user = await requireUser(username);

    if (generation !== listenerGeneration) {
        return;
    }

    const friendshipsRef = collection(db, "friendships");

    const sentQuery = query(
        friendshipsRef,
        where("senderUid", "==", user.uid)
    );

    const receivedQuery = query(
        friendshipsRef,
        where("receiverUid", "==", user.uid)
    );

    let sentData = [];
    let receivedData = [];

    function refreshCache() {
        if (generation !== listenerGeneration) {
            return;
        }

        const merged = new Map();

        [...sentData, ...receivedData].forEach(item => {
            merged.set(item.id, item);
        });

        friendshipCache = [...merged.values()];

        if (typeof onChange === "function") {
            onChange();
        }
    }

    const unsubscribeSent = onSnapshot(
        sentQuery,
        snapshot => {
            sentData = snapshot.docs.map(item => ({
                ...item.data(),
                id: item.id
            }));

            refreshCache();
        },
        onError
    );

    const unsubscribeReceived = onSnapshot(
        receivedQuery,
        snapshot => {
            receivedData = snapshot.docs.map(item => ({
                ...item.data(),
                id: item.id
            }));

            refreshCache();
        },
        onError
    );

    unsubscribeListeners = [
        unsubscribeSent,
        unsubscribeReceived
    ];
}

// 匯出功能
export {
    searchUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriends,
    getFriendRequests,
    removeFriend,
    startFriendshipListener,
    stopFriendshipListener
};