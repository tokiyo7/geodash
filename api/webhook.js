export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            console.log("🚀 Farcaster Webhook Hit Hua! Data:", JSON.stringify(req.body));
            
            let token = null;
            
            // Token dhundhne ka smart tareeka
            if (req.body?.notificationDetails?.token) {
                token = req.body.notificationDetails.token;
            } else if (req.body?.token) {
                token = req.body.token;
            }

            if (!token) {
                console.log("⚠️ Farcaster ne message bheja par Token nahi tha usme.");
                return res.status(200).json({ success: true, note: "Token missing" });
            }

            // Tijori ki chaabi nikalna (Vercel KV aur Upstash dono ke liye support)
            const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
            const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
            
            if (!KV_URL || !KV_TOKEN) {
                console.log("❌ ERROR: Tijori ki chaabi (Keys) Vercel me nahi mili! Redeploy karo.");
                return res.status(500).json({ error: "Database keys missing" });
            }

            // Tijori me Token daalna
            const kvRes = await fetch(KV_URL, {
                method: 'POST',
                headers: { Authorization: "Bearer " + KV_TOKEN },
                body: JSON.stringify(["SADD", "geodash_tokens", token])
            });
            
            const kvData = await kvRes.json();
            console.log("✅ Token successfully tijori me save ho gaya! Upstash Response:", kvData);

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Backend Error:", error);
            return res.status(500).json({ error: "System Error" });
        }
    } else {
        return res.status(405).json({ error: "Sirf POST method allowed hai." });
    }
}
