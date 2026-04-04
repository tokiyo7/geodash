export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";

    // 🖥️ GET REQUEST: Dashboard ka UI (Design) Bhejna
    if (req.method === 'GET') {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash Super Admin</title>
                <style>
                    body { background: #05080f; color: #fff; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { color: #00f0ff; text-shadow: 0 0 10px rgba(0,240,255,0.5); }
                    
                    /* Login Screen */
                    #loginBox { max-width: 350px; margin: 100px auto; background: #111; padding: 30px; border: 2px solid #ff3060; border-radius: 10px; text-align: center; }
                    input { width: 90%; padding: 12px; margin: 10px 0; background: #000; color: #00f0ff; border: 1px solid #00f0ff; border-radius: 5px; outline: none; }
                    button { background: linear-gradient(90deg, #ffd700, #ff8c00); color: #000; padding: 12px 20px; border: none; font-weight: bold; cursor: pointer; border-radius: 5px; width: 100%; font-size: 16px; }
                    button:hover { transform: scale(1.02); }
                    
                    /* Dashboard Screen */
                    #dashboard { display: none; max-width: 1000px; margin: 0 auto; }
                    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
                    .tab { flex: 1; padding: 15px; text-align: center; background: #111; border: 1px solid #333; cursor: pointer; font-weight: bold; color: #888; border-radius: 5px; }
                    .tab.active { background: rgba(0,240,255,0.1); border-color: #00f0ff; color: #00f0ff; }
                    
                    .search-bar { width: 100%; padding: 15px; margin-bottom: 20px; background: #111; border: 1px solid #ffd700; color: #ffd700; font-size: 16px; border-radius: 5px; }
                    
                    table { width: 100%; border-collapse: collapse; background: #0a0f18; border-radius: 8px; overflow: hidden; }
                    th, td { padding: 15px; text-align: left; border-bottom: 1px solid #222; }
                    th { background: #111; color: #00ff88; font-size: 14px; text-transform: uppercase; }
                    tr:hover { background: #151a25; }
                    .highlight { color: #ffd700; font-weight: bold; }
                    .cyan-text { color: #00f0ff; }
                </style>
            </head>
            <body>

                <div id="loginBox">
                    <h2>🕵️‍♂️ JASOOS PANEL</h2>
                    <input type="password" id="adminPassword" placeholder="Enter Boss Password">
                    <button onclick="login()">ACCESS SYSTEM</button>
                    <p id="errorMsg" style="color: #ff3060; font-size: 12px; margin-top: 10px;"></p>
                </div>

                <div id="dashboard">
                    <div class="header">
                        <h1>🚀 GeoDash Command Center</h1>
                        <p style="color:#888;">Live Player Tracking System v3.0</p>
                    </div>

                    <input type="text" id="searchInput" class="search-bar" placeholder="🔍 Search by Username or Wallet Address..." onkeyup="filterTable()">

                    <div class="tabs">
                        <div class="tab active" onclick="switchTab('activity')">📊 Player Activity (Spins & Starts)</div>
                        <div class="tab" onclick="switchTab('clears')">🏆 Level Clears (Rewards)</div>
                    </div>

                    <div id="activityTab">
                        <table id="activityTable">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Wallet Address</th>
                                    <th>Total TXs</th>
                                    <th>🎰 Spins Done</th>
                                    <th>🎮 Levels Started</th>
                                </tr>
                            </thead>
                            <tbody id="activityBody">
                                </tbody>
                        </table>
                    </div>

                    <div id="clearsTab" style="display:none;">
                        <table id="clearsTable">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Wallet Address</th>
                                    <th>Max Level Cleared</th>
                                    <th>Reward Status</th>
                                </tr>
                            </thead>
                            <tbody id="clearsBody">
                                </tbody>
                        </table>
                    </div>
                </div>

                <script>
                    let globalData = [];

                    async function login() {
                        const pwd = document.getElementById('adminPassword').value;
                        const btn = document.querySelector('#loginBox button');
                        btn.innerText = "VERIFYING...";
                        
                        try {
                            const res = await fetch('/api/admin', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password: pwd })
                            });
                            
                            if (res.ok) {
                                const data = await res.json();
                                globalData = data.players;
                                document.getElementById('loginBox').style.display = 'none';
                                document.getElementById('dashboard').style.display = 'block';
                                renderTables(globalData);
                            } else {
                                document.getElementById('errorMsg').innerText = "❌ Wrong Password!";
                                btn.innerText = "ACCESS SYSTEM";
                            }
                        } catch (e) {
                            document.getElementById('errorMsg').innerText = "Network Error!";
                            btn.innerText = "ACCESS SYSTEM";
                        }
                    }

                    function renderTables(data) {
                        const actBody = document.getElementById('activityBody');
                        const clrBody = document.getElementById('clearsBody');
                        actBody.innerHTML = ''; clrBody.innerHTML = '';

                        data.forEach(p => {
                            // Activity Row
                            actBody.innerHTML += \`
                                <tr>
                                    <td class="cyan-text">@\${p.username}</td>
                                    <td style="color:#888; font-size:12px;">\${p.wallet}</td>
                                    <td class="highlight">\${p.totalTxs}</td>
                                    <td>\${p.spins}</td>
                                    <td>\${p.starts}</td>
                                </tr>
                            \`;
                            // Clears Row
                            clrBody.innerHTML += \`
                                <tr>
                                    <td class="cyan-text">@\${p.username}</td>
                                    <td style="color:#888; font-size:12px;">\${p.wallet}</td>
                                    <td class="highlight">Level \${p.maxLevel}</td>
                                    <td><button style="padding:5px 10px; font-size:12px;">Mark Paid</button></td>
                                </tr>
                            \`;
                        });
                    }

                    function filterTable() {
                        const query = document.getElementById('searchInput').value.toLowerCase();
                        const filtered = globalData.filter(p => 
                            p.username.toLowerCase().includes(query) || 
                            p.wallet.toLowerCase().includes(query)
                        );
                        renderTables(filtered);
                    }

                    function switchTab(tabId) {
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        event.target.classList.add('active');
                        
                        if (tabId === 'activity') {
                            document.getElementById('activityTab').style.display = 'block';
                            document.getElementById('clearsTab').style.display = 'none';
                        } else {
                            document.getElementById('activityTab').style.display = 'none';
                            document.getElementById('clearsTab').style.display = 'block';
                        }
                    }
                </script>
            </body>
            </html>
        `;
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
    }

    // 🗄️ POST REQUEST: Database se Data Nikalna
    if (req.method === 'POST') {
        const { password } = req.body;
        if (password !== MY_SECRET_PASSWORD) {
            return res.status(401).json({ error: "Access Denied" });
        }

        try {
            // NOTE: Abhi HTML ready nahi hai, isliye hum "DUMMY DATA" bhej rahe hain 
            // taaki tumhara Panel mast dikhe. Jab HTML banega, hum yahan Upstash se real data link kar denge.
            
            const dummyData = [
                { username: "tokiyo", wallet: "0x1234abcd5678efgh9012ijkl3456mnop", totalTxs: 15, spins: 5, starts: 10, maxLevel: 3 },
                { username: "crypto_king", wallet: "0xabcd1234efgh5678ijkl9012mnop3456", totalTxs: 8, spins: 2, starts: 6, maxLevel: 1 },
                { username: "geodasher", wallet: "0x9876zyxw5432vuts1098rqpo7654nmlk", totalTxs: 42, spins: 12, starts: 30, maxLevel: 5 }
            ];

            return res.status(200).json({ success: true, players: dummyData });
        } catch (error) {
            return res.status(500).json({ error: "Database Error" });
        }
    }
}
