const button = document.getElementById("peaceButton");
const myCountText = document.getElementById("myCount");
const globalCountText = document.getElementById("globalCount");

let myCount = Number(localStorage.getItem("peaceCount")) || 0;
myCountText.textContent = myCount + "回";

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

loadGlobalCount();

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

        myCount++;
        localStorage.setItem("peaceCount", myCount);

        myCountText.textContent = myCount + "回";
        globalCountText.textContent = result.count + "回";
    } catch (error) {
        console.error(error);
        alert("世界の回数を更新できませんでした。");
    } finally {
        button.disabled = false;
    }
});