// 全局变量
let currentDictionary = 'cet4';
let currentChapter = 1;
let currentWordIndex = 0;
let currentWord = '';
let startTime = null;
let isTyping = false;
let totalInputs = 0;
let correctInputs = 0;
let chapterWords = [];
let completedChapters = new Set();
let soundEnabled = true;
let typingSoundEnabled = true;
let speechVolume = 1.0; // 朗读音量，范围0.0-1.0
// 将音量变量暴露到全局作用域
window.speechVolume = speechVolume;

// 词典数据
const dictionaries = {
    cet4: {
        name: 'CET-4',
        description: '大学英语四级词汇',
        wordCount: 360, // 18章×20词
        chapters: 18
    },
    cet6: {
        name: 'CET-6', 
        description: '大学英语六级词汇',
        wordCount: 400, // 20章×20词
        chapters: 20
    },
    gmat: {
        name: 'GMAT',
        description: 'GMAT 词汇',
        wordCount: 400, // 20章×20词
        chapters: 20
    },
    gre: {
        name: 'GRE',
        description: 'GRE 词汇',
        wordCount: 420, // 21章×20词
        chapters: 21
    },
    ielts: {
        name: 'IELTS',
        description: '雅思词汇',
        wordCount: 420, // 21章×20词
        chapters: 21
    },
    kaoyan: {
        name: '考研',
        description: '研究生英语入学考试词汇',
        wordCount: 420, // 21章×20词
        chapters: 21
    }
};

// 全局变量已在文件开头定义，这里不需要重复声明

// DOM 元素
const dictionarySelection = document.getElementById('dictionarySelection');
const chapterSelection = document.getElementById('chapterSelection');
const typingInterface = document.getElementById('typingInterface');
let dictionaryCards = null; // 延迟获取
const chapterGrid = document.getElementById('chapterGrid');
const selectedDictTitle = document.getElementById('selectedDictTitle');
const backToDict = document.getElementById('backToDict');
const backToChapter = document.getElementById('backToChapter');
const currentWordEl = document.getElementById('currentWord');
const pronounceBtn = document.getElementById('pronounceBtn');
const phoneticUS = document.querySelector('.phonetic-us');
const phoneticUK = document.querySelector('.phonetic-uk');
const meaningDisplay = document.querySelector('.meaning-display');
const wordInput = document.getElementById('wordInput');
const inputFeedback = document.getElementById('inputFeedback');
const timeValue = document.getElementById('timeValue');
const inputCount = document.getElementById('inputCount');
const speedValue = document.getElementById('speedValue');
const correctCount = document.getElementById('correctCount');
const accuracyValue = document.getElementById('accuracyValue');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 页面加载完成，开始初始化');
    initializeApp();
    setupEventListeners();
    loadProgress();
    console.log('✅ 初始化完成');
    
    // 添加临时测试函数
    window.testClick = function() {
        console.log('🧪 测试函数被调用');
        alert('JavaScript运行正常！');
    };
    
    console.log('🧪 测试函数已添加到window对象');
});

// 应用初始化
function initializeApp() {
    console.log('🚀 开始应用初始化');
    
    // 验证关键DOM元素
    console.log('🔍 验证DOM元素:');
    console.log('  dictionarySelection:', !!dictionarySelection);
    console.log('  chapterSelection:', !!chapterSelection);
    console.log('  typingInterface:', !!typingInterface);
    console.log('  selectedDictTitle:', !!selectedDictTitle);
    
    // 设置主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // 加载用户设置
    loadUserSettings();
    
    // 显示词典选择界面
    showDictionarySelection();
}

// 更新主题图标
function updateThemeIcon(theme) {
    console.log('🎨 更新主题图标:', theme);
    // 主题图标更新逻辑（如果需要的话）
}

// 加载用户设置
function loadUserSettings() {
    // 加载音效设置
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        const soundSetting = document.getElementById('soundSetting');
        if (soundSetting) {
            soundSetting.checked = soundEnabled;
        }
    }
    
    const savedTypingSound = localStorage.getItem('typingSoundEnabled');
    if (savedTypingSound !== null) {
        typingSoundEnabled = savedTypingSound === 'true';
        const typingSoundSetting = document.getElementById('typingSoundSetting');
        if (typingSoundSetting) {
            typingSoundSetting.checked = typingSoundEnabled;
        }
    }
    
    // 加载音量设置
    const savedVolume = localStorage.getItem('speechVolume');
    if (savedVolume !== null) {
        speechVolume = parseFloat(savedVolume);
        window.speechVolume = speechVolume; // 更新全局变量
        const volumeSetting = document.getElementById('volumeSetting');
        const volumeValue = document.getElementById('volumeValue');
        if (volumeSetting) {
            volumeSetting.value = Math.round(speechVolume * 100);
        }
        if (volumeValue) {
            volumeValue.textContent = Math.round(speechVolume * 100) + '%';
        }
    }
    
    console.log('加载设置 - 朗读功能:', soundEnabled, '打字音效:', typingSoundEnabled, '朗读音量:', speechVolume);
    
    // 测试语音合成是否可用
    if ('speechSynthesis' in window) {
        console.log('语音合成API可用');
        console.log('当前语音列表:', speechSynthesis.getVoices().length);
        
        // 预加载语音列表
        speechSynthesis.getVoices();
        
        // 监听语音列表变化
        speechSynthesis.addEventListener('voiceschanged', () => {
            const voices = speechSynthesis.getVoices();
            console.log('语音列表更新，数量:', voices.length);
        });
    } else {
        console.log('语音合成API不可用');
    }
    
    // 请求用户交互以启用朗读功能
    requestSpeechPermission();
}

// 语音合成状态管理
let speechReady = false;
let speechActivationAttempted = false;
let fallbackTTSEnabled = true; // 启用备用TTS方案

// 请求语音权限和用户交互
function requestSpeechPermission() {
    const speechStatusDiv = document.getElementById('speechStatus');
    
    // 显示语音状态提示
    if (speechStatusDiv && !speechReady) {
        speechStatusDiv.style.display = 'block';
    }
    
    // Chrome需要用户交互后才能使用语音合成
    const activateSpeech = async () => {
        if (speechActivationAttempted) return;
        speechActivationAttempted = true;
        
        console.log('🎤 用户交互检测到，尝试激活语音合成...');
        
        if ('speechSynthesis' in window) {
            try {
                // 强制加载语音列表
                speechSynthesis.getVoices();
                
                // 等待语音列表加载
                if (speechSynthesis.getVoices().length === 0) {
                    await new Promise(resolve => {
                        speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
                        setTimeout(resolve, 1000); // 1秒超时
                    });
                }
                
                // 播放一个短暂的测试音以激活语音API
                const testUtterance = new SpeechSynthesisUtterance('activate');
                testUtterance.volume = 0.01; // 极低音量
                testUtterance.rate = 5; // 较快速度
                testUtterance.onend = () => {
                    speechReady = true;
                    console.log('✅ 语音合成已激活');
                    updateSpeechStatus();
                    // 激活成功后自动朗读一次当前单词
                    try {
                        if (currentWord && soundEnabled) {
                            console.log('🔊 激活后自动朗读当前单词:', currentWord);
                            setTimeout(() => speakWord(currentWord), 200);
                        }
                    } catch (_) {}
                };
                testUtterance.onerror = (e) => {
                    console.log('⚠️ 语音激活测试失败:', e.error);
                    speechReady = true; // 仍然标记为已准备
                    updateSpeechStatus();
                };
                
                speechSynthesis.speak(testUtterance);
                
                // 等待测试完成
                setTimeout(() => {
                    if (!speechReady) {
                        speechReady = true; // 强制设为已准备
                        console.log('🔧 强制激活语音合成');
                        updateSpeechStatus();
                        try {
                            if (currentWord && soundEnabled) {
                                console.log('🔊 强制激活后自动朗读当前单词:', currentWord);
                                setTimeout(() => speakWord(currentWord), 200);
                            }
                        } catch (_) {}
                    }
                }, 800);
                
            } catch (error) {
                console.error('语音激活失败:', error);
                speechReady = true; // 仍然允许尝试
                updateSpeechStatus();
            }
        } else {
            speechReady = false;
            updateSpeechStatus();
        }
    };
    
    // 更新语音状态显示
    function updateSpeechStatus() {
        const speechStatusDiv = document.getElementById('speechStatus');
        if (speechStatusDiv) {
            if (speechReady) {
                speechStatusDiv.style.background = '#d4edda';
                speechStatusDiv.style.borderColor = '#c3e6cb';
                speechStatusDiv.innerHTML = '✅ 语音功能已激活，可以正常朗读';
                setTimeout(() => {
                    speechStatusDiv.style.display = 'none';
                }, 3000);
            } else {
                speechStatusDiv.style.background = '#f8d7da';
                speechStatusDiv.style.borderColor = '#f5c6cb';
                speechStatusDiv.innerHTML = '❌ 语音功能激活失败，请检查浏览器设置';
            }
        }
    }
    
    // 检测Chrome并显示提示
    if (isChromeRestricted()) {
        const chromeTip = document.getElementById('chromeTip');
        if (chromeTip) {
            chromeTip.style.display = 'block';
            console.log('🔍 检测到Chrome浏览器，显示设置提示');
        }
    }
    
    // 在用户首次交互时立即激活TTS并朗读
    const activateAndAutoSpeak = () => {
        console.log('👆 用户首次交互，立即激活TTS');
        speechReady = true; // 标记为已激活
        
        // 如果有当前单词，立即朗读
        if (currentWord && soundEnabled) {
            console.log('🔊 首次交互后立即朗读:', currentWord);
            setTimeout(() => forceActivateAndSpeak(currentWord), 100);
        }
    };
    
    // 监听首次用户交互
    document.addEventListener('click', activateAndAutoSpeak, { once: true });
    document.addEventListener('keydown', activateAndAutoSpeak, { once: true });
    document.addEventListener('touchstart', activateAndAutoSpeak, { once: true });
}

