// 📊 高级访客统计系统
// 这个文件提供详细的访客跟踪和数据收集功能

class TypingAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.currentSession = {
            dictionary: null,
            chapter: null,
            startTime: null,
            wordsTyped: 0,
            errorsCount: 0,
            totalTime: 0
        };
        
        this.init();
    }

    // 初始化统计系统
    init() {
        this.trackPageView();
        this.trackUserInfo();
        this.setupEventListeners();
        this.startHeartbeat();
        
        console.log('📊 统计系统已启动，会话ID:', this.sessionId);
    }

    // 生成唯一会话ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 获取用户信息
    getUserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            referrer: document.referrer || 'direct'
        };
    }

    // 获取地理位置信息（可选）
    async getLocationInfo() {
        try {
            // 使用免费的地理位置API
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country_name,
                countryCode: data.country_code,
                timezone: data.timezone
            };
        } catch (error) {
            console.log('获取地理位置失败:', error);
            return null;
        }
    }

    // 跟踪页面访问
    async trackPageView() {
        const userInfo = this.getUserInfo();
        const locationInfo = await this.getLocationInfo();
        
        const pageViewData = {
            type: 'page_view',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            title: document.title,
            userInfo: userInfo,
            locationInfo: locationInfo
        };

        this.saveEvent(pageViewData);
        this.sendToAnalytics('page_view', pageViewData);
    }

    // 跟踪用户基本信息
    trackUserInfo() {
        const userInfo = this.getUserInfo();
        
        // 检测设备类型
        const deviceType = this.getDeviceType();
        const browserInfo = this.getBrowserInfo();

        const userData = {
            type: 'user_info',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            deviceType: deviceType,
            browserInfo: browserInfo,
            userInfo: userInfo
        };

        this.saveEvent(userData);
    }

    // 获取设备类型
    getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            return 'tablet';
        }
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // 获取浏览器信息
    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';

        if (userAgent.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
            browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
        } else if (userAgent.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
            browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
        } else if (userAgent.indexOf('Safari') > -1) {
            browserName = 'Safari';
            browserVersion = userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
        } else if (userAgent.indexOf('Edge') > -1) {
            browserName = 'Edge';
            browserVersion = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
        }

        return {
            name: browserName,
            version: browserVersion,
            userAgent: userAgent
        };
    }

    // 跟踪练习开始
    trackPracticeStart(dictionary, chapter) {
        this.currentSession = {
            dictionary: dictionary,
            chapter: chapter,
            startTime: Date.now(),
            wordsTyped: 0,
            errorsCount: 0,
            totalTime: 0
        };

        const eventData = {
            type: 'practice_start',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            dictionary: dictionary,
            chapter: chapter
        };

        this.saveEvent(eventData);
        this.sendToAnalytics('practice_start', eventData);
    }

    // 跟踪单词完成
    trackWordComplete(word, timeTaken, errors) {
        this.currentSession.wordsTyped++;
        this.currentSession.errorsCount += errors;

        const eventData = {
            type: 'word_complete',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            word: word,
            timeTaken: timeTaken,
            errors: errors,
            dictionary: this.currentSession.dictionary,
            chapter: this.currentSession.chapter
        };

        this.saveEvent(eventData);
        
        // 每5个单词发送一次数据
        if (this.currentSession.wordsTyped % 5 === 0) {
            this.sendToAnalytics('word_complete', eventData);
        }
    }

    // 跟踪章节完成
    trackChapterComplete(dictionary, chapter, totalTime, wordsCount, accuracy) {
        const eventData = {
            type: 'chapter_complete',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            dictionary: dictionary,
            chapter: chapter,
            totalTime: totalTime,
            wordsCount: wordsCount,
            accuracy: accuracy,
            wpm: this.calculateWPM(wordsCount, totalTime)
        };

        this.saveEvent(eventData);
        this.sendToAnalytics('chapter_complete', eventData);
    }

    // 跟踪语音功能使用
    trackSpeechUsage(action, word = null) {
        const eventData = {
            type: 'speech_usage',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            action: action, // 'activated', 'disabled', 'word_spoken'
            word: word
        };

        this.saveEvent(eventData);
        this.sendToAnalytics('speech_usage', eventData);
    }

    // 跟踪设置更改
    trackSettingChange(setting, value) {
        const eventData = {
            type: 'setting_change',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            setting: setting,
            value: value
        };

        this.saveEvent(eventData);
        this.sendToAnalytics('setting_change', eventData);
    }

    // 跟踪错误/异常
    trackError(error, context) {
        const eventData = {
            type: 'error',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            error: error.toString(),
            context: context,
            stack: error.stack
        };

        this.saveEvent(eventData);
        this.sendToAnalytics('error', eventData);
    }

    // 计算WPM
    calculateWPM(wordsCount, timeMs) {
        const minutes = timeMs / (1000 * 60);
        return Math.round(wordsCount / minutes);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 监听页面离开
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
        });

        // 监听页面隐藏/显示
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackEvent('page_hidden');
            } else {
                this.trackEvent('page_visible');
            }
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.trackEvent('window_resize', {
                newSize: `${window.innerWidth}x${window.innerHeight}`
            });
        });

        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.trackEvent('network_online');
        });

        window.addEventListener('offline', () => {
            this.trackEvent('network_offline');
        });
    }

    // 开始心跳检测（用于统计在线时长）
    startHeartbeat() {
        setInterval(() => {
            this.trackEvent('heartbeat', {
                sessionDuration: Date.now() - this.startTime
            });
        }, 30000); // 每30秒发送一次心跳
    }

    // 跟踪会话结束
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.startTime;
        
        const eventData = {
            type: 'session_end',
            sessionId: this.sessionId,
            timestamp: Date.now(),
            duration: sessionDuration,
            eventsCount: this.events.length,
            currentSession: this.currentSession
        };

        this.saveEvent(eventData);
        this.sendToAnalytics('session_end', eventData);
    }

    // 通用事件跟踪
    trackEvent(eventName, data = {}) {
        const eventData = {
            type: 'custom_event',
            eventName: eventName,
            sessionId: this.sessionId,
            timestamp: Date.now(),
            data: data
        };

        this.saveEvent(eventData);
    }

    // 保存事件到本地存储
    saveEvent(eventData) {
        this.events.push(eventData);
        
        // 保存到 localStorage（作为备份）
        try {
            const existingEvents = JSON.parse(localStorage.getItem('typingAnalytics') || '[]');
            existingEvents.push(eventData);
            
            // 只保留最近1000条记录
            if (existingEvents.length > 1000) {
                existingEvents.splice(0, existingEvents.length - 1000);
            }
            
            localStorage.setItem('typingAnalytics', JSON.stringify(existingEvents));
        } catch (error) {
            console.log('保存事件到本地存储失败:', error);
        }
    }

    // 发送数据到分析服务
    sendToAnalytics(eventType, data) {
        // Google Analytics 4 事件跟踪
        if (typeof gtag !== 'undefined') {
            gtag('event', eventType, {
                custom_parameter_session_id: data.sessionId,
                custom_parameter_timestamp: data.timestamp,
                ...data
            });
        }

        // 发送到自定义分析服务（如果有）
        this.sendToCustomAnalytics(eventType, data);
    }

    // 发送到自定义分析服务
    async sendToCustomAnalytics(eventType, data) {
        // 这里可以发送到你自己的服务器
        // 示例：使用免费的统计服务
        try {
            // 可以使用 Google Sheets API、Airtable API 等免费服务
            // 或者发送到你自己的服务器
            
            // 示例：发送到 webhook
            const webhookUrl = 'YOUR_WEBHOOK_URL_HERE'; // 替换为实际的webhook地址
            
            if (webhookUrl !== 'YOUR_WEBHOOK_URL_HERE') {
                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        eventType: eventType,
                        data: data,
                        timestamp: new Date().toISOString()
                    })
                });
            }
        } catch (error) {
            console.log('发送到自定义分析服务失败:', error);
        }
    }

    // 获取统计报告
    getAnalyticsReport() {
        const events = JSON.parse(localStorage.getItem('typingAnalytics') || '[]');
        
        return {
            totalEvents: events.length,
            sessions: this.groupBy(events, 'sessionId'),
            eventTypes: this.countBy(events, 'type'),
            browsers: this.countBy(events.filter(e => e.type === 'user_info'), 'browserInfo.name'),
            devices: this.countBy(events.filter(e => e.type === 'user_info'), 'deviceType'),
            dictionaries: this.countBy(events.filter(e => e.dictionary), 'dictionary'),
            chapters: this.countBy(events.filter(e => e.chapter), 'chapter')
        };
    }

    // 辅助函数：按字段分组
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = this.getNestedValue(item, key);
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }

    // 辅助函数：按字段计数
    countBy(array, key) {
        return array.reduce((result, item) => {
            const value = this.getNestedValue(item, key);
            result[value] = (result[value] || 0) + 1;
            return result;
        }, {});
    }

    // 辅助函数：获取嵌套值
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }
}

// 初始化统计系统
const analytics = new TypingAnalytics();

// 暴露给全局使用
window.typingAnalytics = analytics;

// 为了方便使用，提供简化的接口
window.trackPracticeStart = (dict, chapter) => analytics.trackPracticeStart(dict, chapter);
window.trackWordComplete = (word, time, errors) => analytics.trackWordComplete(word, time, errors);
window.trackChapterComplete = (dict, chapter, time, words, accuracy) => analytics.trackChapterComplete(dict, chapter, time, words, accuracy);
window.trackSpeechUsage = (action, word) => analytics.trackSpeechUsage(action, word);
window.trackSettingChange = (setting, value) => analytics.trackSettingChange(setting, value);

console.log('📊 打字练习统计系统已加载完成');
