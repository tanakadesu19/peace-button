const button = document.getElementById("peaceButton");
const myCountText = document.getElementById("myCount");
const globalCountText = document.getElementById("globalCount");
const peaceMessage = document.getElementById("peaceMessage");
const socket = io();

// 自分の回数を読み込む
let myCount = Number(localStorage.getItem("peaceCount")) || 0;
myCountText.textContent = myCount + "回";

// 世界の回数を取得
async function loadGlobalCount() {
    try {
        const response = await fetch("/api/count");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "取得に失敗しました");
        }

        globalCountText.textContent = result.count + "回";
    } catch (error) {
        console.error(error);
        globalCountText.textContent = "取得エラー";
    }
}

// 最初に世界の回数を表示
loadGlobalCount();

socket.on("countUpdated", (newCount) => {
    globalCountText.textContent = newCount + "回";
});

// 5秒ごとに世界の回数を更新
setInterval(loadGlobalCount, 5000);

// ボタンを押したとき
button.addEventListener("click", async () => {
    button.disabled = true;

    // 押した瞬間に画面を反応させる
    const previousMyCount = myCount;
    const previousGlobalCount =
        Number(globalCountText.textContent.replace("回", "")) || 0;

    myCount++;
    localStorage.setItem("peaceCount", myCount);

    myCountText.textContent = myCount + "回";
    globalCountText.textContent = previousGlobalCount + 1 + "回";

    peaceMessage.textContent = "🕊️ 平和 +1";
    peaceMessage.classList.remove("show");
    void peaceMessage.offsetWidth;
    peaceMessage.classList.add("show");
    button.classList.add("pressed");

    try {
        // 裏側でサーバーへ送信
        const response = await fetch("/api/count", {
            method: "POST"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "更新に失敗しました");
        }

        // サーバーが返した正確な数字に合わせる
        globalCountText.textContent = result.count + "回";
    } catch (error) {
        console.error(error);

        // 失敗した場合は元の数字に戻す
        myCount = previousMyCount;
        localStorage.setItem("peaceCount", myCount);

        myCountText.textContent = myCount + "回";
        globalCountText.textContent = previousGlobalCount + "回";

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