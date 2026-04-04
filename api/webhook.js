export default async function handler(req, res) {
    // 🔥 BROWSER TESTING TOOL (Isse pata chalega Tijori connected hai ya nahi)
    if (req.method === 'GET') {
        const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
        const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
        
        if (!KV_URL || !KV_TOKEN) {
            return res.status(500).json({ error: "❌ TIJORI Vercel se connect nahi hui hai! (Chaabi missing hai)" });
        }

        try {
            // Ek nakli (fake) token tijori me daal kar test kar rahe hain
            const kvRes = await fetch(KV_URL, {
                method: 'POST',
                headers: { Authorization: "Bearer " + KV_TOKEN },
                body: JSON.stringify(["SADD", "geodash_tokens", "test-token-123"])
            });
            const data = await kvRes.json();
            
            return res.status(200).json({
                status: "✅ TIJORI 100% PERFECT CONNECTED HAI!",
                instruction: "Ab apna Admin Panel (api/send-noti) kholo. Wahan 0 ki jagah '1 player' dikhna chahiye!"
            });
        } catch(e) {
            return res.status(500).json({ error: "❌ Tijori connect hui par data save nahi ho raha." });
        }
    }

    // 🔥 ASLI WEBHOOK LOGIC (Jo Farcaster use karega)
    if (req.method === 'POST') {
        try {
            let token = null;
            if (req.body && req.body.notificationDetails) {
                token = req.body.notificationDetails.token;
            } else if (req.body && req.body.token) {
                token = req.body.token;
            }

            if (token) {
                const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
                const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
                
                if (KV_URL && KV_TOKEN) {
                    await fetch(KV_URL, {
                        method: 'POST',
                        headers: { Authorization: "Bearer " + KV_TOKEN },
                        body: JSON.stringify(["SADD", "geodash_tokens", token])
                    });
                }
            }
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "System Error" });
        }
    }
}
