export default async function handler(req, res) {
    const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (req.method === 'POST') {
        try {
            let body = req.body;
            if (typeof body === 'string') { try { body = JSON.parse(body); } catch(e) {} }

            // 📡 RADAR LOGIC (Isko abhi rehne dete hain safety ke liye)
            if (KV_URL && KV_TOKEN) {
                const logEntry = JSON.stringify({ time: new Date().toLocaleTimeString(), method: req.method, body: body });
                await fetch(KV_URL, { method: 'POST', headers: { Authorization: "Bearer " + KV_TOKEN }, body: JSON.stringify(["LPUSH", "geodash_logs", logEntry]) });
                await fetch(KV_URL, { method: 'POST', headers: { Authorization: "Bearer " + KV_TOKEN }, body: JSON.stringify(["LTRIM", "geodash_logs", 0, 4]) });
            }

            let token = null;

            // 1. Direct format check
            if (body?.notificationDetails?.token) {
                token = body.notificationDetails.token;
            } 
            // 2. 🔥 LOCK-BREAKER: Jo Radar me pakda gaya ("payload": "eyJ...") usko decode karna
            else if (body?.payload) {
                try {
                    // Base64 secret lock ko kholna
                    const decodedStr = Buffer.from(body.payload, 'base64').toString('utf-8');
                    const decodedJson = JSON.parse(decodedStr);
                    
                    // Andar se token nikalna
                    if (decodedJson?.notificationDetails?.token) {
                        token = decodedJson.notificationDetails.token;
                    } else if (decodedJson?.token) {
                        token = decodedJson.token;
                    }
                } catch(e) {
                    console.log("Decode error", e);
                }
            }

            // 🔥 Token mila toh Tijori me daalo!
            if (token && KV_URL && KV_TOKEN) {
                await fetch(KV_URL, {
                    method: 'POST',
                    headers: { Authorization: "Bearer " + KV_TOKEN },
                    body: JSON.stringify(["SADD", "geodash_tokens", token])
                });
            }
            
            return res.status(200).json({ success: true, caughtToken: !!token });
        } catch (error) {
            return res.status(500).json({ error: "System Error" });
        }
    } else {
        return res.status(200).json({ status: "Webhook Ready" });
    }
}