// 此函数已移动到下方，避免重复定义

// 显示词典选择界面
function showDictionarySelection() {
    console.log('📱 显示词典选择界面');
    dictionarySelection.classList.remove('hidden');
    chapterSelection.classList.add('hidden');
    typingInterface.classList.add('hidden');
}

// 此函数已移动到下方，避免重复定义

// 生成章节卡片
function generateChapterCards() {
    if (!chapterGrid) {
        console.error('章节网格容器未找到');
        return;
    }
    
    console.log('为词典生成章节卡片:', currentDictionary);
    chapterGrid.innerHTML = '';
    
    // 获取该词典的最大章节数
    const dict = dictionaries[currentDictionary];
    const maxChapters = dict ? dict.chapters : 20;
    
    for (let i = 1; i <= maxChapters; i++) {
        const chapterCard = document.createElement('div');
        chapterCard.className = 'chapter-card';
        chapterCard.dataset.chapter = i;
        
        // 检查是否完成
        if (completedChapters.has(`${currentDictionary}-${i}`)) {
            chapterCard.classList.add('completed');
        }
        
        // 检查是否有实际的单词数据
        const wordsInChapter = getChapterWords(currentDictionary, i);
        const wordCount = wordsInChapter.length;
        
        chapterCard.innerHTML = `
            <h4>Chapter ${i}</h4>
            <p>${wordCount} 词</p>
        `;
        
        // 只有当章节有词汇时才可点击
        if (wordCount > 0) {
            chapterCard.classList.add('available');
            chapterCard.addEventListener('click', () => {
                currentChapter = i;
                showTypingInterface();
            });
        } else {
            chapterCard.classList.add('unavailable');
            chapterCard.style.opacity = '0.5';
            chapterCard.style.cursor = 'not-allowed';
        }
        
        chapterGrid.appendChild(chapterCard);
    }
}

// 显示打字练习界面
function showTypingInterface() {
    console.log('📱 显示打字练习界面');
    dictionarySelection.classList.add('hidden');
    chapterSelection.classList.add('hidden');
    typingInterface.classList.remove('hidden');
    
    // 加载章节单词并开始练习
    loadChapterWords();
    
    // 聚焦输入框
    if (wordInput) {
        wordInput.focus();
    }
}

// 事件监听器设置
function setupEventListeners() {
    console.log('🔧 设置事件监听器');
    
    // 重新获取词典卡片元素
    const cards = document.querySelectorAll('.dictionary-card');
    console.log('📚 找到词典卡片数量:', cards.length);
    
    if (cards.length === 0) {
        console.error('❌ 未找到任何词典卡片！');
        return;
    }
    
    // 词典选择 - 简化版本
    cards.forEach((card, index) => {
        console.log(`📖 设置第${index + 1}个词典卡片事件:`, card.dataset.dict);
        card.addEventListener('click', function() {
            const dictKey = card.dataset.dict;
            console.log('🎯 点击了词典:', dictKey);
            selectDictionary(dictKey);
        });
    });
    
    // 返回按钮 - 添加安全检查
    const backToDictBtn = document.getElementById('backToDict');
    const backToChapterBtn = document.getElementById('backToChapter');
    
    if (backToDictBtn) {
        backToDictBtn.addEventListener('click', showDictionarySelection);
        console.log('✅ 返回词典按钮事件已绑定');
    }
    
    if (backToChapterBtn) {
        backToChapterBtn.addEventListener('click', showChapterSelection);
        console.log('✅ 返回章节按钮事件已绑定');
    }
    
    // 单词输入
    wordInput.addEventListener('input', handleWordInput);
    wordInput.addEventListener('keydown', handleKeyDown);
    
    // 发音按钮
    pronounceBtn.addEventListener('click', pronounceCurrentWord);
    
    // 已移除额外按钮，专注于自动朗读体验
    
    // 控制按钮
    document.getElementById('skipWord').addEventListener('click', skipCurrentWord);
    document.getElementById('resetPractice').addEventListener('click', resetCurrentChapter);
    
    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // 设置按钮
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.remove('hidden');
    });
    
    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.add('hidden');
    });
    
    // 设置面板事件监听器
    document.getElementById('soundSetting').addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
        localStorage.setItem('soundEnabled', soundEnabled);
    });
    
    document.getElementById('typingSoundSetting').addEventListener('change', (e) => {
        typingSoundEnabled = e.target.checked;
        localStorage.setItem('typingSoundEnabled', typingSoundEnabled);
    });
}

// 显示词典选择界面
function showDictionarySelection() {
    dictionarySelection.classList.remove('hidden');
    chapterSelection.classList.add('hidden');
    typingInterface.classList.add('hidden');
    
    // 更新选中状态
    dictionaryCards.forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.dict === currentDictionary) {
            card.classList.add('selected');
        }
    });
}

// 选择词典
function selectDictionary(dictKey) {
    console.log('🎯 选择词典:', dictKey);
    currentDictionary = dictKey;
    
    // 更新章节选择界面标题
    const title = document.getElementById('selectedDictTitle');
    if (title && dictionaries[dictKey]) {
        title.textContent = `${dictionaries[dictKey].name} - 章节选择`;
        console.log('📝 更新标题为:', title.textContent);
    }
    
    generateChapterGrid();
    showChapterSelection();
}

// 显示章节选择界面
function showChapterSelection() {
    dictionarySelection.classList.add('hidden');
    chapterSelection.classList.remove('hidden');
    typingInterface.classList.add('hidden');
    
    const dict = dictionaries[currentDictionary];
    selectedDictTitle.textContent = `${dict.name} - 章节选择`;
}

// 生成章节网格
function generateChapterGrid() {
    const dict = dictionaries[currentDictionary];
    chapterGrid.innerHTML = '';
    
    if (dict.chapters === 0) {
        chapterGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">该词典暂无数据</p>';
        return;
    }
    
    for (let i = 1; i <= dict.chapters; i++) {
        const chapterCard = document.createElement('div');
        chapterCard.className = 'chapter-card';
        if (completedChapters.has(`${currentDictionary}-${i}`)) {
            chapterCard.classList.add('completed');
        }
        
        // 检查是否有实际的单词数据
        const wordsInChapter = getChapterWords(currentDictionary, i);
        const wordCount = wordsInChapter.length;
        
        chapterCard.innerHTML = `
            <h4>Chapter ${i}</h4>
            <p>${wordCount} 词</p>
        `;
        
        if (wordCount > 0) {
            chapterCard.addEventListener('click', () => {
                selectChapter(i);
            });
        } else {
            chapterCard.style.opacity = '0.5';
            chapterCard.style.cursor = 'not-allowed';
            chapterCard.title = '该章节暂无数据';
        }
        
        chapterGrid.appendChild(chapterCard);
    }
}

