export default class SessionManager {
    constructor(options = {}) {
        this.layout = options.layout || window.layout;
        this.rootElement = options.rootElement || null;
        this.infoUrl = options.infoUrl || null;
        this.extendUrl = options.extendUrl || null;
        this.displaySelector = options.displaySelector || '[data-session-remaining]';
        this.warningThresholdSeconds = Number(options.warningThresholdSeconds) || 180;

        this.remainingSeconds = null;
        this.countdownTimerId = null;
        this.overlayShown = false;
        this.overlayContentSelector = '[data-session-overlay]';
        this.overlayCountdownSelector = '[data-session-overlay-remaining]';
        this.isFetching = false;
    }

    init() {
        if (!this.rootElement) {
            this.rootElement = document.querySelector('[data-session-info-url]');
        }
        if (!this.rootElement) {
            return;
        }
        this.infoUrl = this.rootElement.dataset.sessionInfoUrl || this.infoUrl;
        this.extendUrl = this.rootElement.dataset.sessionExtendUrl || this.extendUrl;

        const threshold = Number(this.rootElement.dataset.sessionWarningThreshold);
        if (!Number.isNaN(threshold) && threshold > 0) {
            this.warningThresholdSeconds = threshold;
        }

        this.displayElement = this.rootElement.querySelector('[data-session-remaining]');
        if (!this.displayElement && this.displaySelector) {
            this.displayElement = document.querySelector(this.displaySelector);
        }

        if (!this.infoUrl || !this.displayElement) {
            return;
        }

        this.fetchSessionInfo();
    }

    async fetchSessionInfo() {
        if (this.isFetching) {
            return;
        }
        this.isFetching = true;
        try {
            const response = await this.request('get', this.infoUrl);
            const data = response?.data ?? response;
            const seconds = this.extractRemainingSeconds(data);

            if (seconds !== null && seconds !== undefined) {
                this.setRemainingSeconds(seconds);
            }
        } catch (error) {
            console.error('[SessionManager] 세션 정보를 가져오지 못했습니다.', error);
        } finally {
            this.isFetching = false;
        }
    }

    extractRemainingSeconds(data) {
        if (!data) {
            return null;
        }

        if (typeof data.remainingSeconds === 'number') {
            return Math.max(0, Math.floor(data.remainingSeconds));
        }

        if (typeof data.expiresAt === 'string') {
            const expires = new Date(data.expiresAt).getTime();
            if (!Number.isNaN(expires)) {
                const now = Date.now();
                return Math.max(0, Math.floor((expires - now) / 1000));
            }
        }

        return null;
    }

    setRemainingSeconds(seconds) {
        if (!Number.isFinite(seconds)) {
            return;
        }
        this.remainingSeconds = Math.max(0, Math.floor(seconds));
        this.updateDisplay();
        this.ensureCountdown();
    }

