(function () {
    const AdminForm = {
        form: null,
        submitButton: null,
        validator: null,
        emailLocal: null,
        emailDomain: null,
        hiddenEmail: null,
        domainSelect: null,
        requiredSelectors: ['#loginId', '#userName', '#emailLocal', '#emailDomain', '#dept', '#mobile', '#role'],
        requiredFields: [],

        init() {
            this.form = document.getElementById('adminRegisterForm');
            if (!this.form) {
                return;
            }

            this.submitButton = this.form.querySelector('.flex-submit');
            this.emailLocal = document.getElementById('emailLocal');
            this.emailDomain = document.getElementById('emailDomain');
            this.hiddenEmail = document.getElementById('email');
            this.domainSelect = document.getElementById('emailDomainSelect');
            this.requiredFields = this.requiredSelectors
                .map(selector => document.querySelector(selector))
                .filter(Boolean);

            this.initValidator();
            this.bindEvents();
            this.updateEmailValue();
            this.toggleSubmit(false);
        },

        initValidator() {
            if (typeof JustValidate === 'undefined') {
                console.warn('JustValidate library is required for admin form validation.');
                return;
            }

            this.validator = new JustValidate('#adminRegisterForm', {
                validateOnInput: true,
                focusInvalidField: true
            });

            this.validator
                .addField('#loginId', [
                    { rule: 'required', errorMessage: '아이디를 입력해주세요.' },
                    { rule: 'minLength', value: 4, errorMessage: '4자 이상 입력해주세요.' },
                    { rule: 'maxLength', value: 20, errorMessage: '20자 이하로 입력해주세요.' }
                ])
                .addField('#userName', [
                    { rule: 'required', errorMessage: '이름을 입력해주세요.' },
                    { rule: 'minLength', value: 2 , errorMessage: '2글자 이상 입력해주세요.'}
                ])
                .addField('#emailLocal', [{ rule: 'required', errorMessage: '이메일 아이디를 입력해주세요.' }])
                .addField('#emailDomain', [
                    { rule: 'required', errorMessage: '도메인을 입력하거나 선택해주세요.' },
                    { rule: 'customRegexp', value: /^[a-z0-9.-]+\.[a-z]{2,}$/i, errorMessage: '도메인을 확인해주세요.' }
                ])
                .addField('#dept', [{ rule: 'required', errorMessage: '부서를 선택해주세요.' }])
                .addField('#mobile', [
                    { rule: 'required', errorMessage: '휴대전화를 입력해주세요.' },
                    { rule: 'customRegexp', value: /^[0-9\-]{10,13}$/, errorMessage: '휴대전화 형식을 확인해주세요.' }
                ])
                .addField('#role', [{ rule: 'required', errorMessage: '등급을 선택해주세요.' }])
                .onSuccess((event) => {
                    event?.preventDefault();
                    this.toggleSubmit(true);
                })
                .onFail(() => {
                    this.toggleSubmit(false);
                });
        },

        bindEvents() {
            this.requiredFields.forEach(field => {
                const eventType = field.tagName === 'SELECT' ? 'change' : 'input';
                field.addEventListener(eventType, () => {
                    if (field === this.emailLocal || field === this.emailDomain) {
                        this.updateEmailValue();
                    }
                    if (field.id && this.validator) {
                        this.validator.revalidateField(`#${field.id}`);
                    }
                    this.checkCompletion();
                });
            });

            this.domainSelect?.addEventListener('change', () => {
                if (this.emailDomain) {
                    this.emailDomain.value = this.domainSelect.value;
                    this.updateEmailValue();
                    this.validator?.revalidateField('#emailDomain');
                    this.checkCompletion();
                }
            });

            this.form.addEventListener('reset', () => {
                window.setTimeout(() => {
                    this.updateEmailValue();
                    this.toggleSubmit(false);
                    if (this.validator && typeof this.validator.refresh === 'function') {
                        this.validator.refresh();
                    }
                }, 0);
            });
        },

        updateEmailValue() {
            if (!this.hiddenEmail) {
                return;
            }
            const local = this.emailLocal?.value.trim();
            const domain = this.emailDomain?.value.trim();
            this.hiddenEmail.value = (local && domain) ? `${local}@${domain}` : '';
        },

        checkCompletion() {
            const complete = this.requiredFields.every(field => field && field.checkValidity());
            this.toggleSubmit(complete);
        },

        toggleSubmit(canSubmit) {
            if (!this.submitButton) {
                return;
            }
            this.submitButton.disabled = !canSubmit;
            this.submitButton.classList.toggle('disabled', !canSubmit);
        },

        async checkIdDuplicateId(value) {
            console.log('checkIdDuplicateId value', value);
            const trimmed = value?.trim() ?? '';
            if (!trimmed || trimmed.length < 4) {
                return true;
            }

            try {
                const {data} = await httpClient.get(`/member/check-id/${encodeURIComponent(trimmed)}`);
                return data?.result === true;
            } catch (error) {
                console.error('checkIdDuplicateId error', error);
                return false;
            }
        }
    }

    AdminForm.init()
})();
