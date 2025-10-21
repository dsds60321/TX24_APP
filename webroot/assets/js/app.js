(function (window) {
    'use strict';

    // App 공유 컴포넌트
    const App = {
        init () {
            if (window.Layout && typeof window.Layout.init === 'function') {
                window.Layout.init();
            }
        }
    }

    // 실행
    window.App = App;
    document.addEventListener('DOMContentLoaded', App.init);
})(window);
