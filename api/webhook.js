export default async function handler(req, res) {
    const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    // 📡 RADAR LOGIC: Har request ko record karo taaki screen par dikhe
    try {
        if (KV_URL && KV_TOKEN) {
            const logEntry = JSON.stringify({
                time: new Date().toLocaleTimeString(),
                method: req.method,
                body: req.body || "Khali Body Aayi Hai"
            });
            
            await fetch(KV_URL, {
                method: 'POST',
                headers: { Authorization: "Bearer " + KV_TOKEN },
                body: JSON.stringify(["LPUSH", "geodash_logs", logEntry])
            });
            
            // Sirf last 5 logs save rakho
            await fetch(KV_URL, {
                method: 'POST',
                headers: { Authorization: "Bearer " + KV_TOKEN },
                body: JSON.stringify(["LTRIM", "geodash_logs", 0, 4]) 
            });
        }
    } catch (e) {
        console.error("Radar Error", e);
    }

    // 🔥 ASLI WEBHOOK LOGIC
    if (req.method === 'POST') {
        try {
            let body = req.body;
            if (typeof body === 'string') { try { body = JSON.parse(body); } catch(e) {} }

            let token = null;
            if (body?.notificationDetails?.token) {
                token = body.notificationDetails.token;
            } else if (body?.token) {
                token = body.token;
            } else if (body?.data?.token) {
                token = body.data.token; // Backup catch
            }

            if (token && KV_URL && KV_TOKEN) {
                await fetch(KV_URL, {
                    method: 'POST',
                    headers: { Authorization: "Bearer " + KV_TOKEN },
                    body: JSON.stringify(["SADD", "geodash_tokens", token])
                });
            }
            
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "System Error" });
        }
    } else {
        return res.status(200).json({ status: "Radar Active" });
    }
}
