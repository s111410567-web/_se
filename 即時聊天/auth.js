
import { auth, db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    setPersistence,
    browserSessionPersistence,
    signOut
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const SESSION_KEY = "chat-demo-session";
// 建立 Firestore 雲端會員索引
async function ensureCloudUser(user, username) {
    const userRef = doc(db, "users", username);

    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            username: username
        });
    } else if (userSnapshot.data().uid !== user.uid) {
        throw new Error("會員索引與登入帳號不一致");
    }
}

// 將帳號名稱轉換成內部電子郵件格式
function usernameToEmail(username) {
    return username.toLowerCase() + "@chat.example.com";
}

// 顯示提示訊息
function showMessage(message, success = false) {
    authMessage.textContent = message;
    authMessage.style.color = success
        ? "#43d98a"
        : "#ff7777";
}

// 驗證帳號格式
function isValidUsername(username) {
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

// Firebase 錯誤訊息
function getErrorMessage(error) {
    switch (error.code) {
        case "auth/email-already-in-use":
            return "帳號已經存在";

        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "帳號或密碼錯誤";

        case "auth/weak-password":
            return "密碼強度不足";

        case "auth/network-request-failed":
            return "網路連線失敗，請稍後再試";

        case "auth/too-many-requests":
            return "操作次數過多，請稍後再試";

        default:
            return "操作失敗：" + error.code;
    }
}

// 切換到註冊畫面
showRegister.addEventListener("click", (event) => {
    event.preventDefault();

    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");

    showMessage("");
});

// 切換到登入畫面
showLogin.addEventListener("click", (event) => {
    event.preventDefault();

    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");

    showMessage("");
});

// Firebase 雲端會員註冊
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document
        .getElementById("registerUsername")
        .value.trim().toLowerCase();

    const password = document
        .getElementById("registerPassword")
        .value;

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value;

    if (!username || !password) {
        showMessage("請填寫完整資料");
        return;
    }

    if (!isValidUsername(username)) {
        showMessage("帳號須為3至30個英文字母、數字或底線");
        return;
    }

    if (password.length < 8) {
        showMessage("密碼至少需要 8 個字元");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("兩次輸入的密碼不一致");
        return;
    }

    try {
        showMessage("正在建立雲端帳號...", true);

        await setPersistence(
            auth,
            browserSessionPersistence
        );

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                usernameToEmail(username),
                password
            );

        await updateProfile(credential.user, {
            displayName: username
        });

        await signOut(auth);

        registerForm.reset();
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");

        showMessage("雲端帳號註冊成功！請登入", true);

    } catch (error) {
        console.error(error);
        showMessage(getErrorMessage(error));
    }
});

// Firebase 雲端會員登入
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document
        .getElementById("loginUsername")
        .value.trim().toLowerCase();

    const password = document
        .getElementById("loginPassword")
        .value;

    if (!isValidUsername(username) || !password) {
        showMessage("請輸入正確的帳號與密碼");
        return;
    }

    try {
        showMessage("正在登入雲端帳號...", true);

        await setPersistence(
            auth,
            browserSessionPersistence
        );

        const credential =
            await signInWithEmailAndPassword(
                auth,
                usernameToEmail(username),
                password
            );

await ensureCloudUser(credential.user, username);

        sessionStorage.setItem(
            SESSION_KEY,
            username
        );

        sessionStorage.setItem(
            "chat-firebase-uid",
            credential.user.uid
        );

        window.location.href = "index.html";

    } catch (error) {
        console.error(error);
        showMessage(getErrorMessage(error));
    }
});
