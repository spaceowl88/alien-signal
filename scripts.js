document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 참조
    const dial = document.getElementById('dial');
    const frequencyDisplay = document.getElementById('frequency-display');
    const statusLight = document.getElementById('status-light');
    const statusText = document.getElementById('status-text');
    const signalStrength = document.getElementById('signal-strength');
    const noiseReduction = document.getElementById('noise-reduction');
    const battery = document.getElementById('battery');
    const messageContainer = document.querySelector('.message-display');
    const scanBtn = document.getElementById('scan-btn');
    const connectBtn = document.getElementById('connect-btn');
    const waveformCanvas = document.getElementById('waveform');
    
    // 오디오 요소 참조
    const dialSound = document.getElementById('dial-sound');
    const signalSound = document.getElementById('signal-sound');
    const transmissionSound = document.getElementById('transmission-sound');
    
    // 호러 모드 오디오 요소
    const horrorDialSound = document.getElementById('horror-dial-sound');
    const horrorSignalSound = document.getElementById('horror-signal-sound');
    const horrorTransmissionSound = document.getElementById('horror-transmission-sound');
    
    // 캔버스 설정
    const ctx = waveformCanvas.getContext('2d');
    waveformCanvas.width = waveformCanvas.parentElement.clientWidth;
    waveformCanvas.height = waveformCanvas.parentElement.clientHeight;
    
    // 상태 변수
    let currentFrequency = 42.5;
    let dialAngle = 0;
    let isScanning = false;
    let isConnected = false;
    let scanInterval;
    let waveformInterval;
    let typingInterval;
    
    // 자연스러운 파형 애니메이션을 위한 변수들
    let animationFrameId;
    let lastTime = performance.now();
    
    let signalActive = false; // 다이얼 조작 여부
    let baseAmplitude = 0.3;  // 파형 기본 진폭
    let noiseLevel = 0.1;     // 파형 노이즈 레벨
    
    // 고정 노이즈 배열 (다이얼 돌리기 전 사용)
    const fixedNoiseArray = Array.from(
        { length: waveformCanvas.width },
        () => (Math.random() * 2 - 1) * 5
    );
    
    // 랜덤 메시지 배열
    const alienMessages = [
        "K'zzt-툭... 지구인들에게... 우주 평화를 위한 메시지를 전달합니다",
        "Grzzz-쓰쓰... 우리는 시리우스 별에서 왔습니다... 접촉 준비...",
        "X'qth... 지구 대표자와의 통신을 요청합니다... 응답하세요...",
        "Z'thalka! 경고! 지구 궤도에 침입자 발견... 위험 상태...",
        "B'zorp-크크... 우리의 문명은 10만 년 전에 멸망했습니다... 이것은 자동 메시지입니다...",
        "M'grahk! 태양계 방문 허가를 요청합니다... 평화적 목적입니다...",
        "V'tzzz... 지구 생명체 연구 데이터 전송 중... 흥미로운 결과...",
        "K'lax-삐삐... 우주 연합 회의에 지구 대표자를 초대합니다...",
        "R'gath... 경고! 소행성 충돌 경로 탐지... 3개월 내 충돌 예상...",
        "N'thul... 우리 함대가 목성 근처에 도착했습니다... 두려워 하지 마세요..."
    ];
    
    // 주파수 대역 설정 수정
    const frequencyBands = [
        { min: 10.0, max: 99.9, hasSignal: false },
        { min: 100.0, max: 199.9, hasSignal: true },
        { min: 200.0, max: 299.9, hasSignal: false },
        { min: 300.0, max: 399.9, hasSignal: true },
        { min: 400.0, max: 499.9, hasSignal: false },
        { min: 500.0, max: 599.9, hasSignal: true },
        { min: 600.0, max: 699.9, hasSignal: false },
        { min: 700.0, max: 799.9, hasSignal: true },
        { min: 800.0, max: 899.9, hasSignal: false },
        { min: 900.0, max: 999.9, hasSignal: true }
    ];
    
    // 자동 스캔 관련 변수 추가
    let scanAttempts = 3; // 남은 스캔 횟수
    const MAX_SCAN_ATTEMPTS = 3; // 최대 스캔 횟수
    
    // 스캔 횟수 표시 업데이트 함수
    function updateScanAttemptsDisplay() {
        const scanBtn = document.getElementById('scan-btn');
        const isHorrorMode = document.body.classList.contains('horror-theme');
        const baseText = isHorrorMode ? 'ABYSSAL DETECTION' : 'scanning';
        const remainingText = isHorrorMode ? 
            `[${scanAttempts}/${MAX_SCAN_ATTEMPTS}]` : 
            `(${scanAttempts}/${MAX_SCAN_ATTEMPTS})`;
        scanBtn.textContent = `${baseText} ${remainingText}`;
    }
    
    // 자연스러운 파형 그리기 함수
    function drawNaturalWaveform() {
        const now = performance.now();
        const deltaTime = (now - lastTime) / 1000;
        lastTime = now;
        
        ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#00ff00';
        
        const centerY = waveformCanvas.height / 2;
        const amplitude = centerY * 0.8 * baseAmplitude;
        
        const layers = 3;
        const layerOpacity = 0.3;
        
        for (let layer = 0; layer < layers; layer++) {
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            
            for (let x = 0; x < waveformCanvas.width; x++) {
                const time = x * 0.02 + now * 0.0005 + layer * 0.5;
                
                // 파형과 노이즈 설정
                const wave1 = Math.sin(time) * 0.4;
                const wave2 = Math.sin(time * 0.3) * 0.3;
                const wave3 = Math.sin(time * 0.1) * 0.2;
                
                // 노이즈 계산
                let noise = 0;
                let noise2 = 0;
                
                if (!signalActive) {
                    // 다이얼 돌리기 전: 고정 노이즈로 잔잔함 유지
                    noise = fixedNoiseArray[x % fixedNoiseArray.length] * 0.7;
                    noise2 = 0;
                } else {
                    // 다이얼 돌린 후: 강하게 요동치는 노이즈
                    noise = (Math.random() * 2 - 1) * noiseLevel * 20 * (0.8 + Math.sin(now * 0.01) * 0.2);
                    noise2 = (Math.random() * 2 - 1) * noiseLevel * 10;
                }
                
                // 최종 y 좌표 계산
                const y = centerY + (wave1 + wave2 + wave3) * amplitude + noise + noise2;
                ctx.lineTo(x, y);
            }
            ctx.globalAlpha = layerOpacity;
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
        animationFrameId = requestAnimationFrame(drawNaturalWaveform);
    }
    
    // 신호 파형 그리기 함수 수정
    function drawWaveform(strength = 0.2) {
        // 기존 애니메이션 중지
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        const now = performance.now();
        
        ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00ff00';
        
        const centerY = waveformCanvas.height / 2;
        const amplitude = centerY * 0.8 * strength;
        
        // 여러 레이어의 파형을 그리기 위한 설정
        const layers = 4;
        const layerOpacity = 0.25;
        
        for (let layer = 0; layer < layers; layer++) {
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            
            for (let x = 0; x < waveformCanvas.width; x++) {
                const time = x * 0.03 + now * 0.001 + layer * 0.3;
                
                // 기본 진동 파형 (신호 강도에 따라 주파수 변화)
                const base = Math.sin(time * (0.2 + strength * 0.3)) * (0.2 + strength * 0.3);
                
                // 신호 활성화 상태에 따른 노이즈 생성
                const noiseStrength = signalActive 
                    ? (Math.random() * 2 - 1) * 20 * Math.sin(now * 0.01)
                    : (Math.random() * 2 - 1) * 3;
                
                // 최종 y 좌표 계산
                const y = centerY + base * amplitude + noiseStrength * (0.5 + strength * 0.5);
                
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
            ctx.globalAlpha = layerOpacity;
        }
        
        // 원래 투명도로 복원
        ctx.globalAlpha = 1.0;
        
        // 신호가 강할 때 폰트 효과 추가
        if (strength > 0.6) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.font = '20px monospace';
            ctx.fillText('신호 수신 중...', 20, 30);
        }
    }
    
    // 스크롤 함수(강제적으로 최하단으로 이동)
    function scrollToBottom() {
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    }
    
    // 메시지 표시 함수
    function displayMessage(message, isAlien = false) {
        const messageElement = document.createElement('p');
        messageElement.classList.add('mb-1');
        if (isAlien) {
            messageElement.classList.add('text-yellow-400');
            messageElement.innerHTML = `<span class="typed-text">${message}</span>`;
        } else {
            messageElement.textContent = message;
        }
        messageContainer.appendChild(messageElement);
        
        // DOM 업데이트 직후 스크롤 이동
        setTimeout(scrollToBottom, 0);
    }
    
    // 타이핑 효과로 메시지 표시
    function typeMessage(message) {
        let i = 0;
        let displayText = '';
        const alienMsg = document.createElement('p');
        alienMsg.classList.add('mb-1', 'text-yellow-400');
        messageContainer.appendChild(alienMsg);
        
        let typingInterval = setInterval(() => {
            if (i < message.length) {
                displayText += message.charAt(i);
                alienMsg.textContent = displayText;
                scrollToBottom();
                i++;
            } else {
                clearInterval(typingInterval);
                setTimeout(scrollToBottom, 0);
            }
        }, 70);
    }
    
    // MutationObserver 설정
    const messageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                setTimeout(scrollToBottom, 0);
            }
        });
    });
    
    if (messageContainer) {
        messageObserver.observe(messageContainer, {
            childList: true,
            subtree: true
        });
        // 최초 진입시도 스크롤
        setTimeout(scrollToBottom, 0);
    }
    
    // 주파수 업데이트 함수
    function updateFrequency(newFreq) {
        currentFrequency = newFreq;
        frequencyDisplay.textContent = newFreq.toFixed(1) + ' MHz';
        
        // 신호 강도 업데이트
        let signalPower = 0;
        let isInSignalBand = false;
        
        // 신호대역 확인
        for (const band of frequencyBands) {
            if (newFreq >= band.min && newFreq <= band.max) {
                if (band.hasSignal) {
                    // 중심 주파수에 가까울수록 신호가 강할 확률이 높아짐
                    const bandCenter = (band.min + band.max) / 2;
                    const distanceFromCenter = Math.abs(newFreq - bandCenter);
                    const bandWidth = (band.max - band.min) / 2;
                    
                    // 기본 신호 강도 계산
                    let baseSignalPower = 1 - (distanceFromCenter / bandWidth);
                    
                    // 랜덤 요소 추가 (0.3 ~ 0.7 사이의 랜덤값)
                    const randomFactor = 0.3 + Math.random() * 0.4;
                    
                    // 최종 신호 강도 계산 (기본값과 랜덤값의 평균)
                    signalPower = (baseSignalPower + randomFactor) / 2;
                    signalPower = Math.max(0, Math.min(1, signalPower));
                    isInSignalBand = true;
                    
                    // 신호가 매우 강할 때 상태 표시
                    if (signalPower > 0.8) {
                        statusLight.classList.add('active');
                        statusLight.style.backgroundColor = '#00ff00';
                        statusText.textContent = '강한 신호 감지!';
                    } else if (signalPower > 0.4) {
                        statusLight.classList.add('active');
                        statusLight.style.backgroundColor = '#ffff00';
                        statusText.textContent = '신호 감지 중...';
                    } else {
                        statusLight.classList.remove('active');
                        statusLight.style.backgroundColor = '#ff9900';
                        statusText.textContent = '약한 신호 감지';
                    }
                }
                break;
            }
        }
        
        if (!isInSignalBand) {
            statusLight.classList.remove('active');
            statusLight.style.backgroundColor = 'red';
            statusText.textContent = '신호 없음';
        }
        
        // 미터 업데이트
        signalStrength.style.width = (signalPower * 100) + '%';
        
        // 파형 업데이트 - 신호가 있을 때만 drawWaveform 사용
        if (isInSignalBand && signalPower > 0.4) {
            drawWaveform(signalPower);
        } else {
            drawNaturalWaveform();
        }
        
        return { signalPower, isInSignalBand };
    }
    
    // 오디오 컨텍스트 설정
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // 오디오 효과 함수
    function createDistortionEffect(audioElement) {
        const source = audioContext.createMediaElementSource(audioElement);
        const distortion = audioContext.createWaveShaper();
        const gainNode = audioContext.createGain();
        
        // 왜곡 커브 생성
        function makeDistortionCurve(amount) {
            const samples = 44100;
            const curve = new Float32Array(samples);
            for (let i = 0; i < samples; i++) {
                const x = (i * 2) / samples - 1;
                curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
            }
            return curve;
        }
        
        distortion.curve = makeDistortionCurve(400);
        distortion.oversample = '4x';
        
        source.connect(distortion);
        distortion.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        return { source, distortion, gainNode };
    }
    
    // 호러 모드 오디오 효과 설정
    let horrorEffects = {};
    if (horrorDialSound) {
        horrorEffects.dial = createDistortionEffect(horrorDialSound);
    }
    if (horrorSignalSound) {
        horrorEffects.signal = createDistortionEffect(horrorSignalSound);
    }
    if (horrorTransmissionSound) {
        horrorEffects.transmission = createDistortionEffect(horrorTransmissionSound);
    }
    
    // 현재 모드에 따른 오디오 재생 함수
    function playAudio(audioType) {
        const isHorrorMode = document.body.classList.contains('horror-theme');
        const audioElement = isHorrorMode ? 
            document.getElementById(`horror-${audioType}-sound`) :
            document.getElementById(`${audioType}-sound`);
            
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.log('오디오 재생 에러:', e));
        }
    }
    
    // 다이얼 조작 관련 함수들
    function onDialTurn() {
        signalActive = true;
        baseAmplitude = 1.0;
        noiseLevel = 1.0;
    }
    
    function onDialStop() {
        // 1초 후 다이얼 초기화
        setTimeout(() => {
            signalActive = false;
            baseAmplitude = 0.3;
            noiseLevel = 0.1;
        }, 1000);
    }
    
    // 다이얼 회전 처리 수정
    function rotateDial(angle) {
        dialAngle = angle;
        dial.style.transform = `rotate(${angle}deg)`;
        
        const freqRange = 989; // 999 - 10
        const newFreq = 10 + (angle / 360) * freqRange;
        
        // 다이얼 회전 시 신호 활성화
        onDialTurn();
        
        const { signalPower } = updateFrequency(newFreq);
        
        // 조절 사운드 재생
        playAudio('dial');
        
        // 신호가 매우 강할 때 신호음 재생
        if (signalPower > 0.8) {
            playAudio('signal');
        }
    }
    
    // 다이얼 드래그 처리
    let isDragging = false;
    let lastMousePosition;
    
    // 마우스 이벤트
    dial.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
        dial.style.cursor = 'grabbing';
        onDialTurn();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dialRect = dial.getBoundingClientRect();
        const dialCenterX = dialRect.left + dialRect.width / 2;
        const dialCenterY = dialRect.top + dialRect.height / 2;
        
        const lastAngle = Math.atan2(
            lastMousePosition.y - dialCenterY,
            lastMousePosition.x - dialCenterX
        );
        
        const newAngle = Math.atan2(
            e.clientY - dialCenterY,
            e.clientX - dialCenterX
        );
        
        const angleDifference = (newAngle - lastAngle) * (180 / Math.PI);
        
        const newDialAngle = (dialAngle + angleDifference) % 360;
        
        rotateDial(newDialAngle);
        
        lastMousePosition = {
            x: e.clientX,
            y: e.clientY
        };
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            dial.style.cursor = 'pointer';
            onDialStop();
        }
    });
    
    // 터치 이벤트
    dial.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            lastMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            onDialTurn();
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        
        const dialRect = dial.getBoundingClientRect();
        const dialCenterX = dialRect.left + dialRect.width / 2;
        const dialCenterY = dialRect.top + dialRect.height / 2;
        
        const lastAngle = Math.atan2(
            lastMousePosition.y - dialCenterY,
            lastMousePosition.x - dialCenterX
        );
        
        const newAngle = Math.atan2(
            e.touches[0].clientY - dialCenterY,
            e.touches[0].clientX - dialCenterX
        );
        
        const angleDifference = (newAngle - lastAngle) * (180 / Math.PI);
        
        const newDialAngle = (dialAngle + angleDifference) % 360;
        
        rotateDial(newDialAngle);
        
        lastMousePosition = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        
        e.preventDefault();
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            onDialStop();
        }
    });
    
    // 자동 스캔 함수 수정
    function startScanning() {
        if (isScanning || scanAttempts <= 0) return;
        
        isScanning = true;
        scanAttempts--; // 스캔 시도 횟수 차감
        updateScanAttemptsDisplay();
        
        const isHorrorMode = document.body.classList.contains('horror-theme');
        scanBtn.classList.replace('bg-blue-600', 'bg-red-600');
        scanBtn.classList.replace('hover:bg-blue-700', 'hover:bg-red-700');
        
        const startMessage = isHorrorMode ? 
            `심연 탐색 시작... [남은 시도: ${scanAttempts}회]` :
            `자동 스캔 시작... (남은 시도: ${scanAttempts}회)`;
        displayMessage(startMessage);
        
        let scanAngle = dialAngle;
        const scanSpeed = 2;
        let scanProgress = 0;
        
        // 랜덤한 완료 위치 설정 (180도 ~ 360도 사이)
        const targetProgress = 180 + Math.random() * 180;
        
        scanInterval = setInterval(() => {
            scanAngle = (scanAngle + scanSpeed) % 360;
            rotateDial(scanAngle);
            
            scanProgress += scanSpeed;
            
            // 랜덤한 위치에서 스캔 완료
            if (scanProgress >= targetProgress) {
                clearInterval(scanInterval);
                isScanning = false;
                
                // 현재 주파수 유지 (호러 모드일 때만 666.6MHz로 변경)
                const strongSignalFreq = isHorrorMode ? 666.6 : currentFrequency;
                currentFrequency = strongSignalFreq;
                frequencyDisplay.textContent = strongSignalFreq.toFixed(1) + ' MHz';
                
                // 신호 강도 최대로 설정
                signalStrength.style.width = '100%';
                statusLight.classList.add('active');
                statusLight.style.backgroundColor = '#00ff00';
                statusText.textContent = isHorrorMode ? '심연의 신호 감지!' : '강한 신호 감지!';
                
                // 파형 업데이트
                drawWaveform(1.0);
                
                // 스캔 버튼 상태 업데이트
                scanBtn.classList.replace('bg-red-600', 'bg-blue-600');
                scanBtn.classList.replace('hover:bg-red-700', 'hover:bg-blue-700');
                
                const foundMessage = isHorrorMode ?
                    `심연의 신호 발견: ${strongSignalFreq.toFixed(1)} MHz` :
                    `강한 신호 발견: ${strongSignalFreq.toFixed(1)} MHz`;
                displayMessage(foundMessage);
                playAudio('signal');
                
                // 1초 후 자동 연결 시도
                setTimeout(() => {
                    // 연결 전 상태 초기화
                    isConnected = false;
                    connectBtn.disabled = false;
                    
                    // 신호 강도 최대로 설정
                    signalStrength.style.width = '100%';
                    noiseReduction.style.width = '90%';
                    battery.style.width = '60%';
                    
                    // 연결 시도
                    attemptConnection();
                }, 1000);
            }
        }, 100);
    }
    
    // 스캔 중지 함수 수정
    function stopScanning() {
        if (!isScanning) return;
        
        clearInterval(scanInterval);
        isScanning = false;
        
        const isHorrorMode = document.body.classList.contains('horror-theme');
        scanBtn.classList.replace('bg-red-600', 'bg-blue-600');
        scanBtn.classList.replace('hover:bg-red-700', 'hover:bg-blue-700');
        
        const stopMessage = isHorrorMode ? '심연 탐색 중지됨' : '자동 스캔 중지됨';
        displayMessage(stopMessage);
        
        // 스캔 중지 시 화면 초기화
        resetToIdle();
    }
    
    // 화면 초기화 함수 수정
    function resetToIdle() {
        const isHorrorMode = document.body.classList.contains('horror-theme');
        
        // 파형 관련 변수 초기화
        signalActive = false;
        baseAmplitude = 0.3;
        noiseLevel = 0.1;
        
        // 주파수 및 UI 초기화
        currentFrequency = isHorrorMode ? 666.6 : 42.5;
        frequencyDisplay.textContent = currentFrequency.toFixed(1) + ' MHz';
        signalStrength.style.width = '0%';
        noiseReduction.style.width = '0%';
        statusLight.classList.remove('active');
        statusLight.style.backgroundColor = isHorrorMode ? '#ff0000' : 'red';
        
        // 파형 애니메이션 초기화
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        ctx.clearRect(0, 0, waveformCanvas.width, waveformCanvas.height);
        drawNaturalWaveform();
    }
    
    // 연결 시도 함수 수정
    function attemptConnection() {
        const isHorrorMode = document.body.classList.contains('horror-theme');
        
        // 이미 연결 중이면 중복 실행 방지
        if (isConnected) {
            displayMessage('이미 연결됨. 새로운 주파수를 찾으려면 다이얼을 조정하세요.');
            return;
        }
        
        const connectMessage = isHorrorMode ? 
            '심연의 신호에 연결 시도 중...' :
            '외계 신호에 연결 시도 중...';
        displayMessage(connectMessage);
        
        // 연결 사운드 재생
        playAudio('transmission');
        
        statusLight.classList.add('active');
        statusText.textContent = isHorrorMode ? '심연과 연결 중...' : '연결 중...';
        
        // 연결 중 버튼 상태 변경
        connectBtn.textContent = isHorrorMode ? 'CONNECTING...' : 'Connecting...';
        connectBtn.disabled = true;
        
        setTimeout(() => {
            statusText.textContent = isHorrorMode ? '심연과 연결됨!' : '연결됨!';
            isConnected = true;
            
            const messages = isHorrorMode ? horrorMessages : alienMessages;
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            const encodingMessage = isHorrorMode ?
                '심연의 메시지 수신 중...' :
                '인코딩된 메시지 수신 중...';
            displayMessage(encodingMessage);
            
            setTimeout(() => {
                const protocolMessage = isHorrorMode ?
                    '심연 번역 프로토콜 활성화...' :
                    '번역 프로토콜 활성화...';
                displayMessage(protocolMessage);
                
                setTimeout(() => {
                    typeMessage(randomMessage);
                    
                    setTimeout(() => {
                        battery.style.width = '40%';
                    }, 3000);
                    
                    setTimeout(() => {
                        isConnected = false;
                        statusText.textContent = isHorrorMode ? '심연과의 연결 종료' : '연결 종료';
                        connectBtn.textContent = isHorrorMode ? 'ABYSSAL SUMMONING' : '연결 시도';
                        connectBtn.disabled = false;
                        
                        const disconnectMessage = isHorrorMode ?
                            '심연의 신호가 사라졌습니다...' :
                            '신호 소실. 연결이 종료되었습니다.';
                        displayMessage(disconnectMessage);
                        
                        // 연결 종료 시 화면 초기화
                        resetToIdle();
                        
                        setTimeout(() => {
                            battery.style.width = '80%';
                        }, 3000);
                    }, 10000);
                }, 1500);
            }, 1000);
        }, 2000);
    }
    
    // 스캔 버튼 이벤트 리스너 수정
    scanBtn.addEventListener('click', () => {
        if (scanAttempts <= 0) {
            const isHorrorMode = document.body.classList.contains('horror-theme');
            const message = isHorrorMode ? 
                '심연 탐색 시도 횟수가 모두 소진되었습니다...' :
                '스캔 시도 횟수가 모두 소진되었습니다.';
            displayMessage(message);
            return;
        }
        
        if (isScanning) {
            stopScanning();
        } else {
            startScanning();
        }
    });
    
    connectBtn.addEventListener('click', attemptConnection);
    
    // 초기화
    updateFrequency(currentFrequency);
    drawNaturalWaveform();
    displayMessage('시스템 초기화 완료');
    displayMessage('외계 신호 탐색을 시작하세요...');
    
    // 윈도우 크기 변경 이벤트 처리 수정
    window.addEventListener('resize', () => {
        waveformCanvas.width = waveformCanvas.parentElement.clientWidth;
        waveformCanvas.height = waveformCanvas.parentElement.clientHeight;
        
        // 현재 상태에 따라 적절한 파형 그리기
        if (isConnected || isScanning) {
            drawWaveform(parseFloat(signalStrength.style.width) / 100);
        } else {
            drawNaturalWaveform();
        }
    });

    // 모드 전환 기능
    const modeToggle = document.getElementById('mode-toggle');
    const modeText = document.querySelector('.mode-text');
    const body = document.body;

    // 초기 테마 설정
    body.classList.add('light-theme');

    // 호러 모드 메시지
    const horrorMessages = [
        "그들이 오고 있다...",
        "이미 너의 뒤에 있다...",
        "도망쳐...",
        "그들은 너를 찾고 있다...",
        "너무 늦었다...",
        "그들은 이미 와 있다...",
        "이제 돌이킬 수 없다...",
        "그들의 시간이 다가온다...",
        "어둠이 너를 감싼다...",
        "그들은 너를 기다리고 있다..."
    ];

    // 기본 모드 메시지
    const normalMessages = [
        "외계 생명체 탐색 중...",
        "신호 수신 대기 중...",
        "주파수 스캔 중...",
        "통신 시도 중...",
        "신호 강도 측정 중...",
        "데이터 분석 중...",
        "통신 채널 설정 중...",
        "신호 잡음 제거 중...",
        "주파수 동기화 중...",
        "통신 프로토콜 확인 중..."
    ];

    // 모드 전환 이벤트 리스너 수정
    modeToggle.addEventListener('change', function() {
        const titleElement = document.querySelector('h1');
        
        if (this.checked) {
            // 호러 테마로 전환
            body.classList.remove('light-theme');
            body.classList.add('horror-theme');
            modeText.textContent = '';
            document.title = '악령의 전파';
            
            // 제목 변경 및 글리치 효과 적용
            titleElement.textContent = 'Abyssal Signal';
            titleElement.classList.add('glitch-text');
            titleElement.setAttribute('data-text', 'Abyssal Signal');
            
            document.querySelector('#frequency-display').textContent = '666.6 MHz';
            document.querySelector('#status-text').textContent = 'Abyssal Channeling...';
            document.querySelector('#scan-btn').textContent = 'ABYSSAL DETECTION';
            document.querySelector('#connect-btn').textContent = 'ABYSSAL SUMMONING';
            
            // 스캔 횟수 표시 업데이트
            updateScanAttemptsDisplay();
            
            // 호러 모드 오디오 효과 활성화
            if (horrorEffects.dial) horrorEffects.dial.gainNode.gain.value = 1;
            if (horrorEffects.signal) horrorEffects.signal.gainNode.gain.value = 1;
            if (horrorEffects.transmission) horrorEffects.transmission.gainNode.gain.value = 1;
            
            // 메시지 컨테이너 업데이트
            const messageContainer = document.querySelector('#message-container');
            messageContainer.innerHTML = `
                <p class="mb-2 glitch-text" data-text="Whispers from the Void">Whispers from the Void</p>
                <p class="mb-1">그들이 오고 있다...</p>
            `;
        } else {
            // 라이트 테마로 전환
            body.classList.remove('horror-theme');
            body.classList.add('light-theme');
            modeText.textContent = '';
            document.title = 'Alien Signal';
            
            // 제목 변경 및 글리치 효과 제거
            titleElement.textContent = 'Alien Signal';
            titleElement.classList.remove('glitch-text');
            titleElement.removeAttribute('data-text');
            
            document.querySelector('#frequency-display').textContent = '42.5 MHz';
            document.querySelector('#status-text').textContent = '대기 중';
            document.querySelector('#scan-btn').textContent = 'scanning';
            document.querySelector('#connect-btn').textContent = 'Connecting';
            
            // 스캔 횟수 표시 업데이트
            updateScanAttemptsDisplay();
            
            // 호러 모드 오디오 효과 비활성화
            if (horrorEffects.dial) horrorEffects.dial.gainNode.gain.value = 0;
            if (horrorEffects.signal) horrorEffects.signal.gainNode.gain.value = 0;
            if (horrorEffects.transmission) horrorEffects.transmission.gainNode.gain.value = 0;
            
            // 메시지 컨테이너 업데이트
            const messageContainer = document.querySelector('#message-container');
            messageContainer.innerHTML = `
                <p class="mb-2">--- 전파 수신 로그 ---</p>
                <p class="mb-1">수신 준비 완료...</p>
            `;
        }
    });

    // 초기화 시 스캔 횟수 표시 업데이트
    updateScanAttemptsDisplay();
});

