export default class Search {
	constructor() {
		this.bean = {
			datas: [],
			page: {
				rowsPerPage: 20,
				selectedPage: 0
			}
		};
		this.layout = typeof window !== 'undefined' ? window.layout : null;
	}

	async submit(elem, event, option) {
		if (event && typeof event.preventDefault === 'function') {
			event.preventDefault();
		}

		console.log('search2 start');
		const searchContainer = document.querySelector('.card-wrapper.search'); // 검색 HTML
		const paging = document.querySelector('.paging'); // 페이징
		const pageContainer = document.querySelector('.page-container'); // 데이터 화면
		const tableContent = document.querySelector('.table-contents'); // 데이터 화면
		const submitButton = elem instanceof HTMLElement
			? elem
			: searchContainer?.querySelector('.search-submit-btn') || searchContainer?.querySelector('.search-btn.btn-primary');
		const url = searchContainer?.dataset?.url;

		if (!searchContainer || !paging || !tableContent || !submitButton || !url) {
			console.warn('검색에 필요한 엘리먼트가 없습니다.');
			return;
		}

		this.bean.datas = [];

		if (option === 'tag') {
			this.setTag();
		} else {
			this.setOptions();
		}

		if (submitButton.classList.contains('active')) {
			this.bean.page.selectedPage = 0;
		}

		console.log('searchBean:', JSON.stringify(this.bean));
		localStorage.setItem('searchBean', JSON.stringify(this.bean.datas));


		try {
			layout.setButtonLoading(submitButton, true);
			layout.showLoading('데이터를 불러오는 중입니다...');

			const { data } = await axios.post(url, this.bean);
			if (pageContainer) {
				pageContainer.innerHTML = data;
			}
			const renderTableContents = document.querySelector('.table-contents');

			// SSR 받은 HTML이기에 새로 선택자를 잡는다.
			if (renderTableContents) {
				this.setTotal(renderTableContents);
			}

			const paging = pageContainer ? pageContainer.querySelector('.paging') : null;
			if (paging && renderTableContents) {
				this.paging(
					pageContainer,
					Number(renderTableContents.getAttribute('data-current')) + 1,
					renderTableContents.getAttribute('data-lastnum')
				);
			}

			if (typeof searchCallback != 'undefined') {
				searchCallback();
			}

		} catch (error) {
			console.error(error);
		} finally {
			layout.setButtonLoading(submitButton, false);
			layout.hideLoading();
		}

		console.log(this.bean);
	}

	setTag() {
		let priority = 1;
		document.querySelectorAll('.tag-contents .tag').forEach((tag) => {
			if (tag.style.display !== 'none') {
				let data = this.getTagDataFromInput(tag);
				data.priority = priority++;
				if (data.value) {
					this.bean.datas.push(data);
				}
			}
		});

		this.bean.datas.forEach((data) => {
			if (data.operSep) {
				let valArr = _.split(data.value, data.operSep, 2);

				if (valArr.length > 1) {
					data.value = valArr[0].replace(/-/gi, '');
					data.operSep = '';
					data.oper = 'ge';
					let data2 = _.cloneDeep(data);
					data2.value = valArr[1].replace(/-/gi, '');
					data2.oper = 'le';
					this.bean.datas.push(data2);
				} else {
					data.value = valArr[0].replace(/-/gi, '');
					data.operSep = '';
					data.oper = 'eq';
					this.bean.datas.push(data);
				}

			}
		});

		if (document.querySelector('.paging')) {
			const tableContent = document.querySelector('.table-contents');
			if (tableContent.dataset.size && tableContent.dataset.current) {
				this.bean.page.rowsPerPage = tableContent.getAttribute('data-size');
				this.bean.page.selectedPage = tableContent.getAttribute('data-current');
			}
		}
	}

	setOptions() {
		// TODO: 기존 폼 옵션 반영 로직 필요 시 작성
		return this.bean.datas;
	}

	getTagDataFromInput(elem) {
		return {
			value: elem.querySelector('.tag-label').innerText,
			id: elem.getAttribute('data-id'),
			oper: elem.getAttribute('data-oper') ? elem.getAttribute('data-oper') : 'eq',
			// operSep: elem.getAttribute('data-oper-sep') == 'null' ? null : elem.getAttribute('data-oper-sep'),
			// group: elem.getAttribute('data-group'),
			priority: elem.getAttribute('data-priority')
		};
	}