// 选择章节
function selectChapter(chapterNum) {
    currentChapter = chapterNum;
    loadChapterWords();
    showTypingInterface();
}

// 加载章节单词
function loadChapterWords() {
    // 使用真实词库数据
    chapterWords = getChapterWords(currentDictionary, currentChapter);
    
    if (chapterWords.length === 0) {
        alert('该章节暂无单词数据，请选择其他章节。');
        showChapterSelection();
        return;
    }
    
    currentWordIndex = 0;
    resetStats();
    loadCurrentWord();
}

// 原来的showTypingInterface函数已合并到上面

// 加载当前单词
function loadCurrentWord() {
    if (currentWordIndex >= chapterWords.length) {
        completeChapter();
        return;
    }
    
    const wordData = chapterWords[currentWordIndex];
    currentWord = wordData.word;
    
    updateWordDisplay();
    phoneticUS.textContent = `US: ${wordData.phonetic.us}`;
    phoneticUK.textContent = `UK: ${wordData.phonetic.uk}`;
    meaningDisplay.textContent = wordData.meaning;
    
    wordInput.value = '';
    wordInput.className = 'word-input';
    hideFeedback();
    
    // 如果已经有过用户交互，立即自动朗读；否则等待交互
    if (speechReady || speechActivationAttempted) {
        autoPronounceCurrent();
    } else {
        console.log('等待用户交互后自动朗读...');
    }
}

// 更新单词显示
function updateWordDisplay(typedLength = 0) {
    if (!currentWord) return;
    
    let html = '';
    for (let i = 0; i < currentWord.length; i++) {
        let className = '';
        if (i < typedLength) {
            className = 'typed';
        } else if (i === typedLength) {
            className = 'current';
        }
        
        html += `<span class="char ${className}">${currentWord[i]}</span>`;
    }
    
    currentWordEl.innerHTML = html;
}

// 处理单词输入
function handleWordInput(e) {
    const input = e.target.value;
    const target = currentWord;
    
    if (!isTyping && input.length > 0) {
        startTyping();
    }
    
    // 播放打字音效
    playTypingSound();
    
    // 逐字符检查
    for (let i = 0; i < input.length; i++) {
        if (i >= target.length || input[i].toLowerCase() !== target[i].toLowerCase()) {
            // 输入错误，立即重置
            totalInputs++;
            wordInput.className = 'word-input incorrect';
            showFeedback('输入错误，重新开始', 'incorrect');
            playErrorSound();
            
            setTimeout(() => {
                wordInput.value = '';
                wordInput.className = 'word-input';
                hideFeedback();
                wordInput.focus();
                updateWordDisplay(0); // 重置单词显示
            }, 800);
            
            updateStats();
            return;
        }
    }
    
    // 更新单词显示，显示已输入的字符
    updateWordDisplay(input.length);
    
    // 输入正确
    if (input.length === target.length) {
        totalInputs++;
        correctInputs++;
        wordInput.className = 'word-input correct';
        showFeedback('正确！', 'correct');
        playSuccessSound();
        
        setTimeout(() => {
            nextWord();
        }, 1000);
    } else {
        // 部分正确，继续输入
        wordInput.className = 'word-input';
    }
    
    updateStats();
}

// 处理按键事件
function handleKeyDown(e) {
    if (e.key === 'Enter') {
        const input = wordInput.value.toLowerCase().trim();
        const target = currentWord.toLowerCase();
        
        if (input === target) {
            nextWord();
        }
    } else if (e.key === 'Escape') {
        skipCurrentWord();
    }
}

// 下一个单词
function nextWord() {
    currentWordIndex++;
    loadCurrentWord();
}

// 跳过当前单词
function skipCurrentWord() {
    currentWordIndex++;
    loadCurrentWord();
}

// 重置当前章节
function resetCurrentChapter() {
    currentWordIndex = 0;
    resetStats();
    loadCurrentWord();
    wordInput.focus();
}

// 完成章节
function completeChapter() {
    completedChapters.add(`${currentDictionary}-${currentChapter}`);
    saveProgress();
    
    alert(`恭喜完成 ${dictionaries[currentDictionary].name} Chapter ${currentChapter}！`);
    showChapterSelection();
}

// 备用TTS朗读功能（改为强化版原生语音合成）
function speakWithFallbackTTS(text) {
    console.log('🎵 使用基础原生TTS朗读:', text);
    simpleSpeech(text);
}

// 强化版原生语音合成
function speakWithEnhancedNativeTTS(text) {
    console.log('🎤 使用强化版原生语音合成:', text);
    
    if (!('speechSynthesis' in window)) {
        console.log('❌ 浏览器不支持语音合成');
        playNotificationSound();
        return;
    }
    
    try {
        // 1. 首先确保停止所有语音
        speechSynthesis.cancel();
        
        // 2. 强制重新加载语音列表
        speechSynthesis.getVoices();
        
        // 3. 等待cancel操作完成后再开始
        setTimeout(() => {
            console.log('🔄 开始设置语音合成...');
            
            const performSpeech = () => {
                const voices = speechSynthesis.getVoices();
                console.log('📋 可用语音列表:');
                voices.forEach((voice, index) => {
                    if (index < 5) { // 只显示前5个
                        console.log(`  ${index}: ${voice.name} (${voice.lang}) [${voice.localService ? '本地' : '网络'}]`);
                    }
                });
                
                // 创建语音对象
                const utterance = new SpeechSynthesisUtterance(text);
                
                // 智能选择语音
                let selectedVoice = null;
                
                // 优先级1: 本地英语语音
                selectedVoice = voices.find(voice => 
                    voice.lang.includes('en') && voice.localService
                );
                
                // 优先级2: 任何英语语音
                if (!selectedVoice) {
                    selectedVoice = voices.find(voice => voice.lang.includes('en'));
                }
                
                // 优先级3: 系统默认语音
                if (!selectedVoice && voices.length > 0) {
                    selectedVoice = voices[0];
                }
                
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                    console.log('🎯 选择语音:', selectedVoice.name, `(${selectedVoice.lang})`);
                } else {
                    console.log('⚠️ 未找到合适语音，使用系统默认');
                }
                
                // 优化语音参数
                utterance.text = text;
                utterance.lang = 'en-US';
                utterance.volume = speechVolume; // 使用用户设置的音量
                utterance.rate = 0.9;  // 稍慢一点更清晰
                utterance.pitch = 1.0;
                
                // 详细的事件监听
                utterance.onstart = function(event) {
                    console.log('🎵 语音开始播放!');
                };
                
                utterance.onend = function(event) {
                    console.log('✅ 语音播放完成!');
                };
                
                utterance.onpause = function(event) {
                    console.log('⏸️ 语音暂停');
                };
                
                utterance.onresume = function(event) {
                    console.log('▶️ 语音恢复');
                };
                
                utterance.onerror = function(event) {
                    console.error('❌ 语音播放错误:', event);
                    console.error('错误类型:', event.error);
                    console.error('错误信息:', event.message);
                    
                    // 播放提示音作为替代
                    setTimeout(() => {
                        playNotificationSound();
                    }, 100);
                };
                
                // 开始朗读前的最后检查
                console.log('🚀 准备开始语音合成...');
                console.log('📝 文本内容:', text);
                console.log('🔊 音量:', utterance.volume);
                console.log('⚡ 语速:', utterance.rate);
                console.log('🎵 音调:', utterance.pitch);
                
                // 执行语音合成
                try {
                    speechSynthesis.speak(utterance);
                    console.log('📢 speechSynthesis.speak() 已调用');
                    
                    // 监控语音状态
                    let checkCount = 0;
                    const maxChecks = 10;
                    
                    const statusMonitor = setInterval(() => {
                        checkCount++;
                        const speaking = speechSynthesis.speaking;
                        const pending = speechSynthesis.pending;
                        const paused = speechSynthesis.paused;
                        
                        console.log(`📊 状态监控 ${checkCount}/${maxChecks}: speaking=${speaking}, pending=${pending}, paused=${paused}`);
                        
                        if (speaking) {
                            console.log('🎤 检测到语音正在播放!');
                            clearInterval(statusMonitor);
                        } else if (checkCount >= maxChecks) {
                            console.log('⚠️ 监控超时，语音可能未开始');
                            clearInterval(statusMonitor);
                            // 播放提示音
                            playNotificationSound();
                        }
                    }, 200);
                    
                } catch (speakError) {
                    console.error('💥 speechSynthesis.speak() 异常:', speakError);
                    playNotificationSound();
                }
            };
            
            // 确保语音列表已加载
            if (speechSynthesis.getVoices().length === 0) {
                console.log('⏳ 等待语音列表加载...');
                speechSynthesis.addEventListener('voiceschanged', () => {
                    console.log('🔄 语音列表已更新');
                    performSpeech();
                }, { once: true });
                
                // 设置超时
                setTimeout(() => {
                    if (speechSynthesis.getVoices().length === 0) {
                        console.log('⏰ 语音列表加载超时，强制执行');
                        performSpeech();
                    }
                }, 2000);
            } else {
                performSpeech();
            }
            
        }, 300); // 给cancel操作更多时间
        
    } catch (error) {
        console.error('💥 强化版TTS整体异常:', error);
        playNotificationSound();
    }
}

