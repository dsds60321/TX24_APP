class Layout {
    constructor() {
        // 하위 페이지 탭 매니저
        this.TabManager = this.createTabManager();
        this.init();
    }

    init() {
        this.bindEvents();
        this.mobileSize();
        this.TabManager.init();
    }

    bindEvents() {
        // menuToggle
        this.menuToggle();
        this.sideNaviToggle();
        this.bindSelectToInput();
        this.bindEmailFocus();
        this.bindCardEdit();
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
        this.showTab(root);
    }

    createTabManager() {
        const layout = this;
        const state = {
            tabs: new Map(),
            order: [],
            activeId: null,
            cache: new Map(),
            initialContent: ''
        };

        let tabPanel = null;
        let tabBar = null;
        let contentArea = null;
        const hasAxios = typeof axios !== 'undefined';

        function init() {
            tabPanel = document.getElementById('bottom-tab-panel');
            tabBar = document.getElementById('bottom-tab-bar');
            contentArea = document.getElementById('main-content-area');

            if (!tabPanel || !tabBar || !contentArea) {
                return;
            }

            state.initialContent = contentArea.innerHTML;

            tabBar.addEventListener('click', onTabBarClick);
            contentArea.addEventListener('click', onContentAreaClick);
            document.addEventListener('click', onTriggerClick);
        }

        function open(descriptor) {
            if (!descriptor || !descriptor.id || !descriptor.url) {
                return;
            }

            if (state.tabs.has(descriptor.id)) {
                activate(descriptor.id);
                return;
            }

            const tab = {
                id: descriptor.id,
                title: (descriptor.title || '').trim() || '새 탭',
                url: descriptor.url
            };

            state.tabs.set(descriptor.id, tab);
            state.order.push(descriptor.id);
            state.activeId = descriptor.id;
            state.cache.delete(descriptor.id);

            renderTabs();
            if (hasAxios) {
                loadContent(descriptor.id);
            } else {
                renderError(descriptor.id, '데이터 연결이 활성화되어 있지 않습니다.');
            }
        }

        function activate(id) {
            if (!state.tabs.has(id)) {
                return;
            }
            state.activeId = id;
            renderTabs();
            const cached = state.cache.get(id);
            if (cached) {
                renderContent(cached);
                return;
            }
            if (hasAxios) {
                loadContent(id);
                return;
            }
            renderError(id, '데이터 연결이 활성화되어 있지 않습니다.');
        }

        function close(id) {
            if (!state.tabs.has(id)) {
                return;
            }

            state.tabs.delete(id);
            state.cache.delete(id);
            state.order = state.order.filter(function(tabId) {
                return tabId !== id;
            });

            const wasActive = state.activeId === id;
            if (wasActive) {
                state.activeId = state.order[state.order.length - 1] || null;
            }

            renderTabs();

            if (state.activeId) {
                activate(state.activeId);
            } else if (wasActive) {
                renderContent(state.initialContent);
            }
        }

        function refresh(id) {
            if (!state.tabs.has(id) || !hasAxios) {
                return;
            }
            state.cache.delete(id);
            if (state.activeId === id) {
                loadContent(id);
            }
        }

        function loadContent(id) {
            const tab = state.tabs.get(id);
            if (!tab) {
                return;
            }

            renderLoading();

            axios.get(tab.url, {
            }).then(function(response) {
                state.cache.set(id, response.data);
                if (state.activeId === id) {
                    renderContent(response.data);
                }
            }).catch(function() {
                if (state.activeId === id) {
                    renderError(id);
                }
            });
        }

        function renderTabs() {
            if (!tabBar) {
                return;
            }

            tabBar.innerHTML = '';

            state.order.forEach(function(id) {
                const tab = state.tabs.get(id);
                if (!tab) {
                    return;
                }

                const tabElement = document.createElement('div');
                tabElement.className = 'tab-item' + (state.activeId === id ? ' active' : '');
                tabElement.setAttribute('data-tab-id', id);
                tabElement.setAttribute('role', 'tab');
                tabElement.setAttribute('tabindex', '0');

                const title = document.createElement('span');
                title.className = 'tab-title';
                title.textContent = tab.title || '새 탭';

                const closeButton = document.createElement('button');
                closeButton.type = 'button';
                closeButton.className = 'tab-close';
                closeButton.setAttribute('data-tab-close', id);
                closeButton.setAttribute('aria-label', '탭 닫기');
                closeButton.innerHTML = '&times;';

                tabElement.appendChild(title);
                tabElement.appendChild(closeButton);

                tabElement.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        activate(id);
                    }
                });

                tabBar.appendChild(tabElement);
            });

            if (tabPanel) {
                if (state.order.length === 0) {
                    tabPanel.classList.add('is-empty');
                } else {
                    tabPanel.classList.remove('is-empty');
                }
            }
        }

        function renderContent(html) {
            if (!contentArea) {
                return;
            }

            const template = document.createElement('template');
            template.innerHTML = html;

            // JS 동적 로딩
            const fragment = template.content.cloneNode(true);
            const scripts = Array.from(fragment.querySelectorAll('script'));
            scripts.forEach(function(script) {
                script.parentNode.removeChild(script);
            });

            contentArea.innerHTML = '';
            contentArea.appendChild(fragment);
            layout.rebindDynamic(contentArea);

            scripts.forEach(function(script) {
                const cloned = document.createElement('script');
                Array.from(script.attributes).forEach(function(attr) {
                    cloned.setAttribute(attr.name, attr.value);
                });
                if (script.textContent) {
                    cloned.textContent = script.textContent;
                }
                contentArea.appendChild(cloned);
            });
        }

        function renderLoading() {
            if (!contentArea) {
                return;
            }
            contentArea.innerHTML = '<div class="tab-feedback loading">로딩 중...</div>';
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

        function onTabBarClick(event) {
            const closeTarget = event.target.closest('[data-tab-close]');
            if (closeTarget) {
                event.stopPropagation();
                const tabId = closeTarget.getAttribute('data-tab-close');
                close(tabId);
                return;
            }

            const tabTarget = event.target.closest('[data-tab-id]');
            if (tabTarget) {
                const tabId = tabTarget.getAttribute('data-tab-id');
                activate(tabId);
            }
        }

        function onContentAreaClick(event) {
            const retryButton = event.target.closest('[data-tab-retry]');
            if (retryButton) {
                const tabId = retryButton.getAttribute('data-tab-retry');
                refresh(tabId);
            }
        }

        function onTriggerClick(event) {
            const trigger = event.target.closest('[data-tab-id]');
            if (!trigger) {
                return;
            }

            const url = trigger.getAttribute('data-tab-url') || trigger.getAttribute('href');
            if (!url) {
                return;
            }

            event.preventDefault();

            const tabIdAttr = trigger.getAttribute('data-tab-id');
            const tabTitle = trigger.getAttribute('data-tab-title') || trigger.textContent.trim();
            const tabId = tabIdAttr || sanitizeId(url);

            open({
                id: tabId,
                title: tabTitle || '새 탭',
                url: url
            });

            document.querySelectorAll('.nav-link').forEach(function(link) {
                link.classList.remove('active');
            });
            trigger.classList.add('active');
        }

        function sanitizeId(value) {
            return value.replace(/[^\w-]/g, '_');
        }

        return {
            init: init,
            open: open,
            activate: activate,
            close: close,
            refresh: refresh
        };
    }
}