    ensureCountdown() {
        if (this.countdownTimerId) {
            return;
        }

        this.countdownTimerId = window.setInterval(() => {
            if (typeof this.remainingSeconds !== 'number') {
                return;
            }

            this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);
            this.updateDisplay();

            if (this.remainingSeconds <= 0) {
                this.handleSessionExpired();
            } else if (this.remainingSeconds <= this.warningThresholdSeconds) {
                this.promptExtension();
            }
        }, 1000);
    }

    updateDisplay() {
        if (!this.displayElement) {
            return;
        }
        const formatted = this.formatSeconds(this.remainingSeconds);
        this.displayElement.textContent = formatted;

        if (this.overlayShown) {
            const overlayLayer = this.getOverlayLayer();
            if (overlayLayer) {
                const overlayCountdown = overlayLayer.querySelector(this.overlayCountdownSelector);
                if (overlayCountdown) {
                    overlayCountdown.textContent = formatted;
                }
            }
        }
    }

    formatSeconds(totalSeconds) {
        if (!Number.isFinite(totalSeconds)) {
            return '--:--';
        }
        const seconds = Math.max(0, totalSeconds);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return [hours, minutes, secs].map(v => String(v).padStart(2, '0')).join(':');
        }
        return [minutes, secs].map(v => String(v).padStart(2, '0')).join(':');
    }

    promptExtension() {
        if (this.overlayShown) {
            return;
        }
        this.overlayShown = true;
        this.renderExtensionOverlay();
    }

    renderExtensionOverlay() {
        const overlayLayer = this.getOverlayLayer();
        const overlayMarkup = this.buildOverlayMarkup();

        if (overlayLayer && this.layout && this.layout.Overlay && typeof this.layout.Overlay.renderContent === 'function') {
            this.layout.Overlay.open();
            this.layout.Overlay.renderContent(overlayMarkup);
            this.bindOverlayEvents(overlayLayer);
        } else {
            const fallback = this.ensureFallbackOverlay();
            fallback.innerHTML = overlayMarkup;
            fallback.classList.add('session-overlay-active');
            this.bindOverlayEvents(fallback);
        }

        this.updateDisplay();
    }

    buildOverlayMarkup() {
        const remaining = this.formatSeconds(this.remainingSeconds);
        return `
            <div class="session-extension" data-session-overlay>
                <button type="button" class="session-extension__close" aria-label="닫기">
                    <span aria-hidden="true">×</span>
                </button>
                <h2 class="session-extension__title">화면 보호</h2>
                <p class="session-extension__message">세션 만료까지 <strong data-session-overlay-remaining>${remaining}</strong> 남았습니다.</p>
                <form class="session-extension__form" novalidate>
                    <label for="sessionExtendPassword" class="session-extension__label">비밀번호</label>
                    <input type="password" id="sessionExtendPassword" class="session-extension__input" placeholder="비밀번호를 입력하세요" autocomplete="current-password" required />
                    <p class="session-extension__error" role="alert" hidden></p>
                    <button type="submit" class="session-extension__submit">세션 연장</button>
                </form>
            </div>
        `;
    }

    bindOverlayEvents(layer) {
        if (!layer) {
            return;
        }
        const container = layer.querySelector(this.overlayContentSelector);
        if (!container) {
            return;
        }
        const form = container.querySelector('form');
        const passwordInput = container.querySelector('#sessionExtendPassword');
        const errorElem = container.querySelector('.session-extension__error');
        const closeButton = container.querySelector('.session-extension__close');

        if (form) {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                if (!passwordInput) {
                    return;
                }
                const password = passwordInput.value.trim();
                if (!password) {
                    this.showOverlayError(errorElem, '비밀번호를 입력해주세요.');
                    passwordInput.focus();
                    return;
                }
                this.extendSession(password, { passwordInput, errorElem, submitButton: form.querySelector('.session-extension__submit') });
            }, { once: false });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => this.hideOverlay());
        }

        if (passwordInput) {
            passwordInput.focus();
        }
    }

    async extendSession(password, controls = {}) {
        if (!this.extendUrl) {
            return;
        }

        const submitButton = controls.submitButton;
        const passwordInput = controls.passwordInput;
        const errorElem = controls.errorElem;

        this.setSubmittingState(true, { submitButton, passwordInput });
        this.showOverlayError(errorElem, '', true);

        try {
            const response = await this.request('post', this.extendUrl, { password });
            const data = response?.data ?? response;
            let seconds = this.extractRemainingSeconds(data);

            if (seconds === null || seconds === undefined) {
                await this.fetchSessionInfo();
                seconds = this.remainingSeconds;
            } else {
                this.setRemainingSeconds(seconds);
            }

            this.hideOverlay();
            this.overlayShown = false;
            if (passwordInput) {
                passwordInput.value = '';
            }
        } catch (error) {
            const message = this.resolveErrorMessage(error) || '세션 연장에 실패했습니다. 다시 시도해주세요.';
            this.showOverlayError(errorElem, message);
        } finally {
            this.setSubmittingState(false, { submitButton, passwordInput });
        }
    }

    handleSessionExpired() {
        this.clearCountdown();
        this.updateDisplay();
        this.showSessionExpiredMessage();
    }

    showSessionExpiredMessage() {
        const overlayLayer = this.getOverlayLayer();
        const markup = `
            <div class="session-extension session-extension--expired" data-session-overlay>
                <h2 class="session-extension__title">세션이 만료되었습니다</h2>
                <p class="session-extension__message">다시 로그인 후 이용해주세요.</p>
                <button type="button" class="session-extension__submit" data-session-expired-reload>로그인 페이지로 이동</button>
            </div>
        `;

        if (overlayLayer && this.layout && this.layout.Overlay && typeof this.layout.Overlay.renderContent === 'function') {
            this.layout.Overlay.open();
            this.layout.Overlay.renderContent(markup);
            const reloadBtn = overlayLayer.querySelector('[data-session-expired-reload]');
            if (reloadBtn) {
                reloadBtn.addEventListener('click', () => window.location.reload());
            }
        } else {
            const fallback = this.ensureFallbackOverlay();
            fallback.innerHTML = markup;
            fallback.classList.add('session-overlay-active');
            const reloadBtn = fallback.querySelector('[data-session-expired-reload]');
            if (reloadBtn) {
                reloadBtn.addEventListener('click', () => window.location.reload());
            }
        }
    }

    hideOverlay() {
        const overlayLayer = this.getOverlayLayer();
        if (overlayLayer && this.layout && this.layout.Overlay) {
            this.layout.Overlay.close();
        } else {
            const fallback = document.getElementById('sessionExtensionFallback');
            if (fallback) {
                fallback.classList.remove('session-overlay-active');
                fallback.innerHTML = '';
            }
        }
        this.overlayShown = false;
    }

    setSubmittingState(isSubmitting, controls = {}) {
        const { submitButton, passwordInput } = controls;
        if (submitButton) {
            submitButton.disabled = isSubmitting;
            submitButton.textContent = isSubmitting ? '처리 중...' : '세션 연장';
        }
        if (passwordInput) {
            passwordInput.disabled = isSubmitting;
        }
    }

    showOverlayError(elem, message, hide = false) {
        if (!elem) {
            return;
        }
        if (hide || !message) {
            elem.hidden = true;
            elem.textContent = '';
        } else {
            elem.hidden = false;
            elem.textContent = message;
        }
    }

    ensureFallbackOverlay() {
        let fallback = document.getElementById('sessionExtensionFallback');
        if (!fallback) {
            fallback = document.createElement('div');
            fallback.id = 'sessionExtensionFallback';
            fallback.className = 'session-extension-fallback';
            document.body.appendChild(fallback);
        }
        return fallback;
    }

    getOverlayLayer() {
        return document.getElementById('launcherModal');
    }

    clearCountdown() {
        if (this.countdownTimerId) {
            window.clearInterval(this.countdownTimerId);
            this.countdownTimerId = null;
        }
    }

    async request(method, url, data) {
        if (window.axios) {
            return window.axios({ method, url, data, withCredentials: true });
        }

        const options = {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        };

        if (data && options.method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Request failed with status ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const json = await response.json();
            return { data: json };
        }
        return { data: null };
    }

    resolveErrorMessage(error) {
        if (!error) {
            return '';
        }
        if (error.response && error.response.data) {
            const respData = error.response.data;
            if (typeof respData === 'string') {
                return respData;
            }
            if (respData && typeof respData.message === 'string') {
                return respData.message;
            }
        }
        if (error.message) {
            return error.message;
        }
        return '';
    }
}
