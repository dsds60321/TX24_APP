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

	// SweetAlert2 헬퍼 (ex: util.sweetAlert.success('저장되었습니다.');)
	sweetAlert: (function () {
		var swalLib = (function () {
			if (typeof Swal === 'function') {
				return Swal;
			}
			if (typeof Sweetalert2 === 'function') {
				return Sweetalert2;
			}
			if (typeof window !== 'undefined' && typeof window.Sweetalert2 === 'function') {
				return window.Sweetalert2;
			}
			return null;
		})();
		var hasSwal = !!swalLib;
		var palette = {
			text: '#0f172a',
			muted: '#475569',
			background: '#ffffff',
			confirm: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
			success: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
			warning: 'linear-gradient(135deg, #d97706 0%, #facc15 100%)',
			danger: 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
			info: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
			cancelBg: '#f3f4f6',
			cancelText: '#0f172a'
		};

		var baseOptions = {
			confirmButtonText: '확인',
			cancelButtonText: '취소',
			showConfirmButton: true,
			buttonsStyling: false,
			focusConfirm: false,
			returnFocus: false,
			customClass: {
				popup: 'tx-swal-popup',
				title: 'tx-swal-title',
				htmlContainer: 'tx-swal-text',
				confirmButton: 'tx-swal-confirm',
				cancelButton: 'tx-swal-cancel'
			}
		};

		var iconThemes = {
			success: { icon: 'success', iconColor: '#22c55e' },
			info: { icon: 'info', iconColor: '#0ea5e9' },
			warning: { icon: 'warning', iconColor: '#f97316' },
			error: { icon: 'error', iconColor: '#ef4444' }
		};

		function extend(target) {
			target = target || {};
			for (var i = 1; i < arguments.length; i++) {
				var source = arguments[i] || {};
				for (var key in source) {
					if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
						target[key] = source[key];
					}
				}
			}
			return target;
		}

		function mergeOptions(messageOrOptions, overrides) {
			var resolved = typeof messageOrOptions === 'string'
				? { text: messageOrOptions }
				: (messageOrOptions || {});
			var finalOptions = extend({}, baseOptions, resolved, overrides);
			finalOptions.customClass = extend({}, baseOptions.customClass, resolved.customClass, overrides && overrides.customClass);
			return finalOptions;
		}

		function getFallbackText(options) {
			if (!options) {
				return '';
			}
			if (options.text) {
				return options.text;
			}
			if (options.title) {
				return options.title;
			}
			if (typeof options.html === 'string') {
				return options.html.replace(/<[^>]+>/g, '');
			}
			return '';
		}

		function fallbackResponse(options, mode) {
			var message = getFallbackText(options) || '알림을 표시할 수 없습니다.';
			if (mode === 'confirm') {
				var confirmed = window.confirm(message);
				return {
					isConfirmed: confirmed,
					isDenied: false,
					isDismissed: !confirmed,
					value: confirmed
				};
			}
			if (mode === 'prompt') {
				var value = window.prompt(message, options && options.inputValue ? options.inputValue : '');
				return {
					isConfirmed: value !== null,
					isDenied: false,
					isDismissed: value === null,
					value: value
				};
			}
			window.alert(message);
			return {
				isConfirmed: true,
				isDenied: false,
				isDismissed: false,
				value: true
			};
		}

		function toneFromOptions(options) {
			if (!options) {
				return 'primary';
			}
			var icon = options.icon;
			if (icon === 'success') {
				return 'success';
			}
			if (icon === 'warning') {
				return 'warning';
			}
			if (icon === 'error') {
				return 'danger';
			}
			if (icon === 'info' || icon === 'question') {
				return 'info';
			}
			return 'primary';
		}

		function applyTheme(popup, options) {
			if (!popup) {
				return;
			}
			var tone = toneFromOptions(options);
			var confirmButton = popup.querySelector('.swal2-confirm');
			var cancelButton = popup.querySelector('.swal2-cancel');
			if (options.toast) {
				popup.style.background = 'rgba(15, 23, 42, 0.95)';
				popup.style.color = '#f8fafc';
				popup.style.borderRadius = '999px';
				popup.style.boxShadow = '0 10px 25px rgba(15, 23, 42, 0.3)';
				if (confirmButton) {
					confirmButton.style.display = 'none';
				}
				return;
			}
			popup.style.borderRadius = '16px';
			popup.style.padding = '24px 28px';
			popup.style.border = '1px solid rgba(15, 23, 42, 0.08)';
			popup.style.boxShadow = '0 30px 60px rgba(15, 23, 42, 0.18)';
			popup.style.background = palette.background;
			popup.style.color = palette.text;
			var title = popup.querySelector('.swal2-title');
			var html = popup.querySelector('.swal2-html-container');
			var actions = popup.querySelector('.swal2-actions');

			if (title) {
				title.style.fontWeight = '600';
				title.style.fontSize = '1.25rem';
				title.style.color = palette.text;
			}
			if (html) {
				html.style.color = palette.muted;
				html.style.fontSize = '0.95rem';
			}
			if(actions) {
				actions.style.gap = '0.75rem';
			}
			if (confirmButton) {
				confirmButton.style.background = palette[tone] || palette.confirm;
				confirmButton.style.border = 'none';
				confirmButton.style.color = '#ffffff';
				confirmButton.style.padding = '0.65rem 1.5rem';
				confirmButton.style.borderRadius = '999px';
				confirmButton.style.fontWeight = '600';
			}
			if (cancelButton) {
				cancelButton.style.background = palette.cancelBg;
				cancelButton.style.color = palette.cancelText;
				cancelButton.style.border = '1px solid rgba(15, 23, 42, 0.08)';
				cancelButton.style.padding = '0.65rem 1.5rem';
				cancelButton.style.borderRadius = '999px';
				cancelButton.style.fontWeight = '500';
				cancelButton.style.marginLeft = '0.5rem';
			}
		}

		function fire(messageOrOptions, overrides, fallbackMode) {
			var options = mergeOptions(messageOrOptions, overrides);
			if (!hasSwal) {
				return Promise.resolve(fallbackResponse(options, fallbackMode));
			}
			var userDidOpen = options.didOpen;
			options.didOpen = function (popup) {
				applyTheme(popup, options);
				if (typeof userDidOpen === 'function') {
					userDidOpen.call(this, popup);
				}
			};
			return swalLib.fire(options);
		}

		function createIcon(icon) {
			var iconOption = iconThemes[icon] || {};
			return function (messageOrOptions, overrides) {
				var mergedOverrides = extend({ icon: icon }, iconOption, overrides);
				return fire(messageOrOptions, mergedOverrides);
			};
		}

		/**
		 * confirm Promise 값 응답
		 */
		function confirmPromise(messageOrOptions, overrides) {
			var confirmOverrides = extend({
				icon: 'question',
				showCancelButton: true,
				reverseButtons: true,
				confirmButtonText: '확인',
				cancelButtonText: '취소'
			}, overrides);
			return fire(messageOrOptions, confirmOverrides, 'confirm');
		}

		/**
		 * Boolean 응답
		 */
		function confirm(messageOrOptions, overrides) {
			return confirmPromise(messageOrOptions, overrides).then(function (result) {
				return !!result.isConfirmed;
			});
		}

		function prompt(messageOrOptions, overrides) {
			var promptOverrides = extend({
				icon: 'info',
				input: 'text',
				showCancelButton: true,
				confirmButtonText: '입력',
				cancelButtonText: '취소'
			}, overrides);
			return fire(messageOrOptions, promptOverrides, 'prompt');
		}

		function toast(messageOrOptions, overrides) {
			var toastOverrides = extend({
				toast: true,
				position: 'top-end',
				showConfirmButton: false,
				timer: 2600,
				timerProgressBar: true,
				width: 360,
				didOpen: function (toastEl) {
					if (hasSwal && swalLib && typeof swalLib.stopTimer === 'function' && typeof swalLib.resumeTimer === 'function') {
						toastEl.addEventListener('mouseenter', swalLib.stopTimer);
						toastEl.addEventListener('mouseleave', swalLib.resumeTimer);
					}
				}
			}, overrides);
			return fire(messageOrOptions, toastOverrides);
		}

		return {
			available: hasSwal,
			fire: function (messageOrOptions, overrides) {
				return fire(messageOrOptions, overrides);
			},
			alert: function (messageOrOptions, overrides) {
				return fire(messageOrOptions, overrides);
			},
			success: createIcon('success'),
			error: createIcon('error'),
			warning: createIcon('warning'),
			info: createIcon('info'),
			confirm: confirm,
			confirmPromise : confirmPromise,
			prompt: prompt,
			toast: toast
		};
	})(),

	// toastify 노티 유틸
	toastify : (function () {
        var hasToastify = typeof Toastify === 'function';
        var activeToast = null;

        var baseOptions = {
            duration: 3000,
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
            error: createTyped('error')
        };

		return call;
	})()
};
