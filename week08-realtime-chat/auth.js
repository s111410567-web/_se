
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

const USERS_KEY = "chat-demo-users";
const SESSION_KEY = "chat-demo-session";

// 讀取示範帳號
function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch {
        return {};
    }
}

// 顯示訊息
function showMessage(message, success = false) {
    authMessage.textContent = message;
    authMessage.style.color = success ? "#43d98a" : "#ff7777";
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

// 註冊示範帳號
registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document
        .getElementById("registerUsername")
        .value.trim();

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

    if (password.length < 8) {
        showMessage("密碼至少需要 8 個字元");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("兩次輸入的密碼不一致");
        return;
    }

    const users = getUsers();

    if (Object.prototype.hasOwnProperty.call(users, username)) {
        showMessage("帳號已經存在");
        return;
    }

    // 僅供本機課堂示範，不能用於正式會員系統
    users[username] = { password };

    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {
        showMessage("無法儲存帳號，請檢查瀏覽器設定");
        return;
    }

    registerForm.reset();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");

    showMessage("註冊成功！請登入", true);
});

// 登入示範帳號
loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document
        .getElementById("loginUsername")
        .value.trim();

    const password = document
        .getElementById("loginPassword")
        .value;

    const users = getUsers();

    if (!users[username] || users[username].password !== password) {
        showMessage("帳號或密碼錯誤");
        return;
    }

    try {
        sessionStorage.setItem(SESSION_KEY, username);
    } catch {
        showMessage("無法建立登入狀態");
        return;
    }

    window.location.href = "index.html";
});
