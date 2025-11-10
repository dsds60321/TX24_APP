(function (window, document) {
	const ERROR_ICON_HTML = '<i class="fa-solid fa-circle-exclamation me-1"></i>';
	let TIME_OUT = 180;


	const TwoFactorPage = {
		init() {
			this.cacheElements();
			this.bindEvents();
		},

		cacheElements() {
			this.form = document.twoFactor,
			this.authBox = document.querySelector('.auth-box');
			this.optionButtons = document.querySelectorAll('.option-Btn');
			this.submitButton = document.querySelector('#submitBtn');
			this.codeInput = document.querySelector('#code');
			this.errorField = this.authBox ? this.authBox.querySelector('.text-danger') : null;
		},

		bindEvents() {
			if (this.optionButtons.length > 0) {
				this.optionButtons.forEach((button) => {
					button.addEventListener('click', () => this.showAuthBox(button));
				});
			}

			// 인증 버튼
			if (this.submitButton) {
				this.submitButton.addEventListener('click', () => this.sendCode());
			}
		},

		async showAuthBox(button) {

			if (!confirm(button.innerText + ' 요청을 진행하시겠습니까?')) {
				return;
			}


			const type = button.dataset.type;
			if (!type) {
				util.toastify.warning('타입 지정에 오류가 발생했습니다. 관리자에게 문의해주시기 바랍니다.');
				return;
			}

			this.form.type.value = type;


			if (type === 'otp') {
				this.openCodeInput();
				return;
			}

			const formData = new FormData(this.form);

			try {
				const {data} = await axios.post('/sign/two-factor/code/send', {
					type,
					csrf: formData.get('_csrf') || ''
				});
				console.log(data);

				alert(data.msg);
				this.openCodeInput();
			} catch (error) {
				console.log(error);
				alert('서버로부터 오류가 발생했습니다.');
				return;
			}


		},

		openCodeInput() {
			if (this.authBox) {
				this.authBox.style.display = 'block';
			}
		},


		sendCode() {
			this.form
		},


		handleSubmit() {
			if (!this.codeInput) {
				return;
			}

			const code = this.codeInput.value.trim();
			if (!code) {
				this.showError('인증번호를 입력해주세요.');
				return;
			}

			const frm = new FormData(this.form);
			try {
				const { data } = axios.post('/sign/two-factor/code/verify', {
					code,
					csrf: frm.get('_csrf') || '',
					type: frm.get('type') || ''
				});

				alert(data.msg);
			} catch (e) {
				alert('서버로부터 오류가 발생했습니다.');
				return;
			}

		},

		showError(message) {
			if (!this.errorField) {
				return;
			}

			this.errorField.innerHTML = ERROR_ICON_HTML + message;
		}
	};

	document.addEventListener('DOMContentLoaded', () => {
		TwoFactorPage.init();
	});
})(window, document);