// 增强版音频合成系统
function enhancedAudioSynthesis(word) {
    console.log('🎼 增强版音频合成:', word);
    
    if (typeof(AudioContext) === "undefined" && typeof(webkitAudioContext) === "undefined") {
        console.log('❌ 不支持Web Audio API，播放基础提示音');
        playNotificationSound();
        return;
    }
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 增强的字母音调映射（更接近真实发音）
        const letterFreqs = {
            'a': 220, 'b': 246, 'c': 261, 'd': 293, 'e': 329, 'f': 349, 'g': 392,
            'h': 440, 'i': 493, 'j': 523, 'k': 587, 'l': 659, 'm': 698, 'n': 783,
            'o': 880, 'p': 987, 'q': 1046, 'r': 1174, 's': 1318, 't': 1396, 'u': 1567,
            'v': 1760, 'w': 1975, 'x': 2093, 'y': 2349, 'z': 2637
        };
        
        // 根据单词长度和内容调整参数
        const wordLength = word.length;
        const baseDuration = Math.max(1.2, wordLength * 0.2);
        let currentTime = audioContext.currentTime;
        
        // 播放单词开始音效
        playWordStartSound(audioContext, currentTime);
        currentTime += 0.2;
        
        // 为每个字母创建音调
        for (let i = 0; i < wordLength; i++) {
            const letter = word[i].toLowerCase();
            const frequency = letterFreqs[letter] || 440;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            // 音频处理链：oscillator -> filter -> gain -> destination
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 设置滤波器（让声音更柔和）
            filter.type = 'lowpass';
            filter.frequency.value = frequency * 2;
            filter.Q.value = 1;
            
            // 设置音调
            oscillator.frequency.setValueAtTime(frequency, currentTime);
            oscillator.type = 'sine';
            
            // 设置音量包络
            const letterDuration = baseDuration / wordLength;
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + letterDuration - 0.02);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + letterDuration);
            
            currentTime += letterDuration * 0.9; // 字母间略有重叠
        }
        
        // 播放单词结束音效
        playWordEndSound(audioContext, currentTime);
        
        console.log('✅ 增强版音频合成完成');
        
    } catch (error) {
        console.error('增强版音频合成失败:', error);
        playNotificationSound();
    }
}

// 播放单词开始音效
function playWordStartSound(audioContext, startTime) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(150, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, startTime + 0.1);
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.1, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.15);
}

// 播放单词结束音效
function playWordEndSound(audioContext, startTime) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(300, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(250, startTime + 0.2);
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.08, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
}

// 音频合成单词发音（Web Audio API方案）
function synthesizeWordAudio(word) {
    console.log('🎶 使用音频合成朗读:', word);
    
    if (typeof(AudioContext) === "undefined" && typeof(webkitAudioContext) === "undefined") {
        console.log('❌ 不支持Web Audio API');
        playNotificationSound();
        return;
    }
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 为不同字母创建不同音调的音效
        const letterFreqs = {
            'a': 440, 'b': 493, 'c': 523, 'd': 587, 'e': 659, 'f': 698, 'g': 784,
            'h': 880, 'i': 987, 'j': 1047, 'k': 1175, 'l': 1319, 'm': 1397, 'n': 1568,
            'o': 1760, 'p': 1975, 'q': 2093, 'r': 2349, 's': 2637, 't': 2794, 'u': 3136,
            'v': 3520, 'w': 3951, 'x': 4186, 'y': 4699, 'z': 5274
        };
        
        const duration = Math.max(0.8, word.length * 0.15); // 根据单词长度调整时长
        let time = audioContext.currentTime;
        
        // 为单词的每个字母创建音调
        for (let i = 0; i < word.length; i++) {
            const letter = word[i].toLowerCase();
            const frequency = letterFreqs[letter] || 500;
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 设置音调和音量
            oscillator.frequency.setValueAtTime(frequency, time);
            oscillator.type = 'sine';
            
            const letterDuration = duration / word.length;
            gainNode.gain.setValueAtTime(0, time);
            gainNode.gain.linearRampToValueAtTime(0.1, time + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + letterDuration);
            
            oscillator.start(time);
            oscillator.stop(time + letterDuration);
            
            time += letterDuration;
        }
        
        console.log('✅ 音频合成播放完成');
        
    } catch (error) {
        console.error('音频合成失败:', error);
        playNotificationSound();
    }
}

// 播放提示音（当语音合成失败时）
function playNotificationSound() {
    console.log('🔔 播放提示音代替朗读');
    
    if (typeof(AudioContext) !== "undefined" || typeof(webkitAudioContext) !== "undefined") {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建一个简单的提示音
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 设置音调（类似"叮"的声音）
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
            
            // 设置音量 - 增大音量
            gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            // 播放
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
            console.log('✅ 提示音播放完成');
            
        } catch (error) {
            console.error('提示音播放失败:', error);
        }
    }
}

// 在线TTS服务（ResponsiveVoice.js API）
function speakWithOnlineAudio(word) {
    try {
        console.log('🌐 使用在线TTS服务朗读:', word);
        
        // 使用ResponsiveVoice.js的在线API
        const text = encodeURIComponent(word);
        const audio = new Audio();
        
        // ResponsiveVoice.js的公共API端点
        audio.src = `https://code.responsivevoice.org/getvoice.php?t=${text}&tl=en-US&sv=&vn=&pitch=0.5&rate=0.5&vol=1`;
        audio.volume = 1.0;
        
        audio.onloadstart = () => {
            console.log('🔄 开始加载在线音频...');
        };
        
        audio.oncanplaythrough = () => {
            console.log('✅ 在线音频加载完成');
        };
        
        audio.onplay = () => {
            console.log('▶️ 在线音频开始播放');
        };
        
        audio.onended = () => {
            console.log('✅ 在线音频播放完成');
        };
        
        audio.onerror = (e) => {
            console.log('❌ 在线音频错误:', e);
            // 尝试备用方案：Google Translate TTS
            tryGoogleTTS(word);
        };
        
        audio.play().catch(err => {
            console.log('在线音频播放失败:', err.message);
            // 尝试备用方案
            tryGoogleTTS(word);
        });
        
    } catch (e) {
        console.log('在线TTS异常:', e.message);
        tryGoogleTTS(word);
    }
}

// 本地音频文件播放
function tryLocalAudio(word) {
    try {
        console.log('📁 尝试播放本地音频文件:', word);
        const audio = new Audio();
        const fileName = word.toLowerCase() + '.mp3';
        audio.src = `assets/audio/${fileName}`;
        audio.volume = 1.0;
        
        audio.onloadstart = () => {
            console.log('🔄 开始加载本地音频:', fileName);
        };
        
        audio.oncanplaythrough = () => {
            console.log('✅ 本地音频加载完成');
        };
        
        audio.onplay = () => {
            console.log('▶️ 本地音频开始播放');
        };
        
        audio.onended = () => {
            console.log('✅ 本地音频播放完成');
        };
        
        audio.onerror = (e) => {
            console.log('❌ 本地音频文件不存在或加载失败:', fileName);
            console.log('播放提示音作为最终替代');
            playNotificationSound();
        };
        
        audio.play().catch(err => {
            console.log('本地音频播放失败:', err.message);
            playNotificationSound();
        });
        
    } catch (e) {
        console.log('本地音频异常:', e.message);
        playNotificationSound();
    }
}

