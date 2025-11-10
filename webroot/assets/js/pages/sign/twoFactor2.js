(function (window, document) {
	const ERROR_ICON_HTML = '<i class="fa-solid fa-circle-exclamation me-1"></i>';
	let TIME_OUT = 180;


	const TwoFactorPage = {
		init() {
			this.cacheElements();
			this.bindEvents();
		},

		cacheElements() {
			this.form = document.twoFactorForm,
			this.options = document.querySelectorAll('.two-fa-option'),
			this.codeInfo = document.getElementById('codeInfo'),
			this.sendBtn = document.getElementById('sendCodeBtn'),
			this.codeInput = document.getElementById('codeInputSection'),
			this.retrySendBtn = document.getElementById('codeButtonSection'),
			this.resendBtn = document.getElementById('resend'),
			this.backBtn = document.getElementById('back'),
			this.verifyBtn = document.getElementById('verify');
		},

		bindEvents() {

			// 선택 이벤트
			this.options.forEach((opt) => this.optionClickEvt(opt));

			// 인증 코드 요청 이벤트
			this.sendBtn.addEventListener('click', (evt) => this.sendCode(evt));

			// 뒤로가기
			this.backBtn.addEventListener('click', () => {
				this.options.forEach(elem => elem.classList.remove('disabled'));

				this.sendBtn.classList.remove('hidden');
				this.codeInput.classList.add('hidden');
				this.retrySendBtn.classList.add('hidden');

			});

			// 다시 보내기
			this.resendBtn.addEventListener('click', (evt) => this.sendCode(evt));

			this.verifyBtn.addEventListener('click', (evt) => this.verifyEvt(evt));
		},



		optionClickEvt(elem) {
			elem.addEventListener('click', () => {
				const type = elem.dataset.type;
				if (!type) {
					util.toastify.error('타입을 확인 할 수 없습니다.');
					return;
				}

				if (elem.classList.contains('disabled')) {
					util.toastify.warning('인증코드가 이미 발송되었습니다. 뒤로가기 후 재선택 혹은 다시보내기를 시도해주세요.');
					return;
				}

				document.getElementById(type).checked = true;
				this.options.forEach((opt) => opt.classList.remove('selected'));

				elem.classList.add('selected');
			});
		},


		async sendCode(evt) {
			evt.preventDefault();
			let formData = new FormData(this.form);

			if (!formData.get('type')) {
				util.toastify.error('인증방법을 선택 후 진행해주세요.');
				return;
			}

			const payload = {
				type: formData.get('type'),
				csrf: formData.get('_csrf')
			}

			const {data} = await axios.post('/sign/two-factor/code/send', payload);
			if (!data.result) {
				util.toastify.warning(data.msg || '서버로부터 오류가 발생했습니다.');
				return;
			}

			document.getElementById('verificationCode').value = '';
			this.options.forEach((opt) => opt.classList.add('disabled'));

			// 기존 전송 버튼 hidden 다시 보내기 유지
			if (evt.target.id !== 'resend') {
				evt.target.classList.add('hidden');
				this.codeInfo.innerText = `${payload.type.toUpperCase()}로 인증코드가 전송되었습니다.`;
			} else {
				this.codeInfo.innerText = `${payload.type.toUpperCase()}로 인증코드가 재전송되었습니다.`;
			}

			util.toastify.success(data.msg);
			this.codeInput.classList.remove('hidden');
			this.retrySendBtn.classList.remove('hidden');

		},

		verifyEvt(evt) {
			evt.preventDefault();
			let formData = new FormData(this.form);

			if (!formData.get('type')) {
				util.toastify.error('인증방법을 선택 후 진행해주세요.');
				return;
			}

			const payload = {
				type: formData.get('type'),
				csrf: formData.get('_csrf'),
				code: formData.get('code')
			};

			axios.post('/sign/two-factor/code/verify', payload);
		}


	};

	document.addEventListener('DOMContentLoaded', () => {
		TwoFactorPage.init();
	});
})(window, document);
