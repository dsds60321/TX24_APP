export default class SessionManager {
    constructor() {
        this.timer = null;
        this.timeElement = document.getElementById('session-time') || null;
        this.remainingSeconds = null; // 잔여 시간
        this.expireAt = 180; // 3분 남았을시 패스워드 알림
    }

    init() {
        // layout.Overlay.open();
        // layout.Overlay.renderContent(this.screenLockContent());
    }


    // 화면 잠금
    screenLockContent() {
        return `  <div class="lock-center-text">
                    <i class="fas fa-user-lock"></i><span>SCREEN LOCK</span>
                  </div>
                    <div class="lock-bottom-control">
                        <input type="password" id="reauthPassword" class="form-control" placeholder="비밀번호 입력">
                        <button class="btn btn-light" onclick="extendSession()">연장하기</button>
                    </div>`
    }
}