// 强制原生语音朗读（最后的方案）
function forceNativeSpeech(text) {
    console.log('🎯 强制原生语音朗读:', text);
    
    if (!('speechSynthesis' in window)) {
        console.log('❌ 浏览器不支持语音合成');
        playNotificationSound();
        return;
    }
    
    try {
        // 完全停止现有语音
        speechSynthesis.cancel();
        
        // 创建utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.volume = speechVolume; // 使用用户设置的音量
        utterance.rate = 0.8;
        utterance.pitch = 1.0;
        
        // 强制选择英文语音
        const voices = speechSynthesis.getVoices();
        console.log('📋 当前可用语音数量:', voices.length);
        
        if (voices.length > 0) {
            // 寻找英文语音
            let englishVoice = voices.find(voice => 
                voice.lang && voice.lang.toLowerCase().includes('en')
            );
            
            if (englishVoice) {
                utterance.voice = englishVoice;
                console.log('🔈 选择英文语音:', englishVoice.name, englishVoice.lang);
            } else {
                utterance.voice = voices[0];
                console.log('🔈 使用默认语音:', voices[0].name, voices[0].lang);
            }
        }
        
        // 事件监听
        utterance.onstart = () => {
            console.log('✅ 强制原生语音开始播放');
        };
        
        utterance.onend = () => {
            console.log('✅ 强制原生语音播放完成');
        };
        
        utterance.onerror = (e) => {
            console.log('❌ 强制原生语音错误:', e.error);
            console.log('播放提示音作为替代');
            setTimeout(() => playNotificationSound(), 100);
        };
        
        // 检查语音是否已被激活过
        if (speechSynthesis.getVoices().length === 0) {
            console.log('⚠️ 语音列表为空，等待加载后重试');
            // 等待语音列表加载
            speechSynthesis.addEventListener('voiceschanged', () => {
                console.log('🔄 语音列表已加载，重新尝试朗读');
                forceNativeSpeech(text);
            }, { once: true });
            return;
        }
        
        // 直接播放
        console.log('🚀 执行speechSynthesis.speak()');
        speechSynthesis.speak(utterance);
        
        // 多次检查是否真的开始了
        let checkCount = 0;
        const maxChecks = 3;
        const checkInterval = setInterval(() => {
            checkCount++;
            console.log(`📊 播放状态检查 ${checkCount}/${maxChecks} - speaking:${speechSynthesis.speaking}, pending:${speechSynthesis.pending}`);
            
            if (speechSynthesis.speaking) {
                console.log('✅ 检测到语音正在播放');
                clearInterval(checkInterval);
            } else if (checkCount >= maxChecks) {
                console.log('⚠️ 多次检查后语音仍未启动，播放提示音');
                clearInterval(checkInterval);
                playNotificationSound();
            }
        }, 300);
        
    } catch (error) {
        console.error('强制原生语音异常:', error);
        playNotificationSound();
    }
}

// 原生语音合成朗读（简化版）
function speakWithNativeTTS(text) {
    console.log('🎤 使用基础原生语音合成:', text);
    simpleSpeech(text);
}

// 强制激活语音功能（增强版）
function forceActivateSpeech() {
    console.log('🎤 强制激活语音功能...');
    
    if ('speechSynthesis' in window) {
        try {
            // 1. 停止所有现有语音
            speechSynthesis.cancel();
            
            // 2. 强制触发语音列表加载
            speechSynthesis.getVoices();
            
            // 3. 播放一个可听到的测试音（用于激活）
            const testUtterance = new SpeechSynthesisUtterance('test');
            testUtterance.volume = 0.1; // 低音量但可听到
            testUtterance.rate = 3; // 快速播放
            testUtterance.lang = 'en-US';
            
            testUtterance.onstart = () => {
                console.log('🎵 语音激活测试开始');
            };
            
            testUtterance.onend = () => {
                console.log('✅ 语音功能激活成功');
                speechReady = true;
            };
            
            testUtterance.onerror = (e) => {
                console.log('⚠️ 语音功能激活失败:', e.error);
                speechReady = false;
            };
            
            console.log('🚀 播放激活测试音...');
            speechSynthesis.speak(testUtterance);
            
        } catch (error) {
            console.error('强制激活语音失败:', error);
            speechReady = false;
        }
    } else {
        console.log('❌ 浏览器不支持语音合成');
        speechReady = false;
    }
}

// 用户交互激活语音（点击页面时触发）
function activateSpeechOnUserInteraction() {
    console.log('👆 检测到用户交互，激活语音功能');
    
    // 移除已有的监听器，避免重复
    document.removeEventListener('click', activateSpeechOnUserInteraction);
    document.removeEventListener('keydown', activateSpeechOnUserInteraction);
    
    // 强制激活语音
    forceActivateSpeech();
}


// 移除自动激活，改为手动激活
// document.addEventListener('click', activateSpeechOnUserInteraction, { once: true });
// document.addEventListener('keydown', activateSpeechOnUserInteraction, { once: true });

// 调试语音系统
function debugSpeechSystem() {
    console.log('=== 开始调试语音系统 ===');
    
    // 检查基本支持
    console.log('1. speechSynthesis支持:', 'speechSynthesis' in window);
    if (!('speechSynthesis' in window)) {
        alert('您的浏览器不支持语音合成！');
        return;
    }
    
    // 检查当前状态
    console.log('2. 当前状态:', {
        speaking: speechSynthesis.speaking,
        pending: speechSynthesis.pending,
        paused: speechSynthesis.paused
    });
    
    // 检查语音列表
    const voices = speechSynthesis.getVoices();
    console.log('3. 语音列表数量:', voices.length);
    if (voices.length > 0) {
        voices.slice(0, 5).forEach((voice, i) => {
            console.log(`   ${i}: ${voice.name} (${voice.lang}) [${voice.localService ? '本地' : '网络'}]`);
        });
    } else {
        console.log('   语音列表为空，等待加载...');
    }
    
    // 尝试最简单的朗读
    console.log('4. 开始测试朗读...');
    const testWord = 'hello';
    
    try {
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(testWord);
        utterance.lang = 'en-US';
        utterance.volume = 1.0;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        // 选择语音
        if (voices.length > 0) {
            const englishVoice = voices.find(v => v.lang.includes('en'));
            if (englishVoice) {
                utterance.voice = englishVoice;
                console.log('   使用语音:', englishVoice.name);
            }
        }
        
        utterance.onstart = () => {
            console.log('✅ 测试朗读开始 - 成功！');
            alert('语音测试成功！听到了"hello"吗？');
        };
        
        utterance.onend = () => {
            console.log('✅ 测试朗读结束');
        };
        
        utterance.onerror = (e) => {
            console.log('❌ 测试朗读错误:', e.error);
            alert('语音测试失败: ' + e.error);
        };
        
        speechSynthesis.speak(utterance);
        console.log('   已调用speak()，等待结果...');
        
        // 超时检查
        setTimeout(() => {
            if (!speechSynthesis.speaking) {
                console.log('⚠️ 原生TTS测试失败，使用增强音频合成');
                alert('TTS被系统阻止，使用增强版音频合成方案');
                enhancedAudioSynthesis('hello');
            }
        }, 1000);
        
    } catch (error) {
        console.error('调试过程出错:', error);
        alert('调试过程出错: ' + error.message);
    }
    
    console.log('=== 调试完成 ===');
}

// 超简单语音合成（终极方案）
function ultraSimpleSpeech(text) {
    console.log('🎯 超简单语音合成:', text);
    
    if (!window.speechSynthesis) {
        console.log('❌ 浏览器不支持语音合成');
        playNotificationSound();
        return;
    }
    
    try {
        // 停止现有语音
        speechSynthesis.cancel();
        
        // 等待一点时间确保停止完成
        setTimeout(() => {
            // 创建最基本的utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // 最基本的设置
            utterance.lang = 'en-US';
            utterance.volume = 1;
            utterance.rate = 0.8;
            utterance.pitch = 1;
            
            // 简单的事件
            utterance.onstart = () => console.log('🎵 超简单语音开始');
            utterance.onend = () => console.log('✅ 超简单语音结束');
            utterance.onerror = (e) => {
                console.log('❌ 超简单语音错误:', e.error);
                playNotificationSound();
            };
            
            // 直接播放
            speechSynthesis.speak(utterance);
            console.log('🚀 已调用speak()');
            
            // 简单检查
            setTimeout(() => {
                console.log('📊 简单检查 - speaking:', speechSynthesis.speaking);
                if (!speechSynthesis.speaking) {
                    console.log('⚠️ 未开始播放，播放提示音');
                    playNotificationSound();
                }
            }, 100);
            
        }, 50);
        
    } catch (error) {
        console.error('超简单语音异常:', error);
        playNotificationSound();
    }
}

