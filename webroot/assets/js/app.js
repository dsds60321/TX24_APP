(function (window) {

    // App 공유 컴포넌트
    const App = {
        init () {
            window.Layout = new Layout();
        }
    }

    // 실행
    window.App = App;
    document.addEventListener('DOMContentLoaded', App.init);
})(window);
