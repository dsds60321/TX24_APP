export default class SessionManager {
    constructor() {
        this.userId = null;
        this.sessionId = null;
        this.timer = null;
        this.timeElement = document.getElementById('session-time') || null;
        this.remainingSeconds = null; // 잔여 시간
        this.screenLockAt = 1790; // 3분 남았을시 패스워드 알림
    }

    init() {
        this.getSession();
        // layout.Overlay.open();
        // layout.Overlay.renderContent(this.screenLockContent());
    }

    async getSession() {
        try {
            const { data } = await axios.get('/user/session');
            const ttl = this.normalizeTtl(data?.data.ttl);

            if (ttl !== null) {
                this.userId = data?.data.id;
                this.sessionId = data?.data.session_id;
                this.startCountdown(ttl);
            } else {
                this.updateTimeElement('-- : --');
            }
        } catch (error) {
            console.error('세션 정보를 불러오지 못했습니다.', error);
            this.updateTimeElement('-- : --');
        }
    }

    normalizeTtl(ttl) {
        const parsed = Number(ttl);
        if (Number.isNaN(parsed) || parsed < 0) {
            return null;
        }
        return Math.floor(parsed);
    }

    startCountdown(ttl) {
        this.remainingSeconds = ttl;
        this.updateTimeElement(this.formatTime(this.remainingSeconds));

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        if (this.remainingSeconds <= 0) {
            return;
        }

        this.timer = setInterval(() => {
            this.remainingSeconds -= 1;

            // 세션 만료시
            if (this.remainingSeconds <= 0) {
                this.remainingSeconds = 0;
                this.updateTimeElement('00 : 00');
                clearInterval(this.timer);
                this.timer = null;
                return;
            }

            this.updateTimeElement(this.formatTime(this.remainingSeconds));
        }, 1000);
    }

    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
    }

    updateTimeElement(value) {
        if (!this.timeElement) {
            this.timeElement = document.getElementById('session-time');
        }

        if (this.timeElement) {
            this.timeElement.textContent = value;
            this.timeElement.dataset.remainingSeconds = String(this.remainingSeconds ?? '');
        }

        // 스크린락 시간
        if (this.screenLockAt >= this.remainingSeconds) {

            if (layout.Overlay.isOpen() === false) {
                layout.Overlay.open();
                layout.Overlay.renderContent(this.screenLockContent());
            }
        }
    }


    async extendSession(){
        const frm = document.sessionForm;
        if (!frm) {
            util.toastify.warning('세션 연장 폼을 찾을 수 없습니다. 관리자에게 문의해주시기 바랍니다.');
            return;
        }

        const form = new FormData(frm);
        const pw = form.get('pw');
        if (!pw) {
            util.toastify.warning('비밀번호를 입력해주세요');
            document.getElementById('pw').focus();
            return;
        }

        const {data} = await axios.post('/user/session/extend', { userId : this.userId,sessionId : this.sessionId, password: pw});
        if (data.result) {
            layout.Overlay.close();
            const ttl = this.normalizeTtl(data?.data.ttl);
            this.startCountdown(ttl);
        }

        util.toastify.info(data.msg);
    }


    // 화면 잠금
    screenLockContent() {
        return `
            <form id="sessionForm" name="sessionForm" novalidate="novalidate">
                <div class="lock-center-text">
                    <i class="fas fa-user-lock"></i><span>SCREEN LOCK</span>
                  </div>
                <div class="lock-bottom-control">
                    <input type="password" name="pw" id="pw" class="form-control" placeholder="비밀번호 입력">
                    <button class="btn btn-light" onclick="sessionManager.extendSession(this)" id="extendSession" type="submit">연장하기</button>
                </div>
            </form>`
    }


}