	setTotal ( tableContent ) {
		const totalSize = tableContent.getAttribute('data-total') || 0;
		const rowsPerPage = tableContent.getAttribute('data-size') || 20;
		document.querySelector(".search-total").innerText = totalSize;
		document.querySelector('.table-contents').setAttribute('data-total', totalSize);
		this.setSizing(tableContent, rowsPerPage);
	}

	setSizing (tableContent, rowsPerPage) {
		const perPage = document.querySelector(".rows-per-page");
		perPage.value = rowsPerPage;
		tableContent.setAttribute('data-size', rowsPerPage);
		if (document.querySelector('body').classList.contains('mobile')) {
			perPage.innerHTML = '';
		}
	}

	paging (ctn, current, lastNum){
		let group = Math.ceil(current / 5); //그룹
		let first = group * 5 - 4; //보여질 첫번째 번호
		let last = first + 4; //보여질 마지막 번호
		console.log('paging: ', current, lastNum, first, last);

		//보여질 번호 추가
		const numberContainer = ctn.querySelector('.paging .num');
		if (!numberContainer) {
			return;
		}
		numberContainer.innerHTML = '';
		if(last > lastNum - 1){
			last = lastNum;
		}

		const submitButton = document.querySelector('.card-wrapper.search .search-submit-btn')
			|| document.querySelector('.card-wrapper.search .search-btn.btn-primary');

		for(let i = first; i <= last; i++){
			const link = document.createElement('a');
			link.textContent = i;
			link.href = '#';
			if(current === i){
				link.classList.add('active');
			}
			link.addEventListener('click', (event) => {
				event.preventDefault();
				numberContainer.querySelectorAll('a').forEach((anchor) => anchor.classList.remove('active'));
				link.classList.add('active');
				const table = ctn.querySelector('.table-contents');
				const targetPage = i - 1;
				if (table) {
					table.setAttribute('data-current', targetPage);
				}
				this.bean.page.selectedPage = targetPage;
				if (submitButton) {
					this.submit(submitButton, event, 'paging');
				}
			});
			numberContainer.appendChild(link);
		}

		//버튼효과
		if(group <= 1){
			ctn.querySelector('.prev-btn').classList.add('block');
			ctn.querySelector('.prev-btn').setAttribute('disabled', true);
		} else {
			ctn.querySelector('.prev-btn').classList.remove('block');
			ctn.querySelector('.next-btn').removeAttribute('disabled');
		}
		if(last == lastNum){
			ctn.querySelector('.next-btn').classList.add('block');
			ctn.querySelector('.next-btn').setAttribute('disabled', true);
		} else {
			ctn.querySelector('.next-btn').classList.remove('block');
			ctn.querySelector('.next-btn').removeAttribute('disabled');
		}

		const activeLink = numberContainer.querySelector('a.active');
		if (!activeLink && numberContainer.firstElementChild) {
			numberContainer.firstElementChild.classList.add('active');
		}
	}


