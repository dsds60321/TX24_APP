(function () {
    const AdminPage = {

        form : null,
        isEditMode : false,
        submitButton : null,
        validator : null,
        requiredSelectors : [],
        idField: null,
        idCheckTimer: null,
        lastRequestedId: '',
        isIdAvailable: null,

        init() {
            this.cacheElements();
            this.initValidator();
            this.bindEvents();
            this.toggleSubmit(false);
        },

        cacheElements() {
            this.form = document.adminRegisterForm ? document.adminRegisterForm : document.adminUpdateForm;
            this.isEditMode = !document.adminRegisterForm;
            this.submitButton = document.querySelector('.flex-submit');
            this.idField = this.form?.querySelector('#id') ?? null;

        },

        initValidator() {
            this.requiredSelectors = ValidationUtil.findRequiredFields(this.form, ['#emailLocal','#emailDomain','#emailDomainSelect']);
            this.validator = ValidationUtil.create(this.form, {
                validateOnInput: true,
                focusInvalidField: true
            });


            // 필수 필드들에 대한 룰 저장
            const defaultRules = this.requiredSelectors.map(elem => {
                const rule = ValidationUtil.getDefaultRule(elem);
                if (!rule) {
                    return null;
                }
                if (elem.id === 'id') {
                    rule.rules.push({
                        validator: () => this.isIdAvailable !== false,
                        errorMessage: '이미 사용 중인 아이디입니다.'
                    });
                }
                return rule;
            });

            ValidationUtil.addFields(this.validator, defaultRules)
                .onSuccess(async (event) => {
                    event.preventDefault();
                    try {
                        layout.Overlay.loading(true);
                        const {data} = await httpClient.post(this.form.action);
                        if (data.result) {
                            util.toastify.success(data.msg);
                        } else {
                            util.toastify.warning(data.data.msg || '서버로부터 오류가 발생했습니다.');
                        }

                        // 경로 이동
                        layout.TabManager.activate('/member/admin/form');
                    } catch (error) {
                        console.log('error', error);
                        util.toastify.error('서버로부터 오류가 발생했습니다.')
                    } finally {
                        layout.Overlay.loading(false);
                    }

                })
                .onFail(() => {
                    util.toastify.warning('입력값을 다시 확인해주세요.');
                });

        },

        bindEvents() {

            // 이메일 이벤트
            this.emailEvt()

            // 검증 이벤트 동작
            ValidationUtil.validExecute(
                this.validator,
                this.requiredSelectors,
                this.checkCompletion,
                this
            );

            this.setupIdDuplicateCheck();

        },

        // 성공시 동작
        checkCompletion() {
            if (!this.form) {
                return;
            }
            const hasErrors = Boolean(this.form.querySelector('.just-validate-error-label'));
            const allFilled = this.requiredSelectors.every(field => field && field.checkValidity());
            const idValid = this.isIdAvailable !== false;
            this.toggleSubmit(!hasErrors && allFilled && idValid);
        },

        emailEvt() {
            const local = document.getElementById('emailLocal');
            const domain = document.getElementById('emailDomain');
            const domainSelect = document.getElementById('emailDomainSelect');
            const email = document.getElementById('email');
            local.addEventListener('input', () => {
                if (local.value) {
                    email.value = `${local.value}@${domain.value}`;
                }

            });

            domainSelect.addEventListener('change', () => {
                if (domainSelect.value) {
                    email.value = `${local.value}@${domain.value}`;
                }
            })

            domain.addEventListener('input', () => {
                if (domain.value) {
                    email.value = `${local.value}@${domain.value}`;
                }
            })
        },

        setupIdDuplicateCheck() {
            if (!this.idField) {
                return;
            }

            this.idField.addEventListener('input', () => {
                this.isIdAvailable = null;
                const value = this.idField.value.trim();

                if (value.length < 4) {
                    this.validator?.revalidateField('#id');
                    this.checkCompletion();
                    return;
                }

                window.clearTimeout(this.idCheckTimer);
                this.idCheckTimer = window.setTimeout(() => {
                    this.checkIdAvailability(value);
                }, 300);
            });
        },

        async checkIdAvailability(value) {
            this.lastRequestedId = value;
            try {
                const { data } = await httpClient.get(`/member/check-id/${encodeURIComponent(value)}`);
                if (this.lastRequestedId !== value) {
                    return;
                }
                this.isIdAvailable = data?.result === true;
            } catch (error) {
                console.error('checkIdAvailability error', error);
                this.isIdAvailable = false;
            } finally {
                this.validator?.revalidateField('#id');
                this.checkCompletion();
            }
        },


        toggleSubmit(canSubmit) {
            if (!this.submitButton) {
                return;
            }
            this.submitButton.disabled = !canSubmit;
            this.submitButton.classList.toggle('disabled', !canSubmit);
        }

    }
    AdminPage.init()
})();
