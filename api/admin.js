import { ethers } from 'ethers';

export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";
    const CONTRACT_ADDRESS = "0x6b9a723c1632B6394bBf2997E9667C9E87235412";
    const ARB_RPC = "https://arb1.arbitrum.io/rpc";

    const ABI = [
        "function getLeaderboard() external view returns (address[10] memory, uint256[10] memory, uint256[10] memory)",
        "function players(address) external view returns (uint256, uint256, uint256, uint256, uint256)"
    ];

    if (req.method === 'GET') {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash Super Admin | Live</title>
                <style>
                    body { background: #05080f; color: #fff; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { color: #00f0ff; text-shadow: 0 0 10px rgba(0,240,255,0.5); }
                    #loginBox { max-width: 350px; margin: 100px auto; background: #111; padding: 30px; border: 2px solid #ff3060; border-radius: 10px; text-align: center; }
                    input { width: 90%; padding: 12px; margin: 10px 0; background: #000; color: #00f0ff; border: 1px solid #00f0ff; border-radius: 5px; outline: none; }
                    button { background: linear-gradient(90deg, #ffd700, #ff8c00); color: #000; padding: 12px 20px; border: none; font-weight: bold; cursor: pointer; border-radius: 5px; width: 100%; font-size: 16px; }
                    #dashboard { display: none; max-width: 1100px; margin: 0 auto; }
                    .search-bar { width: 100%; padding: 15px; margin-bottom: 20px; background: #111; border: 1px solid #ffd700; color: #ffd700; font-size: 16px; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; background: #0a0f18; border-radius: 8px; overflow: hidden; }
                    th, td { padding: 15px; text-align: left; border-bottom: 1px solid #222; }
                    th { background: #111; color: #00ff88; font-size: 13px; }
                    .highlight { color: #ffd700; font-weight: bold; }
                    .status-tag { padding: 4px 8px; border-radius: 4px; font-size: 11px; background: rgba(0,255,136,0.1); color: #00ff88; border: 1px solid #00ff88; }
                </style>
            </head>
            <body>
                <div id="loginBox">
                    <h2>🕵️‍♂️ JASOOS PANEL 3.0</h2>
                    <input type="password" id="adminPassword" placeholder="Enter Boss Password">
                    <button onclick="login()">SYNC WITH BLOCKCHAIN</button>
                    <p id="errorMsg" style="color: #ff3060; font-size: 12px; margin-top: 10px;"></p>
                </div>

                <div id="dashboard">
                    <div class="header">
                        <h1>🚀 Command Center: Live Arbitrum Data</h1>
                        <p id="playerCount" style="color:#888;">Fetching blockchain stats...</p>
                    </div>

                    <input type="text" id="searchInput" class="search-bar" placeholder="🔍 Search Wallet or Username..." onkeyup="filterTable()">

                    <table>
                        <thead>
                            <tr>
                                <th>Wallet Address</th>
                                <th>On-Chain Score</th>
                                <th>Max Level Cleared</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="playerBody"></tbody>
                    </table>
                </div>

                <script>
                    let globalData = [];

                    async function login() {
                        const pwd = document.getElementById('adminPassword').value;
                        const btn = document.querySelector('#loginBox button');
                        btn.innerText = "⚡ SYNCING...";
                        
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
                                document.getElementById('playerCount').innerText = \`Total Active Leaderboard Players: \${globalData.length}\`;
                                renderTable(globalData);
                            } else {
                                document.getElementById('errorMsg').innerText = "❌ Wrong Password!";
                                btn.innerText = "SYNC WITH BLOCKCHAIN";
                            }
                        } catch (e) {
                            document.getElementById('errorMsg').innerText = "Connection Failed!";
                            btn.innerText = "SYNC WITH BLOCKCHAIN";
                        }
                    }

                    function renderTable(data) {
                        const body = document.getElementById('playerBody');
                        body.innerHTML = '';
                        data.forEach(p => {
                            body.innerHTML += \`
                                <tr>
                                    <td style="color:#00f0ff; font-size:13px;">\${p.wallet}</td>
                                    <td class="highlight">\${p.score.toLocaleString()} PTS</td>
                                    <td>Level \${p.level}</td>
                                    <td><span class="status-tag">On-Chain Verified</span></td>
                                </tr>
                            \`;
                        });
                    }

                    function filterTable() {
                        const query = document.getElementById('searchInput').value.toLowerCase();
                        const filtered = globalData.filter(p => p.wallet.toLowerCase().includes(query));
                        renderTable(filtered);
                    }
                </script>
            </body>
            </html>
        `;
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
    }

    if (req.method === 'POST') {
        const { password } = req.body;
        if (password !== MY_SECRET_PASSWORD) return res.status(401).json({ error: "No" });

        try {
            const provider = new ethers.JsonRpcProvider(ARB_RPC);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

            // 🔥 Blockchain se Leaderboard uthana
            const [addrs, scores, lvls] = await contract.getLeaderboard();
            
            const players = [];
            for (let i = 0; i < addrs.length; i++) {
                if (addrs[i] !== "0x0000000000000000000000000000000000000000") {
                    players.push({
                        wallet: addrs[i],
                        score: Number(scores[i]),
                        level: Number(lvls[i])
                    });
                }
            }

            return res.status(200).json({ success: true, players });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Blockchain Sync Failed" });
        }
    }
}
