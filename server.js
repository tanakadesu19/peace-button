require("dotenv").config();

console.log(process.env.SUPABASE_URL);

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

app.get("/api/count/:buttonKey", async (req, res) => {
    const { buttonKey } = req.params;
    const { data, error } = await supabase
        .from("button_counts")
        .select("count")
        .eq("button_key", buttonKey)
        .single();

    if (error) {
        console.error("GET ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "世界の回数を取得できませんでした"
        });
    }

    res.json({
        success: true,
        count: data.count
    });
});

app.get("/api/today-count/:buttonKey", async (req, res) => {
    const { buttonKey } = req.params;

    const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: "Asia/Tokyo"
    });

    const { data, error } = await supabase
        .from("button_daily_counts")
        .select("count")
        .eq("button_key", buttonKey)
        .eq("count_date", today)
        .maybeSingle();

    if (error) {
        console.error("TODAY COUNT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "今日の回数を取得できませんでした"
        });
    }

    res.json({
        success: true,
        count: data?.count ?? 0
    });
});

app.post("/api/count/:buttonKey", async (req, res) => {

    const { buttonKey } = req.params;

    const { data, error } = await supabase.rpc(
        "increment_button_counts",
        {
            p_button_key: buttonKey
        }
    );

    if (error) {
        console.error("INCREMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "回数を更新できませんでした"
        });
    }

    const result = data?.[0];

    if (!result) {
        return res.status(500).json({
            success: false,
            message: "更新結果を取得できませんでした"
        });
    }

    const totalCount = Number(result.total_count);
    const todayCount = Number(result.today_count);

    io.emit("countUpdated", {
        buttonKey,
        totalCount,
        todayCount
    });

    res.json({
        success: true,
        buttonKey,
        totalCount,
        todayCount
    });
});

app.get("/debug", async (req, res) => {
    const { data, error } = await supabase
        .from("peace_count")
        .select("*");

    res.json({
        url: process.env.SUPABASE_URL,
        data,
        error
    });
});

server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});