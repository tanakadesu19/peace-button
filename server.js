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

app.post("/api/count", async (req, res) => {
    try {
        const { data, error } = await supabase.rpc(
            "increment_peace_count"
        );

        if (error) {
            console.error("UPDATE ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "世界の回数を更新できませんでした"
            });
        }

        io.emit("countUpdated", Number(data));

        res.json({
            success: true,
            count: Number(data)
        });
    } catch (error) {
        console.error("SERVER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "サーバーでエラーが発生しました"
        });
    }
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