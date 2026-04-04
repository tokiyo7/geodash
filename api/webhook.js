export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            console.log("🚀 Farcaster Webhook Hit Hua!");
            
            let token = null;
            if (req.body && req.body.notificationDetails) {
                token = req.body.notificationDetails.token;
            } else if (req.body && req.body.token) {
                token = req.body.token;
            }

            if (token) {
                // Support both Vercel KV and Upstash Redis
                const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
                const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
                
                if (KV_URL && KV_TOKEN) {
                    await fetch(KV_URL, {
                        method: 'POST',
                        headers: { Authorization: "Bearer " + KV_TOKEN },
                        body: JSON.stringify(["SADD", "geodash_tokens", token])
                    });
                    console.log("Token successfully tijori me save ho gaya!");
                }
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Backend Error:", error);
            return res.status(500).json({ error: "System Error" });
        }
    } else {
        return res.status(405).json({ error: "No Bhai, Sirf Farcaster Allowed Hai." });
    }
}
