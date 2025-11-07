(function (window, document) {
	const ERROR_ICON_HTML = '<i class="fa-solid fa-circle-exclamation me-1"></i>';
	let TIME_OUT = 180;


	const TwoFactorPage = {
		init() {
			this.cacheElements();
			this.bindEvents();
		},

		cacheElements() {
			this.form = document.twoFactorForm,
			this.options = document.querySelectorAll('.two-fa-option')
		},

		bindEvents() {

			// 선택 이벤트
			this.options.forEach((opt) => this.optionClickEvt(opt));
		},


		optionClickEvt(elem) {
			elem.addEventListener('click', () => {
				const type = elem.dataset.type;
				if (!type) {
					util.toastify.error('타입을 확인 할 수 없습니다.');
					return;
				}

				document.getElementById(type).checked = true;
				this.options.forEach((opt) => opt.classList.remove('selected'));

				elem.classList.add('selected');
			});
		}


	};

	document.addEventListener('DOMContentLoaded', () => {
		TwoFactorPage.init();
	});
})(window, document);
