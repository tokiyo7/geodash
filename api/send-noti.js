export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";

    if (req.method === 'GET') {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash Admin Panel</title>
                <style>
                    body { background: #05080f; color: #00f0ff; font-family: 'Courier New', monospace; text-align: center; padding: 40px; }
                    .box { border: 2px solid #ff3060; border-radius: 12px; padding: 30px; max-width: 400px; margin: 0 auto; background: rgba(10,15,24,0.9); }
                    input, textarea { width: 90%; padding: 12px; margin: 10px 0; border: 1px solid #00f0ff; background: #000; color: #fff; border-radius: 6px; }
                    button { background: linear-gradient(90deg, #ffd700, #ff8c00); color: #000; padding: 15px; width: 100%; border: none; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 16px; margin-top: 10px; }
                    button:hover { transform: scale(1.02); }
                </style>
            </head>
            <body>
                <div class="box">
                    <h2>🚀 GeoDash Broadcast</h2>
                    <p style="color:#888; font-size:12px;">Send notifications to all players</p>
                    
                    <form id="notiForm">
                        <input type="password" id="password" placeholder="Enter Secret Password" required>
                        <input type="text" id="title" placeholder="Notification Title (e.g., Update!)" required>
                        <textarea id="message" rows="4" placeholder="Type your message here..." required></textarea>
                        <button type="submit">SEND NOTIFICATION 🔥</button>
                    </form>
                    <p id="status" style="margin-top:15px; color:#00ff88; display:none;"></p>
                </div>

                <script>
                    document.getElementById('notiForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const btn = e.target.querySelector('button');
                        const status = document.getElementById('status');
                        
                        btn.innerText = "SENDING...";
                        btn.style.background = "#555";
                        btn.disabled = true;

                        const payload = {
                            password: document.getElementById('password').value,
                            title: document.getElementById('title').value,
                            message: document.getElementById('message').value
                        };

                        try {
                            const res = await fetch('/api/send-noti', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            
                            const data = await res.json();
                            
                            status.style.display = "block";
                            if(res.ok) {
                                status.style.color = "#00ff88";
                                status.innerText = "✅ " + data.message;
                            } else {
                                status.style.color = "#ff3060";
                                status.innerText = "❌ " + data.error;
                            }
                        } catch(err) {
                            status.style.display = "block";
                            status.style.color = "#ff3060";
                            status.innerText = "❌ Network Error!";
                        }
                        
                        btn.innerText = "SEND NOTIFICATION 🔥";
                        btn.style.background = "linear-gradient(90deg, #ffd700, #ff8c00)";
                        btn.disabled = false;
                    });
                </script>
            </body>
            </html>
        `;
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
    }

    if (req.method === 'POST') {
        const { password, title, message } = req.body;

        if (password !== MY_SECRET_PASSWORD) {
            return res.status(401).json({ error: "Wrong Password Boss!" });
        }

        try {
            const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
            const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
            const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

            if (!KV_URL || !KV_TOKEN) {
                return res.status(500).json({ error: "Database not connected yet!" });
            }

            const kvRes = await fetch(KV_URL, {
                method: 'POST',
                headers: { Authorization: "Bearer " + KV_TOKEN },
                body: JSON.stringify(["SMEMBERS", "geodash_tokens"])
            });
            
            const kvData = await kvRes.json();
            const tokens = kvData.result || [];

            if (tokens.length === 0) {
                return res.status(400).json({ error: "0 players found in database. No one to send to!" });
            }

            let successCount = 0;
            
            for (let token of tokens) {
                try {
                    const neynarRes = await fetch('https://api.neynar.com/v2/farcaster/frame/notifications', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'api_key': NEYNAR_API_KEY,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            notification: { title: title, body: message },
                            target_url: "https://geodash-amber.vercel.app",
                            token: token
                        })
                    });
                    if (neynarRes.ok) successCount++;
                } catch(e) {
                    console.error("Failed to send to token", token);
                }
            }

            return res.status(200).json({ message: "Successfully sent to " + successCount + " out of " + tokens.length + " players!" });
        } catch (error) {
            return res.status(500).json({ error: "Failed to send: " + error.message });
        }
    }
}
