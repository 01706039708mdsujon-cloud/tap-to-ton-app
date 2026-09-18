const tg = window.Telegram.WebApp;
tg.expand();

const SUPABASE_URL = "https://gnqevgdnkwizeegiwsdc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducWV2Z2Rua3dpemVlZ2l3c2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDkyMDIsImV4cCI6MjEwNDk4NTIwMn0.W4U4_AhCfmYc4lWAjiIZj1VAGfcFWxBUts4UmjKoHZI";

let supabaseClient = window.supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
let user = tg.initDataUnsafe?.user || { id: 12345678, username: "TestUser", first_name: "Test" };
let startParam = tg.initDataUnsafe?.start_param || "";

let currentPoints = 0;
let usdBalance = 0.00;
let maxEnergy = 500;
let currentEnergy = 500;
let tapPower = 1;
let hasAutoBot = false;
let lastDailyClaim = 0;

const usernameText = user.username ? `@${user.username}` : (user.first_name || 'User');
document.getElementById('user-display').innerText = usernameText;

// 🌟 Generate Fullscreen Floating Particles Dynamically
function createBackgroundParticles() {
    const container = document.getElementById('particles-container');
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        let particle = document.createElement('div');
        particle.classList.add('star-particle');

        let size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}vw`;

        let duration = Math.random() * 8 + 6;
        let delay = Math.random() * 5;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        container.appendChild(particle);
    }
}
createBackgroundParticles();

function switchTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if(tabName === 'lead') loadLeaderboard();
    if(tabName === 'ref') loadReferralCount();
}

async function loadUserData() {
    if (!supabaseClient) return;

    try {
        let { data } = await supabaseClient.from('users').select('*').eq('id', user.id).maybeSingle();

        if (data) {
            currentPoints = data.points || 0;
            usdBalance = parseFloat(data.usd_balance || 0.00);
            tapPower = data.tap_power || 1;
            hasAutoBot = data.has_autobot || false;
            lastDailyClaim = data.last_daily_claim || 0;
            
            let lastUpdate = data.last_energy_update || Math.floor(Date.now() / 1000);
            let now = Math.floor(Date.now() / 1000);
            let recovered = Math.floor(now - lastUpdate);
            
            currentEnergy = Math.min(maxEnergy, (data.energy !== undefined ? data.energy : maxEnergy) + recovered);
            
            if (hasAutoBot) {
                document.getElementById('bot-buy-btn').style.display = 'none';
                document.getElementById('bot-claim-btn').style.display = 'block';
            }

            if (data.withdraw_status) {
                document.getElementById('withdraw-history').innerText = data.withdraw_status;
            }

            updateUI();
        } else {
            let initialPoints = 0;
            let referrerId = null;

            if (startParam && startParam.startsWith("ref_")) {
                referrerId = parseInt(startParam.replace("ref_", ""));
                if (referrerId !== user.id) {
                    initialPoints = 200;
                    await rewardReferrer(referrerId);
                }
            }

            await supabaseClient.from('users').upsert([
                { id: user.id, username: usernameText, points: initialPoints, usd_balance: 0.00, referred_by: referrerId, energy: maxEnergy }
            ]);

            currentPoints = initialPoints;
            usdBalance = 0.00;
            updateUI();
        }
    } catch (err) {
        console.error("Error loading user:", err);
    }
}

async function rewardReferrer(refId) {
    try {
        let { data } = await supabaseClient.from('users').select('points').eq('id', refId).single();
        if (data) {
            await supabaseClient.from('users').update({ points: (data.points || 0) + 500 }).eq('id', refId);
        }
    } catch (err) {}
}

async function loadReferralCount() {
    if (!supabaseClient) return;
    try {
        let { count } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', user.id);
        
        document.getElementById('ref-count').innerText = count || 0;
    } catch (err) {}
}

async function loadLeaderboard() {
    if (!supabaseClient) return;
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = "<li>Loading ranks...</li>";

    try {
        let { data } = await supabaseClient
            .from('users')
            .select('username, points')
            .order('points', { ascending: false })
            .limit(10);

        if (data && data.length > 0) {
            listEl.innerHTML = "";
            data.forEach((player, index) => {
                listEl.innerHTML += `
                    <li class="leaderboard-item">
                        <span>#${index + 1} ${player.username || 'User'}</span>
                        <span style="color:var(--accent-gold); font-weight:bold;">${player.points || 0} ₿</span>
                    </li>`;
            });
        } else {
            listEl.innerHTML = "<li>No players yet!</li>";
        }
    } catch (err) {
        listEl.innerHTML = "<li>Error loading leaderboard</li>";
    }
}

function updateUI() {
    document.getElementById('ton-points').innerText = `${currentPoints} ₿`;
    document.getElementById('usd-balance').innerText = `$${usdBalance.toFixed(3)}`;
    document.getElementById('energy-text').innerText = `${currentEnergy} / ${maxEnergy}`;
    document.getElementById('energy-fill').style.width = `${(currentEnergy / maxEnergy) * 100}%`;
    document.getElementById('multitap-lvl').innerText = tapPower;
}

function createTapParticle(x, y) {
    const particle = document.createElement('div');
    particle.classList.add('tap-particle');
    particle.innerText = `+${tapPower}`;
    
    particle.style.left = `${x - 15}px`;
    particle.style.top = `${y - 20}px`;

    document.getElementById('main-content').appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 900);
}

const tapBtn = document.getElementById('tap-btn');
let saveTimeout;

tapBtn.addEventListener('click', (e) => {
    if (currentEnergy >= tapPower) {
        currentPoints += tapPower;
        currentEnergy -= tapPower;
        updateUI();

        const rect = tapBtn.getBoundingClientRect();
        const x = e.clientX || (rect.left + rect.width / 2);
        const y = e.clientY || (rect.top + rect.height / 2);

        createTapParticle(x, y);

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveData, 800);
    }
});

async function saveData() {
    if (!supabaseClient) return;
    let nowSec = Math.floor(Date.now() / 1000);
    await supabaseClient.from('users').upsert({
        id: user.id,
        username: usernameText,
        points: currentPoints,
        usd_balance: usdBalance,
        energy: currentEnergy,
        tap_power: tapPower,
        has_autobot: hasAutoBot,
        last_energy_update: nowSec
    });
}

setInterval(() => {
    if (currentEnergy < maxEnergy) {
        currentEnergy += 1;
        updateUI();
    }
}, 1000);

async function claimDailyReward() {
    let now = Math.floor(Date.now() / 1000);
    if (now - lastDailyClaim < 86400) {
        alert('⏳ Daily reward already claimed today! Check back tomorrow.');
        return;
    }
    
    currentPoints += 250;
    lastDailyClaim = now;
    updateUI();
    saveData();

    alert('🎉 Claimed +250 TON Points Daily Reward!');
}

async function buyMultitap() {
    if (currentPoints < 500) {
        alert('⚠️ Insufficient TON Points! Need 500 ₿');
        return;
    }
    currentPoints -= 500;
    tapPower += 1;
    updateUI();
    saveData();
    alert('🚀 Multitap Upgraded! Now getting ' + tapPower + 'x points per tap.');
}

async function buyAutoBot() {
    if (currentPoints < 2000) {
        alert('⚠️ Insufficient TON Points! Need 2000 ₿');
        return;
    }
    currentPoints -= 2000;
    hasAutoBot = true;
    document.getElementById('bot-buy-btn').style.display = 'none';
    document.getElementById('bot-claim-btn').style.display = 'block';
    updateUI();
    saveData();
    alert('🤖 Auto-Bot Purchased! It will now mine points for you.');
}

function claimBotEarnings() {
    let botBonus = Math.floor(Math.random() * 300) + 200;
    currentPoints += botBonus;
    updateUI();
    saveData();
    alert(`🎉 Auto-Bot mined +${botBonus} TON Points for you!`);
}

function watchAdTask() {
    if (typeof show_11809090 === 'function') {
        show_11809090({ ymid: user.id.toString() }).then(() => {
            usdBalance += 0.005;
            currentPoints += 100;
            updateUI();
            saveData();
            alert('🎉 Earned $0.005 USD and +100 TON Points!');
        }).catch((err) => {
            alert('No ad available right now. Try again later!');
        });
    } else {
        usdBalance += 0.005;
        currentPoints += 100;
        updateUI();
        saveData();
        alert('Test Ad Completed! Earned $0.005 USD and 100 TON Points.');
    }
}

async function processWithdrawal() {
    const method = document.getElementById('withdraw-method').value;
    const account = document.getElementById('withdraw-account').value.trim();

    if (usdBalance < 0.50) {
        alert('⚠️ Minimum withdrawal amount is $0.50 USD!');
        return;
    }

    if (!account) {
        alert('⚠️ Please enter account number or wallet address!');
        return;
    }

    if(confirm(`Request withdrawal of $${usdBalance.toFixed(2)} to ${method} (${account})?`)) {
        let currentReq = usdBalance;
        usdBalance = 0.00;
        let statusText = `Pending: $${currentReq.toFixed(2)} via ${method} (${account})`;
        
        document.getElementById('withdraw-history').innerText = statusText;
        updateUI();

        await supabaseClient.from('users').upsert({
            id: user.id,
            username: usernameText,
            usd_balance: 0.00,
            withdraw_status: statusText
        });

        alert('✅ Withdrawal Request Submitted Successfully!');
    }
}

document.getElementById('share-ref-btn').addEventListener('click', () => {
    const botUsername = "TapToTonEarn_bot"; 
    const refLink = `https://t.me/${botUsername}?start=ref_${user.id}`;
    const shareText = `Join TapToTon and earn USD and TON Points instantly! 🚀`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`);
});

loadUserData();
