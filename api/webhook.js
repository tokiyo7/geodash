export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            let token = null;
            
            // Farcaster se Token pakadna
            if (req.body?.notificationDetails?.token) {
                token = req.body.notificationDetails.token;
            } else if (req.body?.token) {
                token = req.body.token;
            }

            if (token) {
                const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
                const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
                
                if (KV_URL && KV_TOKEN) {
                    // Token ko Upstash Tijori me save karna
                    await fetch(KV_URL, {
                        method: 'POST',
                        headers: { Authorization: "Bearer " + KV_TOKEN },
                        body: JSON.stringify(["SADD", "geodash_tokens", token])
                    });
                }
            }
            // Farcaster ko bolna "Sab theek hai"
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "System Error" });
        }
    } else {
        return res.status(405).json({ error: "Only POST allowed." });
    }
}