	addTag (elem, opt) {
		var ctn = elem.closest('.card-wrapper.search');
		var boxElem = elem.closest('.search-container').querySelector('input'); // 값 가져오기

		var val = boxElem.value; // 값
		var id = boxElem.name; // ID
		var oper = boxElem.getAttribute('data-oper');
		var order = boxElem.getAttribute('data-order');
		var operSep = boxElem.getAttribute('data-oper-sep');
		var group = boxElem.getAttribute('data-group');
		var selectedIndex = ''; // 선택한 옵션 값 인덱스
		var name = '';

		if (elem.closest('.search-container').querySelector('label > ul.select-form-group')) {
//			name = elem.closest('.search-container').querySelector('.select-detail-date').options[0].innerHTML; // 기존 코드 인덱스값 0번 고정으로 인한 주석처리
			selectedIndex = elem.closest('.search-container').querySelector('.select-detail-date').options.selectedIndex; // 옵션 인덱스만 유동적으로 변경
			name = elem.closest('.search-container').querySelector('.select-detail-date').options[selectedIndex].innerHTML;

			//20231212
		}else if (elem.closest('.search-container').querySelector('label > ul.select-form-group-sys')) {
			selectedIndex = elem.closest('.search-container').querySelector('.day-selector').options.selectedIndex; // 옵션 인덱스만 유동적으로 변경
			const optionIndex = elem.closest('.search-container').querySelector('.day-selector').options[selectedIndex];
			if(optionIndex){
				id    = optionIndex.value;
				name  = optionIndex.innerHTML;
				oper  = optionIndex.getAttribute('data-oper') ? null : oper;
				order = optionIndex.getAttribute('data-order')? null : order;
				operSep = optionIndex.getAttribute('data-oper-sep')? null : operSep;
				group = optionIndex.getAttribute('data-group')? null : group;
			}
		} else {
			console.log(elem.closest('.search-container'))
			console.log(elem.closest('.search-container').querySelector('.card-title p'))
			name = elem.closest('.search-container').querySelector('.card-title p').innerText; // 보여지는 이름
		}

		// ID가 이미 있는지 확인해서 기존것은 삭제
		var oladyElem = ctn.querySelector('.field').querySelector('[data-id="' + id + '"]');
		// var oladyElem = document.getElementById('field').querySelector('[data-id="'+id+'"]');
		if (oladyElem) {
			ctn.querySelector('.field').removeChild(oladyElem);
		}

		if (!val == '') {
			// 테그 만들기
			var tagDiv = document.createElement('div'); // Tag 최상위 엘리먼트
			tagDiv.className = 'tag';
			ctn.querySelector('.field').appendChild(tagDiv);
			tagDiv.innerHTML = ctn.querySelector('.tag-temp').innerHTML;
			tagDiv.setAttribute('data-id', id);
			tagDiv.setAttribute('data-oper', oper);
			tagDiv.setAttribute('data-oper-sep', operSep);
			tagDiv.setAttribute('data-order', order);
			tagDiv.setAttribute('data-group', group);
			tagDiv.classList.add('tag');
			if(opt == 'fixed') {
				tagDiv.classList.add('fixed');
			}
			// tagDiv.style.cssFloat = 'left';
			tagDiv.querySelector('.tag-label').innerText = val;

			tagDiv.addEventListener("mouseover", () => {
				tagDiv.querySelector('.tag-label').innerText = name + ' : ' + val;
			});
			tagDiv.addEventListener("mouseleave", () => {
				tagDiv.querySelector('.tag-label').innerText = val;
			});

			tagDiv.querySelector('.tag-close').addEventListener("click", (e) => {
				e.preventDefault();
				this.removeTag(tagDiv);

				// Radio 체크해제
				document.getElementsByName(tagDiv.getAttribute('data-id')).forEach(function(inputElem) {
					inputElem.checked = false;
					inputElem.value = '';
					if (inputElem.parentElement && inputElem.parentElement.children[0]) {
						inputElem.parentElement.children[0].value = '';
					}
				});

				const searchInput = elem.closest('.search-container')?.querySelector('input');
				if (searchInput) {
					searchInput.disabled = false;
				}
			});
			const searchInput = elem.closest('.search-container')?.querySelector('input');
			if (searchInput) {
				searchInput.disabled = false;
			}
		}
		// reload
		const reloadButton = ctn.querySelector('.search-reload');
		if (reloadButton) {
			reloadButton.addEventListener("click", (e) => {
				e.preventDefault();
				this.removeTag(tagDiv);
				document.querySelectorAll('.search-option').forEach(function(optionInput) {
					optionInput.value = '';
				});
				const searchForm = document.querySelector("form[name='search-contents']");
				if (searchForm) {
					searchForm.reset();
				}
				const searchInput = elem.closest('.search-container')?.querySelector('input');
				if (searchInput) {
					searchInput.disabled = false;
				}
			});
		}
	}


	removeTag (elem) {
		if(elem){
			elem.closest('.tag').style.display = 'none';
		}

		document.querySelectorAll(".select-multiple.select-input.suggest-search").forEach((e)=>{
			e.querySelectorAll("li").forEach((el)=>{
				el.classList.remove("on");
			});
		});
	}
}
