/**
 * 공통 레이아웃 JS
 */
export default class Layout {
    constructor() {
        this.loadingOverlay = null;
        this.loadingMessageElem = null;
        this.appsState = this.createAppsState();
        this.currentView = null;
        this.currentDescriptor = null;
        this.appsOverlay = null;
        this.appsGrid = null;
        this.appsClearButton = null;
        this.appsCloseButton = null;
        this.handleAppsOverlayKeyDown = this.handleAppsOverlayKeyDown.bind(this);
        this.init();
        window.apps = () => this.openTab(true);
    }

    init() {
        this.bindEvents();
        this.mobileSize();
        this.initAppsOverlay();
        this.bindAppLaunchers();
        this.restoreSavedApps();
    }

    bindEvents() {
        // menuToggle
        this.menuToggle();
        this.sideNaviToggle();
        this.bindSelectToInput();
        this.bindEmailFocus();
        this.bindCardEdit();
        this.bindModalLoader();
        // this.blockBrowserEvt();
    }

    // 탭 함수
    showTab(root = document) {
        const tabAllButtons = root.querySelectorAll('.tab-button');

        tabAllButtons.forEach(elem => {

            elem.addEventListener('click', function({target}) {
                var nav = target.closest('.nav-box');
                const tabId = target.dataset.tabTarget;
                if (!tabId) return;

                const buttons = nav.querySelectorAll('.tab-button');
                const panes = nav.querySelectorAll('.tab-pane');

                // tab 활성화
                buttons.forEach(btn => btn.classList.remove('active'));
                elem.classList.add('active');

                // content 활성화
                panes.forEach(pane => pane.classList.remove('active'));
                Array.from(panes).filter(pane => pane.id === tabId).forEach(pane => pane.classList.add('active'));
            });
        })
    }

    menuToggle() {
        const sideMenuToggle = document.querySelector('.btn-menu');
        if (!sideMenuToggle || sideMenuToggle.dataset.boundSidebarToggle === 'true') {
            return;
        }
        sideMenuToggle.dataset.boundSidebarToggle = 'true';
        sideMenuToggle.addEventListener('click', function() {
            const mainElement = document.querySelector('.main');
            if (!mainElement) {
                return;
            }
            if (mainElement.classList.contains('sidebarHide')) {
                mainElement.classList.remove('sidebarHide');
            } else {
                mainElement.classList.add('sidebarHide');
            }
        });

        document.querySelector('.close_sidebar').addEventListener('click', function() {
            const mainElement = document.querySelector('.main');
            mainElement.classList.add('sidebarHide');
        })

    }

    sideNaviToggle() {
        this.bindCollapseIconToggle(document);
    }

    bindCollapseIconToggle(root = document) {
        if (!root) {
            return;
        }
        root.querySelectorAll('[data-bs-toggle="collapse"]').forEach(function(toggle) {
            if (toggle.dataset.boundCollapseIcon === 'true') {
                return;
            }
            toggle.dataset.boundCollapseIcon = 'true';
            toggle.addEventListener('click', function() {
                const chevron = this.querySelector('.fa-caret-down');
                if (chevron) {
                    const nextRotation = chevron.style.transform === 'rotate(0deg)' ? 'rotate(-90deg)' : 'rotate(0deg)';
                    chevron.style.transform = nextRotation;
                    chevron.style.transition = 'transform 0.3s ease';
                }
            });
        });
    }

    // select -> input 이벤트
    bindSelectToInput(root = document) {
        if (!root) {
            return;
        }
        root.querySelectorAll('.select-to-input').forEach(function(select) {
            if (select.dataset.boundSelectToInput === 'true') {
                return;
            }
            select.dataset.boundSelectToInput = 'true';
            select.addEventListener('change', function() {
                const targetId = this.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                if (targetInput) {
                    targetInput.value = this.value;
                }
            });
        });
    }

