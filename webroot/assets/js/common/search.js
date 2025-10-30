class Search {
	constructor(config = {}) {
		this.config = Object.assign({
			containerSelector: '.search-container',
			wrapperSelector: '.search-wrapper',
			listSelector: '.search-list',
			pagingSelector: '.paging',
			tableWrapperSelector: '.table-wrap',
			defaultRowsPerPage: 20,
			downloadSuffix: '/download',
			pagingGroupSize: 5,
			localStorageKey: 'searchBean'
		}, config);

		const bindTargets = [
			'submit',
			'downloadExcel',
			'setDate',
			'resetMultipleTag',
			'addTag',
			'removeTag',
			'onKeyDown',
			'openDetail',
			'btnClose',
			'selectOption',
			'chkOption',
			'sizingbtn',
			'logLevelbtn',
			'paging',
			'pagingbtn',
			'common',
			'applyTextMask'
		];

		bindTargets.forEach(method => {
			if (typeof this[method] === 'function') {
				this[method] = this[method].bind(this);
			}
		});
	}

	createSearchBean() {
		return {
			datas: [],
			page: {
				rowsPerPage: this.config.defaultRowsPerPage,
				selectedPage: 0
			}
		};
	}

	getContainer(elem) {
		if (!elem) {
			return null;
		}
		const container = elem.closest(this.config.containerSelector);
		if (!container) {
			console.warn('Search: search container not found', elem);
		}
		return container;
	}

	getWrapper(container) {
		if (!container) {
			return null;
		}
		const wrapper = container.querySelector(this.config.wrapperSelector);
		if (!wrapper) {
			console.warn('Search: search wrapper not found');
		}
		return wrapper;
	}

	getListTarget(container) {
		if (!container) {
			return null;
		}
		const target = container.querySelector(this.config.listSelector);
		if (!target) {
			console.warn('Search: search list target not found');
		}
		return target;
	}

	submit(elem, event, option) {
		if (event && typeof event.preventDefault === 'function') {
			event.preventDefault();
		}

		const container = this.getContainer(elem);
		const wrapper = this.getWrapper(container);
		const listTarget = this.getListTarget(container);

		if (!container || !wrapper || !listTarget) {
			return;
		}

		const requestUrl = wrapper.getAttribute('data-url');
		if (!requestUrl) {
			console.warn('Search: data-url attribute is required');
			return;
		}

		let searchBean = this.createSearchBean();

		if (typeof rowSetting === 'function' && rowSetting(requestUrl)) {
			searchBean.page.rowsPerPage = 100;
		}

		if (option === 'tag') {
			searchBean = this.setTag(elem, searchBean, container, wrapper);
		} else {
			searchBean = this.setOptions(elem, searchBean, container, wrapper);
		}

		const className = elem && typeof elem.className === 'string' ? elem.className : '';
		if (!className.includes('active') && !className.includes('arrow-btn')) {
			searchBean.page.selectedPage = 0;
		}

		console.log('searchBean:', JSON.stringify(searchBean));
		if (typeof window !== 'undefined' && window.localStorage) {
			window.localStorage.setItem(this.config.localStorageKey, JSON.stringify(searchBean.datas));
		}

		if (typeof axios === 'undefined') {
			console.error('Search: axios is required');
			return;
		}

		axios({
			method: 'post',
			url: requestUrl,
			headers: {'Content-Type': 'application/json'},
			data: JSON.stringify(searchBean)
		}).then(response => {
			listTarget.innerHTML = response.data;
			const tableWrap = container.querySelector(this.config.tableWrapperSelector);
			if (tableWrap) {
				this.setTotal(container, tableWrap.getAttribute('data-total'), tableWrap.getAttribute('data-size'));
				const paging = container.querySelector(this.config.pagingSelector);
				if (paging) {
					const current = this.toNumber(tableWrap.getAttribute('data-current')) + 1;
					const last = this.toNumber(tableWrap.getAttribute('data-lastnum'));
					if (last > 0) {
						this.paging(container, current, last);
					}
				}
			}
			this.applyTextMask();

			if (typeof window !== 'undefined' && typeof window.searchCallback === 'function') {
				window.searchCallback();
			}

			const totalKor = container.querySelector('.search-totkr');
			const totalAmt = container.querySelector('.search-tot');
			if (tableWrap && totalKor && totalAmt) {
				totalKor.innerText = tableWrap.getAttribute('data-other') || '';
				totalAmt.innerText = tableWrap.getAttribute('data-other-amt') || '';
			}
		}).catch(error => {
			if (typeof util !== 'undefined' && typeof util.redirect === 'function') {
				util.redirect(error);
			} else {
				console.error(error);
			}
		});
	}

	downloadExcel(elem) {
		if (!(typeof window !== 'undefined' && window.confirm)) {
			return;
		}
		if (!window.confirm('조회 조건에 따라 일정 시간이 소요될 수 있습니다. \n엑셀 다운로드를 진행 하시겠습니까?')) {
			return;
		}

		const container = this.getContainer(elem);
		const wrapper = this.getWrapper(container);
		if (!container || !wrapper) {
			return;
		}

		const requestUrl = wrapper.getAttribute('data-url');
		if (!requestUrl) {
			console.warn('Search: data-url attribute is required');
			return;
		}

		const downloadUrl = requestUrl + this.config.downloadSuffix;
		const payload = this.setOptions(elem, this.createSearchBean(), container, wrapper);

		if (typeof axios === 'undefined') {
			console.error('Search: axios is required');
			return;
		}

		axios({
			method: 'post',
			url: downloadUrl,
			headers: {'Content-Type': 'application/json'},
			data: JSON.stringify(payload)
		}).then(res => {
			if (!res || !res.data) {
				return;
			}
			if (res.data.result && res.data.result.code === '600') {
				window.alert(res.data.result.msg);
				return;
			}

			const stored = typeof window !== 'undefined' && window.localStorage ? JSON.parse(window.localStorage.getItem(this.config.localStorageKey) || '[]') : [];
			if (typeof crud !== 'undefined' && typeof crud.axios === 'function') {
				crud.axios('insert', '/axios/secure/excel/all', {
					url: downloadUrl,
					where: stored,
					size: res.data.size
				}, 'post', 'application/json', function() { console.log('excel download logged'); });
			}

			if (res.data.file && res.data.file.link) {
				window.open(res.data.file.link);
				setTimeout(() => {
					if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
						URL.revokeObjectURL(res.data.file.link);
					}
				}, 100);
			}
		}).catch(error => {
			if (typeof util !== 'undefined' && typeof util.redirect === 'function') {
				util.redirect(error);
			} else {
				console.error(error);
			}
		});
	}

	setOptions(elem, searchBean, container, wrapper) {
		const searchWrap = wrapper;
		if (!searchWrap) {
			return searchBean;
		}

		const bean = searchBean;
		let priority = 1;

		const defaultDateElem = searchWrap.querySelector('.def-date');
		const blankDate = searchWrap.querySelector('.blank-date');

		if (!(blankDate && defaultDateElem && defaultDateElem.value === '')) {
			if (defaultDateElem) {
				if (!defaultDateElem.value && typeof util !== 'undefined' && typeof util.dateToString === 'function') {
					const today = util.dateToString(new Date());
					defaultDateElem.value = today + ' - ' + today;
				}
				const data = this.getDataFromInput(defaultDateElem);
				data.priority = 0;
				bean.datas.push(data);
			}

			if (searchWrap.querySelector('.def-start-time') && searchWrap.querySelector('.def-end-time')) {
				const startElem = searchWrap.querySelector('.def-start-time');
				const endElem = searchWrap.querySelector('.def-end-time');
				if (startElem && !startElem.value) {
					startElem.value = '000000';
				}
				if (endElem && !endElem.value) {
					endElem.value = '235959';
				}
				if (startElem) {
					const startData = this.getDataFromInput(startElem);
					startData.priority = 0;
					bean.datas.push(startData);
				}
				if (endElem) {
					const endData = this.getDataFromInput(endElem);
					endData.priority = 0;
					bean.datas.push(endData);
				}
			}

			const levelElem = searchWrap.querySelector('.log-level');
			if (levelElem) {
				if (!levelElem.value) {
					levelElem.value = '30000';
				} else {
					levelElem.value = this.setLevelInt(levelElem);
				}
				const levelData = this.getDataFromInput(levelElem);
				levelData.priority = 0;
				bean.datas.push(levelData);
			}
		}

		const defValueElem = searchWrap.querySelector('.search-def');
		if (defValueElem && defValueElem.value) {
			const defValue = defValueElem.value;
			searchWrap.querySelectorAll('.search-def-option input').forEach(each => {
				const data = this.getDataFromInput(each);
				data.value = defValue;
				data.priority = priority++;
				data.group = 1;
				bean.datas.push(data);
			});
		}

		searchWrap.querySelectorAll('.search-option').forEach(each => {
			const data = this.getDataFromInput(each);
			data.priority = priority++;
			if (data.value !== '') {
				bean.datas.push(data);
			}
		});

		this.applyRangeFilters(bean.datas);
		this.applyPagingInfo(container, bean);

		return bean;
	}

	setTag(elem, searchBean, container, wrapper) {
		const searchWrap = wrapper;
		if (!searchWrap) {
			return searchBean;
		}

		let priority = 1;
		searchWrap.querySelectorAll('.tag').forEach(each => {
			if (each.style.display === 'none') {
				return;
			}
			const data = this.getTagDataFromInput(each);
			data.priority = priority++;
			if (data.value) {
				searchBean.datas.push(data);
			}
		});

		this.applyRangeFilters(searchBean.datas);
		this.applyPagingInfo(container, searchBean);

		return searchBean;
	}

	getDataFromInput(elem) {
		return {
			value: elem.value,
			id: elem.name,
			oper: elem.getAttribute('data-oper') ? elem.getAttribute('data-oper') : 'eq',
			operSep: elem.getAttribute('data-oper-sep'),
			group: elem.getAttribute('data-group'),
			priority: elem.getAttribute('data-priority')
		};
	}

	getTagDataFromInput(elem) {
		const label = elem.querySelector('.tag-label');
		return {
			value: label ? label.innerText : '',
			id: elem.getAttribute('data-id'),
			oper: elem.getAttribute('data-oper') ? elem.getAttribute('data-oper') : 'eq',
			operSep: elem.getAttribute('data-oper-sep') === 'null' ? null : elem.getAttribute('data-oper-sep'),
			group: elem.getAttribute('data-group'),
			priority: elem.getAttribute('data-priority')
		};
	}

	setDate(elem) {
		const container = elem.closest('.search-form-left');
		if (!container) {
			return;
		}
		const rangePicker = container.querySelector('.search-daterangepicker');
		if (rangePicker) {
			rangePicker.classList.remove('on');
			rangePicker.value = '';
		}
		const boxVal = container.querySelector('.w-30 .box-val');
		if (boxVal) {
			boxVal.value = '';
		}
		const clicked = container.querySelector('.search-btn-click');
		if (clicked) {
			clicked.classList.remove('search-btn-click');
		}
		elem.classList.add('search-btn-click');

		const defDate = document.querySelector('.def-date');
		if (!defDate || typeof util === 'undefined' || typeof util.dateToString !== 'function') {
			return;
		}

		const date = new Date();
		const currentDate = util.dateToString(date);
		let val = '';
		switch (elem.value) {
		case 't':
			val = currentDate + ' - ' + currentDate;
			break;
		case 'w':
			date.setDate(date.getDate() - 7);
			val = util.dateToString(date) + ' - ' + currentDate;
			break;
		case 'm':
			date.setMonth(date.getMonth() - 1);
			val = util.dateToString(date) + ' - ' + currentDate;
			break;
		case '3m':
			date.setMonth(date.getMonth() - 3);
			val = util.dateToString(date) + ' - ' + currentDate;
			break;
		case 'y':
			date.setDate(date.getDate() - 1);
			val = util.dateToString(date) + ' - ' + util.dateToString(date);
			break;
		default:
			val = currentDate + ' - ' + currentDate;
		}
		defDate.value = val;
		this.addTag(elem, 'fixed');
	}

	setLevelInt(elem) {
		switch (elem.value) {
		case 'TRACE': return '5000';
		case 'DEBUG': return '10000';
		case 'INFO': return '20000';
		case 'WARN': return '30000';
		case 'ERROR': return '40000';
		case '30000': return '30000';
		default: return '30000';
		}
	}

	resetMultipleTag(elem) {
		const selectWrap = elem.closest('.select-multiple');
		if (!selectWrap) {
			return;
		}
		const searchOptionElem = selectWrap.querySelector('.box-val');
		if (searchOptionElem) {
			const selector = `.tag[data-id="${searchOptionElem.name}"]`;
			const searchTag = document.querySelector(selector);
			if (searchTag) {
				this.removeTag(searchTag);
			}
		}
		setTimeout(() => {
			elem.classList.remove('on');
		}, 200);
	}

	addTag(elem, opt) {
		const wrapper = elem.closest(this.config.wrapperSelector);
		const boxGroup = elem.closest('.box-group');
		if (!wrapper || !boxGroup) {
			return;
		}

		const tagField = wrapper.querySelector('.field');
		const tagTemplate = wrapper.querySelector('.tag-temp');
		const valueInput = boxGroup.querySelector('.box-val');
		if (!tagField || !tagTemplate || !valueInput) {
			return;
		}

		if (valueInput.classList.contains('typeahead')) {
			const firstVal = boxGroup.querySelector('.box-val:nth-child(1)');
			const secondVal = boxGroup.querySelector('.box-val:nth-child(2)');
			if (firstVal && secondVal) {
				firstVal.value = secondVal.value;
			}
		}

		let val = valueInput.value;
		let id = valueInput.name;
		let oper = valueInput.getAttribute('data-oper');
		let order = valueInput.getAttribute('data-order');
		let operSep = valueInput.getAttribute('data-oper-sep');
		let group = valueInput.getAttribute('data-group');
		let name = '';

		const selectGroup = boxGroup.querySelector('label > ul.select-form-group');
		const selectGroupSys = boxGroup.querySelector('label > ul.select-form-group-sys');
		if (selectGroup) {
			const selector = boxGroup.querySelector('.select-detail-date');
			if (selector) {
				const idx = selector.options.selectedIndex;
				if (idx > -1) {
					name = selector.options[idx].innerHTML;
				}
			}
		} else if (selectGroupSys) {
			const daySelector = boxGroup.querySelector('.day-selector');
			if (daySelector) {
				const idx = daySelector.options.selectedIndex;
				if (idx > -1) {
					const option = daySelector.options[idx];
					id = option.value || id;
					name = option.innerHTML;
					oper = option.getAttribute('data-oper') || oper;
					order = option.getAttribute('data-order') || order;
					operSep = option.getAttribute('data-oper-sep') || operSep;
					group = option.getAttribute('data-group') || group;
				}
			}
		} else {
			const label = boxGroup.querySelector('.box-name');
			name = label ? label.innerText : '';
		}

		const existing = tagField.querySelector(`[data-id="${id}"]`);
		if (existing) {
			tagField.removeChild(existing);
		}

		if (!val) {
			return;
		}

		const tagDiv = document.createElement('div');
		tagDiv.className = 'tag';
		tagDiv.innerHTML = tagTemplate.innerHTML;
		tagDiv.setAttribute('data-id', id);
		tagDiv.setAttribute('data-oper', oper);
		tagDiv.setAttribute('data-oper-sep', operSep);
		tagDiv.setAttribute('data-order', order);
		tagDiv.setAttribute('data-group', group);
		if (opt === 'fixed') {
			tagDiv.classList.add('fixed');
		}

		tagField.appendChild(tagDiv);

		const tagLabel = tagDiv.querySelector('.tag-label');
		if (tagLabel) {
			tagLabel.innerText = val;
		}

		tagDiv.addEventListener('mouseover', () => {
			if (tagLabel) {
				tagLabel.innerText = name ? `${name} : ${val}` : val;
			}
		});
		tagDiv.addEventListener('mouseleave', () => {
			if (tagLabel) {
				tagLabel.innerText = val;
			}
		});

		const closeButton = tagDiv.querySelector('.tag-close');
		if (closeButton) {
			closeButton.addEventListener('click', () => {
				this.removeTag(tagDiv);
				const tagId = tagDiv.getAttribute('data-id');
				if (tagId) {
					const matched = Array.prototype.slice.call(document.getElementsByName(tagId));
					matched.forEach(input => {
						input.checked = false;
						input.value = '';
						if (input.parentElement && input.parentElement.children[0]) {
							input.parentElement.children[0].value = '';
						}
					});
				}
				if (valueInput) {
					valueInput.disabled = false;
				}
			});
		}

		valueInput.disabled = false;

		const reloadButton = wrapper.querySelector('.search-reload');
		if (reloadButton && !reloadButton.dataset.searchReloadBound) {
			reloadButton.dataset.searchReloadBound = 'true';
			reloadButton.addEventListener('click', () => {
				this.removeTag(tagDiv);
				wrapper.querySelectorAll('.search-option').forEach(optionElem => {
					optionElem.value = '';
				});
				const form = document.querySelector("form[name='search-contents']");
				if (form) {
					form.reset();
				}
				valueInput.disabled = false;
			});
		}
	}

	removeTag(elem) {
		const target = elem && elem.classList.contains('tag') ? elem : elem && elem.closest('.tag');
		if (!target) {
			return;
		}
		target.style.display = 'none';
		const suggestList = document.querySelectorAll('.select-multiple.select-input.suggest-search');
		suggestList.forEach(container => {
			container.querySelectorAll('li').forEach(item => {
				item.classList.remove('on');
			});
		});
	}

	onKeyDown(elem, option, nativeEvent) {
		const evt = nativeEvent || (typeof window !== 'undefined' ? window.event : null);
		if (evt && evt.keyCode === 13) {
			if (option === 'tag') {
				this.submit(elem, null, 'tag');
			} else {
				this.submit(elem);
			}
		}
	}

	openDetail(elem) {
		const wrapper = elem.closest(this.config.wrapperSelector);
		if (!wrapper) {
			return;
		}
		const detailContents = wrapper.querySelector('.detail-contents');
		if (!detailContents) {
			return;
		}
		const tagContents = wrapper.querySelector('.tag-contents');
		const detailBtn = wrapper.querySelector('.detail-btn');

		if (detailContents.style.display === 'none') {
			detailContents.style.display = 'flex';
			if (tagContents) {
				tagContents.style.display = 'flex';
			}
			wrapper.classList.add('on');
			if (detailBtn) {
				detailBtn.classList.add('on');
			}
			const searchDef = wrapper.querySelector('.search-def');
			if (searchDef) {
				searchDef.value = '';
			}
			if (wrapper.classList.contains('on')) {
				const tag = wrapper.querySelector('.tag');
				if (tag) {
					tag.style.display = 'none';
				}
			}
			if (document.body.classList.contains('mobile')) {
				const page = document.querySelector('.page');
				if (page) {
					page.style.zIndex = 9999;
				}
			}
		} else {
			detailContents.style.display = 'none';
			if (tagContents) {
				tagContents.style.display = 'none';
			}
			if (detailBtn) {
				detailBtn.classList.remove('on');
			}
			wrapper.classList.remove('on');
			if (document.body.classList.contains('mobile')) {
				const page = document.querySelector('.page');
				if (page) {
					page.style.zIndex = 11;
				}
			}
		}
	}

	btnClose(elem) {
		const wrapper = elem.closest(this.config.wrapperSelector);
		if (!wrapper) {
			return;
		}
		const detailContents = wrapper.querySelector('.detail-contents');
		if (detailContents) {
			detailContents.style.display = 'none';
		}
		const tagContents = wrapper.querySelector('.tag-contents');
		if (tagContents) {
			tagContents.style.display = 'none';
		}
		const detailBtn = wrapper.querySelector('.detail-btn');
		if (detailBtn) {
			detailBtn.querySelector('span').innerHTML = '상세조건';
			detailBtn.classList.remove('on');
		}
		wrapper.classList.remove('on');
		if (document.body.classList.contains('mobile')) {
			const page = document.querySelector('.page');
			if (page) {
				page.style.zIndex = 11;
			}
		}
	}

	selectOption(elem) {
		const boxGroup = elem.closest('.box-group');
		if (!boxGroup) {
			return;
		}
		const elemBoxVal = boxGroup.querySelector('.box-val');
		if (!elemBoxVal) {
			return;
		}
		if (!elem.value && elem.getAttribute('data-value') !== null) {
			elemBoxVal.value = elem.getAttribute('data-value');
			if (elem.parentElement && elem.parentElement.getAttribute('data-name')) {
				elemBoxVal.name = elem.parentElement.getAttribute('data-name');
			}
		} else {
			elemBoxVal.value = elem.value;
			elemBoxVal.name = elem.name;
		}
		setTimeout(() => {
			this.addTag(elem);
		}, 200);
	}

	chkOption(elem) {
		const boxGroup = elem.closest('.box-group');
		if (!boxGroup) {
			return;
		}
		const boxVal = boxGroup.querySelector('.box-val');
		if (!boxVal) {
			return;
		}
		boxVal.name = elem.name;
		const label = elem.closest('.search-check') ? elem.closest('.search-check').querySelector('.chk-label') : null;
		boxVal.value = label ? label.innerHTML : '';
		this.addTag(elem);
	}

	setTotal(container, totalSize, rowsPerPage) {
		const totalElem = container.querySelector('.search-total');
		const tableWrap = container.querySelector(this.config.tableWrapperSelector);
		if (totalElem) {
			totalElem.innerText = totalSize;
		}
		if (tableWrap) {
			tableWrap.setAttribute('data-total', totalSize);
		}
		this.setSizing(container, rowsPerPage);
	}

	setSizing(container, rowsPerPage) {
		const sizeElem = container.querySelector('.search-sizing .rowsPerPage');
		const tableWrap = container.querySelector(this.config.tableWrapperSelector);
		if (sizeElem) {
			sizeElem.innerText = 'show ' + rowsPerPage;
			if (document.body.classList.contains('mobile')) {
				sizeElem.innerHTML = '';
			}
		}
		if (tableWrap) {
			tableWrap.setAttribute('data-size', rowsPerPage);
		}
	}

	sizingbtn(elem) {
		const container = this.getContainer(elem);
		if (!container) {
			return;
		}
		const tableWrap = container.querySelector(this.config.tableWrapperSelector);
		if (!tableWrap) {
			return;
		}
		const rowsPerPage = elem.innerText.replace('show ', '');
		if (rowsPerPage !== tableWrap.getAttribute('data-size')) {
			this.setSizing(container, rowsPerPage);
			tableWrap.setAttribute('data-current', 0);
			this.submit(elem);
		}
	}

	logLevelbtn(elem) {
		const levelInt = document.getElementById('levelInt');
		if (levelInt) {
			levelInt.value = elem.innerText;
		}
		this.submit(elem);
	}

	paging(container, current, lastNum) {
		const numContainer = container.querySelector('.paging .num');
		if (!numContainer) {
			return;
		}
		numContainer.innerHTML = '';

		const groupSize = this.config.pagingGroupSize;
		const group = Math.ceil(current / groupSize);
		const first = (group - 1) * groupSize + 1;
		let last = first + groupSize - 1;
		if (last > lastNum) {
			last = lastNum;
		}

		for (let i = first; i <= last; i++) {
			const link = document.createElement('a');
			link.textContent = i;
			if (i === current) {
				link.classList.add('active');
			}
			link.addEventListener('click', () => {
				const tableWrap = container.querySelector(this.config.tableWrapperSelector);
				if (tableWrap) {
					tableWrap.setAttribute('data-current', i - 1);
				}
				container.querySelectorAll('.paging .num a.active').forEach(active => active.classList.remove('active'));
				link.classList.add('active');
				this.submit(link);
			});
			numContainer.appendChild(link);
		}

		const prevBtn = container.querySelector('.prev-btn');
		if (prevBtn) {
			if (group <= 1) {
				prevBtn.classList.add('block');
				prevBtn.setAttribute('disabled', true);
			} else {
				prevBtn.classList.remove('block');
				prevBtn.removeAttribute('disabled');
			}
		}

		const nextBtn = container.querySelector('.next-btn');
		if (nextBtn) {
			if (last === lastNum) {
				nextBtn.classList.add('block');
				nextBtn.setAttribute('disabled', true);
			} else {
				nextBtn.classList.remove('block');
				nextBtn.removeAttribute('disabled');
			}
		}
	}

	pagingbtn(direction, elem) {
		const container = this.getContainer(elem);
		if (!container) {
			return;
		}
		const tableWrap = container.querySelector(this.config.tableWrapperSelector);
		if (!tableWrap) {
			return;
		}
		let current = this.toNumber(tableWrap.getAttribute('data-current')) + 1;
		const lastNum = this.toNumber(tableWrap.getAttribute('data-lastnum'));
		const groupSize = this.config.pagingGroupSize;
		const group = Math.ceil(current / groupSize);
		const first = (group - 1) * groupSize + 1;
		const last = first + groupSize;

		if (direction === 'prev') {
			current = first - 1;
		}
		if (direction === 'next') {
			current = last;
		}

		if (current < 1) {
			current = 1;
		}
		if (current > lastNum) {
			current = lastNum;
		}

		tableWrap.setAttribute('data-current', current - 1);
		this.paging(container, current, lastNum);
		this.submit(elem);
	}

	common(elem, url, customBean) {
		const container = this.getContainer(elem);
		if (!container) {
			return;
		}
		const target = container.querySelector('.common-list');
		if (!target) {
			return;
		}
		const wrapper = this.getWrapper(container);
		const requestUrl = url || (wrapper ? wrapper.getAttribute('data-url') : '');
		if (!requestUrl) {
			console.warn('Search: data-url attribute is required for common search');
			return;
		}

		const searchBean = customBean || this.createSearchBean();
		this.applyPagingInfo(container, searchBean);

		if (typeof axios === 'undefined') {
			console.error('Search: axios is required');
			return;
		}

		axios({
			method: 'post',
			url: requestUrl,
			headers: {'Content-Type': 'application/json'},
			data: JSON.stringify(searchBean)
		}).then(response => {
			target.innerHTML = response.data;
			const tableWrap = container.querySelector(this.config.tableWrapperSelector);
			if (tableWrap) {
				this.setTotal(container, tableWrap.getAttribute('data-total'), tableWrap.getAttribute('data-size'));
				const paging = container.querySelector(this.config.pagingSelector);
				if (paging) {
					const current = this.toNumber(tableWrap.getAttribute('data-current')) + 1;
					const last = this.toNumber(tableWrap.getAttribute('data-lastnum'));
					if (last > 0) {
						this.paging(container, current, last);
					}
				}
			}
			this.applyTextMask();
		}).catch(error => {
			if (typeof util !== 'undefined' && typeof util.redirect === 'function') {
				util.redirect(error);
			} else {
				console.error(error);
			}
		});
	}

	applyTextMask() {
		if (typeof $ === 'undefined') {
			return;
		}

		const dateMask = $('.pg-view-group .form-control-static.date, td.date, span.date, td.day');
		const timeMask = $('.pg-view-group .form-control-static.time, td.time, span.time');
		const patt = /^[0-9]{8}$/;
		const pattM = /^[0-9]{6}$/;
		const pattT = /^[0-9]{14}$/;
		const pattFULL = /^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/;
		const pattH = /^[0-9]{10}$/;
		const pattLOG = /^[0-9]{17}/;

		$.each(dateMask, function(i, e) {
			const txt = $(e).text().trim();
			if (txt && patt.test(txt)) {
				$(e).text(txt.substr(0, 4) + '-' + txt.substr(4, 2) + '-' + txt.substr(6, 2));
			} else if (txt && pattM.test(txt)) {
				$(e).text(txt.substr(0, 4) + '-' + txt.substr(4, 2));
			} else if (txt && pattT.test(txt)) {
				$(e).text(txt.substr(0, 4) + '-' + txt.substr(4, 2) + '-' + txt.substr(6, 2) + ' ' + txt.substr(8, 2) + ':' + txt.substr(10, 2) + ':' + txt.substr(12, 2));
			} else if (txt && pattH.test(txt)) {
				$(e).text(txt.substr(0, 4) + '-' + txt.substr(4, 2) + '-' + txt.substr(6, 2) + ' ' + txt.substr(8, 2));
			} else if (txt && pattFULL.test(txt)) {
				$(e).text(txt.substr(0, 19));
			} else if (txt && pattLOG.test(txt)) {
				$(e).text(txt.substr(0, 4) + '-' + txt.substr(4, 2) + '-' + txt.substr(6, 2) + ' ' + txt.substr(8, 2) + ':' + txt.substr(10, 2) + ':' + txt.substr(12, 2) + ':' + txt.substr(14, 2) + ':' + txt.substr(16, 3));
			}
		});

		$.each(timeMask, function(i, e) {
			const txt = $(e).text().trim();
			if (txt && pattM.test(txt)) {
				$(e).text(txt.substr(0, 2) + ':' + txt.substr(2, 2) + ':' + txt.substr(4, 2));
			}
		});

		const currencyMask = $('.digits');
		const currencyPatt = /(^[0-9]*$)|(^-[0-9]*$)/;
		$.each(currencyMask, function(i, e) {
			const txt = $(e).text().trim();
			if (txt && currencyPatt.test(txt)) {
				$(e).text(txt.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,'));
			}
		});

		const rateT = $('.rate');
		$.each(rateT, function(i, e) {
			const txt = $(e).text().trim();
			if ($.isNumeric(txt) && txt >= 0 && txt <= 99.99) {
				$(e).text((txt * 100).toFixed(2) + ' %');
			}
		});

		const amountMask = $('.amount');
		$.each(amountMask, function(i, e) {
			let val = ($(e).is('input') ? $(e).val() : $(e).text()).trim();
			if (!val || !/^([\d\-\.]*)$/g.test(val)) {
				return;
			}
			let digit = val.split('.')[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
			const minus = digit.substring(0, 1) === '-' ? '-' : '';
			if (minus) {
				digit = digit.replace('-', '');
			}
			digit = minus + digit;
			val = digit;
			if ($(e).is('input')) {
				$(e).val(val);
			} else {
				$(e).text(val);
			}
		});

		const daySelector = document.querySelector('.day-selector');
		const selectDetailDate = document.querySelector('.select-detail-date');
		if (daySelector) {
			daySelector.addEventListener('change', e => {
				const defDate = document.getElementById('defDate');
				if (defDate) {
					defDate.setAttribute('name', e.target.value);
				}
			});
		}
		if (selectDetailDate) {
			selectDetailDate.addEventListener('change', e => {
				const detailDate = document.getElementById('defDate');
				if (detailDate) {
					detailDate.setAttribute('name', e.target.value);
				}
			});
		}

		const minAmount = $('.min-amount');
		$.each(minAmount, function(i, e) {
			const val = ($(e).is('input') ? $(e).val() : $(e).text()).replace(/,|$|₩|¥/gi, '');
			if (val < 0) {
				$(e).css('color', 'red');
			} else if ((val.split('$')[1]) < 0 || typeof currency !== 'undefined' && currency === 'USD') {
				$(e).css('color', 'red');
			}
		});
	}

	applyPagingInfo(container, searchBean) {
		if (!container) {
			return;
		}
		const tableWrap = container.querySelector(this.config.tableWrapperSelector);
		if (!tableWrap) {
			return;
		}
		const rows = this.toNumber(tableWrap.getAttribute('data-size'), searchBean.page.rowsPerPage);
		const current = this.toNumber(tableWrap.getAttribute('data-current'), searchBean.page.selectedPage);
		searchBean.page.rowsPerPage = rows;
		searchBean.page.selectedPage = current;
	}

	applyRangeFilters(datas) {
		if (!Array.isArray(datas) || datas.length === 0) {
			return;
		}
		const normalized = [];
		datas.forEach(data => {
			if (!data) {
				return;
			}
			if (!data.operSep) {
				normalized.push(data);
				return;
			}
			const parts = this.splitValue(data.value, data.operSep);
			if (parts.length > 1) {
				const lower = this.normalizeRangeValue(parts[0]);
				const upper = this.normalizeRangeValue(parts[1]);
				const lowerData = this.cloneData(data);
				lowerData.value = lower;
				lowerData.operSep = '';
				lowerData.oper = 'ge';
				normalized.push(lowerData);
				const upperData = this.cloneData(data);
				upperData.value = upper;
				upperData.operSep = '';
				upperData.oper = 'le';
				normalized.push(upperData);
			} else {
				const exactData = this.cloneData(data);
				exactData.value = this.normalizeRangeValue(parts[0]);
				exactData.operSep = '';
				exactData.oper = 'eq';
				normalized.push(exactData);
			}
		});
		datas.length = 0;
		normalized.forEach(item => datas.push(item));
	}

	splitValue(value, separator) {
		const target = value == null ? '' : String(value);
		if (!separator) {
			return [target];
		}
		if (typeof _ !== 'undefined' && typeof _.split === 'function') {
			return _.split(target, separator, 2);
		}
		return target.split(separator, 2);
	}

	normalizeRangeValue(value) {
		return String(value || '').replace(/-/g, '');
	}

	cloneData(data) {
		if (typeof _ !== 'undefined' && typeof _.cloneDeep === 'function') {
			return _.cloneDeep(data);
		}
		return JSON.parse(JSON.stringify(data));
	}

	toNumber(value, fallback = 0) {
		const num = Number(value);
		return Number.isNaN(num) ? fallback : num;
	}
}

const search = new Search();
if (typeof window !== 'undefined') {
	window.search = search;
	window.Search = Search;
	window.textMask = function() {
		return search.applyTextMask();
	};
}
