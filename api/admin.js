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
                <title>GeoDash Super Admin 3.1</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js"></script>
                <style>
                    :root { --bg: #05080f; --cyan: #00f0ff; --gold: #ffd700; --red: #ff3060; --green: #00ff88; }
                    body { background: var(--bg); color: #fff; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    #loginBox { max-width: 400px; margin: 100px auto; background: #0a0f18; padding: 40px; border: 2px solid var(--cyan); border-radius: 15px; text-align: center; }
                    input, textarea { width: 100%; padding: 12px; margin: 10px 0; background: #000; color: var(--cyan); border: 1px solid #333; border-radius: 5px; outline: none; }
                    button { background: linear-gradient(90deg, var(--gold), #ff8c00); color: #000; padding: 12px 20px; border: none; font-weight: bold; cursor: pointer; border-radius: 5px; width: 100%; margin-top: 10px; }
                    #dashboard { display: none; max-width: 1200px; margin: 0 auto; }
                    .card { background: #0a0f18; border: 1px solid #222; border-radius: 12px; padding: 25px; margin-bottom: 20px; }
                    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
                    .stat-card { background: #111; padding: 15px; border-radius: 8px; border: 1px solid #333; text-align: center; }
                    .stat-val { font-size: 20px; font-weight: bold; color: var(--green); }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #222; font-size: 13px; }
                    th { color: var(--cyan); text-transform: uppercase; }
                    .status-pending { color: var(--gold); animation: pulse 1.5s infinite; }
                    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                    .copy-btn { width: auto; padding: 5px 10px; font-size: 11px; background: #222; color: #fff; }
                </style>
            </head>
            <body>
                <div id="loginBox">
                    <h2>🕵️‍♂️ BOSS AUTHENTICATION</h2>
                    <input type="password" id="pass" placeholder="Enter TokiyoBoss Password">
                    <button onclick="login()">SYNC COMMAND CENTER</button>
                </div>

                <div id="dashboard">
                    <div class="header">
                        <h1>🚀 GEODASH 3.1 PRO ADMIN</h1>
                        <p style="color:#555">Active Contract: ${CONTRACT_ADDRESS}</p>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div style="color:#888">Vault Balance</div>
                            <div class="stat-val" id="vBal">0.00 ARB</div>
                        </div>
                        <div class="stat-card">
                            <div style="color:var(--gold)">Total Pending Claims</div>
                            <div class="stat-val" id="totalPending">0.00 ARB</div>
                        </div>
                        <div class="stat-card">
                            <div style="color:var(--cyan)">Current Range</div>
                            <div class="stat-val" style="font-size:14px" id="rangeTxt">Loading...</div>
                        </div>
                    </div>

                    <div class="card">
                        <h3>📈 Player Analytics & Claim Tracker</h3>
                        <table id="activityTable">
                            <thead><tr><th>Player Address</th><th>Level</th><th>Tries</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody id="activityBody"></tbody>
                        </table>
                    </div>

                    <div class="card">
                        <h3>⚙️ Control Panel</h3>
                        <div style="display:flex; gap:10px">
                            <button class="danger-btn" onclick="resetLB(false)" style="background:var(--red); color:#fff">Reset Classic Board</button>
                            <button onclick="updateRange()" style="background:var(--cyan); color:#000">Update Spin Range</button>
                        </div>
                        <div style="display:flex; gap:10px; margin-top:15px">
                            <input type="number" id="minR" step="0.001" placeholder="Min ARB">
                            <input type="number" id="maxR" step="0.001" placeholder="Max ARB">
                        </div>
                    </div>
                </div>

                <script>
                    let provider, contract;
                    async function login() {
                        const p = document.getElementById('pass').value;
                        const res = await fetch('/api/admin', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({password: p}) });
                        const data = await res.json();
                        if(data.success) {
                            document.getElementById('loginBox').style.display = 'none';
                            document.getElementById('dashboard').style.display = 'block';
                            initDashboard(data);
                        } else { alert("Unauthorized!"); }
                    }

                    function initDashboard(data) {
                        provider = new ethers.BrowserProvider(window.ethereum);
                        contract = new ethers.Contract("${CONTRACT_ADDRESS}", ${JSON.stringify(ABI)}, provider);
                        refreshData();
                    }

                    async function refreshData() {
                        const bal = await contract.getArbBalance();
                        const min = await contract.spinMinReward();
                        const max = await contract.spinMaxReward();
                        document.getElementById('vBal').innerText = ethers.formatEther(bal) + " ARB";
                        document.getElementById('rangeTxt').innerText = ethers.formatEther(min) + " - " + ethers.formatEther(max) + " ARB";
                        
                        // Fetch Events
                        const filter = contract.filters.LevelCleared();
                        const events = await contract.queryFilter(filter, -5000); // Last 5k blocks
                        
                        let totalUnclaimed = 0n;
                        let html = "";
                        
                        for(let event of events.reverse()) {
                            const addr = event.args[0];
                            const pending = await contract.whitelistRewards(addr);
                            if(pending > 0n) totalUnclaimed += pending;
                            
                            html += \`<tr>
                                <td>\${addr.slice(0,10)}...</td>
                                <td>\${event.args[1]}</td>
                                <td>\${event.args[2]}</td>
                                <td class="\${pending > 0n ? 'status-pending' : ''}">\${pending > 0n ? '⏳ PENDING ('+ethers.formatEther(pending)+')' : '✅ CLAIMED'}</td>
                                <td><button class="copy-btn" onclick="navigator.clipboard.writeText('\${addr}')">Copy</button></td>
                            </tr>\`;
                        }
                        document.getElementById('activityBody').innerHTML = html;
                        document.getElementById('totalPending').innerText = ethers.formatEther(totalUnclaimed) + " ARB";
                    }

                    async function updateRange() {
                        const signer = await provider.getSigner();
                        const c = new ethers.Contract("${CONTRACT_ADDRESS}", ${JSON.stringify(ABI)}, signer);
                        await (await c.setSpinRange(ethers.parseEther(document.getElementById('minR').value), ethers.parseEther(document.getElementById('maxR').value))).wait();
                        refreshData();
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
