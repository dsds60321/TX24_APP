(function () {
    const AdminPage = {

        form : null,
        submitButton : null,
        validator : null,
        requiredSelectors : [],

        init() {
            this.cacheElements();
            this.initValidator();
            this.bindEvents();
            this.toggleSubmit(false);
        },

        cacheElements() {
            this.form = document.adminRegisterForm;
            this.submitButton = document.querySelector('.flex-submit');

        },

        initValidator() {
            this.requiredSelectors = ValidationUtil.findRequiredFields(this.form, ['#emailLocal','#emailDomain','#emailDomainSelect']);
            this.validator = ValidationUtil.create(this.form, {
                validateOnInput: true,
                focusInvalidField: true
            });


            // 필수 필드들에 대한 룰 저장
            const defaultRules = this.requiredSelectors.map(elem => {
                return ValidationUtil.getDefaultRule(elem)
            });

            ValidationUtil.addFields(this.validator, defaultRules)
                .onSuccess((event) => {
                    console.log('success');
                })
                .onFail(() => {
                    console.log('fail');
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

        },

        checkCompletion() {
            const isValid = this.requiredSelectors.every(field => field.value !== '')
                && !this.form.querySelector('.just-validate-error-label');

            console.log('checkCompletion isValid', isValid);

            this.toggleSubmit(isValid);
        },

        emailEvt() {
            const local = document.getElementById('emailLocal');
            const domain = document.getElementById('emailDomain');
            const email = document.getElementById('email');
            local.addEventListener('input', () => {
                if (local.value) {
                    email.value = `${local.value}@${domain.value}`;
                }

            });

            domain.addEventListener('input', () => {
                if (domain.value) {
                    email.value = `${local.value}@${domain.value}`;
                }
            })
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
