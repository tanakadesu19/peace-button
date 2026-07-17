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

app.get("/api/count", async (req, res) => {
    const { data, error } = await supabase
        .from("peace_count")
        .select("count")
        .eq("id", 1)
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

app.get("/api/today-count", async (req, res) => {
    const today = new Date().toLocaleDateString("sv-SE", {
        timeZone: "Asia/Tokyo"
    });

    const { data, error } = await supabase
        .from("peace_daily_counts")
        .select("count")
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

app.post("/api/count", async (req, res) => {
    const { data, error } = await supabase.rpc(
        "increment_peace_counts"
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

    io.emit("countUpdated", {
        totalCount: Number(result.total_count),
        todayCount: Number(result.today_count)
    });

    res.json({
        success: true,
        totalCount: Number(result.total_count),
        todayCount: Number(result.today_count)
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