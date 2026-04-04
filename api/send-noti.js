export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";

    if (req.method === 'GET') {
        let radarHtml = "<p style='color:#888'>Farcaster se abhi tak koi data nahi aaya hai...</p>";
        
        try {
            const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
            const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
            
            if (KV_URL && KV_TOKEN) {
                const logRes = await fetch(KV_URL, {
                    method: 'POST',
                    headers: { Authorization: "Bearer " + KV_TOKEN },
                    body: JSON.stringify(["LRANGE", "geodash_logs", 0, 4])
                });
                const logData = await logRes.json();
                
                if (logData.result && logData.result.length > 0) {
                    radarHtml = logData.result.map(l => `<div style="background:#111; padding:8px; margin-bottom:5px; border-radius:4px; font-size:11px; text-align:left; word-wrap:break-word; border:1px solid #333;">${l}</div>`).join('');
                }
            }
        } catch(e) {
            radarHtml = "<p style='color:red'>Radar Error.</p>";
        }

        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash Broadcast</title>
                <style>
                    body { background: #05080f; color: #00f0ff; font-family: 'Courier New', monospace; text-align: center; padding: 20px; }
                    .box { border: 2px solid #ff3060; border-radius: 12px; padding: 20px; max-width: 400px; margin: 0 auto; background: rgba(10,15,24,0.9); }
                    input, textarea { width: 90%; padding: 12px; margin: 10px 0; border: 1px solid #00f0ff; background: #000; color: #fff; border-radius: 6px; }
                    button { background: linear-gradient(90deg, #ffd700, #ff8c00); color: #000; padding: 15px; width: 100%; border: none; font-weight: bold; cursor: pointer; border-radius: 6px; font-size: 16px; margin-top: 10px; }
                    button:hover { transform: scale(1.02); }
                    .radar-box { border: 1px solid #00ff88; border-radius: 12px; padding: 15px; max-width: 400px; margin: 20px auto; background: rgba(0,255,136,0.05); }
                </style>
            </head>
            <body>
                <div class="box">
                    <h2>🚀 GeoDash Broadcast</h2>
                    <form id="notiForm">
                        <input type="password" id="password" placeholder="Enter Secret Password" required>
                        <input type="text" id="title" placeholder="Notification Title" required>
                        <textarea id="message" rows="4" placeholder="Type your message..." required></textarea>
                        <button type="submit">SEND NOTIFICATION 🔥</button>
                    </form>
                    <p id="status" style="margin-top:15px; font-weight:bold; display:none;"></p>
                </div>

                <div class="radar-box">
                    <h3 style="margin-top:0; color:#00ff88;">📡 Farcaster Radar</h3>
                    <p style="font-size:12px; color:#888;">Live Token Tracking</p>
                    ${radarHtml}
                </div>

                <script>
                    document.getElementById('notiForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const btn = e.target.querySelector('button');
                        const status = document.getElementById('status');
                        
                        btn.innerText = "SENDING...";
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
        if (password !== MY_SECRET_PASSWORD) return res.status(401).json({ error: "Wrong Password Boss!" });

        try {
            const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
            const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

            if (!KV_URL || !KV_TOKEN) return res.status(500).json({ error: "Database keys missing in Vercel!" });

            // Fetch tokens from DB
            const kvRes = await fetch(KV_URL, {
                method: 'POST',
                headers: { Authorization: "Bearer " + KV_TOKEN },
                body: JSON.stringify(["SMEMBERS", "geodash_tokens"])
            });
            const kvData = await kvRes.json();
            let tokens = kvData.result || [];

            // Remove testing token if it's still there
            tokens = tokens.filter(t => t !== "test-token-123");

            if (tokens.length === 0) return res.status(400).json({ error: "0 players found in DB." });

            let successCount = 0;
            let lastError = "";
            
            // 🔥 DIRECT FARCASTER API (No Neynar Needed!) 🔥
            for (let i = 0; i < tokens.length; i += 100) {
                const batch = tokens.slice(i, i + 100);
                try {
                    const farcasterRes = await fetch('https://api.farcaster.xyz/v1/frame-notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            notificationId: "msg-" + Date.now() + "-" + i,
                            title: title,
                            body: message,
                            targetUrl: "https://geodash-amber.vercel.app",
                            tokens: batch
                        })
                    });
                    
                    if (farcasterRes.ok) {
                        successCount += batch.length;
                    } else {
                        const errData = await farcasterRes.json();
                        lastError = JSON.stringify(errData);
                    }
                } catch(e) {
                    lastError = e.message;
                }
            }

            if (successCount === 0) return res.status(400).json({ error: `Farcaster API Error: ${lastError}` });
            return res.status(200).json({ message: `Successfully sent to ${successCount} players! Check your phone!` });
        } catch (error) {
            return res.status(500).json({ error: "Backend crash: " + error.message });
        }
    }
}