// 终极本地化TTS方案
function ultimateLocalTTS(text) {
    console.log('🎯 终极本地化TTS:', text);
    
    // 检查浏览器支持
    if (!('speechSynthesis' in window)) {
        console.log('❌ 浏览器不支持语音合成，使用音频合成');
        synthesizeWordAudio(text);
        return;
    }
    
    try {
        // 强制重置语音系统
        speechSynthesis.cancel();
        
        // 等待重置完成
        setTimeout(() => {
            performUltimateSpeech(text);
        }, 50);
        
    } catch (error) {
        console.error('终极TTS错误:', error);
        synthesizeWordAudio(text);
    }
}

function performUltimateSpeech(text) {
    console.log('🚀 执行终极语音合成:', text);
    
    // 创建语音对象
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 设置基本参数
    utterance.text = text;
    utterance.lang = 'en-US';
    utterance.volume = 1.0;
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    
    // 尝试获取并设置最佳语音
    const voices = speechSynthesis.getVoices();
    console.log('🎤 语音总数:', voices.length);
    
    if (voices.length > 0) {
        // 寻找最佳英文语音
        let bestVoice = null;
        
        // 优先级排序
        const priorities = [
            v => v.lang.includes('en-US') && v.name.includes('Google'),
            v => v.lang.includes('en-US') && v.localService,
            v => v.lang.includes('en-US'),
            v => v.lang.includes('en'),
            v => v.default,
            v => true // 任何语音
        ];
        
        for (const priorityFn of priorities) {
            bestVoice = voices.find(priorityFn);
            if (bestVoice) break;
        }
        
        if (bestVoice) {
            utterance.voice = bestVoice;
            console.log('🎯 选择最佳语音:', bestVoice.name, bestVoice.lang);
        }
    } else {
        console.log('⚠️ 语音列表为空，使用默认');
    }
    
    // 设置事件监听
    let speechStarted = false;
    
    utterance.onstart = function() {
        speechStarted = true;
        console.log('✅ 终极TTS开始播放');
    };
    
    utterance.onend = function() {
        console.log('✅ 终极TTS播放完成');
    };
    
    utterance.onerror = function(event) {
        console.error('❌ 终极TTS错误:', event.error, event.message);
        if (!speechStarted) {
            console.log('🎵 降级到音频合成');
            synthesizeWordAudio(text);
        }
    };
    
    // 执行语音合成
    console.log('🔊 开始播放...');
    speechSynthesis.speak(utterance);
    
    // 监控语音状态
    let checkCount = 0;
    const maxChecks = 5;
    
    const monitor = setInterval(() => {
        checkCount++;
        const speaking = speechSynthesis.speaking;
        const pending = speechSynthesis.pending;
        
        console.log(`📊 监控 ${checkCount}/${maxChecks}: speaking=${speaking}, pending=${pending}`);
        
        if (speaking || speechStarted) {
            console.log('✅ 语音正在播放');
            clearInterval(monitor);
        } else if (checkCount >= maxChecks) {
            console.log('⚠️ 语音未启动，使用音频合成');
            clearInterval(monitor);
            speechSynthesis.cancel();
            synthesizeWordAudio(text);
        }
    }, 200);
}

// 本地化TTS实现（不依赖外部服务）
function modernTTSSpeak(text) {
    console.log('🎙️ 本地化TTS开始:', text);
    
    // 直接使用最强的本地方案
    ultimateLocalTTS(text);
}

// 强化版原生TTS
function enhancedNativeTTS(text) {
    console.log('🔧 强化版原生TTS:', text);
    
    try {
        // 确保停止之前的语音
        speechSynthesis.cancel();
        
        // 等待一下确保停止完成
        setTimeout(() => {
            performEnhancedSpeech(text);
        }, 100);
        
    } catch (error) {
        console.error('强化版TTS错误:', error);
        synthesizeWordAudio(text);
    }
}

function performEnhancedSpeech(text) {
    const utterThis = new SpeechSynthesisUtterance(text);
    
    // 获取语音列表
    let voices = speechSynthesis.getVoices();
    console.log('🎤 可用语音数量:', voices.length);
    
    if (voices.length === 0) {
        // 如果语音列表为空，等待加载
        console.log('⏳ 等待语音列表加载...');
        speechSynthesis.addEventListener('voiceschanged', () => {
            voices = speechSynthesis.getVoices();
            console.log('🔄 语音列表已加载:', voices.length);
            if (voices.length > 0) {
                performEnhancedSpeech(text);
            } else {
                synthesizeWordAudio(text);
            }
        }, { once: true });
        return;
    }
    
    // 智能选择最佳语音
    let selectedVoice = null;
    
    // 优先级1: 英文女声
    selectedVoice = voices.find(voice => 
        voice.lang.includes('en') && 
        voice.name.toLowerCase().includes('female')
    );
    
    // 优先级2: 任何英文语音
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.includes('en'));
    }
    
    // 优先级3: Google语音
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.name.includes('Google'));
    }
    
    // 优先级4: 第一个可用语音
    if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
    }
    
    if (selectedVoice) {
        utterThis.voice = selectedVoice;
        console.log('🎯 选择语音:', selectedVoice.name, selectedVoice.lang);
    }
    
    // 设置参数
    utterThis.lang = 'en-US';
    utterThis.volume = speechVolume; // 使用用户设置的音量
    utterThis.rate = 0.9;
    utterThis.pitch = 1.1;
    
    // 事件处理
    utterThis.onstart = function(event) {
        console.log('✅ 强化版TTS开始播放');
    };
    
    utterThis.onend = function(event) {
        console.log('✅ 强化版TTS播放完成');
    };
    
    utterThis.onerror = function(event) {
        console.error('❌ 强化版TTS错误:', event.error);
        // 如果出错，降级到音频合成
        synthesizeWordAudio(text);
    };
    
    // 执行语音合成
    speechSynthesis.speak(utterThis);
    console.log('🚀 强化版TTS已调用speak()');
    
    // 检查是否真的开始了
    setTimeout(() => {
        if (!speechSynthesis.speaking && !speechSynthesis.pending) {
            console.log('⚠️ 强化版TTS未启动，降级到音频合成');
            synthesizeWordAudio(text);
        } else {
            console.log('✅ 强化版TTS正在运行');
        }
    }, 300);
}

// 简化但可靠的朗读函数
function speakWord(text) {
    if (!text || !soundEnabled) {
        console.log('跳过朗读 - 无文本或朗读功能关闭');
        return;
    }
    
    console.log('🔊 开始朗读单词:', text);
    
    // 使用强制激活的TTS方案
    forceActivateAndSpeak(text);
}

// 使用系统TTS（需要用户手动操作）
function useSystemTTS() {
    const word = currentWord || 'hello';
    console.log('🎙️ 使用系统TTS朗读:', word);
    
    // 选中当前单词
    const wordElement = document.getElementById('currentWord');
    if (wordElement) {
        // 选中文字
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(wordElement);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // 提示用户使用系统功能
        alert(`已选中单词"${word}"！\n\n请按以下任一方式朗读：\n\n1. 按 Win+Ctrl+Enter 开启讲述人\n2. 按 Ctrl+Shift+S (如已设置快捷键)\n3. 右键选择"朗读所选文本"\n4. 使用浏览器扩展朗读选中文字`);
    }
}

// 使用在线TTS
function useOnlineTTS() {
    const word = currentWord || 'hello';
    console.log('🌐 使用在线TTS朗读:', word);
    
    // 打开Google翻译页面朗读
    const url = `https://translate.google.com/?sl=en&tl=zh&text=${encodeURIComponent(word)}&op=translate`;
    const popup = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    
    if (popup) {
        alert(`已在新窗口打开Google翻译！\n\n单词："${word}"\n\n请点击翻译页面的小喇叭图标🔊来朗读单词`);
    } else {
        // 如果弹窗被阻止，提供手动链接
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.textContent = '点击这里在Google翻译中朗读';
        link.style.cssText = 'color: #2196f3; text-decoration: underline; font-weight: bold;';
        
        const tip = document.createElement('div');
        tip.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid #2196f3; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000; text-align: center;';
        tip.innerHTML = `
            <h3>在线朗读 - ${word}</h3>
            <p>弹窗被阻止，请手动打开：</p>
            <div style="margin: 10px 0;">${link.outerHTML}</div>
            <button onclick="this.parentElement.remove()" style="padding: 5px 15px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
        `;
        document.body.appendChild(tip);
        
        // 5秒后自动关闭
        setTimeout(() => {
            if (tip.parentElement) {
                tip.remove();
            }
        }, 5000);
    }
}

