import { ethers } from 'ethers';

export default async function handler(req, res) {
    const MY_SECRET_PASSWORD = "tokiyoboss";
    // Naya Farcaster Safe Contract Address
    const CONTRACT_ADDRESS = "0x9488b2e99BB3470078EEB0812799c76ea4e64C65"; 
    const ARB_RPC = "https://arb1.arbitrum.io/rpc";

    // Updated READ ABI for new contract
    const READ_ABI = [
        "function getGeoLeaderboard() external view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
        "function getDevilLeaderboard() external view returns (address[15] memory, uint256[15] memory, uint256[15] memory)",
        "function getArbBalance() external view returns (uint256)"
    ];

    if (req.method === 'GET') {
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GeoDash Super Admin 3.1</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js"></script>
                <style>
                    body { background: #05080f; color: #fff; font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { color: #00f0ff; text-shadow: 0 0 10px rgba(0,240,255,0.5); margin-bottom: 5px;}
                    
                    #loginBox { max-width: 350px; margin: 100px auto; background: #111; padding: 30px; border: 2px solid #ff3060; border-radius: 10px; text-align: center; }
                    input { width: 90%; padding: 12px; margin: 10px 0; background: #000; color: #00f0ff; border: 1px solid #00f0ff; border-radius: 5px; outline: none; }
                    button { background: linear-gradient(90deg, #ffd700, #ff8c00); color: #000; padding: 12px 20px; border: none; font-weight: bold; cursor: pointer; border-radius: 5px; font-size: 14px; transition: 0.2s; margin-top: 10px;}
                    button:hover { transform: scale(1.05); }
                    .danger-btn { background: #ff3060; color: white; }
                    
                    #dashboard { display: none; max-width: 1200px; margin: 0 auto; }
                    .tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;}
                    .tab { flex: 1; padding: 15px; text-align: center; background: #111; border: 1px solid #333; cursor: pointer; font-weight: bold; color: #888; border-radius: 5px; }
                    .tab.active { background: rgba(0,240,255,0.1); border-color: #00f0ff; color: #00f0ff; }
                    
                    .control-panel { background: #111; border: 1px solid #00ff88; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                    .control-panel h3 { margin-top: 0; color: #00ff88; }
                    .flex-inputs { display: flex; gap: 10px; margin-bottom: 15px; align-items: center; }
                    .flex-inputs input { width: 100%; }

                    table { width: 100%; border-collapse: collapse; background: #0a0f18; border-radius: 8px; overflow: hidden; margin-bottom: 20px;}
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #222; font-size: 13px;}
                    th { background: #111; color: #00ff88; }
                    tr:hover { background: #151a25; }
                    .highlight { color: #ffd700; font-weight: bold; }
                    
                    .copy-btn { padding: 5px 10px; font-size: 11px; margin-right: 5px; cursor: pointer; background: #333; color: white; border: none; border-radius: 3px;}
                    .copy-btn:hover { background: #555; }
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
                        <h1>🚀 GeoDash 3.1 Admin Hub</h1>
                        <p style="color:#888;">Contract: 0x9488b2e99BB3470078EEB0812799c76ea4e64C65</p>
                        <p style="color:#00ff88; font-weight:bold;">Vault Balance: <span id="vaultBalance">Loading...</span> ARB</p>
                    </div>

                    <div class="tabs">
                        <div class="tab active" onclick="switchTab('geoTab')">🟦 GeoDash Board</div>
                        <div class="tab" onclick="switchTab('devilTab')">👿 Devil Board</div>
                        <div class="tab" onclick="switchTab('rewardTab')">🎁 Reward & Whitelist</div>
                        <div class="tab" onclick="switchTab('spinTab')">🎰 Spin Info</div>
                    </div>

                    <div id="geoTab" class="tab-content">
                        <table>
                            <thead><tr><th>Rank</th><th>Wallet Address</th><th>Highest Level</th><th>Attempts</th><th>Actions</th></tr></thead>
                            <tbody id="geoBody">
                                <tr><td colspan="5" style="text-align:center; color:#888;">Fetching Data...</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div id="devilTab" class="tab-content" style="display:none;">
                        <table>
                            <thead><tr><th>Rank</th><th>Wallet Address</th><th>Highest Level</th><th>Attempts</th><th>Actions</th></tr></thead>
                            <tbody id="devilBody">
                                <tr><td colspan="5" style="text-align:center; color:#888;">Fetching Data...</td></tr>
                            </tbody>
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
                        <h3>🎰 Spin Machine Configuration</h3>
                        <p style="font-size:14px; color:#aaa; line-height: 1.6;">
                            <b>Farcaster Optimization Active:</b><br><br>
                            To ensure 100% stability and zero "No State Changes" errors on Warpcast, the Spin Machine probabilities are currently locked inside the smart contract.<br><br>
                            <b>Current Range:</b> 0.01 ARB to 0.05 ARB per spin.<br>
                            <b>Cooldown:</b> 1 Hour.<br><br>
                            <i>Note: Manual slider adjustments are disabled in this version for maximum security and speed.</i>
                        </p>
                    </div>

                </div>

                <script>
                    const CONTRACT_ADDRESS = "0x9488b2e99BB3470078EEB0812799c76ea4e64C65";
                    // Updated WRITE ABI for new contract
                    const WRITE_ABI = [
                        "function addToWhitelist(address[] calldata _players, uint256[] calldata _amounts) external"
                    ];

                    let globalData = null;

                    async function login() {
                        const pwd = document.getElementById('adminPassword').value;
                        const btn = document.querySelector('#loginBox button');
                        btn.innerText = "FETCHING BLOCKCHAIN...";
                        document.getElementById('errorMsg').innerText = "";
                        
                        try {
                            const res = await fetch('/api/admin', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password: pwd })
                            });
                            
                            if (res.status === 401) {
                                document.getElementById('errorMsg').innerText = "❌ Wrong Password!";
                                btn.innerText = "SYNC BLOCKCHAIN";
                                return;
                            }

                            document.getElementById('loginBox').style.display = 'none';
                            document.getElementById('dashboard').style.display = 'block';

                            const data = await res.json();
                            
                            if (data.success) {
                                globalData = data;
                                document.getElementById('vaultBalance').innerText = data.vaultBal;
                                renderLeaderboards();
                            } else {
                                document.getElementById('geoBody').innerHTML = \`<tr><td colspan="5" style="color:#ff3060; text-align:center;">⚠️ Backend Error: \${data.error}</td></tr>\`;
                            }
                        } catch (e) {
                            document.getElementById('geoBody').innerHTML = \`<tr><td colspan="5" style="color:#ff3060; text-align:center;">⚠️ Server Crash! \${e.message}</td></tr>\`;
                        }
                    }

                    function renderLeaderboards() {
                        const buildRows = (data) => {
                            if (!data || data.length === 0) return '<tr><td colspan="5" style="text-align:center; color:#888;">No players on the board yet!</td></tr>';
                            let html = "";
                            data.forEach((p, index) => {
                                html += \`
                                    <tr>
                                        <td>#\${index + 1}</td>
                                        <td style="color:#00f0ff;">\${p.wallet}</td>
                                        <td class="highlight">Level \${p.level}</td>
                                        <td>\${p.attempts}</td>
                                        <td>
                                            <button class="copy-btn" onclick="copyAddress('\${p.wallet}')">📋 Copy Address</button>
                                        </td>
                                    </tr>\`;
                            });
                            return html;
                        };

                        document.getElementById('geoBody').innerHTML = buildRows(globalData.geoDash);
                        document.getElementById('devilBody').innerHTML = buildRows(globalData.devilMode);
                    }

                    function switchTab(tabId) {
                        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                        event.target.classList.add('active');
                        document.getElementById(tabId).style.display = 'block';
                    }

                    window.copyAddress = function(address) {
                        navigator.clipboard.writeText(address);
                        alert("Address Copied: " + address + "\\n\\nYou can now paste this into the Reward Whitelist tab.");
                    }

                    async function getContract() {
                        if (!window.ethereum) throw new Error("MetaMask extension not found!");
                        await window.ethereum.request({ method: 'eth_requestAccounts' });
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const signer = await provider.getSigner();
                        return new ethers.Contract(CONTRACT_ADDRESS, WRITE_ABI, signer);
                    }

                    window.addToWhitelist = async function() {
                        const addr = document.getElementById('wlAddress').value;
                        const amt = document.getElementById('wlAmount').value;
                        const status = document.getElementById('wlStatus');
                        if(!addr || !amt) return alert("Please fill both fields!");
                        
                        try {
                            status.style.color = "#ffd700"; status.innerText = "⏳ Opening MetaMask to sign...";
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

            const [geoAddrs, geoLvls, geoAtts] = await contract.getGeoLeaderboard();
            const [devAddrs, devLvls, devAtts] = await contract.getDevilLeaderboard();
            
            // Get vault balance directly
            const bal = await contract.getArbBalance();
            const vaultEth = ethers.formatEther(bal);
            
            const formatBoard = (addrs, lvls, atts) => {
                let board = [];
                for (let i = 0; i < addrs.length; i++) {
                    if (addrs[i] !== "0x0000000000000000000000000000000000000000") {
                        board.push({ wallet: addrs[i], level: Number(lvls[i]), attempts: Number(atts[i]) });
                    }
                }
                return board;
            };

            return res.status(200).json({ 
                success: true, 
                geoDash: formatBoard(geoAddrs, geoLvls, geoAtts),
                devilMode: formatBoard(devAddrs, devLvls, devAtts),
                vaultBal: vaultEth
            });
        } catch (error) {
            return res.status(200).json({ success: false, error: error.message });
        }
    }
}
