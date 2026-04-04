// api/webhook.js
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            console.log("🚀 Farcaster Webhook Hit Hua!");
            // Farcaster ko 'Sab theek hai' batane ke liye success bhejte hain
            return res.status(200).json({ 
                success: true, 
                message: "GeoDash Backend System Live!" 
            });
        } catch (error) {
            console.error("Backend Error:", error);
            return res.status(500).json({ error: "System Error" });
        }
    } else {
        return res.status(405).json({ error: "No Bhai, Sirf Farcaster Allowed Hai." });
    }
}