// 检测是否为Chrome浏览器
function isChromeRestricted() {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    return isChrome;
}

// 强制激活并朗读
function forceActivateAndSpeak(text) {
    console.log('🎯 强制激活TTS并朗读:', text);
    
    // 检测Chrome并使用特殊处理
    if (isChromeRestricted()) {
        console.log('🔍 检测到Chrome浏览器，使用强化模式');
        chromeSpecialTTS(text);
        return;
    }
    
    // 如果已经激活过，直接朗读
    if (speechReady) {
        directSpeech(text);
        return;
    }
    
    // 强制激活TTS权限
    if ('speechSynthesis' in window) {
        try {
            // 立即尝试播放一个静音测试来激活权限
            const testUtter = new SpeechSynthesisUtterance('');
            testUtter.volume = 0.01;
            testUtter.rate = 10;
            testUtter.pitch = 0.1;
            
            testUtter.onstart = () => {
                console.log('✅ TTS权限激活成功');
                speechReady = true;
                // 立即朗读目标文本
                setTimeout(() => directSpeech(text), 100);
            };
            
            testUtter.onend = () => {
                // 如果测试完成但没有触发onstart，强制执行
                if (!speechReady) {
                    console.log('🔄 强制设为已激活');
                    speechReady = true;
                    setTimeout(() => directSpeech(text), 100);
                }
            };
            
            testUtter.onerror = () => {
                console.log('⚠️ 测试失败，强制执行朗读');
                speechReady = true;
                setTimeout(() => directSpeech(text), 100);
            };
            
            // 执行测试
            speechSynthesis.speak(testUtter);
            
            // 超时保护
            setTimeout(() => {
                if (!speechReady) {
                    console.log('⏰ 激活超时，强制执行');
                    speechReady = true;
                    directSpeech(text);
                }
            }, 200);
            
        } catch (error) {
            console.error('激活过程出错:', error);
            speechReady = true;
            directSpeech(text);
        }
    } else {
        console.log('❌ 不支持语音合成');
        playNotificationSound();
    }
}

// Chrome浏览器专用TTS
function chromeSpecialTTS(text) {
    console.log('🔧 Chrome专用TTS模式:', text);
    
    // 强制清除所有语音
    speechSynthesis.cancel();
    
    // 等待一帧，确保清除完成
    requestAnimationFrame(() => {
        try {
            // 创建专用于Chrome的utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Chrome特殊设置
            utterance.lang = 'en-US';
            utterance.volume = 1.0;  // 最大音量
            utterance.rate = 0.8;  // Chrome需要稍慢的语速
            utterance.pitch = 1.2;  // 稍高音调，更清晰
            
            // 强制选择系统默认语音
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                // 优先选择系统英文语音
                const systemVoice = voices.find(v => 
                    v.localService && (v.lang.includes('en-US') || v.lang.includes('en'))
                ) || voices.find(v => 
                    v.lang.includes('en-US') || v.lang.includes('en')
                ) || voices[0];
                
                if (systemVoice) {
                    utterance.voice = systemVoice;
                    console.log('🎯 Chrome使用语音:', systemVoice.name);
                }
            }
            
            // Chrome专用事件处理
            let hasStarted = false;
            
            utterance.onstart = () => {
                hasStarted = true;
                console.log('✅ Chrome朗读开始');
            };
            
            utterance.onend = () => {
                console.log('✅ Chrome朗读完成');
            };
            
            utterance.onerror = (e) => {
                console.error('❌ Chrome朗读错误:', e.error);
                if (e.error === 'interrupted') {
                    // Chrome经常报告interrupted，重试
                    console.log('🔄 Chrome被中断，正在重试...');
                    setTimeout(() => chromeRetryTTS(text), 100);
                } else {
                    playNotificationSound();
                }
            };
            
            // 执行朗读
            speechSynthesis.speak(utterance);
            
            // Chrome专用检查
            setTimeout(() => {
                if (!hasStarted && !speechSynthesis.speaking) {
                    console.log('⚠️ Chrome朗读未启动，重试...');
                    chromeRetryTTS(text);
                }
            }, 300);
            
        } catch (error) {
            console.error('Chrome TTS错误:', error);
            playNotificationSound();
        }
    });
}

// Chrome重试TTS
function chromeRetryTTS(text) {
    console.log('🔄 Chrome重试TTS:', text);
    
    speechSynthesis.cancel();
    
    setTimeout(() => {
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.volume = 1.0;  // 最大音量
            utterance.rate = 0.7; // 更慢的语速
            utterance.pitch = 1.2;  // 更清晰的音调
            
            utterance.onstart = () => {
                console.log('✅ Chrome重试成功');
            };
            
            utterance.onerror = () => {
                console.log('❌ Chrome重试失败，播放提示音');
                playNotificationSound();
            };
            
            speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.error('Chrome重试错误:', error);
            playNotificationSound();
        }
    }, 200);
}

// 直接朗读（已激活状态下）
function directSpeech(text) {
    console.log('🎤 直接朗读:', text);
    
    try {
        // 停止当前语音
        speechSynthesis.cancel();
        
        // 创建新的朗读
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // 获取最佳语音
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                // 寻找英文语音
                let englishVoice = voices.find(v => 
                    v.lang.includes('en-US') || v.lang.includes('en')
                );
                if (englishVoice) {
                    utterance.voice = englishVoice;
                    console.log('🎯 使用语音:', englishVoice.name);
                }
            }
            
            // 设置参数
            utterance.lang = 'en-US';
            utterance.volume = speechVolume;  // 使用用户设置的音量
            utterance.rate = 0.9;
            utterance.pitch = 1.2;  // 提高音调，更清晰
            
            // 事件监听
            utterance.onstart = () => {
                console.log('✅ 朗读开始');
            };
            
            utterance.onend = () => {
                console.log('✅ 朗读完成');
            };
            
            utterance.onerror = (e) => {
                console.error('❌ 朗读错误:', e.error);
                // 错误时播放提示音
                playNotificationSound();
            };
            
            // 执行朗读
            speechSynthesis.speak(utterance);
            
            // 检查是否成功
            setTimeout(() => {
                if (!speechSynthesis.speaking) {
                    console.log('⚠️ 朗读未启动，播放提示音');
                    playNotificationSound();
                } else {
                    console.log('✅ 朗读正在进行');
                }
            }, 100);
            
        }, 50);
        
    } catch (error) {
        console.error('直接朗读错误:', error);
        playNotificationSound();
    }
}

// 最简化的语音合成
function simpleSpeech(text) {
    console.log('🎤 使用简化语音合成:', text);
    
    if (!('speechSynthesis' in window)) {
        console.log('❌ 不支持语音合成，播放提示音');
        playNotificationSound();
        return;
    }
    
    // 不再强制依赖speechReady标志，直接尝试朗读
    if (!speechReady) {
        console.log('ℹ️ 语音未标记为激活，但仍尝试朗读');
    }
    
    try {
        const startSpeak = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // 显式选择英文语音，避免系统默认中文TTS无声
            const voices = speechSynthesis.getVoices();
            let voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')); 
            if (!voice && voices.length > 0) voice = voices[0];
            if (voice) {
                utterance.voice = voice;
                console.log('🔈 使用语音:', voice.name, voice.lang);
            } else {
                console.log('⚠️ 未获取到任何语音列表');
            }
            
            // 使用最基本的设置
            utterance.lang = 'en-US';
            utterance.volume = 1.0;
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            
            // 简单的回调
            utterance.onstart = () => {
                console.log('✅ 简化语音开始');
            };
            
            utterance.onend = () => {
                console.log('✅ 简化语音完成');
            };
            
            utterance.onerror = (e) => {
                console.log('❌ 简化语音错误:', e.error);
                // 错误时播放提示音
                playNotificationSound();
            };
            
            // 直接播放，不做复杂的检查
            console.log('🎵 直接播放语音...');
            try {
                speechSynthesis.speak(utterance);
            } catch (e) {
                console.log('speak调用异常，播放提示音:', e.message);
                playNotificationSound();
            }
            
            // 如果3秒后还没开始，播放提示音
            setTimeout(() => {
                if (!speechSynthesis.speaking) {
                    console.log('⚠️ 语音未开始，播放提示音');
                    playNotificationSound();
                }
            }, 3000);
        };

        // 如果当前正在说话，先取消再延迟启动；否则直接启动
        if (speechSynthesis.speaking || speechSynthesis.pending) {
            console.log('⏹️ 正在朗读，先取消后重试');
            speechSynthesis.cancel();
            setTimeout(startSpeak, 250);
        } else {
            startSpeak();
        }
        
    } catch (error) {
        console.error('简化语音异常:', error);
        playNotificationSound();
    }
}

