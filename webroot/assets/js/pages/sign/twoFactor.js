(function (window, document) {
	const ERROR_ICON_HTML = '<i class="fa-solid fa-circle-exclamation me-1"></i>';
	let TIME_OUT = 180;


	const TwoFactorPage = {
		init() {
			this.cacheElements();
			this.bindEvents();
		},

		cacheElements() {
			this.form = document.querySelector('.login-form');
			this.optionBox = document.querySelector('.option-box');
			this.authBox = document.querySelector('.auth-box');
			this.optionButtons = document.querySelectorAll('.option-Btn');
			this.backButton = document.querySelector('#backBtn');
			this.submitButton = document.querySelector('#submitBtn');
			this.codeInput = document.querySelector('#twoFactor');
			this.errorField = this.authBox ? this.authBox.querySelector('.text-danger') : null;
		},

		bindEvents() {
			if (this.optionButtons.length > 0) {
				this.optionButtons.forEach((button) => {
					button.addEventListener('click', () => this.showAuthBox(button));
				});
			}

			if (this.backButton) {
				this.backButton.addEventListener('click', () => this.handleBack());
			}

			if (this.submitButton) {
				this.submitButton.addEventListener('click', () => this.handleSubmit());
			}
		},

		showAuthBox(button) {

			if (!confirm(button.innerText + ' 요청을 진행하시겠습니까?')) {
				return;
			}


			if (this.authBox) {
				this.authBox.style.display = 'block';
			}

			this.clearError();
			if (this.codeInput) {
				this.codeInput.value = '';
				this.codeInput.focus();
			}



		},

		handleBack() {
			if (this.optionBox) {
				this.optionBox.style.display = 'block';
			}

			if (this.authBox) {
				this.authBox.style.display = 'none';
			}

			this.clearError();
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

			this.clearError();
			window.location.href = '/example/components';
		},

		showError(message) {
			if (!this.errorField) {
				return;
			}

			this.errorField.innerHTML = ERROR_ICON_HTML + message;
		},

		clearError() {
			if (!this.errorField) {
				return;
			}

			this.errorField.textContent = '';
		}
	};

	document.addEventListener('DOMContentLoaded', () => {
		TwoFactorPage.init();
	});
})(window, document);
