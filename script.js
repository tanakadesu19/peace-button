const button = document.getElementById("peaceButton");
const myCountText = document.getElementById("myCount");
const globalCountText = document.getElementById("globalCount");
const peaceMessage = document.getElementById("peaceMessage");

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

// ボタンを押したとき
button.addEventListener("click", async () => {
    button.disabled = true;

    try {
        const response = await fetch("/api/count", {
            method: "POST"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "更新に失敗しました");
        }

        // 自分の回数を増やす
        myCount++;
        localStorage.setItem("peaceCount", myCount);

        // 回数表示を更新
        myCountText.textContent = myCount + "回";
        globalCountText.textContent = result.count + "回";

        // 「平和 +1」の演出
        peaceMessage.textContent = "🕊️ 平和 +1";
        peaceMessage.classList.remove("show");

        // 同じアニメーションを毎回再生するため
        void peaceMessage.offsetWidth;

        peaceMessage.classList.add("show");
        button.classList.add("pressed");

        setTimeout(() => {
            button.classList.remove("pressed");
            peaceMessage.classList.remove("show");
        }, 800);
    } catch (error) {
        console.error(error);
        alert("世界の回数を更新できませんでした。");
    } finally {
        button.disabled = false;
    }
});