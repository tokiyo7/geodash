import { ethers } from 'ethers';

export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";
    const CONTRACT_ADDRESS = "0x0C2c9dd1001a8ee6e329d972D0Ba6546db92d6d7"; 
    const ARB_RPC = "https://arb1.arbitrum.io/rpc";

    // FULL V9 HYBRID ABI
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
        "function adminWithdrawArb(uint256 amount) external",
        "event LevelCleared(address indexed player, uint256 level, uint256 attempts, bool isDevil)"
    ];

    if (req.method === 'GET') {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash Super Admin 3.2 — MASTER</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js"></script>
                <style>
                    :root { --bg: #05080f; --cyan: #00f0ff; --gold: #ffd700; --red: #ff3060; --green: #00ff88; --card: #0a111a; }
                    * { box-sizing: border-box; }
                    body { background: var(--bg); color: #fff; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                    
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid var(--card); padding-bottom: 20px; }
                    .header h1 { color: var(--cyan); text-shadow: 0 0 15px rgba(0,240,255,0.5); font-size: 28px; margin-bottom: 10px; }
                    
                    #loginBox { max-width: 450px; margin: 100px auto; background: var(--card); padding: 40px; border: 2px solid var(--cyan); border-radius: 20px; text-align: center; box-shadow: 0 0 30px rgba(0,240,255,0.2); }
                    input { width: 100%; padding: 15px; margin: 10px 0; background: #000; color: var(--cyan); border: 1px solid #333; border-radius: 8px; outline: none; font-size: 16px; }
                    button { background: linear-gradient(90deg, var(--gold), #ff8c00); color: #000; padding: 15px; border: none; font-weight: 900; cursor: pointer; border-radius: 8px; width: 100%; text-transform: uppercase; transition: 0.3s; margin-top: 10px; }
                    button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255,215,0,0.4); }
                    
                    #dashboard { display: none; max-width: 1300px; margin: 0 auto; animation: fadeIn 0.5s ease; }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
                    .stat-card { background: var(--card); padding: 20px; border-radius: 15px; border: 1px solid #222; text-align: center; position: relative; overflow: hidden; }
                    .stat-card::after { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--cyan); }
                    .stat-val { font-size: 22px; font-weight: bold; margin-top: 10px; }
                    
                    .tabs { display: flex; gap: 12px; margin-bottom: 25px; flex-wrap: wrap; }
                    .tab { flex: 1; padding: 18px; text-align: center; background: #111; border: 1px solid #333; cursor: pointer; border-radius: 10px; color: #666; font-weight: bold; transition: 0.2s; min-width: 150px; }
                    .tab.active { background: rgba(0,240,255,0.1); border-color: var(--cyan); color: var(--cyan); }
                    
                    .card { background: var(--card); border: 1px solid #222; border-radius: 15px; padding: 30px; margin-bottom: 25px; overflow-x: auto; }
                    .card h3 { margin-top: 0; display: flex; justify-content: space-between; align-items: center; color: var(--gold); }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; min-width: 800px; }
                    th { text-align: left; color: #888; font-size: 12px; padding: 12px; border-bottom: 2px solid #222; }
                    td { padding: 15px 12px; border-bottom: 1px solid #1a1a1a; font-size: 14px; }
                    tr:hover { background: rgba(255,255,255,0.02); }
                    
                    .status-pending { color: var(--gold); font-weight: bold; background: rgba(255,215,0,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--gold); display: inline-block;}
                    .status-claimed { color: #555; background: rgba(255,255,255,0.05); padding: 6px 10px; border-radius: 6px; display: inline-block;}
                    .status-added { color: var(--green); font-weight: bold; background: rgba(0,255,136,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--green); display: inline-block;}
                    
                    .action-btns { display: flex; gap: 8px; }
                    .btn-small { width: auto; padding: 8px 15px; font-size: 12px; text-transform: none; background: #222; color: #fff; }
                    .btn-small:hover { background: var(--cyan); color: #000; }
                    .btn-danger { background: var(--red); color: #fff; }
                    
                    .username-tag { color: var(--cyan); font-weight: bold; font-size: 16px; margin-bottom: 4px; display: inline-block; }
                    .wallet-tag { color: #666; font-size: 11px; font-family: monospace; }
                </style>
            </head>
            <body>
                <div id="loginBox">
                    <h1 style="color:var(--gold); margin-bottom:5px;">TOKIYO BOSS</h1>
                    <p style="color:#666; margin-bottom:25px;">GEODASH 3.2 COMMAND CENTER</p>
                    <input type="password" id="pass" placeholder="Enter Secret Password">
                    <button onclick="login()">SYNC BLOCKCHAIN</button>
                    <p id="loginError" style="color:var(--red); margin-top:15px; font-size:12px;"></p>
                </div>

                <div id="dashboard">
                    <div class="header">
                        <h1>🚀 GEODASH 3.2 MASTER ADMIN</h1>
                        <p style="color:#555">NETWORK: ARBITRUM ONE | CONTRACT: <span style="color:#888">${CONTRACT_ADDRESS}</span></p>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card" style="border-left: 4px solid var(--green);">
                            <div style="color:#888">Vault Balance</div>
                            <div class="stat-val" id="vBal" style="color:var(--green)">0.00 ARB</div>
                        </div>
                        <div class="stat-card" style="border-left: 4px solid var(--gold);">
                            <div style="color:#888">Total Pending Bounty</div>
                            <div class="stat-val" id="totalPending" style="color:var(--gold)">0.00 ARB</div>
                        </div>
                        <div class="stat-card" style="border-left: 4px solid #ff8c00;">
                            <div style="color:#888">Players Waiting</div>
                            <div class="stat-val" id="pendingCount" style="color:#ff8c00">0 Players</div>
                        </div>
                        <div class="stat-card" style="border-left: 4px solid var(--cyan);">
                            <div style="color:#888">Live Spin Range</div>
                            <div class="stat-val" id="rangeTxt" style="color:var(--cyan);">---</div>
                        </div>
                    </div>

                    <div class="tabs">
                        <div class="tab active" onclick="showTab('playerTab', this)">👥 PLAYER ANALYTICS</div>
                        <div class="tab" onclick="showTab('configTab', this)">⚙️ ENGINE SETTINGS</div>
                        <div class="tab" onclick="showTab('rewardTab', this)">🎁 REWARD HUB</div>
                    </div>

                    <div id="playerTab" class="tab-content">
                        
                        <div class="card" style="border-color: var(--gold); box-shadow: 0 0 15px rgba(255,215,0,0.1);">
                            <h3>
                                <span>🏆 All-Time Top 15 (Classic Mode)</span>
                                <button class="btn-small" onclick="refreshData()" style="width:auto; background:var(--gold); color:#000;">🔄 Sync Now</button>
                            </h3>
                            <table id="lbTable">
                                <thead>
                                    <tr>
                                        <th>Player Identity</th>
                                        <th>Max Level</th>
                                        <th>Best Attempts</th>
                                        <th>Bounty Status</th>
                                        <th>Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody id="lbBody">
                                    <tr><td colspan="5" style="text-align:center; padding:40px; color:#555;">Loading Permanent Leaderboard...</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="card">
                            <h3><span>📡 Recent Activity Log (Last 1.5 Days)</span></h3>
                            <table id="activityTable">
                                <thead>
                                    <tr>
                                        <th>Player Identity</th>
                                        <th>Game Mode & Level</th>
                                        <th>Attempts</th>
                                        <th>Bounty Status</th>
                                        <th>Quick Action</th>
                                    </tr>
                                </thead>
                                <tbody id="activityBody">
                                    <tr><td colspan="5" style="text-align:center; padding:40px; color:#555;">Initializing system...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div id="configTab" class="tab-content" style="display:none">
                        <div class="card">
                            <h3>🎰 Spin Probability Settings</h3>
                            <div style="display:flex; gap:20px; margin-top:20px">
                                <div style="flex:1">
                                    <label style="color:#888; font-size:12px;">Minimum ARB</label>
                                    <input type="number" id="minR" step="0.001" placeholder="e.g. 0.05">
                                </div>
                                <div style="flex:1">
                                    <label style="color:#888; font-size:12px;">Maximum ARB</label>
                                    <input type="number" id="maxR" step="0.001" placeholder="e.g. 0.2">
                                </div>
                            </div>
                            <button onclick="updateSpinRange()">UPDATE BLOCKCHAIN RANGE</button>
                        </div>

                        <div class="card">
                            <h3 style="color:var(--red)">🚨 Danger Zone</h3>
                            <p style="color:#888; font-size:12px; margin-bottom:15px;">Wiping the leaderboard is irreversible.</p>
                            <div class="action-btns">
                                <button class="btn-danger" onclick="resetLB(false)" style="flex:1; padding:15px;">RESET CLASSIC BOARD</button>
                                <button class="btn-danger" onclick="resetLB(true)" style="flex:1; padding:15px;">RESET DEVIL BOARD</button>
                            </div>
                        </div>
                    </div>

                    <div id="rewardTab" class="tab-content" style="display:none">
                        <div class="card">
                            <h3>🎁 Manual Whitelist / Bounty Payout</h3>
                            <p style="color:#888; font-size:12px; margin-bottom:20px;">Use this to reward players manually. Add their address and they can claim instantly.</p>
                            <input type="text" id="wlAddr" placeholder="Paste Wallet Address (0x...)">
                            <input type="number" id="wlAmt" step="0.01" placeholder="Amount to give (e.g. 1.0)">
                            <button onclick="addWhitelist()" style="background:var(--green); color:#000;">GRANT BOUNTY REWARD</button>
                        </div>
                    </div>
                </div>

                <div id="toast" style="position:fixed; bottom:20px; right:20px; background:#111; border-left:4px solid var(--cyan); padding:15px; display:none; z-index:1000; font-weight:bold; box-shadow: 0 0 20px rgba(0,0,0,0.8);"></div>

                <script>
                    let provider, contract;
                    const ADDR = "${CONTRACT_ADDRESS}";

                    function showMsg(m, c=true) {
                        const t = document.getElementById('toast');
                        t.innerText = m; t.style.display = 'block'; t.style.borderLeftColor = c ? 'var(--green)' : 'var(--red)';
                        setTimeout(() => t.style.display = 'none', 4000);
                    }

                    async function login() {
                        const p = document.getElementById('pass').value;
                        const res = await fetch('/api/admin', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password: p}) });
                        if(res.ok) {
                            document.getElementById('loginBox').style.display = 'none';
                            document.getElementById('dashboard').style.display = 'block';
                            initApp();
                        } else { document.getElementById('loginError').innerText = "Access Denied: Master Password Incorrect."; }
                    }

                    function initApp() {
                        provider = new ethers.BrowserProvider(window.ethereum);
                        contract = new ethers.Contract(ADDR, ${JSON.stringify(ABI)}, provider);
                        refreshData();
                    }

                    async function fetchUsernames(addresses) {
                        if(addresses.length === 0) return {};
                        let nameMap = {};
                        for (let i = 0; i < addresses.length; i += 10) {
                            const batch = addresses.slice(i, i + 10);
                            try {
                                const res = await fetch('https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=' + batch.join(','), {
                                    headers: { 'accept': 'application/json', 'api_key': 'NEYNAR_API_DOCS' }
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    for (let addr of batch) {
                                        let lowerAddr = addr.toLowerCase();
                                        if (data[lowerAddr] && data[lowerAddr].length > 0) {
                                            let userObj = data[lowerAddr][0];
                                            let uname = userObj.username || (userObj.user && userObj.user.username);
                                            if(uname) nameMap[lowerAddr] = '@' + uname;
                                        }
                                    }
                                }
                            } catch(e) {}
                        }
                        return nameMap;
                    }

                    async function refreshData() {
                        try {
                            const bal = await contract.getArbBalance();
                            const min = await contract.spinMinReward();
                            const max = await contract.spinMaxReward();
                            document.getElementById('vBal').innerText = Number(ethers.formatEther(bal)).toFixed(4) + " ARB";
                            document.getElementById('rangeTxt').innerText = ethers.formatEther(min) + " - " + ethers.formatEther(max) + " ARB";
                            document.getElementById('minR').value = ethers.formatEther(min);
                            document.getElementById('maxR').value = ethers.formatEther(max);

                            // 1. FETCH ALL-TIME LEADERBOARD
                            const [geoAddrs, geoLvls, geoAtts] = await contract.getGeoLeaderboard();
                            
                            // 2. FETCH RECENT EVENTS (Expanded to 500,000 blocks ~ 1.5 Days)
                            const currentBlock = await provider.getBlockNumber();
                            const startBlock = currentBlock > 500000 ? currentBlock - 500000 : 0; 
                            
                            let events = [];
                            try {
                                const filter = contract.filters.LevelCleared();
                                events = await contract.queryFilter(filter, startBlock, currentBlock);
                            } catch(e) { console.warn("RPC limit hit for recent events"); }

                            // 3. COMBINE ALL ADDRESSES FOR NEYNAR API
                            let allAddrs = [...geoAddrs, ...events.map(e => e.args[0])];
                            allAddrs = [...new Set(allAddrs)].filter(a => a !== "0x0000000000000000000000000000000000000000");
                            
                            const nameMap = await fetchUsernames(allAddrs);

                            let unclaimedAmt = 0n;
                            let pendingPlayers = new Set();

                            // 4. RENDER ALL-TIME LEADERBOARD TABLE
                            let lbHtml = "";
                            for(let i=0; i<15; i++) {
                                if(geoAddrs[i] === "0x0000000000000000000000000000000000000000" || geoLvls[i] == 0) continue;
                                let pAddr = geoAddrs[i];
                                let uname = nameMap[pAddr.toLowerCase()] || "👤 Player_" + pAddr.slice(-4).toUpperCase();
                                
                                const reward = await contract.whitelistRewards(pAddr);
                                let statusHtml = "";
                                if(reward > 0n) {
                                    unclaimedAmt += reward;
                                    pendingPlayers.add(pAddr);
                                    statusHtml = '<span class="status-added">✅ PENDING (' + ethers.formatEther(reward) + ')</span>';
                                } else {
                                    statusHtml = '<span class="status-claimed">❌ NO REWARD</span>';
                                }

                                lbHtml += \`<tr>
                                    <td><span class="username-tag">\${uname}</span><br><span class="wallet-tag">\${pAddr}</span></td>
                                    <td><span style="color:var(--cyan);font-weight:bold;font-size:16px;">Lv \${geoLvls[i]}</span></td>
                                    <td>\${geoAtts[i]} Tries</td>
                                    <td>\${statusHtml}</td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="btn-small" onclick="copyAddr('\${pAddr}')">📋</button>
                                            <button class="btn-small" style="background:var(--gold);color:#000;" onclick="quickReward('\${pAddr}')">🎁 Reward</button>
                                        </div>
                                    </td>
                                </tr>\`;
                            }
                            document.getElementById('lbBody').innerHTML = lbHtml || '<tr><td colspan="5" style="text-align:center; padding:30px;">Leaderboard is empty. Be the first!</td></tr>';

                            // 5. RENDER RECENT EVENTS TABLE
                            let actHtml = "";
                            for (let event of events.reverse()) {
                                const pAddr = event.args[0];
                                const lvl = event.args[1];
                                const att = event.args[2];
                                const isDevil = event.args[3]; 
                                
                                const reward = await contract.whitelistRewards(pAddr);
                                let statusHtml = reward > 0n ? '<span class="status-added">✅ PENDING</span>' : '<span class="status-claimed">❌ CLAIMED/NONE</span>';
                                let uname = nameMap[pAddr.toLowerCase()] || "👤 Player_" + pAddr.slice(-4).toUpperCase();

                                actHtml += \`<tr>
                                    <td><span class="username-tag" style="font-size:13px;">\${uname}</span><br><span class="wallet-tag">\${pAddr}</span></td>
                                    <td><span style="color:\${isDevil ? 'var(--red)' : 'var(--cyan)'}">\${isDevil ? '👿' : '🟦'} Lv \${lvl}</span></td>
                                    <td>\${att}</td>
                                    <td>\${statusHtml}</td>
                                    <td><button class="btn-small" onclick="quickReward('\${pAddr}')">🎁</button></td>
                                </tr>\`;
                            }
                            document.getElementById('activityBody').innerHTML = actHtml || '<tr><td colspan="5" style="text-align:center; padding:30px;">No recent clears in last 36 hours. Check Top 15 Leaderboard above.</td></tr>';
                            
                            // Stats updates
                            document.getElementById('totalPending').innerText = ethers.formatEther(unclaimedAmt) + " ARB";
                            document.getElementById('pendingCount').innerText = pendingPlayers.size + " Players";

                        } catch(e) { 
                            console.error("Error loading analytics:", e); 
                            showMsg("Error loading analytics. Check console.", false);
                        }
                    }

                    window.copyAddr = (a) => { navigator.clipboard.writeText(a); showMsg("Address Copied!"); }
                    
                    window.quickReward = (a) => { 
                        document.getElementById('wlAddr').value = a; 
                        showTab('rewardTab', document.querySelectorAll('.tab')[2]); 
                        showMsg("Address pasted in Reward Hub. Enter Amount!", true); 
                    }

                    async function updateSpinRange() {
                        const s = await provider.getSigner();
                        const c = new ethers.Contract(ADDR, ${JSON.stringify(ABI)}, s);
                        const tx = await c.setSpinRange(ethers.parseEther(document.getElementById('minR').value), ethers.parseEther(document.getElementById('maxR').value));
                        showMsg("Sending to Arbitrum..."); await tx.wait(); showMsg("Spin Range Updated!"); refreshData();
                    }

                    async function addWhitelist() {
                        const s = await provider.getSigner();
                        const c = new ethers.Contract(ADDR, ${JSON.stringify(ABI)}, s);
                        const tx = await c.addToWhitelist([document.getElementById('wlAddr').value], [ethers.parseEther(document.getElementById('wlAmt').value)]);
                        showMsg("Whitelisting player..."); await tx.wait(); showMsg("Player Added to Hub!"); refreshData();
                    }

                    async function resetLB(isDev) {
                        if(!confirm("Are you sure? This clears the board!")) return;
                        const s = await provider.getSigner();
                        const c = new ethers.Contract(ADDR, ${JSON.stringify(ABI)}, s);
                        const tx = await c.resetLeaderboard(isDev);
                        showMsg("Wiping Leaderboard..."); await tx.wait(); showMsg("Board Cleared!"); refreshData();
                    }

                    function showTab(id, el) {
                        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.getElementById(id).style.display = 'block'; el.classList.add('active');
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
