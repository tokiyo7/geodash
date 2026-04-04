export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            console.log("🚀 Farcaster Webhook Hit Hua!");
            
            // Farcaster jo token bhej raha hai usko nikalna
            let token = null;
            if (req.body && req.body.notificationDetails) {
                token = req.body.notificationDetails.token;
            } else if (req.body && req.body.token) {
                token = req.body.token;
            }

            // Agar token mila, toh usko Tijori (Vercel KV) me save karna
            if (token) {
                const KV_URL = process.env.KV_REST_API_URL;
                const KV_TOKEN = process.env.KV_REST_API_TOKEN;
                
                if (KV_URL && KV_TOKEN) {
                    // SADD ka matlab hota hai Set Add (taaki ek banda 2 baar save na ho jaye)
                    await fetch(KV_URL, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${KV_TOKEN}` },
                        body: JSON.stringify(["SADD", "geodash_tokens", token])
                    });
                    console.log("Token successfully tijori me save ho gaya!");
                }
            }

            // Farcaster ko 'Sab theek hai' batana
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Backend Error:", error);
            return res.status(500).json({ error: "System Error" });
        }
    } else {
        return res.status(405).json({ error: "No Bhai, Sirf Farcaster Allowed Hai." });
    }
}
