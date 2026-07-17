const button = document.getElementById("peaceButton");
const myCountText = document.getElementById("myCount");
const globalCountText = document.getElementById("globalCount");
const todayCountText = document.getElementById("todayCount");
const peaceMessage = document.getElementById("peaceMessage");
const loadingScreen = document.getElementById("loadingScreen");
const socket = io();

const pageTitle = document.getElementById("pageTitle");
const myCountLabel = document.getElementById("myCountLabel");
const globalCountLabel = document.getElementById("globalCountLabel");
const todayCountLabel = document.getElementById("todayCountLabel");
const loadingText = document.getElementById("loadingText");

// 言語切り替えボタン
const languageButton = document.getElementById("languageButton");

// ボタン効果音
const clickSound = new Audio("click.mp3");

// 翻訳データ
const translations = {
    ja: {
        title: " 平和ボタン",
        button: "平和",
        myCountLabel: "あなたが押した回数",
        globalCountLabel: "世界のみんなが押した回数",
        todayCountLabel: "今日押された回数",
        loading: "平和を準備しています…",
        peacePlusOne: "🕊️ 平和 +1",
        updateError: "更新に失敗しました",
        countSuffix: "回",
        fetchError: "取得エラー"
    },

    en: {
        title: " Peace Button",
        button: "Peace",
        myCountLabel: "Your presses",
        globalCountLabel: "Presses around the world",
        todayCountLabel: "Presses today",
        loading: "Preparing peace…",
        peacePlusOne: "🕊️ Peace +1",
        updateError: "Update failed",
        countSuffix: "",
        fetchError: "Failed to load"
    }
};

// 言語を判定して表示を変更
const browserLanguage = navigator.language.toLowerCase();

let language =
    localStorage.getItem("peaceLanguage") ||
    (browserLanguage.startsWith("ja") ? "ja" : "en");

let text = translations[language];

function applyLanguage() {
    text = translations[language];

    document.documentElement.lang = language;

    pageTitle.textContent = text.title;
    button.textContent = text.button;
    myCountLabel.textContent = text.myCountLabel;
    globalCountLabel.textContent = text.globalCountLabel;
    todayCountLabel.textContent = text.todayCountLabel;
    loadingText.textContent = text.loading;

    myCountText.textContent =
        myCount + text.countSuffix;

    const globalCount =
        Number(globalCountText.textContent.replace("回", "")) || 0;

    const todayCount =
        Number(todayCountText.textContent.replace("回", "")) || 0;

    globalCountText.textContent =
        globalCount + text.countSuffix;

    todayCountText.textContent =
        todayCount + text.countSuffix;

    languageButton.textContent =
        language === "ja" ? "English" : "日本語";
}

// 自分の回数を読み込む
let myCount = Number(localStorage.getItem("peaceCount")) || 0;

applyLanguage();

// 切り替え処理
languageButton.addEventListener("click", () => {
    language = language === "ja" ? "en" : "ja";

    localStorage.setItem("peaceLanguage", language);

    applyLanguage();
});

// 世界の回数を読み込む
async function loadGlobalCount() {
    try {
        const response = await fetch("/api/count");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "取得に失敗しました");
        }

        globalCountText.textContent = result.count + text.countSuffix;
    } catch (error) {
        console.error(error);
        globalCountText.textContent = text.fetchError;
    } finally {
        loadingScreen.classList.add("hidden");

        setTimeout(() => {
            loadingScreen.style.display = "none";
        }, 400);
    }
}

// 今日の回数を読み込む
async function loadTodayCount() {
    try {
        const response = await fetch("/api/today-count");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "取得に失敗しました");
        }

        todayCountText.textContent = result.count + text.countSuffix;
    } catch (error) {
        console.error(error);
        todayCountText.textContent = text.fetchError;
    }
}

// 最初の読み込み
loadGlobalCount();
loadTodayCount();

// リアルタイム更新
socket.on("countUpdated", (counts) => {
    globalCountText.textContent =
        counts.totalCount + text.countSuffix;

    todayCountText.textContent =
        counts.todayCount + text.countSuffix;
});

// ボタンを押したとき
button.addEventListener("click", async () => {

    clickSound.currentTime = 0;
    clickSound.play();
    clickSound.volume = 0.4;

    if (button.disabled) {
        return;
    }

    button.disabled = true;

    // 更新前の数字を保存
    const previousMyCount = myCount;

    const previousGlobalCount =
        Number(globalCountText.textContent.replace("回", "")) || 0;

    const previousTodayCount =
        Number(todayCountText.textContent.replace("回", "")) || 0;

    // 押した瞬間に仮の数字を表示
    myCount++;
    localStorage.setItem("peaceCount", myCount);

    myCountText.textContent = myCount + text.countSuffix;
    globalCountText.textContent =
        previousGlobalCount + 1 + text.countSuffix;
    todayCountText.textContent =
        previousTodayCount + 1 + text.countSuffix;

    // 演出
    peaceMessage.textContent = text.peacePlusOne;
    peaceMessage.classList.remove("show");
    void peaceMessage.offsetWidth;
    peaceMessage.classList.add("show");

    button.classList.add("pressed");

    try {
        // サーバーに更新を送る
        const response = await fetch("/api/count", {
            method: "POST"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "更新に失敗しました");
        }

        // サーバーから返った正確な数字に合わせる
        globalCountText.textContent =
            result.totalCount + text.countSuffix;

        todayCountText.textContent =
            result.todayCount + text.countSuffix;       
    } catch (error) {
        console.error(error);

        // 失敗したら元の数字に戻す
        myCount = previousMyCount;
        localStorage.setItem("peaceCount", myCount);

        myCountText.textContent = previousMyCount + "回";
        globalCountText.textContent = previousGlobalCount + "回";
        todayCountText.textContent = previousTodayCount + "回";

        peaceMessage.textContent = "更新に失敗しました";
    } finally {
        setTimeout(() => {
            button.classList.remove("pressed");
        }, 180);

        setTimeout(() => {
            peaceMessage.classList.remove("show");
        }, 700);

        button.disabled = false;
    }
});