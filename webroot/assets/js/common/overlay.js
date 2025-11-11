export default class Overlay2 {
    constructor() {
        this.overlayContainer = document.querySelector('.launcher-apps');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // apps 생성 오버레이

        // 로딩 생성 오버레이
    }


    open() {
        this.overlayContainer.classList.add('active');
    }

    close() {
        this.overlayContainer.classList.remove('active');
    }

    loading(isLoading = true) {
        if (isLoading) {
            this.open();
            this.overlayContainer.innerHTML = `로딩중...`
        } else {
            this.close();
        }

    }


    // 앱 런처
    appTabs = {
        pages: new Map(),
        open: () => {
            this.open();
            this.overlayContainer.innerHTML = ``
            this.appTabs.renderHeader();
            if (this.appTabs.pages.size === 0) {
                this.appTabs.emptyRender();
                return;
            }


        },
        // 헤더 생성
        renderHeader: () => {
            this.overlayContainer.innerHTML = `<div class="launcher-content">
               <button class="close-launcher" onClick="overlay.close()">×</button>
               <div class="launcher-header-section">
                   <h1 class="launcher-title">Apps History</h1>
                   <p class="launcher-subtitle">방문한 페이지를 선택하여 빠르게 이동하세요</p>
                   <button class="clear-all-btn" onClick="clearAllHistory()" id="clearAllBtn"
                           style="display: none;">
                       🗑️ 전체 기록 삭제
                   </button>
               </div>`;
        },
        emptyRender: () => {
            document.querySelector('.launcher-content')
                .insertAdjacentHTML('beforeend', `
              <div class="apps-grid" id="appsGrid">
                <div class="empty-state">
                  <div class="empty-state-icon">📭</div>
                  <div class="empty-state-title">아직 방문한 페이지가 없습니다</div>
                  <div class="empty-state-text">사이드바 메뉴에서 페이지를 방문해보세요!</div>
                </div>
              </div>
            `);
        },
        render: () => {

        },


    }


}