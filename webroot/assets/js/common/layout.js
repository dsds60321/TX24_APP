/**
 * 공통 레이아웃 JS
 */
export default class Layout {
    constructor() {
        // 하위 페이지 탭 매니저
        this.pages = new Set(); // 페이지 기록될 저장소
        this.loadingOverlay = null;
        this.loadingMessageElem = null;
        this.init();
        if (typeof window !== 'undefined') {
            window.layout = this;
        }
    }

    init() {
        this.bindEvents();
        this.mobileSize();
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
        this.showTab(root);
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
        // window.addEventListener('beforeunload', function (e) {
        //     // 페이지 이탈 경고
        //     e.preventDefault();
        //     e.returnValue = '';
        // });
        //
        // history.pushState(null, '', location.href);
        // window.onpopstate = function () {
        //     history.pushState(null, '', location.href);
        //     alert('뒤로가기가 차단되어 있습니다.');
        // };
    }

    datepickerRender() {
        document.querySelectorAll('.fc-datepicker').forEach((elem) => {
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
