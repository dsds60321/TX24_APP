import Suggest from "./suggest.js";
/**
 * 공통 레이아웃 JS
 * 모달 + 오버레이 + 탭
 */
export default class Layout {
    constructor() {
        // 하위 페이지 탭 매니저
        this.TabManager = this.createTabManager();
        this.Overlay = this.overlay();
        this.loadingOverlay = null;
        this.loadingMessageElem = null;
        this.init();
        this.SuggestManager = new Suggest();
    }

    init() {
        this.bindEvents();
        this.mobileSize();
        this.TabManager.init();
        this.Overlay.init();
    }

    bindEvents() {
        this.menuToggle(); // 메뉴 사이드바 이벤트
        this.sideNaviToggle(); // 네비게이션 이벤트
        this.bindSelectToInput();  // select
        this.bindEmailFocus(); // 이메일 focus
        this.bindCardEdit(); // edit 수정버튼 클릭 이벤트
        this.bindModalLoader(); // 모달 이벤트
        this.blockBrowserEvt(); // 브라우저 동작 제어 이벤트
        this.simpleSelectEvt(); // select 이벤트
    }

    // 탭 함수
    showTab(root = document) {
        const tabAllButtons = root.querySelectorAll('.tab-button');

        tabAllButtons.forEach(elem => {

            elem.addEventListener('click', function ({target}) {
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
        sideMenuToggle.addEventListener('click', function () {
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

        document.querySelector('.close_sidebar').addEventListener('click', function () {
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
        root.querySelectorAll('[data-bs-toggle="collapse"]').forEach(function (toggle) {
            if (toggle.dataset.boundCollapseIcon === 'true') {
                return;
            }
            toggle.dataset.boundCollapseIcon = 'true';
            toggle.addEventListener('click', function () {
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
        root.querySelectorAll('.select-to-input').forEach(function (select) {
            if (select.dataset.boundSelectToInput === 'true') {
                return;
            }
            select.dataset.boundSelectToInput = 'true';
            select.addEventListener('change', function () {
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
        root.querySelectorAll('.email').forEach(function (container) {
            if (container.dataset.boundEmail === 'true') {
                return;
            }
            container.dataset.boundEmail = 'true';
            const textInputs = container.querySelectorAll('input');
            textInputs.forEach(function (input) {
                input.addEventListener('focus', function () {
                    container.classList.add('on');
                });
                input.addEventListener('blur', function () {
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
        const submitBtn = button.closest('div').querySelector('.flex-submit');

        if (!wrapper) {
            return;
        }
        // TODO edit 접으면 기본값으로 돌아가는게 필요할듯

        if (wrapper.classList.contains('edit')) {
            wrapper.classList.remove('edit');
            submitBtn ? submitBtn.classList.add('none') : '';
            this.resetData(wrapper);
        } else {
            wrapper.classList.add('edit');
            submitBtn ? submitBtn.classList.remove('none') : '';
        }

    }

    resetData(wrapper) {
        wrapper.querySelectorAll('input, select').forEach(elem => {
            const originElem = elem.closest('.card-txt')?.querySelector('.value');
            if (!originElem) return;

            const originValue = originElem.textContent?.trim() ?? '';

            switch (elem.tagName) {
                case 'INPUT':
                    elem.value = originValue;
                    break;

                case 'SELECT':
                    const matched = Array.from(elem.options)
                        .find(opt => opt.textContent.trim() === originValue);

                    if (matched) elem.value = matched.value;
                    break;
            }
        });
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

        modals.forEach(function (modal) {
            if (modal.dataset.boundModalAjax === 'true') {
                return;
            }
            modal.dataset.boundModalAjax = 'true';

            modal.addEventListener('show.bs.modal', function (event) {
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
                layout.loadModalContent(requestUrl).then(function (html) {
                    const content = html || layout.buildModalError();
                    layout.renderHtmlWithScripts(modalContent, content, {
                        rebindRoot: modal,
                        enableDatepicker: true,
                        afterRender: function () {
                            layout.syncModalLabel(modal);
                        }
                    });
                }).catch(function (error) {
                    layout.renderHtmlWithScripts(modalContent, layout.buildModalError(error), {
                        rebindRoot: modal
                    });
                });
            });

            modal.addEventListener('hidden.bs.modal', function () {
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
        if (!(button instanceof HTMLElement)) {
            return;
        }

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
        }).then(function (response) {
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
        params.forEach(function (value, key) {
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

    simpleSelectEvt() {
        document.querySelectorAll('.simple-select').forEach(function (select) {
            const trigger = select.querySelector('.simple-select-trigger');
            const options = select.querySelector('.simple-select-options');
            const label   = select.querySelector('.selected-label');
            const hidden  = select.querySelector('input[type="hidden"]');

            trigger.addEventListener('click', function () {
                options.classList.toggle('show');
            });

            options.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', () => {
                    select.querySelectorAll('li').forEach(l => l.classList.remove('active'));
                    li.classList.add('active');

                    label.textContent = li.textContent;
                    if (hidden) {
                        hidden.value = li.dataset.value;
                    }

                    options.classList.remove('show');
                });
            });

            document.addEventListener('click', (e) => {
                if (!select.contains(e.target)) options.classList.remove('show');
            });
        })
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
        this.showTab(root);
        this.simpleSelectEvt();
        this.renderSuggest();
    }

    renderHtmlWithScripts(targetElem, html, options = {}) {
        if (!targetElem) {
            return;
        }

        const template = document.createElement('template');
        template.innerHTML = html || '';

        const fragment = template.content.cloneNode(true);
        const scripts = Array.from(fragment.querySelectorAll('script'));
        scripts.forEach(function (script) {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });

        targetElem.innerHTML = '';
        targetElem.appendChild(fragment);

        const {
            rebindRoot = targetElem,
            enableDatepicker = false,
            afterRender = null
        } = options;

        if (rebindRoot) {
            this.rebindDynamic(rebindRoot);
        }

        scripts.forEach(function (script) {
            const cloned = document.createElement('script');
            Array.from(script.attributes).forEach(function (attr) {
                cloned.setAttribute(attr.name, attr.value);
            });
            if (script.textContent) {
                cloned.textContent = script.textContent;
            }
            targetElem.appendChild(cloned);
        });

        if (enableDatepicker) {
            this.datepickerRender();
        }

        if (typeof afterRender === 'function') {
            afterRender();
        }
    }

    // suggest 렌더링
    renderSuggest() {
        const suggestElems = document.querySelectorAll('.client-suggest-panel');
        if (!suggestElems || suggestElems.length === 0) {
            return;
        }

        suggestElems.forEach(elem => {
            const originInput = elem.closest('.search-group').querySelector('input')
            originInput.addEventListener('input', (elem) => this.SuggestManager.render(elem))
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.client-suggest-panel')) {
                suggestElems.forEach((elem) => elem.classList.remove('active'));
            }
        })
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

        // 뒤로 가기 클릭시 탭 생성 -> # 버튼 클릭시 열리는 문제 있음
        history.pushState(null, '', location.href);
        window.onpopstate = function () {
            history.pushState(null, '', location.href);
            layout.Overlay.tabOpen();
        };


        // 오버레이 닫기 버튼
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                layout.Overlay.close();
            }
        });
    }

    datepickerRender() {
        console.log('datepickerRender datepickerRender')
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
                        if (elem) {
                            console.log('elem', elem)
                            if (picker.range) {
                                console.log('date', date)
                                console.log(elem.value)
                                console.log(util.dateUtil.toString(date[0]))
                                if (date.length < 2) {
                                    elem.value = util.dateUtil.toString(date[0]) + ' - ' + util.dateUtil.toString(date[0]);
                                } else {
                                    elem.value = util.dateUtil.toString(date[0]) + ' - ' + util.dateUtil.toString(date[1]);
                                }
                            } else {
                                if (formattedDate) {
                                    elem.value = formattedDate + " - " + formattedDate;
                                }
                            }

                            search.addTag(elem);
                            if (date.length > 1) {
                                inst.hide();
                            }
                        }
                    }
                };
            }

            $(elem).datepicker(pickerOption);


            // 기본값
            switch (picker.default) {
                case "today" :
                    val = util.dateUtil.getNowDate(picker.separator);
                    break;

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
            if (type === "picker") {
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


    /*
     * 페이지 히스토리
     */
    createTabManager() {
        let contentArea = null;
        const state = {
            tabs: new Map(),
            activeUrl: null,
            refererUrl: null,
            cache: new Map(),
            images: new Map()
        }

        function getState() {
            return state;
        }

        function init() {
            contentArea = document.getElementById('main-content-area');

            if (!contentArea) {
                return;
            }

            document.addEventListener('click', onTriggerClick);
        }

        /**
         * NOTE : NavLink 혹은 , 탭 선택시 open 함수
         * title : 탭 제목
         * url : 탭 유니크 아이디
         * referer : 네비게이션 탭 설정값
         * options : { activeTab : 탭 등록 여부 , referer : Nav 찾기 위한 URL}
         */
        function open(param) {
            let title;
            let url;
            let options = {};

            // 1) HTML 엘리먼트로 들어온 경우: <button onclick="open(this)" ...>
            if (param instanceof HTMLElement) {
                const ds = param.dataset || {};

                // data-title, data-url
                title = ds.title;
                url = ds.url;

                // 나머지 data-* 들은 options로 사용 (title, url 제외)
                const { title: _t, url: _u, ...rest } = ds;
                options = { ...rest };
            }
            // 2) 기존처럼 객체로 들어온 경우: open({ title, url, options })
            else {
                const cfg = param || {};
                ({ title, url, options = {} } = cfg);
            }

            // 기본 옵션 병합 (기존 로직 유지)
            options = { activeTab: true, ...options };

            console.log('open', title, url, options);

            if (!title && !url) {
                return;
            }

            if (options.referer) {
                state.refererUrl = options.referer;
            }

            const tab = {
                title: title,
                url: url,
            };

            if (options.activeTab) {
                state.tabs.set(url, tab);
                state.activeUrl = url;
            }

            try {
                activate(url, { skipNavSync: true });
            } finally {
                // 콘텐츠 로딩 결과와 관계없이 UI 상태는 항상 동기화
                toggleNav(url);
            }
        }

		function activate(tabUrl, options = {}) {
			const {skipNavSync = false} = options;

			layout.Overlay.close();

			if (!skipNavSync) {
				toggleNav(tabUrl);
			}

			// if (!state.tabs.has(tabUrl)) {
			// 	return;
			// }

            state.activeUrl = tabUrl;

            if (state.tabs.has(tabUrl) && state.cache.get(tabUrl)) {
                const cached = state.cache.get(tabUrl); // 이미 가지고 있는 페이지인 경우
                if (cached) {
                    renderContent(cached);
                    return;
                }
            }


            loadContent(tabUrl);
        }

        function onTriggerClick(event) {

            // submit , href 등 이벤트 발생 안됨
            if (event.target.closest('.nav-link')) {
                event.preventDefault();
            }

            // tab생성에 필요한 데이터
            const linkElem = event.target.closest('.nav-link');
            if (!linkElem) {
                return;
            }

            const {tabUrl, tabTitle} = linkElem.dataset;
            if (!tabUrl || !tabTitle) {
                return;
            }

            open({
                title: tabTitle,
                url: tabUrl,
            });
        }


        function renderContent(html) {
            if (!contentArea) {
                return;
            }

            layout.renderHtmlWithScripts(contentArea, html, {
                enableDatepicker: true,
                afterRender: function () {
                    capturePage(state.activeUrl);
                }
            });
        }


        function loadContent(url) {
            const tab = state.tabs.get(url);
            httpClient.get(url)
                .then(({data}) => {
                    state.cache.set(url, data);
                    renderContent(data);
                })
                .catch(error => {
                    console.error('loadContent ERROR ', error)
                    util.toastify.warning('컨텐츠를 불러오는데 실패했습니다.');
                    state.tabs.delete(url);
                    renderError(url);
                });
        }

        function renderError(id, message) {
            if (!contentArea) {
                return;
            }
            const errorText = message || '컨텐츠를 불러오는 데 실패했습니다.';
            contentArea.innerHTML = '' +
                '<div class="tab-feedback error">' +
                '<p>' + errorText + '</p>' +
                '<button type="button" class="btn btn-blue tab-retry-btn" data-tab-retry="' + id + '">다시 시도</button>' +
                '</div>';
        }

        function capturePage(url) {
            html2canvas(contentArea, {
                backgroundColor: '#F1F2F4',
                scale: 1.5,
                logging: false,
                useCORS: true,
                allowTaint: true
            }).then(canvas => {
                const imageData = canvas.toDataURL('image/png', 0.95);
                state.images.set(url, imageData);
            }).catch(err => {
                console.error('캡처 실패:', err);
            });
        }

        function deleteApp(elem) {
            const card = elem.closest('.app-card');
            const url = card.dataset.url;

            if (!card && !url) {
                return;
            }

            if (state.tabs.size === 1) {
                util.toastify.info('최소 1개에 페이지는 남겨두어야 합니다.');
                return;
            }

            if (state.tabs.has(url)) {
                state.tabs.delete(url);
                state.cache.delete(url);
                state.images.delete(url);
                card.remove();
            }

        }

        function toggleNav(url) {
            // 네비게이션 설정
            document.querySelectorAll('.nav-wrapper .nav-link').forEach(function (link) {
                link.classList.remove('active');
            });

            document.querySelectorAll('.nav-wrapper .collapse').forEach(function (collapse) {
                collapse.classList.remove('show');
            });


            let selectTab = document.querySelector(`[data-tab-url="${url}"]`);
            if (!selectTab && state.refererUrl) {
                selectTab = document.querySelector(`[data-tab-url="${state.refererUrl}"]`);

                // 이전 URL 초기화
                state.refererUrl = null;
            }

            if (selectTab) {
                selectTab.classList.add('active');
                selectTab.closest('.collapse').classList.add('show');
            }
        }


        return {
            init,
            open,
            activate,
            getState,
            deleteApp
        }
    }


    /**
     * overlay 함수
     */
    overlay() {
        let overlayLayer = null;

        function init() {
            overlayLayer = document.getElementById('launcherModal');
        }

        function open() {
            if (!overlayLayer) return;
            overlayLayer.classList.add('active');
        }

        function close() {
            if (!overlayLayer) return;
            overlayLayer.classList.remove('active');
        }

        function loading(isLoading, message = 'Loading...') {
            if (!overlayLayer) return;
            if (isLoading) {
                open();
                overlayLayer.classList.add('loading');
                // TODO css 및 html 추가 필요
            } else {
                overlayLayer.classList.remove('loading');
                close();
            }
        }


        function renderContent(content) {
            if (!overlayLayer) return;
            overlayLayer.innerHTML = content;
        }


        function tabOpen() {
            open();
            renderTabHeader();
            renderTabContent();
        }


        function renderTabHeader() {
            overlayLayer.innerHTML = `<div class="launcher-content">
               <button class="close-launcher" onClick="layout.Overlay.close()">×</button>
               <div class="launcher-header-section">
                   <h1 class="launcher-title">Apps History</h1>
                   <p class="launcher-subtitle">방문한 페이지를 선택하여 빠르게 이동하세요</p>
                   <button class="clear-all-btn" onClick="" id="clearAllBtn"
                           style="display: none;">
                       🗑️ 전체 기록 삭제
                   </button>
               </div>`;
        }

        function renderTabContent() {
            const {tabs, images} = layout.TabManager.getState();
            document.querySelector('.launcher-content')
                .insertAdjacentHTML('beforeend', `
                  <div class="apps-grid" id="appsGrid">
                    ${renderTab()}
                  </div>
                `);
        }

        function renderTab() {
            const {tabs, images} = layout.TabManager.getState();

            if (tabs.size === 0) {
                return `
                      <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <div class="empty-state-title">아직 방문한 페이지가 없습니다</div>
                        <div class="empty-state-text">사이드바 메뉴에서 페이지를 방문해보세요!</div>
                      </div>
                    `;
            }

            return [...tabs].map(([url, {title}]) => {
                const image = images.get(url) || "";
                return `
                      <div class="app-card" data-url="${url}" onclick="layout.TabManager.activate('${url}')">
                        <button class="delete-app-btn" onclick="event.stopPropagation(); layout.TabManager.deleteApp(this);">×</button>
                        <div class="app-title">${title}</div>
                        <div class="app-preview"><img src='${image}' alt='${title}'></div>
                      </div>
                    `;
            }).join('');
        }

        function isOpen() {
            return overlayLayer?.classList.contains('active') ?? false;
        }


        return {
            init, open, close, tabOpen, renderContent, isOpen, loading
        }
    }



    // 공통적으로 사용되는 화면 응답
    /**
     * 주소지, 대표자, 계좌...
     */
    async commonRender() {
        for (const elem of document.querySelectorAll('.common-render')) {
            const {url, id, target} = elem.dataset;
            if (!url  || !target) {
                console.warn('렌더링에 필요한 값이 비어있습니다. ', elem);
                continue;
            }

            let targetElem = document.getElementById(target);

            if (!targetElem) {
                console.warn('렌더링할 대상이 없습니다.', target);
                continue;
            }


            await httpClient.get(elem.dataset.url)
                .then(({data}) => {
                    targetElem.innerHTML = data;
                })
                .catch(error => {
                    console.error('commonRender ERROR ', error)
                });
        }
    }
}
