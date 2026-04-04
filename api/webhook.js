export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            // Data string me aaye ya JSON me, ye usko theek kar lega
            let body = req.body;
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch(e) {}
            }

            let token = null;
            if (body?.notificationDetails?.token) {
                token = body.notificationDetails.token;
            } else if (body?.token) {
                token = body.token;
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
    } else {
        return res.status(405).json({ error: "Only POST allowed." });
    }
}