// 방명록 기능
document.addEventListener('DOMContentLoaded', () => {
    const guestbookForm = document.getElementById('guestbook-form');
    const guestbookList = document.getElementById('guestbook-list');
    
    // 로컬 스토리지에서 방명록 데이터 불러오기
    let guestbookEntries = JSON.parse(localStorage.getItem('guestbookEntries')) || [];
    
    // 방명록 항목 렌더링 함수
    function renderGuestbookEntries() {
        guestbookList.innerHTML = '';
        guestbookEntries.forEach((entry, index) => {
            const entryElement = document.createElement('div');
            entryElement.className = 'bg-gray-700 rounded-lg p-4 border border-gray-600';
            entryElement.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <span class="text-green-400 font-bold">${entry.name}</span>
                        <span class="text-gray-400 ml-2">${entry.frequency}</span>
                    </div>
                    <span class="text-gray-400 text-sm">${new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <p class="text-green-300">${entry.message}</p>
            `;
            guestbookList.appendChild(entryElement);
        });
    }
    
    // 초기 렌더링
    renderGuestbookEntries();
    
    // 폼 제출 처리
    guestbookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('guest-name').value.trim();
        const frequency = document.getElementById('guest-frequency').value.trim();
        const message = document.getElementById('guest-message').value.trim();
        
        if (!name || !message) {
            alert('이름과 메시지를 모두 입력해주세요.');
            return;
        }
        
        // 새 항목 추가
        const newEntry = {
            name,
            frequency: frequency || 'N/A',
            message,
            timestamp: new Date().toISOString()
        };
        
        guestbookEntries.unshift(newEntry); // 새 항목을 맨 위에 추가
        localStorage.setItem('guestbookEntries', JSON.stringify(guestbookEntries));
        
        // 폼 초기화
        guestbookForm.reset();
        
        // 방명록 다시 렌더링
        renderGuestbookEntries();
        
        // 호러 모드일 때 특별한 효과 추가
        if (document.body.classList.contains('horror-theme')) {
            const entryElement = guestbookList.firstElementChild;
            entryElement.classList.add('glitch-text');
            entryElement.setAttribute('data-text', message);
        }
    });
}); 