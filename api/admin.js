import { ethers } from 'ethers';

export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";
    const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138"; // TERA NAYA CONTRACT 🔥
    const ARB_RPC = "https://arb1.arbitrum.io/rpc";

    // 📡 Backend ke liye sirf Padhne (Read) wala ABI
    const READ_ABI = [
        "function getGeoLeaderboard() external view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
        "function getDevilLeaderboard() external view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
        "function tier1Chance() external view returns (uint256)",
        "function tier2Chance() external view returns (uint256)",
        "function tier1Reward() external view returns (uint256)",
        "function tier2Reward() external view returns (uint256)",
        "function tier3Reward() external view returns (uint256)"
    ];

    if (req.method === 'GET') {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash Super Admin 3.0</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js"></script>
                <style>
                    body { background: #05080f; color: #fff; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { color: #00f0ff; text-shadow: 0 0 10px rgba(0,240,255,0.5); margin-bottom: 5px;}
                    
                    #loginBox { max-width: 350px; margin: 100px auto; background: #111; padding: 30px; border: 2px solid #ff3060; border-radius: 10px; text-align: center; }
                    input { width: 90%; padding: 12px; margin: 10px 0; background: #000; color: #00f0ff; border: 1px solid #00f0ff; border-radius: 5px; outline: none; }
                    button { background: linear-gradient(90deg, #ffd700, #ff8c00); color: #000; padding: 12px 20px; border: none; font-weight: bold; cursor: pointer; border-radius: 5px; font-size: 14px; transition: 0.2s; }
                    button:hover { transform: scale(1.05); }
                    .danger-btn { background: #ff3060; color: white; }
                    
                    #dashboard { display: none; max-width: 1200px; margin: 0 auto; }
                    .tabs { display: flex; gap: 10px; margin-bottom: 20px; }
                    .tab { flex: 1; padding: 15px; text-align: center; background: #111; border: 1px solid #333; cursor: pointer; font-weight: bold; color: #888; border-radius: 5px; }
                    .tab.active { background: rgba(0,240,255,0.1); border-color: #00f0ff; color: #00f0ff; }
                    
                    .control-panel { background: #111; border: 1px solid #00ff88; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                    .control-panel h3 { margin-top: 0; color: #00ff88; }
                    .flex-inputs { display: flex; gap: 10px; margin-bottom: 15px; }
                    .flex-inputs input { width: 100%; }

                    table { width: 100%; border-collapse: collapse; background: #0a0f18; border-radius: 8px; overflow: hidden; margin-bottom: 20px;}
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #222; font-size: 13px;}
                    th { background: #111; color: #00ff88; }
                    tr:hover { background: #151a25; }
                    .highlight { color: #ffd700; font-weight: bold; }
                    
                    .copy-btn, .ban-btn { padding: 5px 10px; font-size: 11px; margin-right: 5px;}
                    .ban-btn { background: #ff3060; color: white; border: none; }
                </style>
            </head>
            <body>

                <div id="loginBox">
                    <h2>🕵️‍♂️ COMMAND CENTER</h2>
                    <input type="password" id="adminPassword" placeholder="Enter Boss Password">
                    <button onclick="login()">SYNC BLOCKCHAIN</button>
                    <p id="errorMsg" style="color: #ff3060; font-size: 12px; margin-top: 10px;"></p>
                </div>

                <div id="dashboard">
                    <div class="header">
                        <h1>🚀 GeoDash 3.0 Admin Hub</h1>
                        <p style="color:#888;">Contract: 0xd9145CCE52D386f254917e481eB44e9943F39138</p>
                    </div>

                    <div class="tabs">
                        <div class="tab active" onclick="switchTab('geoTab')">🟦 GeoDash Board</div>
                        <div class="tab" onclick="switchTab('devilTab')">👿 Devil Board</div>
                        <div class="tab" onclick="switchTab('rewardTab')">🎁 Reward & Whitelist</div>
                        <div class="tab" onclick="switchTab('spinTab')">🎰 Spin Settings</div>
                    </div>

                    <div id="geoTab" class="tab-content">
                        <button class="danger-btn" onclick="resetBoard(false)" style="margin-bottom:15px;">⚠️ Reset GeoDash Board</button>
                        <table>
                            <thead><tr><th>Rank</th><th>Wallet Address</th><th>Highest Level</th><th>Attempts</th><th>Actions</th></tr></thead>
                            <tbody id="geoBody"></tbody>
                        </table>
                    </div>

                    <div id="devilTab" class="tab-content" style="display:none;">
                        <button class="danger-btn" onclick="resetBoard(true)" style="margin-bottom:15px;">⚠️ Reset Devil Board</button>
                        <table>
                            <thead><tr><th>Rank</th><th>Wallet Address</th><th>Highest Level</th><th>Attempts</th><th>Actions</th></tr></thead>
                            <tbody id="devilBody"></tbody>
                        </table>
                    </div>

                    <div id="rewardTab" class="tab-content control-panel" style="display:none;">
                        <h3>🎁 Add Player to Reward Whitelist</h3>
                        <p style="font-size:12px; color:#aaa;">Add a player's address and reward amount. They can claim it in the game's Reward Hub.</p>
                        <div class="flex-inputs">
                            <input type="text" id="wlAddress" placeholder="Paste Player Wallet Address">
                            <input type="number" id="wlAmount" placeholder="Reward Amount (e.g. 0.01 ARB)">
                        </div>
                        <button onclick="addToWhitelist()">🔒 ADD TO WHITELIST (MetaMask)</button>
                        <p id="wlStatus" style="font-size:12px; margin-top:10px;"></p>
                    </div>

                    <div id="spinTab" class="tab-content control-panel" style="display:none;">
                        <h3>🎰 Manage Spin Probabilities & Rewards</h3>
                        <p style="font-size:12px; color:#aaa;">Note: Tier 3 (Jackpot) chance is automatically calculated as (100 - Tier1 - Tier2)%. Must total < 100.</p>
                        
                        <div class="flex-inputs">
                            <div><label style="font-size:11px; color:#888;">Tier 1 Chance (%)</label><input type="number" id="t1c" placeholder="e.g. 70"></div>
                            <div><label style="font-size:11px; color:#888;">Tier 2 Chance (%)</label><input type="number" id="t2c" placeholder="e.g. 29"></div>
                        </div>
                        <div class="flex-inputs">
                            <div><label style="font-size:11px; color:#888;">Tier 1 Reward (ARB)</label><input type="text" id="t1r" placeholder="e.g. 0.005"></div>
                            <div><label style="font-size:11px; color:#888;">Tier 2 Reward (ARB)</label><input type="text" id="t2r" placeholder="e.g. 0.05"></div>
                            <div><label style="font-size:11px; color:#888;">Tier 3 Reward (ARB)</label><input type="text" id="t3r" placeholder="e.g. 0.2"></div>
                        </div>
                        <button onclick="updateSpinSettings()">⚙️ UPDATE SPIN SETTINGS (MetaMask)</button>
                        <p id="spinStatus" style="font-size:12px; margin-top:10px;"></p>
                    </div>

                </div>

                <script>
                    const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";
                    const WRITE_ABI = [
                        "function addToWhitelist(address[] calldata _players, uint256[] calldata _amounts) external",
                        "function setSpinSettings(uint256 _t1Chance, uint256 _t2Chance, uint256 _t1Reward, uint256 _t2Reward, uint256 _t3Reward) external",
                        "function banPlayer(address _player, bool _fromDevilGame) external",
                        "function resetSpecificLeaderboard(bool _resetDevilGame) external"
                    ];

                    let globalData = null;

                    async function login() {
                        const pwd = document.getElementById('adminPassword').value;
                        const btn = document.querySelector('#loginBox button');
                        btn.innerText = "FETCHING BLOCKCHAIN...";
                        
                        try {
                            const res = await fetch('/api/admin', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password: pwd })
                            });
                            
                            if (res.ok) {
                                globalData = await res.json();
                                document.getElementById('loginBox').style.display = 'none';
                                document.getElementById('dashboard').style.display = 'block';
                                renderLeaderboards();
                                populateSpinData();
                            } else {
                                document.getElementById('errorMsg').innerText = "❌ Wrong Password!";
                                btn.innerText = "SYNC BLOCKCHAIN";
                            }
                        } catch (e) {
                            document.getElementById('errorMsg').innerText = "Network Error!";
                            btn.innerText = "SYNC BLOCKCHAIN";
                        }
                    }

                    function renderLeaderboards() {
                        const buildRows = (data, isDevil) => {
                            let html = "";
                            data.forEach((p, index) => {
                                html += \`
                                    <tr>
                                        <td>#\${index + 1}</td>
                                        <td style="color:#00f0ff;">\${p.wallet}</td>
                                        <td class="highlight">Level \${p.level}</td>
                                        <td>\${p.attempts}</td>
                                        <td>
                                            <button class="copy-btn" onclick="copyAddress('\${p.wallet}')">📋 Copy</button>
                                            <button class="ban-btn" onclick="banPlayer('\${p.wallet}', \${isDevil})">🔨 Ban</button>
                                        </td>
                                    </tr>\`;
                            });
                            return html;
                        };

                        document.getElementById('geoBody').innerHTML = buildRows(globalData.geoDash, false);
                        document.getElementById('devilBody').innerHTML = buildRows(globalData.devilMode, true);
                    }

                    function populateSpinData() {
                        document.getElementById('t1c').value = globalData.spinData.t1Chance;
                        document.getElementById('t2c').value = globalData.spinData.t2Chance;
                        document.getElementById('t1r').value = globalData.spinData.t1Reward;
                        document.getElementById('t2r').value = globalData.spinData.t2Reward;
                        document.getElementById('t3r').value = globalData.spinData.t3Reward;
                    }

                    function switchTab(tabId) {
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                        event.target.classList.add('active');
                        document.getElementById(tabId).style.display = 'block';
                    }

                    function copyAddress(address) {
                        navigator.clipboard.writeText(address);
                        alert("Address Copied: " + address);
                    }

                    // --- WEB3 WRITE FUNCTIONS (MetaMask required) --- //
                    
                    async function getContract() {
                        if (!window.ethereum) throw new Error("MetaMask not found!");
                        await window.ethereum.request({ method: 'eth_requestAccounts' });
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const signer = await provider.getSigner();
                        return new ethers.Contract(CONTRACT_ADDRESS, WRITE_ABI, signer);
                    }

                    async function addToWhitelist() {
                        const addr = document.getElementById('wlAddress').value;
                        const amt = document.getElementById('wlAmount').value;
                        const status = document.getElementById('wlStatus');
                        
                        if(!addr || !amt) return alert("Please fill both fields!");
                        
                        try {
                            status.style.color = "#ffd700"; status.innerText = "⏳ Opening MetaMask...";
                            const contract = await getContract();
                            const amtWei = ethers.parseEther(amt.toString());
                            
                            const tx = await contract.addToWhitelist([addr], [amtWei]);
                            status.innerText = "⏳ Waiting for blockchain confirmation...";
                            await tx.wait();
                            
                            status.style.color = "#00ff88"; status.innerText = "✅ Successfully added to Whitelist!";
                            document.getElementById('wlAddress').value = ""; document.getElementById('wlAmount').value = "";
                        } catch(e) {
                            status.style.color = "#ff3060"; status.innerText = "❌ Error: " + (e.reason || e.message);
                        }
                    }

                    async function updateSpinSettings() {
                        const t1c = document.getElementById('t1c').value;
                        const t2c = document.getElementById('t2c').value;
                        const t1r = document.getElementById('t1r').value;
                        const t2r = document.getElementById('t2r').value;
                        const t3r = document.getElementById('t3r').value;
                        const status = document.getElementById('spinStatus');

                        try {
                            status.style.color = "#ffd700"; status.innerText = "⏳ Opening MetaMask...";
                            const contract = await getContract();
                            
                            const tx = await contract.setSpinSettings(
                                t1c, t2c, 
                                ethers.parseEther(t1r), ethers.parseEther(t2r), ethers.parseEther(t3r)
                            );
                            status.innerText = "⏳ Waiting for blockchain confirmation...";
                            await tx.wait();
                            
                            status.style.color = "#00ff88"; status.innerText = "✅ Spin Settings Updated!";
                        } catch(e) {
                            status.style.color = "#ff3060"; status.innerText = "❌ Error: " + (e.reason || e.message);
                        }
                    }

                    async function banPlayer(address, isDevil) {
                        if(!confirm("Are you sure you want to BAN this player and remove them from the board?")) return;
                        try {
                            const contract = await getContract();
                            const tx = await contract.banPlayer(address, isDevil);
                            alert("Transaction sent! Board will update after confirmation.");
                            await tx.wait();
                            window.location.reload();
                        } catch(e) {
                            alert("Error: " + (e.reason || e.message));
                        }
                    }

                    async function resetBoard(isDevil) {
                        if(!confirm("🚨 WARNING! This will WIPE the entire leaderboard. Are you sure?")) return;
                        try {
                            const contract = await getContract();
                            const tx = await contract.resetSpecificLeaderboard(isDevil);
                            alert("Transaction sent! Board is resetting.");
                            await tx.wait();
                            window.location.reload();
                        } catch(e) {
                            alert("Error: " + (e.reason || e.message));
                        }
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
        if (password !== MY_SECRET_PASSWORD) return res.status(401).json({ error: "Access Denied" });

        try {
            const provider = new ethers.JsonRpcProvider(ARB_RPC);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, READ_ABI, provider);

            // Fetch Leaderboards
            const [geoAddrs, geoLvls, geoAtts] = await contract.getGeoLeaderboard();
            const [devAddrs, devLvls, devAtts] = await contract.getDevilLeaderboard();
            
            const formatBoard = (addrs, lvls, atts) => {
                let board = [];
                for (let i = 0; i < addrs.length; i++) {
                    if (addrs[i] !== "0x0000000000000000000000000000000000000000") {
                        board.push({ wallet: addrs[i], level: Number(lvls[i]), attempts: Number(atts[i]) });
                    }
                }
                return board;
            };

            // Fetch Spin Data
            const t1c = Number(await contract.tier1Chance());
            const t2c = Number(await contract.tier2Chance());
            const t1r = ethers.formatEther(await contract.tier1Reward());
            const t2r = ethers.formatEther(await contract.tier2Reward());
            const t3r = ethers.formatEther(await contract.tier3Reward());

            return res.status(200).json({ 
                success: true, 
                geoDash: formatBoard(geoAddrs, geoLvls, geoAtts),
                devilMode: formatBoard(devAddrs, devLvls, devAtts),
                spinData: { t1Chance: t1c, t2Chance: t2c, t1Reward: t1r, t2Reward: t2r, t3Reward: t3r }
            });
        } catch (error) {
            return res.status(500).json({ error: "Blockchain Sync Failed: " + error.message });
        }
    }
}
