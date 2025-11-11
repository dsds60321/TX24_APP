const util = {
    pad: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    dateUtil: {
        toString: function (date) {
            console.log(date);
            if (!date) date = new Date();
            return date.getFullYear() + "-" + (util.pad(date.getMonth() + 1, 2)) + "-" + util.pad(date.getDate(), 2);
        },
        getNowDate: function (separator) {
            var nowDate = new Date();
            var yesterDate = new Date(nowDate.setDate(nowDate.getDate()))
            var yDay = yesterDate.getDate();
            var yMonth = yesterDate.getMonth() + 1;
            var yYear = yesterDate.getFullYear();
            var startDt = new Date(yYear, nowDate.getMonth(), 1);
            var firstDate = startDt.getDate();
            if (yDay < 10) {
                yDay = '0' + yDay;
            }
            if (yMonth < 10) {
                yMonth = '0' + yMonth;
            }

            if (separator) {
                return yYear + separator + yMonth + separator + yDay;
            }

            return yYear + yMonth + yDay;
        }
    },

    // toastify 노티 유틸
    toastify: (function () {
        var hasToastify = typeof Toastify === 'function';
        var activeToast = null;

        var baseOptions = {
            duration: 1000,
            gravity: 'top',
            position: 'right',
            close: true,
            stopOnFocus: true,
            escapeMarkup: true,
            offset: {
                x: 0,
                y: 0
            },
            style: {
                background: '#323232',
                color: '#ffffff',
                animation: 'toastify-slide-in-right 0.35s ease forwards'
            }
        };

        var typeStyles = {
            info: {
                background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(96, 165, 250))'
            },
            success: {
                background: 'linear-gradient(to right, rgb(16, 185, 129), rgb(52, 211, 153))'
            },
            warning: {
                background: 'linear-gradient(to right, rgb(245, 158, 11), rgb(251, 191, 36))'
            },
            error: {
                background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(248, 113, 113))'
            }
        };

        function extend(target) {
            target = target || {};
            var i;
            for (i = 1; i < arguments.length; i++) {
                var source = arguments[i] || {};
                var key;
                for (key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        }

        function mergeOptions(messageOrOptions, overrides) {
            var messageOptions = typeof messageOrOptions === 'string'
                ? { text: messageOrOptions }
                : (messageOrOptions || {});
            var finalOptions = extend({}, baseOptions, messageOptions, overrides);
            finalOptions.style = extend({}, baseOptions.style, messageOptions.style, overrides && overrides.style);
            return finalOptions;
        }

        function removeToast(instance) {
            if (!instance) {
                return;
            }
            try {
                if (instance.toastElement && instance.toastElement.parentNode) {
                    instance.toastElement.parentNode.removeChild(instance.toastElement);
                } else if (typeof instance.hideToast === 'function') {
                    instance.hideToast();
                }
            } catch (error) {
                console.warn('[util.toastify] 토스트 제거 중 오류:', error);
            }
        }

        function purgeExistingToasts() {
            if (activeToast) {
                removeToast(activeToast);
                activeToast = null;
            }
            Array.from(document.querySelectorAll('.toastify')).forEach(function (elem) {
                if (elem && elem.parentNode) {
                    elem.parentNode.removeChild(elem);
                }
            });
        }

        function show(messageOrOptions, overrides) {
            if (!hasToastify) {
                console.warn('[util.toastify] Toastify 스크립트를 찾을 수 없습니다.');
                return null;
            }
            var options = mergeOptions(messageOrOptions, overrides);
            purgeExistingToasts();

            var originalCallback = options.callback;
            var toast = null;
            options.callback = function () {
                if (activeToast === toast) {
                    activeToast = null;
                }
                if (typeof originalCallback === 'function') {
                    originalCallback.call(this);
                }
            };

            toast = Toastify(options);
            activeToast = toast;
            toast.showToast();
            return toast;
        }

        function createTyped(type) {
            if (!typeStyles[type]) {
                return function (messageOrOptions, overrides) {
                    return show(messageOrOptions, overrides);
                };
            }
            return function (messageOrOptions, overrides) {
                var mergedOverrides = overrides ? extend({}, overrides) : {};
                mergedOverrides.style = extend({}, typeStyles[type], overrides && overrides.style);
                return show(messageOrOptions, mergedOverrides);
            };
        }

        var call = {
            available: hasToastify,
            show: show,
            info: createTyped('info'),
            success: createTyped('success'),
            warning: createTyped('warning'),
            error: createTyped('error'),
            demo: function () {
                if (!hasToastify) {
                    console.warn('[util.toastify] demo를 실행하려면 Toastify가 필요합니다.');
                    return;
                }
                var queue = [
                    function () { call.show('기본 토스트 예제입니다.'); },
                    function () { call.success('성공 토스트 예제입니다.'); },
                    function () { call.info('정보 토스트 예제입니다.'); },
                    function () { call.warning('경고 토스트 예제입니다.'); },
                    function () { call.error('에러 토스트 예제입니다.'); }
                ];
                var delay = 0;
                var step = 600;
                queue.forEach(function (fn) {
                    window.setTimeout(fn, delay);
                    delay += step;
                });
            }
        };

        return call;
    })()
};
