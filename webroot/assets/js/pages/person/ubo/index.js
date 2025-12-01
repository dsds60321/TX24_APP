(function () {
    const UboPage = {

        form : null,
        validator : null,
        requiredSelectors : [],
        submitButton : null,


        init() {
            console.log('ubo page init')
            this.cacheElements();
            if (!this.form) {
                return;
            }
            this.initValidator();
            this.bindEvents();
        },

        cacheElements() {
            this.form = document.uboForm;
            this.submitButton = this.form ? this.form.querySelector('#submit') : null;

        },

        initValidator() {
            this.requiredSelectors = ValidationUtil.findRequiredFields(this.form) || [];
            this.validator = ValidationUtil.create(this.form, {
                validateOnInput: true,
                focusInvalidField: true
            });

            const defaultRules = (this.requiredSelectors || []).map(elem => {
                return ValidationUtil.getDefaultRule(elem);
            });



            ValidationUtil.addFields(this.validator, defaultRules)
                .onSuccess(async (event) => {
                    event.preventDefault();
                    try {
                        if (!await util.sweetAlert.confirm('대표자를 등록하시겠습니까?')) {
                            return;
                        }

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

            ValidationUtil.validExecute(
                this.validator,
                this.requiredSelectors,
                null,
                this
            );
        }

    }

    UboPage.init();

})();
