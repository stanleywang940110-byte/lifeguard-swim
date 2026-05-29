document.addEventListener('DOMContentLoaded', () => {
    // 取得所有的導航按鈕與畫面
    const navButtons = document.querySelectorAll('.nav-btn');
    const screens = document.querySelectorAll('.screen');

    // 切換畫面的核心函數
    function navigateToScreen(targetId) {
        const targetScreen = document.getElementById(targetId);
        
        if (!targetScreen) {
            console.error(`找不到目標畫面: ${targetId}`);
            return;
        }

        // 移除所有畫面的 active 狀態 (淡出)
        screens.forEach(screen => {
            if (screen.classList.contains('active')) {
                screen.classList.remove('active');
                // 可選：如果在離開畫面時需要暫停影片/重置動畫，可以在這裡加上邏輯
            }
        });

        // 加上目標畫面的 active 狀態 (淡入)
        targetScreen.classList.add('active');
        
        // 將視窗滾動回到頂部 (如果該畫面內部有捲動過)
        targetScreen.scrollTo(0, 0);
    }

    // 為每個按鈕綁定點擊事件
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            if (targetId) {
                navigateToScreen(targetId);
            }
        });
    });

    // ==========================================
    // ==== 點擊小遊戲邏輯 (移植自 immersive-news-swim) ====
    // ==========================================
    const gameScreen = document.getElementById('game-screen');
    const startUI = document.getElementById('start-ui');
    const startBtn = document.getElementById('start-btn');
    const gameUI = document.getElementById('game-ui');
    const beachLayer = document.getElementById('beach-layer');
    const oceanBackground = document.querySelector('.ocean-background');
    const surgeWarning = document.getElementById('surge-warning');
    const progressBar = document.getElementById('progress-bar');
    const distanceText = document.getElementById('distance-text');
    const swimmer = document.getElementById('swimmer');
    const lifesaversContainer = document.getElementById('lifesavers-container');
    const clickEffects = document.getElementById('click-effects');
    const diveSplashContainer = document.getElementById('dive-splash-container');
    const skipBtn = document.getElementById('skip-btn');

    const TARGET_DISTANCE = 100; 
    let currentDistance = 0;
    let gameState = 'intro';
    let currentDragInterval = null;
    let lifesaverInterval = null;
    let surgeEventTimeout = null;
    let isSurgeMode = false;

    // 監聽 game-screen 是否變為 active，若是則初始化遊戲
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                if (gameScreen.classList.contains('active')) {
                    initGame();
                } else {
                    stopGameLoops();
                }
            }
        });
    });
    observer.observe(gameScreen, { attributes: true });

    function initGame() {
        gameState = 'intro';
        currentDistance = 0;
        isSurgeMode = false;
        updateProgressUI();
        
        startUI.classList.remove('hide');
        gameUI.classList.add('hide');
        surgeWarning.classList.add('hide');
        oceanBackground.classList.remove('surge', 'playing');
        beachLayer.classList.remove('recede');
        
        swimmer.className = 'swimmer intro-standby';
        swimmer.style.bottom = '5vh';

        lifesaversContainer.innerHTML = '';
        clickEffects.innerHTML = '';
        diveSplashContainer.innerHTML = '';
        
        clearTimeout(surgeEventTimeout);
        stopGameLoops();
    }

    if(startBtn) {
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState !== 'intro') return;
            
            gameState = 'cutscene';
            startUI.classList.add('hide');
            swimmer.classList.remove('intro-standby');
            swimmer.classList.add('jump-in');
            
            setTimeout(() => createMegaSplash(), 1800);

            setTimeout(() => {
                gameState = 'playing';
                swimmer.classList.remove('jump-in');
                swimmer.classList.add('playing');
                oceanBackground.classList.add('playing');
                beachLayer.classList.add('recede');
                gameUI.classList.remove('hide');
                
                startGameLoops();
                scheduleNextSurge(true); 
            }, 2200);
        });
    }

    function startGameLoops() {
        currentDragInterval = setInterval(() => {
            let dragForce = 0.15; 
            if (isSurgeMode) {
                dragForce = 0.55; 
            }
            if (currentDistance > 0) {
                currentDistance -= dragForce;
                if (currentDistance < 0) currentDistance = 0;
            }
            updateProgressUI();
        }, 50); 

        setTimeout(() => {
            if (gameState === 'playing' && Math.random() > 0.1) spawnLifesaver();
        }, 1200);

        lifesaverInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            if (Math.random() > 0.3) spawnLifesaver();
        }, 2200);
    }

    function stopGameLoops() {
        clearInterval(currentDragInterval);
        clearInterval(lifesaverInterval);
        clearTimeout(surgeEventTimeout);
    }

    function scheduleNextSurge(isFirst = false) {
        if (gameState !== 'playing') return;
        let nextTime = Math.random() * 4000 + 5000; 
        if (isFirst) nextTime = Math.random() * 2000 + 4000; 
        
        surgeEventTimeout = setTimeout(() => {
            if (gameState !== 'playing') return;
            
            isSurgeMode = true;
            surgeWarning.classList.remove('hide');
            gameScreen.classList.add('screen-shake');
            setTimeout(() => gameScreen.classList.remove('screen-shake'), 600);

            setTimeout(() => {
                isSurgeMode = false;
                surgeWarning.classList.add('hide');
                scheduleNextSurge(false);
            }, 3000);
        }, nextTime);
    }

    function updateProgressUI() {
        let percentage = (currentDistance / TARGET_DISTANCE) * 100;
        if (percentage > 100) percentage = 100;
        
        progressBar.style.width = `${percentage}%`;
        distanceText.textContent = Math.floor(currentDistance);

        if (gameState === 'playing' || gameState === 'intro') {
            swimmer.style.bottom = `${5 + (percentage * 0.65)}vh`;
        }

        if (currentDistance >= TARGET_DISTANCE && gameState === 'playing') {
            triggerWin();
        }
    }

    function spawnLifesaver() {
        const lifesaver = document.createElement('div');
        lifesaver.classList.add('lifesaver');
        const randomX = Math.random() * 60 + 15;
        lifesaver.style.left = `${randomX}%`;
        
        lifesaver.innerHTML = `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
                <defs><filter id="buoy-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="8" stdDeviation="4" flood-color="#000" flood-opacity="0.25"/></filter></defs>
                <g filter="url(#buoy-shadow)">
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#f8fafc" stroke-width="18" />
                    <circle cx="50" cy="50" r="32" fill="none" stroke="#ef4444" stroke-width="18" stroke-dasharray="25.1 25.1" transform="rotate(22.5 50 50)" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#cbd5e1" stroke-width="1.5" />
                    <circle cx="50" cy="18" r="3" fill="#475569" /><circle cx="50" cy="82" r="3" fill="#475569" /><circle cx="18" cy="50" r="3" fill="#475569" /><circle cx="82" cy="50" r="3" fill="#475569" />
                </g>
            </svg>`;
        
        lifesaver.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState !== 'playing') return;
            currentDistance += 15;
            updateProgressUI();
            createFloatingText(e.clientX, e.clientY, "+15m 推進");
            createRipple(e.clientX, e.clientY);
            swimmerDash();
            
            lifesaver.style.animation = 'none'; 
            lifesaver.style.transition = 'all 0.2s';
            lifesaver.style.opacity = '0';
            lifesaver.style.transform = 'scale(2.5) rotate(45deg)';
            setTimeout(() => lifesaver.remove(), 200);
        });

        lifesaversContainer.appendChild(lifesaver);
        setTimeout(() => { if (lifesaver.parentElement) lifesaver.remove(); }, 4500);
    }

    function createMegaSplash() {
        const splash = document.createElement('div');
        splash.classList.add('mega-splash');
        diveSplashContainer.appendChild(splash);
        setTimeout(() => splash.remove(), 1000);
    }

    function createFloatingText(x, y, text) {
        const floatText = document.createElement('div');
        floatText.classList.add('floating-text');
        floatText.textContent = text;
        floatText.style.left = `${x}px`;
        floatText.style.top = `${y}px`;
        clickEffects.appendChild(floatText);
        setTimeout(() => floatText.remove(), 1200);
    }

    function swimmerDash() {
        swimmer.classList.add('dash');
        setTimeout(() => {
            if (gameState !== 'playing') return;
            swimmer.classList.remove('dash');
        }, 300);
    }

    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        clickEffects.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    if(gameScreen) {
        gameScreen.addEventListener('click', (e) => {
            if (gameState !== 'playing') return;
            currentDistance += 1.0; 
            swimmerDash();
            updateProgressUI();
            createRipple(e.clientX, e.clientY);
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState === 'playing' || gameState === 'intro') {
                triggerWin();
            }
        });
    }

    function triggerWin() {
        gameState = 'finished';
        stopGameLoops();
        distanceText.textContent = TARGET_DISTANCE;
        
        // 短暫延遲後，自動跳轉到統計頁面
        setTimeout(() => {
            navigateToScreen('stats-screen');
        }, 800);
    }

    // ==========================================
    // ==== 視差滾動效果 (Parallax Scroll) JS 邏輯 ====
    // ==========================================
    const parallaxScreenObj = document.getElementById('parallax-screen');
    const parallaxBgs = document.querySelectorAll('.parallax-bg');
    const parallaxContents = document.querySelectorAll('.parallax-content');
    
    if (parallaxScreenObj) {
        // 使用 requestAnimationFrame 優化效能
        let ticking = false;
        
        parallaxScreenObj.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollTop = parallaxScreenObj.scrollTop;
                    
                    parallaxBgs.forEach(bg => {
                        const group = bg.parentElement;
                        // 計算目前視窗滾動到了該群組的多少距離
                        const offset = scrollTop - group.offsetTop;
                        
                        // 讓背景大幅度往下推 (0.8倍)，創造出幾乎靜止或極慢速的感覺
                        bg.style.transform = `translateY(${offset * 0.8}px)`;
                    });
                    
                    parallaxContents.forEach(content => {
                        const group = content.parentElement;
                        const offset = scrollTop - group.offsetTop;
                        
                        // 讓前景的空方塊反向往上拉 (-0.5倍)，創造出快速飛過的感覺
                        content.style.transform = `translateY(${offset * -0.5}px)`;
                    });
                    
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        // 初始化觸發一次
        setTimeout(() => {
            if(parallaxScreenObj.classList.contains('active')) {
                parallaxScreenObj.dispatchEvent(new Event('scroll'));
            }
        }, 100);
    }
});