    /**
     * email css
     */
    bindEmailFocus(root = document) {
        if (!root) {
            return;
        }
        root.querySelectorAll('.email').forEach(function(container) {
            if (container.dataset.boundEmail === 'true') {
                return;
            }
            container.dataset.boundEmail = 'true';
            const textInputs = container.querySelectorAll('input');
            textInputs.forEach(function(input) {
                input.addEventListener('focus', function() {
                    container.classList.add('on');
                });
                input.addEventListener('blur', function() {
                    container.classList.remove('on');
                });
            });
        });
    }

    bindCardEdit(root = document) {
        if (!root) {
            return;
        }
        root.querySelectorAll('.flex-edit').forEach((button) => {
            if (button.dataset.boundFlexEdit === 'true') {
                return;
            }
            button.dataset.boundFlexEdit = 'true';
            button.addEventListener('click', () => {
                this.toggleCardEdit(button);
            });
        });
    }

    toggleCardEdit(button) {
        const wrapper = button.closest('.card-wrapper');
        if (!wrapper) {
            return;
        }
        if (wrapper.classList.contains('edit')) {
            wrapper.classList.remove('edit');
        } else {
            wrapper.classList.add('edit');
        }
    }

    /**
     * 모달 관련 JS
     */
    bindModalLoader(root = document) {
        if (!root) {
            return;
        }

        const layout = this;
        const modals = root.querySelectorAll('.modal');

        modals.forEach(function(modal) {
            if (modal.dataset.boundModalAjax === 'true') {
                return;
            }
            modal.dataset.boundModalAjax = 'true';

            modal.addEventListener('show.bs.modal', function(event) {
                const trigger = event.relatedTarget;
                if (!trigger) {
                    return;
                }
                const requestUrl = trigger.getAttribute('data-modal-url');
                if (!requestUrl) {
                    return;
                }

                const modalContent = modal.querySelector('.modal-content');
                if (!modalContent) {
                    return;
                }

                modalContent.innerHTML = layout.buildModalLoading();
                layout.loadModalContent(requestUrl).then(function(html) {
                    modalContent.innerHTML = html;
                    layout.rebindDynamic(modal);
                    layout.syncModalLabel(modal);
                }).catch(function(error) {
                    modalContent.innerHTML = layout.buildModalError(error);
                });
            });

            modal.addEventListener('hidden.bs.modal', function() {
                const modalContent = modal.querySelector('.modal-content');
                if (!modalContent) {
                    return;
                }
                if (modal.dataset.keepContent === 'true') {
                    return;
                }
                modalContent.innerHTML = '';
            });
        });
    }

    /**
     * 전역 로딩 표시
     */
    ensureLoadingOverlay() {
        if (this.loadingOverlay && document.body.contains(this.loadingOverlay)) {
            return this.loadingOverlay;
        }

        const mainContent = document.querySelector('.main .main-content') || document.querySelector('.main');
        if (!mainContent) {
            return null;
        }

        const overlay = document.createElement('div');
        overlay.className = 'layout-loading-overlay';
        overlay.innerHTML = '<div class="layout-loading-content" role="status" aria-live="polite">' +
            '<div class="layout-loading-spinner" aria-hidden="true"></div>' +
            '<p class="layout-loading-text">로딩 중...</p>' +
            '</div>';

        mainContent.appendChild(overlay);

        this.loadingOverlay = overlay;
        this.loadingMessageElem = overlay.querySelector('.layout-loading-text');
        return overlay;
    }

    showLoading(message = '로딩 중입니다...') {
        const overlay = this.ensureLoadingOverlay();
        if (!overlay) {
            return;
        }
        if (this.loadingMessageElem) {
            this.loadingMessageElem.textContent = message;
        }
        overlay.classList.add('is-active');
    }

