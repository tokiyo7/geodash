export default async function handler(req, res) {
    const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (req.method === 'POST') {
        try {
            let body = req.body;
            if (typeof body === 'string') { try { body = JSON.parse(body); } catch(e) {} }

            let decodedJson = null;
            let token = null;

            // 🔥 ADVANCED LOCK-BREAKER 2.0: Base64URL ko theek karke todna 🔥
            if (body?.payload) {
                try {
                    // Farcaster ke lock (Base64URL) ko standard format me lana
                    let base64 = body.payload.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) { base64 += '='; } // Missing padding theek karna
                    
                    // Lock tod kar andar ka JSON nikalna
                    const decodedStr = Buffer.from(base64, 'base64').toString('utf-8');
                    decodedJson = JSON.parse(decodedStr);
                    
                    // Andar se asli Token nikalna
                    if (decodedJson?.notificationDetails?.token) {
                        token = decodedJson.notificationDetails.token;
                    } else if (decodedJson?.token) {
                        token = decodedJson.token;
                    }
                } catch(e) {
                    decodedJson = { error: "Lock tootne me fail hua", details: e.message };
                }
            }

            // 📡 RADAR LOGIC: Ab Radar me khula hua lock (Decoded Data) dikhega!
            if (KV_URL && KV_TOKEN) {
                const logEntry = JSON.stringify({ 
                    time: new Date().toLocaleTimeString(), 
                    Status: token ? "✅ TOKEN MIL GAYA!" : "❌ TOKEN NAHI MILA",
                    DecodedData: decodedJson || body 
                });
                await fetch(KV_URL, { method: 'POST', headers: { Authorization: "Bearer " + KV_TOKEN }, body: JSON.stringify(["LPUSH", "geodash_logs", logEntry]) });
                await fetch(KV_URL, { method: 'POST', headers: { Authorization: "Bearer " + KV_TOKEN }, body: JSON.stringify(["LTRIM", "geodash_logs", 0, 4]) });
            }

            // 🔥 Token mila toh chupchaap Tijori me daalo!
            if (token && KV_URL && KV_TOKEN) {
                await fetch(KV_URL, {
                    method: 'POST',
                    headers: { Authorization: "Bearer " + KV_TOKEN },
                    body: JSON.stringify(["SADD", "geodash_tokens", token])
                });
            }
            
            return res.status(200).json({ success: true, tokenCaught: !!token });
        } catch (error) {
            return res.status(500).json({ error: "System Error" });
        }
    } else {
        return res.status(200).json({ status: "Webhook Ready" });
    }
}
