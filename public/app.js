
        // --- 音源ファイル優先 AudioManager（欠落時は Web Audio 合成分岐） ---
        const AUDIO_FILES = {
            bgm: '/assets/audio/bgm.mp3',
            sizzle: '/assets/audio/sizzle.mp3',
            trash: '/assets/audio/trash.mp3',
            dolphin: '/assets/audio/dolphin.mp3',
            pull: '/assets/audio/pull.mp3',
            miss: '/assets/audio/miss.mp3'
        };
        class SoundFX {
            constructor() {
                this.ctx = null;
                this.bgmEnabled = false;
                this.bgmInterval = null;
                this.noteIndex = 0;
                this.fileAudio = null;      // { bgm: HTMLAudioElement, pools: {name: HTMLAudioElement[]} }
                this.fileOk = {};           // name -> true/false/undefined(unknown)
                this.seCursor = {};
            }

            ensureFileAudio() {
                if (this.fileAudio || typeof window === 'undefined' || typeof window.Audio === 'undefined') return;
                try {
                    const mk = (src, volume) => {
                        const el = new window.Audio(src);
                        el.preload = 'auto';
                        el.volume = volume;
                        return el;
                    };
                    const pools = {};
                    for (const [name, volume] of [['sizzle', 0.5], ['trash', 0.5], ['dolphin', 0.6], ['pull', 0.6], ['miss', 0.6]]) {
                        pools[name] = [mk(AUDIO_FILES[name], volume), mk(AUDIO_FILES[name], volume), mk(AUDIO_FILES[name], volume)];
                        pools[name].forEach((el) => {
                            el.addEventListener('error', () => { this.fileOk[name] = false; });
                            el.addEventListener('canplaythrough', () => { if (this.fileOk[name] !== false) this.fileOk[name] = true; });
                        });
                        this.seCursor[name] = 0;
                    }
                    const bgm = mk(AUDIO_FILES.bgm, 0.35);
                    bgm.loop = true;
                    bgm.addEventListener('error', () => { this.fileOk.bgm = false; });
                    bgm.addEventListener('canplaythrough', () => { if (this.fileOk.bgm !== false) this.fileOk.bgm = true; });
                    this.fileAudio = { bgm, pools };
                } catch (e) { /* file audio unsupported -> synth only */ }
            }

            init() {
                if (!this.ctx) {
                    try {
                        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                    } catch (e) {}
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume().catch(() => {});
                }
                this.ensureFileAudio();
            }

            playFile(name) {
                if (!this.fileAudio || this.fileOk[name] === false) return false;
                try {
                    const pool = this.fileAudio.pools[name];
                    if (!pool) return false;
                    const el = pool[this.seCursor[name] % pool.length];
                    this.seCursor[name]++;
                    el.currentTime = 0;
                    const p = el.play();
                    if (p && typeof p.catch === 'function') p.catch(() => { this.fileOk[name] = false; });
                    return true;
                } catch (e) {
                    return false;
                }
            }

            toggleBGM() {
                this.init();
                this.bgmEnabled = !this.bgmEnabled;
                if (this.bgmEnabled) {
                    this.startBGM();
                } else {
                    this.stopBGM();
                }
                return this.bgmEnabled;
            }

            startBGM() {
                // ファイルBGMを試し、不可なら合成BGMへ
                if (this.fileAudio && this.fileOk.bgm !== false) {
                    try {
                        this.stopSynthBGM();
                        this.fileAudio.bgm.currentTime = 0;
                        const p = this.fileAudio.bgm.play();
                        if (p && typeof p.catch === 'function') {
                            p.then(() => { this.fileOk.bgm = true; }).catch(() => {
                                this.fileOk.bgm = false;
                                if (this.bgmEnabled) this.startSynthBGM();
                            });
                        }
                        return;
                    } catch (e) { /* fall through to synth */ }
                }
                this.startSynthBGM();
            }

            stopBGM() {
                try { if (this.fileAudio) { this.fileAudio.bgm.pause(); } } catch (e) {}
                this.stopSynthBGM();
            }

            stopSynthBGM() {
                if (this.bgmInterval) clearInterval(this.bgmInterval);
                this.bgmInterval = null;
            }

            startSynthBGM() {
                if (!this.ctx) return;
                if (this.bgmInterval) clearInterval(this.bgmInterval);
                const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
                const melody = [0, 2, 3, 5, 4, 3, 2, 0, 3, 5, 7, 5, 4, 3, 2, 0];

                this.bgmInterval = setInterval(() => {
                    if (!this.bgmEnabled || !this.ctx) return;
                    if (this.fileOk.bgm === true) return; // ファイルBGM再生中は合成を止める
                    const freq = scale[melody[this.noteIndex % melody.length]];
                    this.playTone(freq, 'triangle', 0.15, 0.03);
                    if (this.noteIndex % 2 === 0) {
                        this.playTone(130.81, 'sine', 0.2, 0.05);
                    }
                    this.noteIndex++;
                }, 200);
            }

            playTone(freq, type, duration, gainValue = 0.1) {
                if (!this.ctx) return;
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                    gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + duration);
                } catch (e) {}
            }

            sizzle(count = 1) {
                if (this.playFile('sizzle')) return;
                const baseFreq = 500 + (count - 1) * 120;
                this.playTone(baseFreq, 'sawtooth', 0.12, 0.12);
                setTimeout(() => this.playTone(baseFreq * 1.25, 'sine', 0.18, 0.15), 40);
            }

            trash() {
                if (this.playFile('trash')) return;
                this.playTone(180, 'square', 0.1, 0.08);
            }

            dolphin() {
                if (this.playFile('dolphin')) return;
                if (!this.ctx) return;
                this.playTone(880, 'sine', 0.1, 0.15);
                setTimeout(() => this.playTone(1760, 'sine', 0.25, 0.2), 60);
                setTimeout(() => this.playTone(2200, 'sine', 0.3, 0.2), 120);
            }

            perfectPull(multiplier = 1) {
                if (this.playFile('pull')) return;
                if (!this.ctx) return;
                const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
                const notes = freqs.slice(0, 2 + multiplier);
                notes.forEach((f, i) => {
                    setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.25), i * 45);
                });
            }

            miss() {
                if (this.playFile('miss')) return;
                if (!this.ctx) return;
                this.playTone(120, 'sawtooth', 0.4, 0.3);
            }
        }

        const sfx = new SoundFX();

        // --- パーティクル描画 (Canvas) ---
        const canvas = document.getElementById('fx-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class Particle {
            constructor(x, y, color, size, vx, vy, life) {
                this.x = x;
                this.y = y;
                this.color = color;
                this.size = size;
                this.vx = vx;
                this.vy = vy;
                this.life = life;
                this.maxLife = life;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.15;
                this.life--;
            }

            draw(c) {
                c.save();
                c.globalAlpha = Math.max(0, this.life / this.maxLife);
                c.fillStyle = this.color;
                c.beginPath();
                c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }
        }

        function createExplosion(x, y, colors, count = 30) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 2;
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 6 + 3;
                particles.push(new Particle(
                    x, y, color, size,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed - 2,
                    Math.random() * 30 + 20
                ));
            }
        }

        function renderParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw(ctx);
                if (particles[i].life <= 0) {
                    particles.splice(i, 1);
                }
            }
            requestAnimationFrame(renderParticles);
        }
        renderParticles();

        // --- ゲーム定数・状態 ---
        const ITEMS = [
            { id: 'eel', name: '新鮮ウナギ', sub: '（Eel）', emoji: '🐍', type: 'eel' },
            { id: 'electric_eel', name: 'デンキウナギ', sub: '（危険！）', emoji: '⚡', type: 'danger' },
            { id: 'poison_eel', name: '毒ウナギ', sub: '（要らん！）', emoji: '🟣', type: 'danger' },
            { id: 'anago', name: '偽ウナギ（アナゴ）', sub: '（紛らわしい）', emoji: '🐟', type: 'danger' },
            { id: 'dolphin', name: 'イルカ', sub: '（イルカが居る！）', emoji: '🐬', type: 'dolphin' }
        ];

        let gameState = {
            isPlaying: false,
            isTutorial: false,
            score: 0,
            timeLeft: 60,
            combo: 0,
            rushMode: false,
            rushTimer: null,
            timerInterval: null,
            cookInterval: null,
            currentItem: null,
            wok: {
                eelCount: 0,
                cookProgress: 0,
                status: 'empty'
            },
            stats: { cooked: 0, trashed: 0, saved: 0, burned: 0 }
        };

        // DOM参照
        const $ = (id) => document.getElementById(id);
        const elScore = $('score-text');
        const elTimer = $('timer-text');
        const elComboContainer = $('combo-container');
        const elComboCount = $('combo-count');
        const elRushBadge = $('rush-badge');
        const elTutBadge = $('tut-badge');

        const elItemCard = $('item-card');
        const elItemEmoji = $('item-emoji');
        const elItemName = $('item-name');
        const elItemSub = $('item-sub');

        const elWokContainer = $('wok-container');
        const elWokEmoji = $('wok-emoji');
        const elWokStatusText = $('wok-status-text');
        const elWokBadge = $('wok-badge');
        const elCookProgress = $('cook-progress');
        const elSteamEffect = $('steam-effect');
        const elPullBonusText = $('pull-bonus-text');

        // --- オンラインランキング（Worker + D1、localStorageフォールバック） ---
        const RANKING_KEY = 'iru_iru_kaku_rankings_v1';
        const FALLBACK_RANKINGS = [
            { name: "居る居る閣 龍", score: 8500, rank_title: "👑 伝説の爆熱ウナギ炒り神" },
            { name: "さすらいシェフ", score: 5400, rank_title: "🔥 一流ウナギ炒り職人" },
            { name: "うな吉", score: 3200, rank_title: "🍳 一人前の調理人" },
            { name: "看板娘アオイ", score: 1800, rank_title: "見習いシェフ" },
            { name: "新人スタッフルーキー", score: 800, rank_title: "見習いシェフ" }
        ];
        let rankingScope = 'daily';

        function loadLocalRankings() {
            try {
                const data = localStorage.getItem(RANKING_KEY);
                if (data) return JSON.parse(data);
            } catch (e) {}
            return FALLBACK_RANKINGS.slice();
        }

        function saveLocalRankings(rankings) {
            try {
                localStorage.setItem(RANKING_KEY, JSON.stringify(rankings.slice(0, 5)));
            } catch (e) {}
        }

        async function fetchRankings(scope) {
            try {
                const res = await fetch('/api/rankings?scope=' + scope + '&limit=5');
                if (!res.ok) throw new Error('bad status ' + res.status);
                const data = await res.json();
                if (!Array.isArray(data.rankings)) throw new Error('bad payload');
                return data.rankings;
            } catch (e) {
                return null;
            }
        }

        function renderRankingRows(rankings) {
            const listEl = $('ranking-list');
            listEl.innerHTML = '';
            if (!rankings.length) {
                const li = document.createElement('li');
                li.className = 'text-center text-stone-400 text-xs py-4';
                li.textContent = 'まだ記録がありません。最初の職人になろう！';
                listEl.appendChild(li);
                return;
            }

            rankings.slice(0, 5).forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center bg-black/40 px-2 py-1 rounded border border-amber-900/40';
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1) + '.';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'font-bold text-amber-200 truncate max-w-[110px]';
                nameSpan.textContent = medal + ' ' + String(item.name ?? '???').slice(0, 20);
                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'font-black text-amber-400 tracking-wider';
                scoreSpan.textContent = Number(item.score ?? 0) + ' pt';
                li.appendChild(nameSpan);
                li.appendChild(scoreSpan);
                listEl.appendChild(li);
            });
        }

        function updateRankingTabs() {
            const daily = $('ranking-tab-daily');
            const alltime = $('ranking-tab-alltime');
            if (!daily || !alltime) return;
            const active = 'flex-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-amber-500 bg-amber-500 text-black cursor-pointer transition';
            const inactive = 'flex-1 text-[11px] font-bold px-2 py-1 rounded-lg border border-amber-800 text-amber-300 cursor-pointer transition';
            daily.className = rankingScope === 'daily' ? active : inactive;
            alltime.className = rankingScope === 'alltime' ? active : inactive;
        }

        async function renderStartRanking() {
            updateRankingTabs();
            const listEl = $('ranking-list');
            const rows = await fetchRankings(rankingScope);
            if (rows) {
                if (!rows.length && rankingScope === 'daily') {
                    // デイリー初日は全期間を表示して空を見せない
                    const all = await fetchRankings('alltime');
                    renderRankingRows(all && all.length ? all : loadLocalRankings());
                } else {
                    renderRankingRows(rows);
                    saveLocalRankings(rows.map((r) => ({ name: r.name, score: r.score, rank: r.rank_title })));
                }
            } else {
                renderRankingRows(loadLocalRankings());
            }
        }

        function switchRankingScope(scope) {
            if (rankingScope === scope) return;
            rankingScope = scope;
            renderStartRanking();

            if ($('ranking-tab-daily')) $('ranking-tab-daily').addEventListener('click', () => switchRankingScope('daily'));
            if ($('ranking-tab-alltime')) $('ranking-tab-alltime').addEventListener('click', () => switchRankingScope('alltime'));
        }

        function checkAndHandleHighScore(score, rankTitle) {
            const inputContainer = $('high-score-input-container');
            if (!(score > 0)) {
                inputContainer.classList.add('hidden');
                return;
            }
            // サーバー側で順位判定するため、スコア>0は常時登録可とする
            inputContainer.classList.remove('hidden');
            $('btn-save-score').onclick = async () => {
                const btn = $('btn-save-score');
                btn.disabled = true;
                try {
                    const name = $('player-name-input').value.trim().slice(0, 8) || 'ウナギ職人';
                    const st = (gameState && gameState.stats) || { cooked: 0, trashed: 0, saved: 0, burned: 0 };
                    const res = await fetch('/api/scores', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            name,
                            score,
                            rankTitle,
                            fried: st.cooked ?? 0,
                            discarded: st.trashed ?? 0,
                            saved: st.saved ?? 0,
                            burned: st.burned ?? 0
                        })
                    });
                    if (!res.ok) throw new Error('save failed: ' + res.status);
                    const data = await res.json();
                    inputContainer.classList.add('hidden');
                    rankingScope = 'daily';
                    await renderStartRanking();
                    showJudgementText('ランキングに登録しました！(本日' + (data.rankInDaily ?? '?') + '位)', '#fef08a');
                } catch (e) {
                    // オフライン時は従来通り端末内保存
                    const rankings = loadLocalRankings();
                    const name = $('player-name-input').value.trim() || 'ウナギ職人';
                    rankings.push({ name, score, rank: rankTitle });
                    rankings.sort((a, b) => b.score - a.score);
                    saveLocalRankings(rankings);
                    inputContainer.classList.add('hidden');
                    renderRankingRows(loadLocalRankings());
                    showJudgementText('オフラインのため端末内に保存しました', '#fef08a');
                } finally {
                    btn.disabled = false;
                }
            };
        }

        // --- チュートリアルツアー処理 ---
        let tutStep = 0;
        const tutSteps = [
            {
                stepText: "STEP 1 / 4",
                icon: "🐍",
                title: "「新鮮ウナギ」を鍋に入れる！",
                desc: "左カードに「新鮮ウナギ」が出ています。【🔥 炒る！】ボタンを押して鍋へ入れよう！(最大5匹)",
                highlightElId: "btn-iru-pan",
                itemToSet: ITEMS[0] // ウナギ
            },
            {
                stepText: "STEP 2 / 4",
                icon: "⚡",
                title: "「危険物/偽物」はゴミ箱へ処分！",
                desc: "「デンキウナギ」「毒ウナギ」「アナゴ」が出たら【🗑️ 要らん】を押して破棄しよう！",
                highlightElId: "btn-iran",
                itemToSet: ITEMS[1] // デンキウナギ
            },
            {
                stepText: "STEP 3 / 4",
                icon: "🐬",
                title: "「イルカ」は海へ開放！",
                desc: "珍しいイルカが出現したら【🐬 居る！】を押そう！RUSHタイムが発動するぞ！",
                highlightElId: "btn-iru-dolphin",
                itemToSet: ITEMS[4] // イルカ
            },
            {
                stepText: "STEP 4 / 4",
                icon: "🍽️",
                title: "黄金タイミングで皿へ引き上げる！",
                desc: "右側の鍋にウナギが入っています！メーターが「黄金ゾーン」に達したタイミングで【皿へ盛る！】を押そう！",
                highlightElId: "btn-pull-out",
                itemToSet: ITEMS[0]
            }
        ];

        function startTutorialMode() {
            sfx.init();
            
            gameState = {
                isPlaying: true,
                isTutorial: true,
                score: 0,
                timeLeft: 999,
                combo: 0,
                rushMode: false,
                rushTimer: null,
                timerInterval: null,
                cookInterval: null,
                currentItem: null,
                wok: { eelCount: 0, cookProgress: 0, status: 'empty' },
                stats: { cooked: 0, trashed: 0, saved: 0, burned: 0 }
            };

            $('modal-start').classList.add('hidden');
            $('modal-result').classList.add('hidden');
            $('tutorial-banner').classList.remove('hidden');
            elTutBadge.classList.remove('hidden');
            elTimer.innerText = "∞";

            tutStep = 0;
            applyTutStep(0);

            if (gameState.cookInterval) clearInterval(gameState.cookInterval);
            gameState.cookInterval = setInterval(updateWokCooking, 50);
        }

        function clearAllHighlights() {
            document.querySelectorAll('.tutorial-highlight').forEach(el => {
                el.classList.remove('tutorial-highlight');
            });
        }

        function applyTutStep(stepIdx) {
            clearAllHighlights();
            if (stepIdx >= tutSteps.length) {
                endTutorialMode();
                return;
            }

            const step = tutSteps[stepIdx];
            tutStep = stepIdx;

            $('tut-banner-step').innerText = step.stepText;
            $('tut-banner-icon').innerText = step.icon;
            $('tut-banner-title').innerText = step.title;
            $('tut-banner-desc').innerText = step.desc;

            // 食材の強制指定
            gameState.currentItem = step.itemToSet;
            elItemEmoji.innerText = gameState.currentItem.emoji;
            elItemName.innerText = gameState.currentItem.name;
            elItemSub.innerText = gameState.currentItem.sub;

            // STEP 4 の場合、鍋にウナギを入れ調理進行
            if (stepIdx === 3) {
                if (gameState.wok.eelCount === 0) {
                    gameState.wok.eelCount = 2;
                    gameState.wok.cookProgress = 60; // 黄金ゾーン直下
                    updateWokUI();
                }
            }

            // ハイライト付与
            const targetEl = $(step.highlightElId);
            if (targetEl) {
                targetEl.classList.add('tutorial-highlight');
            }
        }

        function endTutorialMode() {
            clearAllHighlights();
            $('tutorial-banner').classList.add('hidden');
            elTutBadge.classList.add('hidden');
            gameState.isTutorial = false;
            gameState.isPlaying = false;
            clearInterval(gameState.cookInterval);
            resetWok();
            
            showJudgementText("チュートリアル完了！", "#fbbf24");
            setTimeout(() => {
                $('modal-start').classList.remove('hidden');
            }, 800);
        }

        // --- メインゲーム処理 ---
        function startGame() {
            sfx.init();
            clearAllHighlights();
            $('tutorial-banner').classList.add('hidden');
            elTutBadge.classList.add('hidden');
            
            gameState = {
                isPlaying: true,
                isTutorial: false,
                score: 0,
                timeLeft: 60,
                combo: 0,
                rushMode: false,
                rushTimer: null,
                timerInterval: null,
                cookInterval: null,
                currentItem: null,
                wok: { eelCount: 0, cookProgress: 0, status: 'empty' },
                stats: { cooked: 0, trashed: 0, saved: 0, burned: 0 }
            };

            updateUI();
            resetWokUI();
            nextItem();

            $('modal-start').classList.add('hidden');
            $('modal-result').classList.add('hidden');

            showJudgementText("開店！爆熱スタート！", "#fbbf24");

            if (gameState.timerInterval) clearInterval(gameState.timerInterval);
            gameState.timerInterval = setInterval(() => {
                if (gameState.isTutorial) return;
                gameState.timeLeft--;
                elTimer.innerText = gameState.timeLeft;

                if (gameState.timeLeft <= 0) {
                    endGame();
                }
            }, 1000);

            if (gameState.cookInterval) clearInterval(gameState.cookInterval);
            gameState.cookInterval = setInterval(updateWokCooking, 50);
        }

        function endGame() {
            gameState.isPlaying = false;
            clearInterval(gameState.timerInterval);
            clearInterval(gameState.cookInterval);
            if (gameState.rushTimer) clearTimeout(gameState.rushTimer);

            $('result-score').innerText = gameState.score;
            $('stat-cooked').innerText = gameState.stats.cooked;
            $('stat-trashed').innerText = gameState.stats.trashed;
            $('stat-saved').innerText = gameState.stats.saved;
            $('stat-burned').innerText = gameState.stats.burned;

            let rank = '見習いシェフ';
            if (gameState.score >= 10000) rank = '👑 伝説の爆熱ウナギ炒り神';
            else if (gameState.score >= 6000) rank = '🔥 一流ウナギ炒り職人';
            else if (gameState.score >= 3000) rank = '🍳 一人前の調理人';
            else if (gameState.stats.burned >= 4) rank = '⚠️ ボヤ騒ぎを起こした危険人物';

            $('result-rank').innerText = rank;
            checkAndHandleHighScore(gameState.score, rank);

            $('modal-result').classList.remove('hidden');
        }

        function nextItem() {
            if (gameState.isTutorial) return; // チュートリアル中は手動制御

            if (gameState.rushMode) {
                gameState.currentItem = ITEMS[0];
            } else {
                // ランダム出現（ウナギ62%, 危険物30%, イルカ8%）
                const rand = Math.random();
                if (rand < 0.62) {
                    gameState.currentItem = ITEMS[0];
                } else if (rand < 0.92) {
                    const dIdx = Math.floor(Math.random() * 3) + 1;
                    gameState.currentItem = ITEMS[dIdx];
                } else {
                    gameState.currentItem = ITEMS[4]; // イルカ(8%)
                }
            }

            elItemEmoji.innerText = gameState.currentItem.emoji;
            elItemName.innerText = gameState.currentItem.name;
            elItemSub.innerText = gameState.currentItem.sub;

            elItemCard.classList.remove('shake-heavy');
            void elItemCard.offsetWidth;
            elItemCard.classList.add('shake-heavy');
        }

        function actionSort(chosenType) {
            if (!gameState.isPlaying) return;

            const item = gameState.currentItem;
            const rect = elItemCard.getBoundingClientRect();
            const posX = rect.left + rect.width / 2;
            const posY = rect.top + rect.height / 2;

            if (chosenType === 'pan') {
                if (item.type === 'eel') {
                    if (gameState.wok.eelCount < 5) {
                        gameState.wok.eelCount++;
                        sfx.sizzle(gameState.wok.eelCount);
                        
                        if (gameState.wok.eelCount === 1) {
                            gameState.wok.cookProgress = 0;
                        } else {
                            gameState.wok.cookProgress = Math.max(0, gameState.wok.cookProgress - 8);
                        }
                        
                        triggerWokShake();
                        createExplosion(posX, posY, ['#f59e0b', '#ef4444', '#fbbf24'], 20);
                        addScore(60);
                        addCombo();
                        showJudgementText(`炒る！ (${gameState.wok.eelCount}/5)`, '#fbbf24');
                    } else {
                        sfx.sizzle(5);
                        addScore(30);
                        showJudgementText("鍋満タン(5匹)！", "#f59e0b");
                    }
                } else {
                    const lostCount = gameState.wok.eelCount;
                    if (lostCount > 0) {
                        gameState.stats.burned += lostCount;
                        resetWok();
                        handleMiss(`危険物混入！ウナギ${lostCount}匹全滅！`);
                    } else {
                        resetWok();
                        handleMiss("危険物を炒めてしまった！");
                    }
                    createExplosion(posX, posY, ['#dc2626', '#000000', '#7f1d1d'], 35);
                }
            } else if (chosenType === 'trash') {
                if (item.type === 'danger') {
                    sfx.trash();
                    addScore(50);
                    addCombo();
                    gameState.stats.trashed++;
                    createExplosion(posX, posY, ['#64748b', '#94a3b8'], 15);
                    showJudgementText("要らん！破棄！", "#94a3b8");
                } else {
                    handleMiss("新鮮ウナギを捨ててしまった！");
                    createExplosion(posX, posY, ['#dc2626'], 25);
                }
            } else if (chosenType === 'dolphin') {
                if (item.type === 'dolphin') {
                    sfx.dolphin();
                    addScore(200);
                    addCombo();
                    gameState.stats.saved++;
                    createExplosion(posX, posY, ['#38bdf8', '#0ea5e9', '#ffffff'], 40);
                    showJudgementText("🐬 居る！大海原へ！", "#38bdf8");
                    triggerRushMode();
                } else {
                    handleMiss("イルカじゃない！");
                }
            }

            // チュートリアル中であればステップ進行チェック
            if (gameState.isTutorial) {
                if ((tutStep === 0 && chosenType === 'pan') ||
                    (tutStep === 1 && chosenType === 'trash') ||
                    (tutStep === 2 && chosenType === 'dolphin')) {
                    applyTutStep(tutStep + 1);
                }
            } else {
                nextItem();
            }
        }

        function triggerWokShake() {
            elWokContainer.classList.remove('shake-heavy');
            void elWokContainer.offsetWidth;
            elWokContainer.classList.add('shake-heavy');
        }

        function updateWokCooking() {
            if (!gameState.isPlaying || gameState.wok.eelCount === 0) return;

            gameState.wok.cookProgress += 1.25;

            if (gameState.wok.cookProgress < 50) {
                gameState.wok.status = 'raw';
            } else if (gameState.wok.cookProgress >= 50 && gameState.wok.cookProgress <= 85) {
                gameState.wok.status = 'perfect';
            } else if (gameState.wok.cookProgress > 85 && gameState.wok.cookProgress < 100) {
                gameState.wok.status = 'burning';
            } else if (gameState.wok.cookProgress >= 100) {
                gameState.wok.status = 'burned';
                sfx.miss();
                
                const count = gameState.wok.eelCount;
                gameState.stats.burned += count;
                const rect = elWokContainer.getBoundingClientRect();
                createExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2, ['#18181b', '#ef4444', '#71717a'], 50);
                handleMiss(`ウナギ${count}匹全滅焦がし！`);
                resetWok();
                return;
            }

            updateWokUI();
        }

        function actionPullOut() {
            if (!gameState.isPlaying) return;

            const count = gameState.wok.eelCount;
            if (count === 0) return;

            const rect = elWokContainer.getBoundingClientRect();
            const posX = rect.left + rect.width / 2;
            const posY = rect.top + rect.height / 2;

            const multiplierMap = { 1: 1.0, 2: 1.8, 3: 2.8, 4: 4.0, 5: 5.5 };
            const multiplier = multiplierMap[count] || 1.0;

            if (gameState.wok.status === 'perfect' || gameState.wok.status === 'burning') {
                sfx.perfectPull(count);
                
                const basePoints = 200 * count;
                const comboBonus = 1 + Math.floor(gameState.combo / 5) * 0.25;
                const finalPoints = Math.round(basePoints * comboBonus * multiplier);

                addScore(finalPoints);
                addCombo();
                gameState.stats.cooked += count;

                createExplosion(posX, posY, ['#fef08a', '#fbbf24', '#f59e0b', '#ffffff'], 40 + count * 10);

                if (count >= 5) {
                    showJudgementText("🐉 LEGEND 5-EEL STRIKE!! 🐉", "#fef08a");
                    triggerScreenShake();
                } else if (count >= 3) {
                    showJudgementText(`🔥 PERFECT ${count}-EEL COMBO! 🔥`, "#fef08a");
                } else {
                    showJudgementText(`美味！${finalPoints}pt獲得！`, "#fbbf24");
                }

            } else if (gameState.wok.status === 'raw') {
                sfx.sizzle(1);
                addScore(25 * count);
                gameState.stats.cooked += count;
                showJudgementText("生揚げ…！", "#94a3b8");
            }

            resetWok();

            if (gameState.isTutorial && tutStep === 3) {
                applyTutStep(tutStep + 1);
            }
        }

        function resetWok() {
            gameState.wok.eelCount = 0;
            gameState.wok.cookProgress = 0;
            gameState.wok.status = 'empty';
            resetWokUI();
        }

        // 5匹入っても崩れない頑丈なWok UI描画関数
        function updateWokUI() {
            const w = gameState.wok;
            elCookProgress.style.width = `${w.cookProgress}%`;

            elWokContainer.classList.remove('sizzle-perfect-super', 'border-red-600');
            elSteamEffect.classList.add('hidden');

            if (w.eelCount === 0) {
                resetWokUI();
                return;
            }

            elWokBadge.innerText = `${w.eelCount}/5 匹`;

            // 鍋の中はウナギ絵文字だけに特化！(グリッド/フレックスで視認性抜群)
            elWokEmoji.style.opacity = '1';
            const countDisplayHTML = {
                1: '<span class="text-4xl md:text-6xl animate-bounce">🐍</span>',
                2: '<div class="flex gap-2 text-3xl md:text-5xl"><span>🐍</span><span>🐍</span></div>',
                3: '<div class="flex gap-1.5 text-2xl md:text-4xl"><span>🐍</span><span>🐍</span><span>🐍</span></div>',
                4: '<div class="grid grid-cols-2 gap-2 text-2xl md:text-4xl"><span>🐍</span><span>🐍</span><span>🐍</span><span>🐍</span></div>',
                5: '<div class="flex flex-col items-center gap-1"><div class="flex gap-1 text-2xl md:text-3xl"><span>🐍</span><span>🐍</span><span>🐍</span></div><div class="flex gap-1 text-2xl md:text-3xl"><span>🐍</span><span>🐍</span></div></div>'
            };
            elWokEmoji.innerHTML = countDisplayHTML[w.eelCount] || '🐍';

            const bonusText = {
                1: '1匹引き上げ（標準）',
                2: '2匹引き上げ（1.8倍ボーナス）',
                3: '3匹引き上げ（2.8倍ボーナス）',
                4: '4匹引き上げ（4.0倍ボーナス）',
                5: '5匹引き上げ（超絶5.5倍倍率ボーナス！！）'
            };
            elPullBonusText.innerText = bonusText[w.eelCount] || '';

            if (w.status === 'raw') {
                elWokStatusText.innerText = `じわじわ炒め中… (${w.eelCount}/5匹)`;
                elWokStatusText.className = 'text-xs md:text-sm font-bold text-amber-300 truncate';
            } else if (w.status === 'perfect') {
                elWokStatusText.innerText = `【要る！】極上の焼き加減！(${w.eelCount}匹)`;
                elWokStatusText.className = 'text-xs md:text-sm font-black text-yellow-300 animate-pulse truncate';
                elWokContainer.classList.add('sizzle-perfect-super');
                elSteamEffect.classList.remove('hidden');
            } else if (w.status === 'burning') {
                elWokStatusText.innerText = '焦げる！今すぐ盛れ！';
                elWokStatusText.className = 'text-xs md:text-sm font-black text-red-400 animate-bounce truncate';
                elWokContainer.classList.add('border-red-600');
                elSteamEffect.classList.remove('hidden');
            }
        }

        function resetWokUI() {
            elCookProgress.style.width = '0%';
            elWokContainer.classList.remove('sizzle-perfect-super', 'border-red-600');
            elSteamEffect.classList.add('hidden');
            elWokBadge.innerText = '0/5 匹';
            elWokEmoji.innerHTML = '<span class="text-4xl md:text-6xl">🍳</span>';
            elWokEmoji.style.opacity = '0.3';
            elWokStatusText.innerText = '鍋は空っぽ';
            elWokStatusText.className = 'text-xs md:text-sm font-bold text-stone-400 truncate';
            elPullBonusText.innerText = '重ね炒り（最大5匹）で超絶倍率ボーナス！';
        }

        function addScore(pts) {
            gameState.score += pts;
            elScore.innerText = gameState.score;
        }

        function addCombo() {
            gameState.combo++;
            elComboCount.innerText = gameState.combo;
            
            if (gameState.combo >= 2) {
                elComboContainer.classList.remove('scale-0');
                elComboContainer.classList.add('scale-100');
            }

            // 15コンボごとにフィーバー発動（頻度をマイルドに調整）
            if (gameState.combo % 15 === 0) {
                triggerRushMode();
            }
        }

        function handleMiss(reason) {
            sfx.miss();
            gameState.combo = 0;
            elComboContainer.classList.add('scale-0');
            
            const penalty = gameState.wok.eelCount > 0 ? 120 * gameState.wok.eelCount : 100;
            gameState.score = Math.max(0, gameState.score - penalty);
            elScore.innerText = gameState.score;

            showJudgementText(reason, "#ef4444");
            triggerScreenShake();
        }

        function triggerRushMode() {
            if (gameState.rushMode || gameState.isTutorial) return;
            gameState.rushMode = true;
            elRushBadge.classList.remove('hidden');
            showJudgementText("🔥 爆熱・炒り放題RUSH発動！ 🔥", "#fef08a");

            if (gameState.rushTimer) clearTimeout(gameState.rushTimer);
            gameState.rushTimer = setTimeout(() => {
                gameState.rushMode = false;
                elRushBadge.classList.add('hidden');
            }, 6000);
        }

        function triggerScreenShake() {
            document.body.classList.add('shake-heavy');
            setTimeout(() => document.body.classList.remove('shake-heavy'), 250);
        }

        function showJudgementText(text, color) {
            const container = $('judgement-container');
            const el = document.createElement('div');
            el.className = 'popup-text absolute top-1/2 left-1/2 text-xl md:text-4xl font-black pointer-events-none tracking-widest text-center whitespace-nowrap filter drop-shadow-2xl';
            el.style.color = color;
            el.style.textShadow = '0 0 20px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.9)';
            el.innerText = text;
            container.appendChild(el);
            setTimeout(() => el.remove(), 700);
        }

        function updateUI() {
            elScore.innerText = gameState.score;
            elTimer.innerText = gameState.timeLeft;
            elComboContainer.classList.add('scale-0');
            elRushBadge.classList.add('hidden');
        }

        // --- イベントリスナー設定 ---
        window.addEventListener('DOMContentLoaded', () => {

            renderStartRanking();

            $('btn-start').addEventListener('click', startGame);
            $('btn-retry').addEventListener('click', startGame);

            // タイトル画面へ戻るボタン
            $('btn-home').addEventListener('click', () => {
                $('modal-result').classList.add('hidden');
                renderStartRanking();
                $('modal-start').classList.remove('hidden');
            });

            // チュートリアル関連
            $('btn-tutorial-start').addEventListener('click', startTutorialMode);
            $('btn-tut-quit').addEventListener('click', () => {
                clearAllHighlights();
                $('tutorial-banner').classList.add('hidden');
                elTutBadge.classList.add('hidden');
                gameState.isTutorial = false;
                renderStartRanking();
                $('modal-start').classList.remove('hidden');
            });

            // BGM
            $('btn-audio-toggle').addEventListener('click', () => {
                const isPlaying = sfx.toggleBGM();
                $('audio-icon').innerText = isPlaying ? '🔊' : '🔇';
                $('audio-text').innerText = isPlaying ? 'BGM ON' : 'BGM OFF';
            });

            // 左操作
            $('btn-iru-pan').addEventListener('click', () => actionSort('pan'));
            $('btn-iran').addEventListener('click', () => actionSort('trash'));
            $('btn-iru-dolphin').addEventListener('click', () => actionSort('dolphin'));

            // 右操作
            $('btn-pull-out').addEventListener('click', actionPullOut);
            elWokContainer.addEventListener('click', actionPullOut);

            // キーボード
            window.addEventListener('keydown', (e) => {
                if (!gameState.isPlaying) return;

                const key = e.key.toLowerCase();
                if (key === 'w' || e.key === 'ArrowUp') {
                    actionSort('pan');
                } else if (key === 's' || e.key === 'ArrowDown') {
                    actionSort('trash');
                } else if (e.key === ' ' || key === 'spacebar') {
                    e.preventDefault();
                    actionSort('dolphin');
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    actionPullOut();
                }
            });

            // X シェア
            $('btn-share').addEventListener('click', () => {
                const text = `『イール炒る、要る？』居る居る閣で売上【${gameState.score}点】を達成！\n称号：${$('result-rank').innerText}\n#イール炒る要る #居る居る閣`;
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            });
        });
    