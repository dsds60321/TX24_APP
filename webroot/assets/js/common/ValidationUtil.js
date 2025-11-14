// JustValidate 공통 유틸
const ValidationUtil = (function () {

    const DEFAULT_OPTIONS = {
        validateOnInput: true,
        focusInvalidField: true,
    };

    // 공통 rule 키워드 상수화 (오타 방지용)
    const RULE = {
        REQUIRED: 'required',
        MIN_LENGTH: 'minLength',
        MAX_LENGTH: 'maxLength',
        REGEXP: 'customRegexp',
    };

    function create(formSelector, options = {}) {
        if (typeof JustValidate === 'undefined') {
            console.warn('JustValidate library is required.');
            return null;
        }

        const validator = new JustValidate(formSelector, {
            ...DEFAULT_OPTIONS,
            ...options,
        });

        return validator;
    }

    /**
     * 간단한 필드 정의 배열로 한 번에 addField 해주는 헬퍼
     * fields = [
     *  { selector: '#loginId', rules: [ { rule: RULE.REQUIRED, errorMessage: '...'}, ... ] },
     * ]
     */
    function addFields(validator, fields = []) {
        fields.forEach((field) => {
            if (field) {
                validator.addField(field.selector, field.rules);
            }
        });
        return validator;
    }

    /**
     * 기본 룰 반환
     */
    function getDefaultRule(elem) {
        if (!elem) {
            return null;
        }

        if (!elem.id && !elem.name) {
            console.warn(`해당 엘리먼트에 선택자가 비어있습니다. : ${elem.outerHTML}`)
            return null;
        }

        let selector = null;
        if(elem.id) {
            selector = `#${elem.id}`;
        }

        if (!selector) {
            return null;
        }

        let rule = {
            selector,
            rules : [
                { rule: ValidationUtil.RULE.REQUIRED, errorMessage: '필수값을 입력해주세요.' },
            ]
        }

        if (selector.includes('email')) {
            rule.rules.push({
                rule : ValidationUtil.RULE.REGEXP, value : ValidationUtil.PATTERN.EMAIL, errorMessage: '이메일을 확인해주세요.'
            })
        }

        if (selector.includes('phone')) {
            rule.rules.push({
                rule : ValidationUtil.RULE.REGEXP, value : ValidationUtil.PATTERN.MOBILE, errorMessage : '전화번호를 확인해주세요.'
            })
        }

        // ID 중복체크
        if (selector.includes('id')) {
            rule.rules.push({
                validator : async (value, context) => {
                    let result = false;
                    const {data} = await httpClient.get(`/member/check-id/${encodeURIComponent(value)}`);
                    result = data.result;
                    // .then((res) => {
                    //     console.log('---', res.data.result)
                    //     result =  res.data.result;
                    // })
                    // .catch((err) => {
                    //     console.error(err);
                    //     result = false;
                    // });

                    console.log('data', data);
                    console.log('result', result);
                    return result;
                }
            })
        }

        console.log('rule' , rule);

        return rule
    }

    function validExecute(validator, requiredSelectors, fn, context = null) {
        if (!validator || !Array.isArray(requiredSelectors) || !fn) {
            return;
        }

        requiredSelectors.forEach(selector => {
            if (!selector) {
                return;
            }
            const eventType = selector.tagName === 'SELECT' ? 'change' : 'input';
            selector.addEventListener(eventType, () => {
                if (selector.id) {
                    validator.revalidateField(`#${selector.id}`);
                }
                fn.call(context ?? null);
            });
        });
    }

    /**
     * 필수값 선택자 헬퍼 함수
     */
    function findRequiredFields(form, excludes = []) {
        // 전체 필드 수집
        const fields = form.querySelectorAll(
            '.card-title.required + .card-txt :is(input, select, textarea)'
        );

        if (!excludes.length) return fields;

        // 배열로 변환 후 제외 처리
        const excludeNodes = excludes.flatMap(selector =>
            Array.from(form.querySelectorAll(selector))
        );

        return Array.from(fields).filter(field => !excludeNodes.includes(field));
    }


    // 자주 쓰는 정규식 같은 것도 여기 모아둘 수 있음
    const PATTERN = {
        MOBILE: /^[0-9\-]{10,13}$/,
        EMAIL : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    };

    return {
        create,
        addFields,
        findRequiredFields,
        getDefaultRule,
        validExecute,
        RULE,
        PATTERN,
    };
})();
