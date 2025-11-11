(function (window, document) {
	const ProfilePage = {
		validator: null,

		init() {
			this.cacheElements();
			this.initValidator();
			this.bindEvents();
		},

		cacheElements() {
			this.form = document.getElementById('profileForm');
			this.submitButton = document.getElementById('submitBtn');
		},

		initValidator() {
			if (!this.form) {
				console.warn('profile.js | form element not found.');
				return;
			}

			this.validator = new JustValidate(this.form, {
				lockForm: true,
			});

			this.validator
				.addField('#name', [
					{ rule: 'required', errorMessage: '이름을 입력해주세요.' },
					{ rule: 'minLength', value: 2, errorMessage: '이름은 최소 2글자 이상이어야 합니다.' },
					{ rule: 'maxLength', value: 30, errorMessage: '이름은 최대 30글자 이하로 입력해주세요.' },
				])
				.addField('input[name="email"]', [
					{ rule: 'required', errorMessage: '이메일을 입력해주세요.' },
					{ rule: 'email', errorMessage: '올바른 이메일 형식이 아닙니다.' },
				])
				.addField('input[name="phone"]', [
					{rule: 'customRegexp' , value: /^01[0-9][0-9]{7,8}$/ , errorMessage : '올바른 휴대폰 번호를 입력해주세요.'},
					{rule: 'required' , errorMessage : '휴대폰 번호를 입력해주세요.'}
				])
				.onSuccess(() => {
					this.handleSubmit();
				})
				.onFail((fields) => {
					console.warn('profile.js | validation failed', fields);
				});
		},

		bindEvents() {
			if (this.submitButton) {
				this.submitButton.addEventListener('click', (event) => {
					event.preventDefault();
					if (!this.validator) {
						return;
					}
					this.validator.revalidate();
				});
			}
		},

		async handleSubmit() {
			if (!this.form) {
				return;
			}

			const formData = new FormData(this.form);
			const payload = {};
			formData.forEach((value, key) => {
				payload[key] = value;
			});

			if (!confirm('계정 정보를 변경하시겠습니까?')) {
				return;
			}

			try {
				const { data } = await httpClient.post('/user/profile/update', payload);

				if (!data.result) {
					util.toastify.error(data?.data.msg || '서버로부터 오류가 발생했습니다.');
					return;
				}

				if (data.result) {
					util.toastify.success(data.msg);
				}

			} catch (error) {
				console.error('profile.js | submit failed', error);
			}
		}
	};


	setTimeout(() => {
		ProfilePage.init();
	}, 1000);

})(window, document);
