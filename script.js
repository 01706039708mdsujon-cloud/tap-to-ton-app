const tg = window.Telegram.WebApp;
tg.expand();

const SUPABASE_URL = "https://gnqevgdnkwizeegiwsdc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducWV2Z2Rua3dpemVlZ2l3c2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDkyMDIsImV4cCI6MjEwNDk4NTIwMn0.W4U4_AhCfmYc4lWAjiIZj1VAGfcFWxBUts4UmjKoHZI";

let supabaseClient = window.supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
let user = tg.initDataUnsafe?.user || { id: 12345678, username: "TestUser", first_name: "Test" };
let startParam = tg.initDataUnsafe?.start_param || "";

// States
let currentPoints = 0;
let usdBalance = 0.00;
let maxEnergy = 500;
let currentEnergy = 500;
let tapPower = 1;
let hasAutoBot = false;
let streakDays = 1;
let lastDailyClaim = 0;
let isTgTaskDone = false;

// Settings
let isSoundEnabled = true;
let currentLang = 'bn';

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTapSound() {
    if (!isSoundEnabled) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch(e) {}
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    document.getElementById('sound-btn').innerText = isSoundEnabled ? '🔊' : '🔇';
}

// 💵 GENERATE ANIMATED FLOATING DOLLARS & CURRENCY PARTICLES
function createMoneyParticles() {
    const container = document.getElementById('money-particles');
    if (!container) return;
    
    const symbols = ['$', '💵', '💲', '₿', '$', '💵'];
    
    for (let i = 0; i < 25; i++) {
        let particle = document.createElement('div');
        particle.classList.add('money-particle');
        
        particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];
        
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.fontSize = `${Math.random() * 14 + 16}px`;
        particle.style.animationDuration = `${Math.random() * 8 + 7}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        if (Math.random() > 0.5) {
            particle.style.color = 'rgba(251, 191, 36, 0.7)';
            particle.style.textShadow = '0 0 10px rgba(251, 191, 36, 0.5)';
        }

        container.appendChild(particle);
    }
}
createMoneyParticles();

const translations = {
    bn: {
        ton_balance: "TON Points (Tapping)",
        usd_balance: "Ad Earnings (USD)",
        daily_title: "📅 Daily Streak Check-in",
        daily_sub: "প্রতিদিন লগইন করে বড় বড় রিওয়ার্ড ক্লেইম করুন!",
        daily_btn: "Claim Daily Bonus",
        boost_tap_title: "⚡ Upgrade Tapping",
        boost_tap_sub: "প্রতি ট্যাপে পাবেন বেশি পয়েন্ট!",
        boost_tap_btn: "Upgrade Multitap (Cost: 500 ₿)",
        tap_power: "Current Power:",
        bot_title: "🤖 Auto-Tap Bot",
        bot_sub: "অফলাইনে থাকলেও পয়েন্ট জমা হতে থাকবে!",
        bot_buy: "Buy Auto-Bot (Cost: 2000 ₿)",
        bot_claim: "Claim Bot Earnings",
        lead_title: "🏆 Top 10 Tappers",
        task_ad_title: "📹 Watch Video Ads",
        task_ad_sub: "প্রতিটি এড দেখার জন্য পাবেন $0.005 USD এবং +100 TON Points!",
        task_ad_btn: "Watch Video Ad",
        task_social_title: "📢 Social Quests",
        task_social_sub: "আমাদের অফিশিয়াল টেলিগ্রাম চ্যানেলে জয়েন করে পয়েন্ট ক্লেইম করুন!",
        withdraw_title: "💸 Instant Withdraw",
        withdraw_sub: "মিনিমাম উইথড্র: $0.50 USD (Bkash, Nagad, TON Wallet)",
        withdraw_btn: "Submit Request",
        withdraw_history_title: "📜 Last Request Status",
        ref_title: "Invite Friends!",
        ref_sub: "Earn +500 TON Points per referral.",
        ref_count: "Total Referrals:",
        ref_btn: "Share Invite Link",
        help_title: "🎧 24/7 Official Helpline",
        help_sub: "যেকোনো সমস্যা বা উইথড্র সহায়তার জন্য সরাসরি যোগাযোগ করুন:",
        nav_earn: "Earn", nav_boost: "Boost", nav_ranks: "Ranks", nav_ads: "Ads", nav_withdraw: "Withdraw", nav_friends: "Friends", nav_help: "Help"
    },
    en: {
        ton_balance: "TON Points (Tapping)",
        usd_balance: "Ad Earnings (USD)",
        daily_title: "📅 Daily Streak Check-in",
        daily_sub: "Log in daily to claim bigger rewards!",
        daily_btn: "Claim Daily Bonus",
        boost_tap_title: "⚡ Upgrade Tapping",
        boost_tap_sub: "Get more points per tap!",
        boost_tap_btn: "Upgrade Multitap (Cost: 500 ₿)",
        tap_power: "Current Power:",
        bot_title: "🤖 Auto-Tap Bot",
        bot_sub: "Mine points even when you are offline!",
        bot_buy: "Buy Auto-Bot (Cost: 2000 ₿)",
        bot_claim: "Claim Bot Earnings",
        lead_title: "🏆 Top 10 Tappers",
        task_ad_title: "📹 Watch Video Ads",
        task_ad_sub: "Get $0.005 USD and +100 TON Points per ad!",
        task_ad_btn: "Watch Video Ad",
        task_social_title: "📢 Social Quests",
        task_social_sub: "Join our official Telegram channel and earn bonus!",
        withdraw_title: "💸 Instant Withdraw",
        withdraw_sub: "Minimum payout: $0.50 USD (Bkash, Nagad, TON)",
        withdraw_btn: "Submit Request",
        withdraw_history_title: "📜 Last Request Status",
        ref_title: "Invite Friends!",
        ref_sub: "Earn +500 TON Points per referral.",
        ref_count: "Total Referrals:",
        ref_btn: "Share Invite Link",
        help_title: "🎧 24/7 Official Helpline",
        help_sub: "Contact support for instant assistance:",
        nav_earn: "Earn", nav_boost: "Boost", nav_ranks: "Ranks", nav_ads: "Ads", nav_withdraw: "Withdraw", nav_friends: "Friends", nav_help: "Help"
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'bn' ? 'en' : 'bn';
    document.getElementById('lang-btn').innerText = currentLang === 'bn' ? '🌐 EN' : '🌐 BN';
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });
}

const usernameText = user.username ? `@${user.username}` : (user.first_name || 'User');
document.getElementById('user-display').innerText = usernameText;

function switchTab(event, tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    activeTab.classList.add('active');
    
    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    if(tabName === 'lead') loadLeaderboard();
    if(tabName === 'ref') loadReferralCount();
}

// Data loading and logic
async function loadUserData() {
    if (!supabaseClient) return;

    try {
        let { data } = await supabaseClient.from('users').select('*').eq('id', user.id).maybeSingle();

        if (data) {
            currentPoints = data.points || 0;
            usdBalance = parseFloat(data.usd_balance || 0.00);
            tapPower = data.tap_power || 1;
            hasAutoBot = data.has_autobot || false;
            streakDays = data.streak_days || 1;
            lastDailyClaim = data.last_daily_claim || 0;
            isTgTaskDone = data.is_tg_task_done || false;
            
            let lastUpdate = data.last_energy_update || Math.floor(Date.now() / 1000);
            let now = Math.floor(Date.now() / 1000);
            let recovered = Math.floor(now - lastUpdate);
            
            currentEnergy = Math.min(maxEnergy, (data.energy !== undefined ? data.energy : maxEnergy) + recovered);
            
            if (hasAutoBot) {
                document.getElementById('bot-buy-btn').style.display = 'none';
                document.getElementById('bot-claim-btn').style.display = 'block';
            }

            if (isTgTaskDone) {
                document.getElementById('tg-task-btn').innerText = "✅ Channel Joined";
                document.getElementById('tg-task-btn').disabled = true;
            }

            if (data.withdraw_status) {
                document.getElementById('withdraw-history').innerText = data.withdraw_status;
            }

            document.getElementById('streak-count').innerText = streakDays;
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
            ], { onConflict: 'id' });

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

    setTimeout(() => { particle.remove(); }, 850);
}

const tapBtn = document.getElementById('tap-btn');
let saveTimeout;
let tapClickCounter = 0;

tapBtn.addEventListener('click', (e) => {
    tapClickCounter++;
    if(tapClickCounter > 25) return; 

    if (currentEnergy >= tapPower) {
        currentPoints += tapPower;
        currentEnergy -= tapPower;
        updateUI();
        playTapSound();

        const rect = tapBtn.getBoundingClientRect();
        const x = e.clientX || (rect.left + rect.width / 2);
        const y = e.clientY || (rect.top + rect.height / 2);

        createTapParticle(x, y);

        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveData, 800);
    }
});

setInterval(() => { tapClickCounter = 0; }, 1000);

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
        streak_days: streakDays,
        last_daily_claim: lastDailyClaim,
        is_tg_task_done: isTgTaskDone,
        last_energy_update: nowSec
    }, { onConflict: 'id' });
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
    
    let bonusAmount = streakDays * 200;
    currentPoints += bonusAmount;
    lastDailyClaim = now;
    streakDays += 1;
    document.getElementById('streak-count').innerText = streakDays;

    updateUI();
    saveData();

    alert(`🎉 Claimed +${bonusAmount} TON Points!`);
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
    alert('🤖 Auto-Bot Purchased!');
}

function claimBotEarnings() {
    let botBonus = Math.floor(Math.random() * 300) + 200;
    currentPoints += botBonus;
    updateUI();
    saveData();
    alert(`🎉 Auto-Bot mined +${botBonus} TON Points!`);
}

function watchAdTask() {
    if (typeof show_11809090 === 'function') {
        show_11809090({ ymid: user.id.toString() }).then(() => {
            usdBalance += 0.005;
            currentPoints += 100;
            updateUI();
            saveData();
            alert('🎉 Earned $0.005 USD and +100 TON Points!');
        }).catch(() => {
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

function completeTelegramTask() {
    tg.openTelegramLink("https://t.me/TapToTonCommunity");
    setTimeout(() => {
        if (!isTgTaskDone) {
            isTgTaskDone = true;
            currentPoints += 300;
            document.getElementById('tg-task-btn').innerText = "✅ Channel Joined";
            document.getElementById('tg-task-btn').disabled = true;
            updateUI();
            saveData();
            alert("🎉 +300 TON Points added!");
        }
    }, 3000);
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
        }, { onConflict: 'id' });

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
