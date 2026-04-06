import { ethers } from 'ethers';

export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";
    const CONTRACT_ADDRESS = "0x0C2c9dd1001a8ee6e329d972D0Ba6546db92d6d7"; 
    const ARB_RPC = "https://arb1.arbitrum.io/rpc";

    // V9 Hybrid Full ABI
    const ABI = [
        "function admin1() view returns (address)",
        "function admin2() view returns (address)",
        "function spinMinReward() view returns (uint256)",
        "function spinMaxReward() view returns (uint256)",
        "function getArbBalance() view returns (uint256)",
        "function getGeoLeaderboard() view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
        "function getDevilLeaderboard() view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
        "function setSpinRange(uint256 _min, uint256 _max) external",
        "function resetLeaderboard(bool _isDevil) external",
        "function addToWhitelist(address[] calldata _players, uint256[] calldata _amounts) external",
        "function adminWithdrawArb(uint256 amount) external",
        "event LevelCleared(address indexed player, uint256 level, uint256 attempts)"
    ];

    if (req.method === 'GET') {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash Pro Admin 3.1</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js"></script>
                <style>
                    :root { --bg: #05080f; --cyan: #00f0ff; --gold: #ffd700; --red: #ff3060; --green: #00ff88; }
                    body { background: var(--bg); color: #fff; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #222; padding-bottom: 20px; }
                    #loginBox { max-width: 400px; margin: 100px auto; background: #0a0f18; padding: 40px; border: 2px solid var(--cyan); border-radius: 15px; text-align: center; box-shadow: 0 0 20px rgba(0,240,255,0.2); }
                    input { width: 100%; padding: 12px; margin: 10px 0; background: #000; color: var(--cyan); border: 1px solid #333; border-radius: 5px; outline: none; }
                    button { background: linear-gradient(90deg, var(--gold), #ff8c00); color: #000; padding: 12px 20px; border: none; font-weight: bold; cursor: pointer; border-radius: 5px; transition: 0.2s; width: 100%; margin-top: 10px; }
                    button:hover { transform: scale(1.02); opacity: 0.9; }
                    .danger-btn { background: linear-gradient(90deg, var(--red), #800); color: white; }
                    #dashboard { display: none; max-width: 1100px; margin: 0 auto; }
                    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
                    .tab { flex: 1; padding: 15px; text-align: center; background: #111; border: 1px solid #333; cursor: pointer; border-radius: 8px; color: #888; font-weight: bold; }
                    .tab.active { background: rgba(0,240,255,0.1); border-color: var(--cyan); color: var(--cyan); }
                    .card { background: #0a0f18; border: 1px solid #222; border-radius: 12px; padding: 25px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #222; font-size: 14px; }
                    th { color: var(--green); }
                    .highlight { color: var(--gold); font-weight: bold; }
                    .stats-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .balance-box { font-size: 20px; color: var(--green); font-weight: bold; }
                </style>
            </head>
            <body>
                <div id="loginBox">
                    <h2 style="color:var(--cyan)">🕵️‍♂️ SYSTEM SYNC</h2>
                    <input type="password" id="pass" placeholder="Enter Admin Password">
                    <button onclick="login()">AUTHORIZE ACCESS</button>
                    <p id="err" style="color:var(--red); font-size:12px; margin-top:15px;"></p>
                </div>

                <div id="dashboard">
                    <div class="header">
                        <h1>🚀 GEODASH COMMAND CENTER</h1>
                        <p style="color:#555">Contract: ${CONTRACT_ADDRESS}</p>
                    </div>

                    <div class="stats-row card">
                        <div>
                            <span style="color:#888">Vault Balance:</span>
                            <div class="balance-box"><span id="vBal">0.00</span> ARB</div>
                        </div>
                        <div style="text-align:right">
                            <span style="color:#888">Spin Range:</span>
                            <div style="color:var(--gold)" id="rangeTxt">Loading...</div>
                        </div>
                    </div>

                    <div class="tabs">
                        <div class="tab active" onclick="showTab('boardTab', this)">📊 Leaderboards</div>
                        <div class="tab" onclick="showTab('spinTab', this)">🎰 Spin Settings</div>
                        <div class="tab" onclick="showTab('rewardTab', this)">🎁 Reward Hub</div>
                    </div>

                    <div id="boardTab" class="tab-content">
                        <div class="card">
                            <h3 style="color:var(--cyan); margin-top:0">🟦 GeoDash Classic Board</h3>
                            <button class="danger-btn" style="width:auto; padding:8px 15px; font-size:12px" onclick="resetLB(false)">Reset Board</button>
                            <table id="geoTable">
                                <thead><tr><th>Rank</th><th>Address</th><th>Level</th><th>Tries</th></tr></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="spinTab" class="tab-content" style="display:none">
                        <div class="card">
                            <h3 style="color:var(--gold)">⚙️ Adjust Spin Rewards</h3>
                            <p style="font-size:12px; color:#888">Set the range of ARB players can win. (Values in ARB)</p>
                            <div style="display:flex; gap:20px; margin-top:20px">
                                <div style="flex:1">
                                    <label>Minimum Reward</label>
                                    <input type="number" id="minR" step="0.001" placeholder="e.g. 0.01">
                                </div>
                                <div style="flex:1">
                                    <label>Maximum Reward</label>
                                    <input type="number" id="maxR" step="0.001" placeholder="e.g. 0.1">
                                </div>
                            </div>
                            <button onclick="updateRange()">UPDATE BLOCKCHAIN RANGE</button>
                        </div>
                    </div>

                    <div id="rewardTab" class="tab-content" style="display:none">
                        <div class="card">
                            <h3 style="color:var(--green)">🎁 Manual Whitelist</h3>
                            <input type="text" id="wlAddr" placeholder="Player Wallet Address">
                            <input type="number" id="wlAmt" step="0.01" placeholder="Amount to give (e.g. 1.0 ARB)">
                            <button onclick="addWL()">ADD TO REWARD HUB</button>
                        </div>
                    </div>
                </div>

                <script>
                    let authHeader = "";
                    async function login() {
                        const p = document.getElementById('pass').value;
                        const res = await fetch('/api/admin', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({password: p})
                        });
                        const data = await res.json();
                        if(data.success) {
                            authHeader = p;
                            document.getElementById('loginBox').style.display = 'none';
                            document.getElementById('dashboard').style.display = 'block';
                            loadData(data);
                        } else {
                            document.getElementById('err').innerText = "Invalid Password!";
                        }
                    }

                    function loadData(data) {
                        document.getElementById('vBal').innerText = data.bal;
                        document.getElementById('rangeTxt').innerText = data.min + " - " + data.max + " ARB";
                        document.getElementById('minR').value = data.min;
                        document.getElementById('maxR').value = data.max;
                        
                        const tbody = document.querySelector('#geoTable tbody');
                        tbody.innerHTML = data.geo.map((p, i) => \`
                            <tr><td>#\${i+1}</td><td style="color:var(--cyan)">\${p.addr}</td><td class="highlight">Level \${p.lvl}</td><td>\${p.att}</td></tr>
                        \`).join('');
                    }

                    function showTab(id, el) {
                        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.getElementById(id).style.display = 'block';
                        el.classList.add('active');
                    }

                    async function getContract() {
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const signer = await provider.getSigner();
                        return new ethers.Contract("${CONTRACT_ADDRESS}", ${JSON.stringify(ABI)}, signer);
                    }

                    async function updateRange() {
                        try {
                            const c = await getContract();
                            const min = ethers.parseEther(document.getElementById('minR').value.toString());
                            const max = ethers.parseEther(document.getElementById('maxR').value.toString());
                            const tx = await c.setSpinRange(min, max);
                            alert("Transaction Sent! Waiting for block...");
                            await tx.wait();
                            alert("Success!");
                        } catch(e) { alert(e.message); }
                    }

                    async function resetLB(isDev) {
                        if(!confirm("Reset this leaderboard?")) return;
                        try {
                            const c = await getContract();
                            const tx = await c.resetLeaderboard(isDev);
                            await tx.wait();
                            alert("Leaderboard Cleared!");
                        } catch(e) { alert(e.message); }
                    }

                    async function addWL() {
                        try {
                            const c = await getContract();
                            const addr = document.getElementById('wlAddr').value;
                            const amt = ethers.parseEther(document.getElementById('wlAmt').value.toString());
                            const tx = await c.addToWhitelist([addr], [amt]);
                            await tx.wait();
                            alert("Player Whitelisted!");
                        } catch(e) { alert(e.message); }
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
        if (password !== MY_SECRET_PASSWORD) return res.status(401).json({ error: "Unauthorized" });

        try {
            const provider = new ethers.JsonRpcProvider(ARB_RPC);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

            const [geoA, geoL, geoT] = await contract.getGeoLeaderboard();
            const min = await contract.spinMinReward();
            const max = await contract.spinMaxReward();
            const bal = await contract.getArbBalance();

            const geo = geoA.map((addr, i) => ({
                addr, lvl: Number(geoL[i]), att: Number(geoT[i])
            })).filter(p => p.addr !== ethers.ZeroAddress);

            return res.status(200).json({
                success: true,
                geo,
                min: ethers.formatEther(min),
                max: ethers.formatEther(max),
                bal: ethers.formatEther(bal)
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
