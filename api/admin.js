import { ethers } from 'ethers';

export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";
    const CONTRACT_ADDRESS = "0x0C2c9dd1001a8ee6e329d972D0Ba6546db92d6d7"; 
    const ARB_RPC = "https://arb1.arbitrum.io/rpc";

    // Full ABI including Events and Admin Functions
    const ABI = [
        "function admin1() view returns (address)",
        "function admin2() view returns (address)",
        "function spinMinReward() view returns (uint256)",
        "function spinMaxReward() view returns (uint256)",
        "function getArbBalance() view returns (uint256)",
        "function getGeoLeaderboard() view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
        "function getDevilLeaderboard() view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
        "function whitelistRewards(address) view returns (uint256)",
        "function setSpinRange(uint256 _min, uint256 _max) external",
        "function resetLeaderboard(bool _isDevil) external",
        "function addToWhitelist(address[] calldata _players, uint256[] calldata _amounts) external",
        "event LevelCleared(address indexed player, uint256 level, uint256 attempts)"
    ];

    if (req.method === 'GET') {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash 3.0 | SUPER ADMIN HUB</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js"></script>
                <style>
                    :root { --bg: #05080f; --cyan: #00f0ff; --gold: #ffd700; --red: #ff3060; --green: #00ff88; --card: #0a0f18; }
                    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Courier New', monospace; }
                    body { background: var(--bg); color: #fff; padding: 20px; }
                    
                    /* --- LOGIN UI --- */
                    #loginBox { max-width: 420px; margin: 120px auto; background: var(--card); padding: 40px; border: 2px solid var(--red); border-radius: 15px; text-align: center; box-shadow: 0 0 30px rgba(255, 48, 96, 0.2); }
                    input { width: 100%; padding: 14px; margin: 12px 0; background: #000; color: var(--cyan); border: 1px solid #333; border-radius: 6px; outline: none; font-size: 16px; }
                    input:focus { border-color: var(--cyan); }
                    .main-btn { background: linear-gradient(90deg, var(--gold), #ff8c00); color: #000; padding: 14px; border: none; font-weight: 900; cursor: pointer; border-radius: 6px; width: 100%; text-transform: uppercase; letter-spacing: 1px; }
                    
                    /* --- DASHBOARD UI --- */
                    #dashboard { display: none; max-width: 1200px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: var(--cyan); font-size: 32px; text-shadow: 0 0 15px rgba(0, 240, 255, 0.4); margin-bottom: 10px; }
                    
                    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 25px; }
                    .stat-card { background: var(--card); padding: 20px; border: 1px solid #222; border-radius: 12px; text-align: center; position: relative; overflow: hidden; }
                    .stat-card::after { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--cyan); }
                    .stat-card.pending::after { background: var(--gold); }
                    .stat-val { font-size: 24px; font-weight: bold; margin-top: 10px; color: var(--green); }

                    .tabs { display: flex; gap: 12px; margin-bottom: 25px; background: #111; padding: 8px; border-radius: 10px; }
                    .tab { flex: 1; padding: 15px; text-align: center; cursor: pointer; border-radius: 8px; color: #666; font-weight: bold; transition: 0.3s; }
                    .tab.active { background: var(--card); border: 1px solid var(--cyan); color: var(--cyan); box-shadow: 0 0 15px rgba(0,240,255,0.1); }

                    .card { background: var(--card); border: 1px solid #222; border-radius: 15px; padding: 30px; margin-bottom: 25px; }
                    .card h3 { color: var(--gold); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }

                    /* --- TABLE STYLING --- */
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { text-align: left; padding: 15px; color: #555; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #222; }
                    td { padding: 15px; border-bottom: 1px solid #111; font-size: 14px; vertical-align: middle; }
                    tr:hover { background: rgba(255,255,255,0.02); }
                    
                    .status-tag { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; }
                    .status-pending { background: rgba(255, 215, 0, 0.1); color: var(--gold); border: 1px solid var(--gold); }
                    .status-claimed { background: rgba(0, 255, 136, 0.1); color: var(--green); border: 1px solid var(--green); opacity: 0.7; }
                    
                    .action-btn { padding: 6px 12px; font-size: 11px; background: #222; color: #fff; border: 1px solid #444; border-radius: 4px; cursor: pointer; margin-right: 5px; }
                    .action-btn:hover { background: #333; border-color: var(--cyan); }
                    .danger-btn { background: rgba(255, 48, 96, 0.1); color: var(--red); border: 1px solid var(--red); }
                    
                    #loadingOverlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; align-items: center; justify-content: center; z-index: 10000; flex-direction: column; }
                    .spinner { width: 40px; height: 40px; border: 4px solid var(--cyan); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                </style>
            </head>
            <body>

                <div id="loadingOverlay"><div class="spinner"></div><p>Syncing with Blockchain...</p></div>

                <div id="loginBox">
                    <h2 style="color:var(--red); margin-bottom:10px;">🛡️ GEO-SHIELD 3.0</h2>
                    <p style="color:#666; font-size:12px; margin-bottom:20px;">Restricted Access - Admin Credentials Required</p>
                    <input type="password" id="pass" placeholder="Master Password">
                    <button class="main-btn" onclick="login()">Sync & Authorize</button>
                    <p id="err" style="color:var(--red); font-size:12px; margin-top:15px;"></p>
                </div>

                <div id="dashboard">
                    <div class="header">
                        <h1>🚀 GEODASH 3.0 PRO COMMAND CENTER</h1>
                        <p style="color:#444; font-size:11px; margin-top:5px;">CONTRACT ID: ${CONTRACT_ADDRESS}</p>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <p style="color:#888; font-size:12px;">CONTRACT BALANCE</p>
                            <div class="stat-val" id="vBal">0.00 ARB</div>
                        </div>
                        <div class="stat-card pending">
                            <p style="color:var(--gold); font-size:12px;">PENDING REWARDS</p>
                            <div class="stat-val" id="totalPending" style="color:var(--gold)">0.00 ARB</div>
                        </div>
                        <div class="stat-card">
                            <p style="color:var(--cyan); font-size:12px;">SPIN CONFIG</p>
                            <div class="stat-val" id="rangeTxt" style="color:var(--cyan); font-size:16px;">Loading...</div>
                        </div>
                    </div>

                    <div class="tabs">
                        <div class="tab active" onclick="showTab('analyticsTab', this)">📈 PLAYER ANALYTICS</div>
                        <div class="tab" onclick="showTab('settingsTab', this)">⚙️ GAME SETTINGS</div>
                        <div class="tab" onclick="showTab('resetTab', this)">⚠️ DANGER ZONE</div>
                    </div>

                    <div id="analyticsTab" class="tab-content">
                        <div class="card">
                            <h3>
                                <span>Recent On-Chain Activity</span>
                                <button class="action-btn" onclick="refreshAnalytics()">🔄 REFRESH DATA</button>
                            </h3>
                            <table id="activityTable">
                                <thead>
                                    <tr>
                                        <th>PLAYER ADDRESS</th>
                                        <th>LVL</th>
                                        <th>TRIES</th>
                                        <th>REWARD STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="settingsTab" class="tab-content" style="display:none">
                        <div class="card">
                            <h3>🎰 Adjust Spin Reward Range</h3>
                            <div style="display:flex; gap:15px; margin-bottom:20px;">
                                <div style="flex:1">
                                    <label style="font-size:11px; color:#888;">MIN REWARD (ARB)</label>
                                    <input type="number" id="minR" step="0.001">
                                </div>
                                <div style="flex:1">
                                    <label style="font-size:11px; color:#888;">MAX REWARD (ARB)</label>
                                    <input type="number" id="maxR" step="0.001">
                                </div>
                            </div>
                            <button class="main-btn" onclick="updateRange()">UPDATE BLOCKCHAIN RANGE</button>
                        </div>

                        <div class="card">
                            <h3>🎁 Manual Reward Hub (Whitelist)</h3>
                            <p style="font-size:12px; color:#555; margin-bottom:15px;">Send custom ARB amounts to players manually after verification.</p>
                            <input type="text" id="wlAddr" placeholder="Wallet Address (0x...)">
                            <input type="number" id="wlAmt" step="0.01" placeholder="Reward Amount (e.g. 1.0 ARB)">
                            <button class="main-btn" style="background:var(--cyan)" onclick="addWL()">ADD TO HUB</button>
                        </div>
                    </div>

                    <div id="resetTab" class="tab-content" style="display:none">
                        <div class="card" style="border-color: var(--red);">
                            <h3 style="color:var(--red)">🚨 EMERGENCY CONTROLS</h3>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                                <div>
                                    <p style="font-size:12px; color:#888; margin-bottom:10px;">Wipe all data from the Classic Board.</p>
                                    <button class="main-btn danger-btn" onclick="resetBoard(false)">RESET CLASSIC BOARD</button>
                                </div>
                                <div>
                                    <p style="font-size:12px; color:#888; margin-bottom:10px;">Wipe all data from the Devil Board.</p>
                                    <button class="main-btn danger-btn" onclick="resetBoard(true)">RESET DEVIL BOARD</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <script>
                    let provider, contract;
                    const CONTRACT_ADDR = "${CONTRACT_ADDRESS}";

                    async function login() {
                        const p = document.getElementById('pass').value;
                        const res = await fetch('/api/admin', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({password: p})
                        });
                        const data = await res.json();
                        if(data.success) {
                            document.getElementById('loginBox').style.display = 'none';
                            document.getElementById('dashboard').style.display = 'block';
                            initDashboard();
                        } else {
                            document.getElementById('err').innerText = "ACCESS DENIED: INVALID KEY";
                        }
                    }

                    async function initDashboard() {
                        toggleLoading(true);
                        provider = new ethers.BrowserProvider(window.ethereum);
                        contract = new ethers.Contract(CONTRACT_ADDR, ${JSON.stringify(ABI)}, provider);
                        await refreshAnalytics();
                        toggleLoading(false);
                    }

                    async function refreshAnalytics() {
                        toggleLoading(true);
                        try {
                            const bal = await contract.getArbBalance();
                            const min = await contract.spinMinReward();
                            const max = await contract.spinMaxReward();
                            
                            document.getElementById('vBal').innerText = Number(ethers.formatEther(bal)).toFixed(4) + " ARB";
                            document.getElementById('rangeTxt').innerText = ethers.formatEther(min) + " - " + ethers.formatEther(max) + " ARB";
                            document.getElementById('minR').value = ethers.formatEther(min);
                            document.getElementById('maxR').value = ethers.formatEther(max);

                            const filter = contract.filters.LevelCleared();
                            const events = await contract.queryFilter(filter, -10000); // Last 10k blocks

                            let unclaimedTotal = 0n;
                            let html = "";
                            
                            // Process unique addresses to check pending status
                            const uniqueAddrs = [...new Set(events.map(e => e.args[0]))];
                            
                            for(let event of events.reverse()) {
                                const addr = event.args[0];
                                const pending = await contract.whitelistRewards(addr);
                                if(pending > 0n) unclaimedTotal += pending;

                                html += \`
                                    <tr>
                                        <td style="color:var(--cyan); font-size:12px;">\${addr}</td>
                                        <td style="font-weight:bold">Lv \${event.args[1]}</td>
                                        <td>\${event.args[2]}</td>
                                        <td>
                                            <span class="status-tag \${pending > 0n ? 'status-pending' : 'status-claimed'}">
                                                \${pending > 0n ? '⏳ PENDING ('+ethers.formatEther(pending)+')' : '✅ CLAIMED / NONE'}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="action-btn" onclick="copyAddr('\${addr}')">COPY</button>
                                            <button class="action-btn" onclick="quickWL('\${addr}')">WL</button>
                                        </td>
                                    </tr>
                                \`;
                            }
                            document.querySelector('#activityTable tbody').innerHTML = html || "<tr><td colspan='5' style='text-align:center;'>No Activity Recorded</td></tr>";
                            document.getElementById('totalPending').innerText = ethers.formatEther(unclaimedTotal) + " ARB";

                        } catch(e) { console.error(e); }
                        toggleLoading(false);
                    }

                    function showTab(id, el) {
                        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.getElementById(id).style.display = 'block';
                        el.classList.add('active');
                    }

                    function toggleLoading(show) { document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none'; }
                    
                    window.copyAddr = (a) => { navigator.clipboard.writeText(a); alert("Copied!"); }
                    window.quickWL = (a) => {
                        showTab('settingsTab', document.querySelectorAll('.tab')[1]);
                        document.getElementById('wlAddr').value = a;
                    }

                    async function updateRange() {
                        try {
                            const signer = await provider.getSigner();
                            const c = new ethers.Contract(CONTRACT_ADDR, ${JSON.stringify(ABI)}, signer);
                            const tx = await c.setSpinRange(ethers.parseEther(document.getElementById('minR').value), ethers.parseEther(document.getElementById('maxR').value));
                            await tx.wait();
                            refreshAnalytics();
                        } catch(e) { alert(e.message); }
                    }

                    async function addWL() {
                        try {
                            const signer = await provider.getSigner();
                            const c = new ethers.Contract(CONTRACT_ADDR, ${JSON.stringify(ABI)}, signer);
                            const tx = await c.addToWhitelist([document.getElementById('wlAddr').value], [ethers.parseEther(document.getElementById('wlAmt').value)]);
                            await tx.wait();
                            refreshAnalytics();
                        } catch(e) { alert(e.message); }
                    }

                    async function resetBoard(isDev) {
                        if(!confirm("⚠️ PERMANENT WIPE: Are you sure?")) return;
                        try {
                            const signer = await provider.getSigner();
                            const c = new ethers.Contract(CONTRACT_ADDR, ${JSON.stringify(ABI)}, signer);
                            const tx = await c.resetLeaderboard(isDev);
                            await tx.wait();
                            refreshAnalytics();
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
        if (password !== MY_SECRET_PASSWORD) return res.status(401).json({ success: false });
        return res.status(200).json({ success: true });
    }
}
