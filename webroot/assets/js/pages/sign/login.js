(function (window, document) {
	const ERROR_ICON_HTML = '<i class="fa-solid fa-circle-exclamation me-1"></i>';

	const SignPage = {
        validator: new JustValidate('#loginForm'),
		init() {
			this.cacheElements();
			this.initValidator();
			this.bindEvents();
		},

		cacheElements() {
			this.form = document.getElementById('loginForm');
			if (this.form) {
				this.form.setAttribute('novalidate', 'novalidate');
			}

			this.idInput = document.querySelector('#id');
			this.passwordInput = document.querySelector('#pw');
			this.togglePasswordButton = document.querySelector('#togglePassword');
			this.eyeIcon = document.querySelector('#eyeIcon');
			this.errorField = document.querySelector('.text-danger');
			this.errorWrapper = document.querySelector('#error-wrapper');
			this.loginButton = document.querySelector('#loginBtn');
		},

        // Form 검증
		initValidator() {
			this.validator
				.addField('#id', [
					{ rule: 'required', errorMessage: '아이디를 입력해주세요.' }
				])
				.addField('#pw', [
					{ rule: 'required', errorMessage: '비밀번호를 입력해주세요.' }
				])
                .addField('#csrf', [
                    { rule: 'required', errorMessage: '올바르지 않은 접근입니다.' }
                ])
					.onSuccess((event) => {
	                    event.preventDefault();
	                    this.clearError(); // 에러 제거
	                    this.request(event.target); // 요청
	                    // this.redirectTo2FA();
					})
				.onFail(() => {
                    this.showError('아이디와 비밀번호를 모두 입력해주세요.');
				});
		},

		async request(formElement) {
            const formData = new FormData(formElement);
            const payload = {
                id: (formData.get('id') || '').trim(),
                password: formData.get('pw') || '',
                _csrf : formData.get('_csrf') || ''
            };

            // 로그인 요청
            try {
                const {data} = await axios.post('/sign/in', payload, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

				console.log('----', data)

                if (!data.result) {
					this.showError(data.msg)
					return false;
                }

                const frm = document.createElement('form');
                frm.action = data.link;
                frm.method = 'POST';
                frm.style.display = 'none';

                // REDIS key
                let input = document.createElement('input');
				input.name = "_csrf";
				input.id = "_csrf";
                input.type = "hidden";
                input.value = data.msg


				frm.appendChild(input);
                document.body.appendChild(frm);
                frm.submit();
            } catch (error) {
                this.errorField.innerHTML = ERROR_ICON_HTML + data.msg || '오류가 발생했습니다. 관리자에게 문의해주시기 바랍니다.';
            }
        },

		bindEvents() {
			if (this.togglePasswordButton) {
				this.togglePasswordButton.addEventListener('click', () => this.togglePasswordVisibility());
			}
		},

        // 패스워드 토글
		togglePasswordVisibility() {
			if (!this.passwordInput || !this.eyeIcon) {
				return;
			}

			const isHidden = this.passwordInput.type === 'password';
			this.passwordInput.type = isHidden ? 'text' : 'password';

			this.eyeIcon.classList.toggle('fa-eye', !isHidden);
			this.eyeIcon.classList.toggle('fa-eye-slash', isHidden);
		},

		showError(message) {
			if (!this.errorField) {
				return;
			}

			this.errorWrapper.style.display = 'block';
			this.errorField.innerHTML = message;
		},

		clearError() {
			if (this.errorField) {
				this.errorField.textContent = '';

				this.errorWrapper.style.display = 'none';
			}
		},

		redirectTo2FA() {
			window.location.href = '/example/login2fa';
		}
	};

	document.addEventListener('DOMContentLoaded', function () {
		SignPage.init();
	});

})(window, document);
