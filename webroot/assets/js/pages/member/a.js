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
        loginIdValidatorRegistered: false,

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
            if (typeof window === 'undefined' || typeof window.Parsley === 'undefined' || typeof window.jQuery === 'undefined') {
                console.warn('Parsley + jQuery가 필요합니다. 라이브러리가 로드되지 않았습니다.');
                return;
            }

            this.registerCustomValidators();

            const $form = window.jQuery(this.form);
            this.validator = $form.parsley({
                trigger: 'input',
                focus: 'first'
            });

            this.validator.on('field:validated', () => {
                this.checkCompletion();
            });

            this.validator.on('form:validated', (formInstance) => {
                this.toggleSubmit(formInstance.validationResult === true);
            });
        },

        bindEvents() {
            this.requiredFields.forEach(field => {
                const eventType = field.tagName === 'SELECT' ? 'change' : 'input';
                field.addEventListener(eventType, () => {
                    if (field === this.emailLocal || field === this.emailDomain) {
                        this.updateEmailValue();
                    }
                    this.checkCompletion();
                });
            });

            this.domainSelect?.addEventListener('change', () => {
                if (this.emailDomain) {
                    this.emailDomain.value = this.domainSelect.value;
                    this.updateEmailValue();
                    this.checkCompletion();
                }
            });

            this.form.addEventListener('reset', () => {
                window.setTimeout(() => {
                    this.updateEmailValue();
                    this.toggleSubmit(false);
                    if (this.validator && typeof this.validator.reset === 'function') {
                        this.validator.reset();
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
            const parsleyValid = this.validator ? this.validator.isValid({ force: false }) : true;
            this.toggleSubmit(complete && parsleyValid !== false);
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
                console.log('checkIdDuplicateId data', data.result);
                return data.result;
            } catch (error) {
                console.error('checkIdDuplicateId error', error);
                return false;
            }
        },

        registerCustomValidators() {
            if (this.loginIdValidatorRegistered || typeof window.Parsley === 'undefined') {
                return;
            }

            window.Parsley.addValidator('loginIdAvailable', {
                validateString: (value) => {
                    if (!window.jQuery || typeof window.jQuery.Deferred !== 'function') {
                        return this.checkIdDuplicateId(value);
                    }

                    const deferred = window.jQuery.Deferred();
                    this.checkIdDuplicateId(value)
                        .then(result => {
                            deferred.resolve(result);
                        })
                        .catch(error => {
                            console.error('loginIdAvailable validator error', error);
                            deferred.reject(false);
                        });
                    return deferred.promise();
                },
                priority: 32,
                messages: {
                    ko: '이미 사용 중인 아이디입니다.',
                    en: '이미 사용 중인 아이디입니다.'
                }
            });

            this.loginIdValidatorRegistered = true;
        }
    }

    AdminForm.init()
})();
