import { ethers } from 'ethers';

export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";
    const CONTRACT_ADDRESS = "0x0C2c9dd1001a8ee6e329d972D0Ba6546db92d6d7"; 
    const ARB_RPC = "https://arb1.arbitrum.io/rpc";

    const ABI = [
        "function spinMinReward() view returns (uint256)",
        "function spinMaxReward() view returns (uint256)",
        "function getArbBalance() view returns (uint256)",
        "function getGeoLeaderboard() view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
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
                <title>GeoDash Pro Admin 3.1</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js"></script>
                <style>
                    :root { --bg: #05080f; --cyan: #00f0ff; --gold: #ffd700; --red: #ff3060; --green: #00ff88; }
                    body { background: var(--bg); color: #fff; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                    #loginBox { max-width: 400px; margin: 100px auto; background: #0a0f18; padding: 40px; border: 2px solid var(--cyan); border-radius: 15px; text-align: center; }
                    input { width: 100%; padding: 12px; margin: 10px 0; background: #000; color: var(--cyan); border: 1px solid #333; border-radius: 5px; outline: none; }
                    button { background: linear-gradient(90deg, var(--gold), #ff8c00); color: #000; padding: 12px 20px; border: none; font-weight: bold; cursor: pointer; border-radius: 5px; width: 100%; margin-top: 10px; }
                    #dashboard { display: none; max-width: 1100px; margin: 0 auto; }
                    .card { background: #0a0f18; border: 1px solid #222; border-radius: 12px; padding: 25px; margin-bottom: 20px; }
                    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
                    .tab { flex: 1; padding: 15px; text-align: center; background: #111; border: 1px solid #333; cursor: pointer; border-radius: 8px; color: #888; font-weight: bold; }
                    .tab.active { background: rgba(0,240,255,0.1); border-color: var(--cyan); color: var(--cyan); }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #222; font-size: 13px; }
                    .status-pending { color: var(--gold); font-weight: bold; }
                    .status-claimed { color: var(--green); opacity: 0.6; }
                    .pending-banner { background: rgba(255, 215, 0, 0.1); border: 1px solid var(--gold); padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                </style>
            </head>
            <body>
                <div id="loginBox">
                    <h2>🕵️‍♂️ SYSTEM SYNC</h2>
                    <input type="password" id="pass" placeholder="Enter Admin Password">
                    <button onclick="login()">AUTHORIZE</button>
                </div>

                <div id="dashboard">
                    <h1>🚀 GEODASH COMMAND CENTER v3.1</h1>
                    
                    <div class="pending-banner">
                        <div>
                            <span style="color:var(--gold)">Total Unclaimed Rewards:</span>
                            <h2 id="totalPending">Scanning...</h2>
                        </div>
                        <button onclick="refreshAnalytics()" style="width:auto; padding:8px 15px;">🔄 Refresh Analytics</button>
                    </div>

                    <div class="tabs">
                        <div class="tab active" onclick="showTab('analyticsTab', this)">📈 Player Analytics</div>
                        <div class="tab" onclick="showTab('spinTab', this)">🎰 Spin & Whitelist</div>
                    </div>

                    <div id="analyticsTab" class="tab-content">
                        <div class="card">
                            <h3>Live Player Activity & Claim Status</h3>
                            <table id="activityTable">
                                <thead><tr><th>Player</th><th>Level</th><th>Tries</th><th>Reward Status</th></tr></thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>

                    <div id="spinTab" class="tab-content" style="display:none">
                        <div class="card">
                            <h3>🎰 Adjust Spin Range</h3>
                            <div style="display:flex; gap:10px">
                                <input type="number" id="minR" step="0.001" placeholder="Min ARB">
                                <input type="number" id="maxR" step="0.001" placeholder="Max ARB">
                            </div>
                            <button onclick="updateRange()">UPDATE RANGE</button>
                        </div>
                        <div class="card">
                            <h3>🎁 Whitelist Player</h3>
                            <input type="text" id="wlAddr" placeholder="Wallet Address">
                            <input type="number" id="wlAmt" step="0.01" placeholder="ARB Amount">
                            <button onclick="addWL()">ADD TO HUB</button>
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
                            initEthers();
                            refreshAnalytics();
                        } else { alert("Wrong Password!"); }
                    }

                    function initEthers() {
                        provider = new ethers.BrowserProvider(window.ethereum);
                        contract = new ethers.Contract(CONTRACT_ADDR, ${JSON.stringify(ABI)}, provider);
                    }

                    async function refreshAnalytics() {
                        const tbody = document.querySelector('#activityTable tbody');
                        tbody.innerHTML = '<tr><td colspan="4">Scanning Blockchain Events...</td></tr>';
                        
                        // Fetching LevelCleared events
                        const filter = contract.filters.LevelCleared();
                        const events = await contract.queryFilter(filter, -50000); // Last 50k blocks
                        
                        let totalUnclaimed = 0;
                        let rows = "";

                        for(let event of events.reverse()) {
                            const addr = event.args[0];
                            const lvl = event.args[1].toString();
                            const att = event.args[2].toString();
                            
                            // Check if this specific user has a pending reward
                            const pending = await contract.whitelistRewards(addr);
                            const isPending = pending > 0n;
                            if(isPending) totalUnclaimed += Number(ethers.formatEther(pending));

                            rows += \`<tr>
                                <td>\${addr.slice(0,6)}...\${addr.slice(-4)}</td>
                                <td>Lv \${lvl}</td>
                                <td>\${att}</td>
                                <td class="\${isPending ? 'status-pending' : 'status-claimed'}">
                                    \${isPending ? '⏳ PENDING ('+ethers.formatEther(pending)+' ARB)' : '✅ CLAIMED / NONE'}
                                </td>
                            </tr>\`;
                        }
                        tbody.innerHTML = rows;
                        document.getElementById('totalPending').innerText = totalUnclaimed.toFixed(3) + " ARB";
                    }

                    function showTab(id, el) {
                        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.getElementById(id).style.display = 'block';
                        el.classList.add('active');
                    }

                    async function updateRange() {
                        const signer = await provider.getSigner();
                        const c = new ethers.Contract(CONTRACT_ADDR, ${JSON.stringify(ABI)}, signer);
                        const tx = await c.setSpinRange(ethers.parseEther(document.getElementById('minR').value), ethers.parseEther(document.getElementById('maxR').value));
                        await tx.wait(); alert("Range Updated!");
                    }

                    async function addWL() {
                        const signer = await provider.getSigner();
                        const c = new ethers.Contract(CONTRACT_ADDR, ${JSON.stringify(ABI)}, signer);
                        const tx = await c.addToWhitelist([document.getElementById('wlAddr').value], [ethers.parseEther(document.getElementById('wlAmt').value)]);
                        await tx.wait(); alert("Whitelisted!"); refreshAnalytics();
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