// Chrome兼容的发音功能
function pronounceCurrentWord() {
    if (!currentWord || !soundEnabled) {
        console.log('朗读功能已关闭或无单词');
        return;
    }
    
    // 视觉反馈
    pronounceBtn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        pronounceBtn.style.transform = 'scale(1)';
    }, 150);
    
    console.log('🔊 手动点击朗读单词:', currentWord);
    
    // 直接走基础原生朗读
    speakWithNativeTTS(currentWord);
}

// 启用输入的统一函数
function enableInput() {
    wordInput.disabled = false;
    wordInput.placeholder = '请输入单词...';
    wordInput.focus();
}

// 测试语音合成功能
function testSpeechSynthesis() {
    console.log('=== 开始测试语音合成 ===');
    
    if (!('speechSynthesis' in window)) {
        alert('您的浏览器不支持语音合成功能！');
        console.log('浏览器不支持speechSynthesis');
        return;
    }
    
    console.log('speechSynthesis对象:', speechSynthesis);
    console.log('speechSynthesis.speaking:', speechSynthesis.speaking);
    console.log('speechSynthesis.pending:', speechSynthesis.pending);
    console.log('speechSynthesis.paused:', speechSynthesis.paused);
    
    // 首先尝试触发语音列表加载
    const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log('可用语音数量:', voices.length);
        
        if (voices.length > 0) {
            voices.forEach((voice, index) => {
                if (index < 10) { // 只显示前10个语音
                    console.log(`语音${index}: ${voice.name} (${voice.lang}) [${voice.localService ? '本地' : '网络'}]`);
                }
            });
            
            // 开始测试朗读
            performTest(voices);
        } else {
            console.log('语音列表为空，等待加载...');
            setTimeout(() => {
                loadVoices();
            }, 500);
        }
    };
    
    // 执行测试朗读
    function performTest(voices) {
        // 停止当前朗读
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            setTimeout(() => doTest(), 200);
        } else {
            doTest();
        }
        
        function doTest() {
            const testWord = currentWord || 'test';
            console.log('测试朗读单词:', testWord);
            
            const utterance = new SpeechSynthesisUtterance(testWord);
            
            // 选择最佳语音
            const preferredVoice = voices.find(voice => 
                voice.lang.startsWith('en') && voice.localService === true
            ) || voices.find(voice => voice.lang.startsWith('en'));
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
                console.log('使用语音:', preferredVoice.name);
            }
            
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            utterance.volume = 1.0;
            utterance.pitch = 1.0;
            
            utterance.onstart = function() {
                console.log('✅ 测试朗读开始成功');
                alert('朗读测试开始！');
            };
            
            utterance.onend = function() {
                console.log('✅ 测试朗读结束');
                alert('朗读测试完成！');
            };
            
            utterance.onerror = function(event) {
                console.error('❌ 测试朗读错误:', event.error);
                alert('朗读测试失败: ' + event.error + '\n请检查浏览器设置或尝试刷新页面');
            };
            
            try {
                console.log('开始执行测试朗读...');
                speechSynthesis.speak(utterance);
                
                // 状态监控
                let checkCount = 0;
                const statusCheck = setInterval(() => {
                    checkCount++;
                    console.log(`状态检查${checkCount}:`, {
                        speaking: speechSynthesis.speaking,
                        pending: speechSynthesis.pending,
                        paused: speechSynthesis.paused
                    });
                    
                    if (checkCount >= 10 || (!speechSynthesis.speaking && !speechSynthesis.pending)) {
                        clearInterval(statusCheck);
                        if (checkCount >= 10) {
                            console.warn('朗读可能未正常工作');
                        }
                    }
                }, 500);
                
            } catch (error) {
                console.error('测试朗读异常:', error);
                alert('朗读测试异常: ' + error.message);
            }
        }
    }
    
    // 开始加载语音
    loadVoices();
    
    // 触发语音列表加载事件
    speechSynthesis.addEventListener('voiceschanged', loadVoices, { once: true });
}

// 自动朗读单词（使用新的统一朗读函数）
function autoPronounceCurrent() {
    console.log('=== 自动朗读函数被调用 ===');
    console.log('currentWord:', currentWord);
    console.log('soundEnabled:', soundEnabled);
    
    if (!currentWord || !soundEnabled) {
        console.log('跳过朗读 - 无单词或朗读功能关闭');
        enableInput();
        return;
    }
    
    // 直接启用输入，不要禁用输入框
    enableInput();
    
    // 延迟一点时间让用户看到单词，然后开始朗读
    setTimeout(() => {
        console.log('🔊 开始自动朗读...');
        speakWord(currentWord);
    }, 400);
}

// 显示输入反馈
function showFeedback(text, type) {
    inputFeedback.textContent = text;
    inputFeedback.className = `input-feedback show ${type}`;
}

// 隐藏输入反馈
function hideFeedback() {
    inputFeedback.className = 'input-feedback';
}

// 开始打字
function startTyping() {
    if (!startTime) {
        startTime = new Date();
        isTyping = true;
    }
}

// 开始计时器
function startTimer() {
    startTime = new Date();
    const timer = setInterval(() => {
        if (!startTime) {
            clearInterval(timer);
            return;
        }
        
        const elapsed = new Date() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        timeValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// 重置统计
function resetStats() {
    startTime = null;
    isTyping = false;
    totalInputs = 0;
    correctInputs = 0;
    updateStats();
}

// 更新统计信息
function updateStats() {
    inputCount.textContent = totalInputs;
    correctCount.textContent = correctInputs;
    
    if (totalInputs > 0) {
        const accuracy = (correctInputs / totalInputs * 100).toFixed(2);
        accuracyValue.textContent = accuracy;
    } else {
        accuracyValue.textContent = '0.00';
    }
    
    if (startTime && totalInputs > 0) {
        const elapsed = (new Date() - startTime) / 1000 / 60; // 分钟
        const speed = (correctInputs / elapsed).toFixed(2);
        speedValue.textContent = speed;
    } else {
        speedValue.textContent = '0.00';
    }
}

// 音效系统
let audioContext = null;

// 初始化音频上下文
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('音频API不支持');
        }
    }
}

// 播放打字音效
function playTypingSound() {
    if (!typingSoundEnabled || !soundEnabled) return;
    if (!audioContext) initAudioContext();
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // 高频点击声
        oscillator.type = 'square';
        gainNode.gain.value = 0.05;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
    } catch (e) {
        // 忽略错误
    }
}

// 播放错误音效
function playErrorSound() {
    if (!soundEnabled) return;
    if (!audioContext) initAudioContext();
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 200; // 低频错误声
        oscillator.type = 'sawtooth';
        gainNode.gain.value = 0.15;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // 忽略错误
    }
}

// 播放成功音效
function playSuccessSound() {
    if (!soundEnabled) return;
    if (!audioContext) initAudioContext();
    if (!audioContext) return;
    
    try {
        // 播放两个音符组成的成功音效
        [523, 659].forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            const startTime = audioContext.currentTime + index * 0.1;
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.2);
        });
    } catch (e) {
        // 忽略错误
    }
}

// 主题切换
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// 更新主题图标
function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// 保存进度
function saveProgress() {
    const progress = {
        currentDictionary,
        completedChapters: Array.from(completedChapters)
    };
    localStorage.setItem('typingProgress', JSON.stringify(progress));
}

// 加载进度
function loadProgress() {
    const saved = localStorage.getItem('typingProgress');
    if (saved) {
        const progress = JSON.parse(saved);
        currentDictionary = progress.currentDictionary || 'cet4';
        completedChapters = new Set(progress.completedChapters || []);
    }
}