    hideLoading() {
        if (!this.loadingOverlay) {
            return;
        }
        this.loadingOverlay.classList.remove('is-active');
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            if (!button.dataset.prevDisabled) {
                button.dataset.prevDisabled = button.disabled ? 'true' : 'false';
            }
            button.classList.add('is-loading');
            button.disabled = true;
        } else {
            button.classList.remove('is-loading');
            const prev = button.dataset.prevDisabled;
            if (typeof prev !== 'undefined') {
                button.disabled = prev === 'true';
                delete button.dataset.prevDisabled;
            } else {
                button.disabled = false;
            }
        }
    }

    loadModalContent(url) {
        if (!url) {
            return Promise.reject(new Error('유효한 요청 경로가 없습니다.'));
        }
        return fetch(url, {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).then(function(response) {
            if (!response.ok) {
                const message = '모달 데이터를 불러오지 못했습니다. (' + response.status + ')';
                throw new Error(message);
            }
            return response.text();
        });
    }

    buildModalLoading() {
        return '<div class="modal-body py-5 text-center">' +
            '<div class="spinner-border text-primary" role="status" aria-hidden="true"></div>' +
            '<p class="mt-3 mb-0 text-muted">콘텐츠를 불러오는 중입니다...</p>' +
            '</div>';
    }

    buildModalError(error) {
        const message = error && error.message ? error.message : '잠시 후 다시 시도해 주세요.';
        return '<div class="modal-body py-4 text-center">' +
            '<i class="fa-solid fa-triangle-exclamation fa-2x text-danger mb-3" aria-hidden="true"></i>' +
            '<p class="mb-1">모달 콘텐츠를 가져오는 데 실패했습니다.</p>' +
            '<p class="text-muted small mb-0">' + message + '</p>' +
            '</div>';
    }

    buildModalUrl(baseUrl, trigger) {
        const url = new URL(baseUrl, window.location.origin);
        const params = this.collectModalParams(trigger);
        params.forEach(function(value, key) {
            url.searchParams.append(key, value);
        });
        return url.toString();
    }

    syncModalLabel(modal) {
        if (!modal) {
            return;
        }
        const labelId = modal.getAttribute('aria-labelledby');
        if (!labelId) {
            return;
        }
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) {
            return;
        }
        const title = modalContent.querySelector('.modal-title');
        if (!title) {
            return;
        }
        title.id = labelId;
    }

    mobileSize() {
        const mainElement = document.querySelector('.main');
        if (!mainElement) {
            return;
        }
        if (window.innerWidth <= 767) {
            mainElement.classList.add('sidebarHide');
        } else {
            mainElement.classList.remove('sidebarHide');
        }
    }

    /**
     * content 로드 후 이벤트 동작
     */
    rebindDynamic(root) {
        if (!root) {
            return;
        }
        this.bindCollapseIconToggle(root);
        this.bindSelectToInput(root);
        this.bindEmailFocus(root);
        this.bindCardEdit(root);
        this.bindModalLoader(root);
        this.bindAppLaunchers(root);
        this.showTab(root);
    }

    createAppsState() {
        return {
            storageKey: 'tx24:apps',
            maxItems: 12,
            items: []
        };
    }

    bindAppLaunchers(root = document) {
        if (!root) {
            return;
        }
        root.querySelectorAll('[data-tab-url]').forEach((trigger) => {
            if (trigger.dataset.boundAppLauncher === 'true') {
                return;
            }
            trigger.dataset.boundAppLauncher = 'true';
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                this.openAppFromTrigger(trigger);
            });
        });
    }

    openAppFromTrigger(trigger) {
        if (!trigger) {
            return;
        }
        const url = trigger.getAttribute('data-tab-url') || trigger.getAttribute('href');
        if (!url) {
            return;
        }
        const tabIdAttr = trigger.getAttribute('data-tab-id');
        const tabTitle = trigger.getAttribute('data-tab-title') || trigger.textContent.trim();
        const descriptor = {
            id: tabIdAttr || this.sanitizeId(url),
            title: tabTitle || '저장된 화면',
            url: url
        };

        document.querySelectorAll('.nav-link').forEach((link) => {
            if (link !== trigger) {
                link.classList.remove('active');
            }
        });
        trigger.classList.add('active');

        this.syncCurrentViewSnapshot();
        this.currentDescriptor = descriptor;
        this.loadAppContent(descriptor);
    }

    loadAppContent(descriptor) {
        if (!descriptor || !descriptor.url) {
            return;
        }

        if (typeof axios === 'undefined') {
            window.location.href = descriptor.url;
            return;
        }

        this.showLoading('화면을 불러오는 중입니다...');
        axios.get(descriptor.url, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).then((response) => {
            this.hideLoading();
            const html = response.data;
            const snapshot = {
                id: descriptor.id,
                title: descriptor.title,
                url: descriptor.url,
                html: ''
            };
            this.currentDescriptor = descriptor;
            this.currentView = snapshot;
            this.renderMainContent(html, { resetForms: true, source: 'server' });
            const hydratedHtml = this.getCurrentContentHTML();
            snapshot.html = hydratedHtml;
            const record = this.saveApp(snapshot);
            if (record) {
                this.currentView = record;
            }
        }).catch((error) => {
            this.hideLoading();
            const message = error && error.message ? error.message : '콘텐츠를 불러오지 못했습니다.';
            this.renderMainContent(this.buildAppError(message), { resetForms: false, source: 'error' });
        });
    }

    renderMainContent(html, options = {}) {
        const { resetForms = false } = options;
        const contentArea = document.getElementById('main-content-area');
        if (!contentArea) {
            return;
        }

        const template = document.createElement('template');
        template.innerHTML = html;

        const fragment = template.content.cloneNode(true);
        const scripts = Array.from(fragment.querySelectorAll('script'));
        scripts.forEach((script) => {
            script.parentNode.removeChild(script);
        });

        contentArea.innerHTML = '';
        contentArea.appendChild(fragment);
        if (resetForms) {
            contentArea.querySelectorAll('form').forEach((form) => {
                try {
                    form.reset();
                } catch (error) {
                    console.warn('폼 리셋 중 오류가 발생했습니다.', error);
                }
            });
        }
        this.rebindDynamic(contentArea);
        this.datepickerRender();

        scripts.forEach((script) => {
            const cloned = document.createElement('script');
            Array.from(script.attributes).forEach((attr) => {
                cloned.setAttribute(attr.name, attr.value);
            });
            if (script.textContent) {
                cloned.textContent = script.textContent;
            }
            contentArea.appendChild(cloned);
        });
    }

    buildAppError(message) {
        const safeMessage = message || '잠시 후 다시 시도해 주세요.';
        return '<div class="app-error-state" role="alert">' +
            '<div class="app-error-icon" aria-hidden="true"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
            '<div class="app-error-body">' +
            '<p class="app-error-title">콘텐츠를 가져오지 못했습니다.</p>' +
            '<p class="app-error-message">' + safeMessage + '</p>' +
            '</div>' +
            '</div>';
    }

    saveApp(app) {
        if (!app || !app.id) {
            return;
        }
        const items = this.appsState.items;
        const existingIndex = items.findIndex((item) => item.id === app.id);
        if (existingIndex !== -1) {
            items.splice(existingIndex, 1);
        }
        const record = {
            id: app.id,
            title: (app.title || '').trim() || '저장된 화면',
            url: app.url || '',
            html: app.html || '',
            savedAt: Date.now(),
            snapshotAt: Date.now()
        };
        items.unshift(record);

        if (items.length > this.appsState.maxItems) {
            items.length = this.appsState.maxItems;
        }

        this.persistApps();
        if (this.isAppsOverlayOpen()) {
            this.renderAppsOverlay();
        }
        this.currentView = record;
        return record;
    }

    removeSavedApp(appId) {
        if (!appId) {
            return;
        }
        this.appsState.items = this.appsState.items.filter((item) => item.id !== appId);
        this.persistApps();
        this.renderAppsOverlay();
        if (this.currentView && this.currentView.id === appId) {
            this.currentView = null;
        }
    }

    clearSavedApps() {
        this.appsState.items = [];
        this.persistApps();
        this.renderAppsOverlay();
        this.currentView = null;
    }

    activateSavedApp(appId) {
        if (!appId) {
            return;
        }
        const items = this.appsState.items;
        const index = items.findIndex((item) => item.id === appId);
        if (index === -1) {
            return null;
        }
        let app;
        if (index === 0) {
            app = items[0];
        } else {
            [app] = items.splice(index, 1);
            items.unshift(app);
        }
        this.persistApps();
        return app;
    }

    persistApps() {
        if (typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.setItem(this.appsState.storageKey, JSON.stringify(this.appsState.items));
        } catch (error) {
            console.warn('앱 정보를 저장하지 못했습니다.', error);
        }
    }

    restoreSavedApps() {
        if (typeof localStorage !== 'undefined') {
            try {
                const raw = localStorage.getItem(this.appsState.storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        this.appsState.items = parsed.slice(0, this.appsState.maxItems);
                    }
                }
            } catch (error) {
                console.warn('저장된 앱 정보를 불러오지 못했습니다.', error);
            }
        }
        this.renderAppsOverlay();
    }

    initAppsOverlay() {
        if (this.appsOverlay && document.body.contains(this.appsOverlay)) {
            return;
        }
        this.appsOverlay = document.getElementById('apps-overlay');
        if (!this.appsOverlay) {
            return;
        }
        this.appsGrid = this.appsOverlay.querySelector('[data-apps-grid]');
        this.appsClearButton = this.appsOverlay.querySelector('[data-apps-clear]');
        this.appsCloseButton = this.appsOverlay.querySelector('[data-apps-close]');

        if (!this.appsOverlay.dataset.boundAppsOverlay) {
            this.appsOverlay.dataset.boundAppsOverlay = 'true';
            this.appsOverlay.addEventListener('click', (event) => {
                if (event.target === this.appsOverlay) {
                    this.closeAppsOverlay();
                }
            });
        }

        if (this.appsClearButton && this.appsClearButton.dataset.boundAppsClear !== 'true') {
            this.appsClearButton.dataset.boundAppsClear = 'true';
            this.appsClearButton.addEventListener('click', () => {
                this.clearSavedApps();
            });
        }

        if (this.appsCloseButton && this.appsCloseButton.dataset.boundAppsClose !== 'true') {
            this.appsCloseButton.dataset.boundAppsClose = 'true';
            this.appsCloseButton.addEventListener('click', () => {
                this.closeAppsOverlay();
            });
        }
    }

    renderAppsOverlay() {
        if (!this.appsGrid) {
            return;
        }
        this.appsGrid.innerHTML = '';
        const { items, maxItems } = this.appsState;
        for (let index = 0; index < maxItems; index += 1) {
            const app = items[index];
            const tile = this.createAppTile(app, index);
            this.appsGrid.appendChild(tile);
        }
    }

    getSavedApp(appId) {
        if (!appId) {
            return null;
        }
        return this.appsState.items.find((item) => item.id === appId) || null;
    }

    updateSavedApp(appId, updater, { rerender = false } = {}) {
        if (!appId) {
            return null;
        }
        const items = this.appsState.items;
        const index = items.findIndex((item) => item.id === appId);
        if (index === -1) {
            return null;
        }
        const base = items[index];
        const next = typeof updater === 'function' ? updater({ ...base }) : { ...base, ...updater };
        items[index] = next;
        this.persistApps();
        if (rerender && this.isAppsOverlayOpen()) {
            this.renderAppsOverlay();
        }
        return next;
    }

    getCurrentContentHTML() {
        const contentArea = document.getElementById('main-content-area');
        if (!contentArea) {
            return '';
        }
        const clone = contentArea.cloneNode(true);
        const originalControls = contentArea.querySelectorAll('input, textarea, select');
        const cloneControls = clone.querySelectorAll('input, textarea, select');
        originalControls.forEach((control, index) => {
            const cloneControl = cloneControls[index];
            if (!cloneControl) {
                return;
            }
            if (control instanceof HTMLInputElement && cloneControl instanceof HTMLInputElement) {
                switch (control.type) {
                    case 'checkbox':
                    case 'radio':
                        cloneControl.checked = control.checked;
                        if (control.checked) {
                            cloneControl.setAttribute('checked', 'checked');
                        } else {
                            cloneControl.removeAttribute('checked');
                        }
                        break;
                    case 'file':
                        cloneControl.value = '';
                        cloneControl.removeAttribute('value');
                        break;
                    default:
                        cloneControl.value = control.value;
                        cloneControl.setAttribute('value', control.value);
                        break;
                }
            } else if (control instanceof HTMLTextAreaElement && cloneControl instanceof HTMLTextAreaElement) {
                cloneControl.value = control.value;
                cloneControl.textContent = control.value;
            } else if (control instanceof HTMLSelectElement && cloneControl instanceof HTMLSelectElement) {
                const options = cloneControl.options;
                Array.from(options).forEach((option, idx) => {
                    option.selected = control.options[idx] ? control.options[idx].selected : option.selected;
                    if (option.selected) {
                        option.setAttribute('selected', 'selected');
                    } else {
                        option.removeAttribute('selected');
                    }
                });
            }
        });

        clone.querySelectorAll('[data-skip-app-snapshot]').forEach((node) => node.remove());
        clone.querySelectorAll('script').forEach((node) => node.remove());
        return clone.innerHTML.trim();
    }

    syncCurrentViewSnapshot() {
        if (!this.currentView || !this.currentView.id) {
            return;
        }
        const html = this.getCurrentContentHTML();
        if (!html) {
            return;
        }
        this.currentView.html = html;
        const updated = this.updateSavedApp(this.currentView.id, { html, snapshotAt: Date.now() });
        if (updated) {
            this.currentView = updated;
        }
    }

    buildPreviewHTML(html) {
        if (!html) {
            return '<div class="apps-preview-empty">미리보기 없음</div>';
        }
        const template = document.createElement('template');
        template.innerHTML = html;
        template.content.querySelectorAll('script').forEach((node) => node.remove());
        const container = document.createElement('div');
        container.appendChild(template.content.cloneNode(true));
        const sanitized = container.innerHTML.trim();
        if (!sanitized) {
            return '<div class="apps-preview-empty">미리보기 없음</div>';
        }
        return '<div class="apps-preview-frame"><div class="apps-preview-content">' + sanitized + '</div></div>';
    }

    createAppTile(app, index) {
        const tile = document.createElement('div');
        tile.className = 'apps-tile' + (app ? ' is-filled' : ' is-empty');
        tile.setAttribute('data-app-slot', String(index + 1));

        const body = document.createElement('div');
        body.className = 'apps-tile-body';

        if (app) {
            tile.setAttribute('data-app-id', app.id);
            const preview = document.createElement('div');
            preview.className = 'apps-tile-preview';
            preview.innerHTML = this.buildPreviewHTML(app.html);
            this.schedulePreviewFit(preview);
            body.appendChild(preview);

            const footer = document.createElement('div');
            footer.className = 'apps-tile-footer';

            const title = document.createElement('span');
            title.className = 'apps-tile-title';
            title.textContent = app.title || '저장된 화면';

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'apps-tile-delete btn btn-sm btn-light';
            deleteButton.setAttribute('data-app-delete', app.id);
            deleteButton.setAttribute('aria-label', '저장된 화면 삭제');
            deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>';

            footer.appendChild(title);
            footer.appendChild(deleteButton);
            tile.appendChild(body);
            tile.appendChild(footer);

            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.removeSavedApp(app.id);
            });

            tile.addEventListener('click', () => {
                const activeApp = this.activateSavedApp(app.id) || app;
                if (activeApp) {
                    this.currentDescriptor = {
                        id: activeApp.id,
                        title: activeApp.title,
                        url: activeApp.url
                    };
                    this.currentView = { ...activeApp };
                    this.renderMainContent(activeApp.html || '', { resetForms: false, source: 'snapshot' });
                    const hydratedHtml = this.getCurrentContentHTML();
                    this.currentView.html = hydratedHtml;
                    this.updateSavedApp(activeApp.id, { html: hydratedHtml, snapshotAt: Date.now() });
                }
                this.closeAppsOverlay();
            });
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'apps-tile-placeholder';
            placeholder.innerHTML = '<span class="apps-slot-index">' + (index + 1) + '</span>' +
                '<span class="apps-slot-empty">저장된 화면이 없습니다.</span>';
            body.appendChild(placeholder);
            tile.appendChild(body);

            const footer = document.createElement('div');
            footer.className = 'apps-tile-footer';
            const title = document.createElement('span');
            title.className = 'apps-slot-empty-label';
            title.textContent = '빈 슬롯';
            footer.appendChild(title);
            tile.appendChild(footer);
        }

        return tile;
    }

    schedulePreviewFit(preview) {
        if (!preview) {
            return;
        }
        requestAnimationFrame(() => {
            this.fitPreview(preview);
        });
    }

    fitPreview(preview) {
        if (!preview) {
            return;
        }
        const frame = preview.querySelector('.apps-preview-frame');
        const content = frame ? frame.querySelector('.apps-preview-content') : null;
        if (!frame || !content) {
            return;
        }
        content.style.transform = 'scale(1)';
        content.style.margin = '0';
        const frameStyles = window.getComputedStyle(frame);
        const frameWidth = Math.max(
            0,
            frame.clientWidth - parseFloat(frameStyles.paddingLeft || '0') - parseFloat(frameStyles.paddingRight || '0')
        );
        const frameHeight = Math.max(
            0,
            frame.clientHeight - parseFloat(frameStyles.paddingTop || '0') - parseFloat(frameStyles.paddingBottom || '0')
        );
        const contentRect = content.getBoundingClientRect();
        const contentWidth = content.scrollWidth || contentRect.width;
        const contentHeight = content.scrollHeight || contentRect.height;
        if (!contentWidth || !contentHeight || !frameWidth || !frameHeight) {
            return;
        }
        const scale = Math.min(frameWidth / contentWidth, frameHeight / contentHeight, 1);
        const scaledWidth = contentWidth * scale;
        const scaledHeight = contentHeight * scale;
        const offsetX = Math.max(0, (frameWidth - scaledWidth) / 2);
        const offsetY = Math.max(0, (frameHeight - scaledHeight) / 2);
        const translateX = offsetX / scale;
        const translateY = offsetY / scale;
        content.style.transformOrigin = 'top left';
        content.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    handleAppsResize() {
        if (!this.isAppsOverlayOpen() || !this.appsGrid) {
            return;
        }
        this.appsGrid.querySelectorAll('.apps-tile-preview').forEach((preview) => this.fitPreview(preview));
    }

    openTab(force) {
        if (!this.appsOverlay) {
            return;
        }
        const shouldOpen = typeof force === 'boolean' ? force : !this.isAppsOverlayOpen();
        if (shouldOpen) {
            this.openAppsOverlay();
        } else {
            this.closeAppsOverlay();
        }
    }

    openAppsOverlay() {
        if (!this.appsOverlay) {
            return;
        }
        this.syncCurrentViewSnapshot();
        this.renderAppsOverlay();
        this.appsOverlay.classList.add('is-open');
        this.appsOverlay.setAttribute('aria-hidden', 'false');
        document.body.classList.add('apps-overlay-open');
        document.addEventListener('keydown', this.handleAppsOverlayKeyDown);
        window.addEventListener('resize', this.handleAppsResize);
        requestAnimationFrame(() => {
            if (!this.appsGrid) {
                return;
            }
            this.appsGrid.querySelectorAll('.apps-tile-preview').forEach((preview) => this.fitPreview(preview));
        });
    }

    closeAppsOverlay() {
        if (!this.appsOverlay) {
            return;
        }
        this.appsOverlay.classList.remove('is-open');
        this.appsOverlay.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('apps-overlay-open');
        document.removeEventListener('keydown', this.handleAppsOverlayKeyDown);
        window.removeEventListener('resize', this.handleAppsResize);
    }

    isAppsOverlayOpen() {
        return this.appsOverlay ? this.appsOverlay.classList.contains('is-open') : false;
    }

    handleAppsOverlayKeyDown(event) {
        if (event.key === 'Escape') {
            this.closeAppsOverlay();
        }
    }

    sanitizeId(value) {
        return (value || '').replace(/[^\w-]/g, '_');
    }


    blockBrowserEvt() {
        document.addEventListener('keydown', function (e) {
            if (
                e.key === 'F5' ||
                (e.ctrlKey && e.key === 'r') ||
                (e.metaKey && e.key === 'r')
            ) {
                e.preventDefault();
                alert('새로고침이 차단되어 있습니다.');
            }
        });

        // 마우스 오른쪽 버튼 새로고침 메뉴 방지 (일부 환경)
        window.addEventListener('beforeunload', function (e) {
            // 페이지 이탈 경고
            e.preventDefault();
            e.returnValue = '';
        });

        history.pushState(null, '', location.href);
        window.onpopstate = function () {
            history.pushState(null, '', location.href);
            alert('뒤로가기가 차단되어 있습니다.');
        };
    }

    datepickerRender() {
        document.querySelectorAll('.tx-datepicker').forEach((elem) => {
            const picker = layout.setOption(elem, "picker");
            let val;
            let pickerOption = {};

            const unit = picker.format === 'yyyy-mm' ? 'month' : 'days';
            if (unit === 'days') {
                pickerOption = {
                    dateFormat: picker.format,
                    multipleDatesSeparator: picker.separator,
                    range: picker.range,
                    onSelect: function (formattedDate, date, inst) {

                        /* search box Input처리 */
                        if(elem) {
                            console.log('elem', elem)
                            if(picker.range){
                                console.log('date', date)
                                console.log(elem.value)
                                console.log(util.dateUtil.toString(date[0]))
                                if(date.length < 2) {
                                    elem.value = util.dateUtil.toString(date[0]) + ' - ' + util.dateUtil.toString(date[0]);
                                } else {
                                    elem.value = util.dateUtil.toString(date[0]) + ' - ' + util.dateUtil.toString(date[1]);
                                }
                            }else{
                                if(formattedDate){
                                    elem.value = formattedDate +" - " + formattedDate;
                                }
                            }

                            search.addTag(elem);
                            if(date.length > 1) {inst.hide();}
                        }
                    }
                };
            }

            $(elem).datepicker(pickerOption);


            // 기본값
            switch (picker.default) {
                case "today" : val = util.dateUtil.getNowDate(picker.separator); break;

            }

            if (val) {
                elem.value = val;
                search.addTag(elem);
            }


        });
    }

    setOption(elem, type) {
        let option = {};
        if (elem) {
            if(type === "picker"){
                option['format'] = elem.dataset.format;
                option['separator'] = elem.dataset.separator;
                option['range'] = elem.dataset.range === 'Y';
                option['default'] = elem.dataset.default;
                // option['option'] = JSON.parse(elem.dataset.option);
            }
        }

        console.log(option)

        return option;
    }

}
