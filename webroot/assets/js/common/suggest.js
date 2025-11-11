export default class Suggest {
    constructor() {
    }


    /**
     * TODO : 이상한값 기입 못하게
     */
    async render(elem) {
        const inputElem = elem.target;
        if (!inputElem) {
            console.warn('suggest 대상 엘리먼트를 찾지 못했습니다.');
            return;
        }

        const suggestElem = inputElem.closest('.search-group').querySelector('.client-suggest-panel');

        if (!suggestElem) {
            console.warn('suggest 엘리먼트를 찾지 못했습니다.');
            return;
        }

        suggestElem.classList.remove('active');


        // source -> 테이블명
        // val -> suggest value
        // key -> suggest display
        const {source, val, key} = inputElem.dataset;
        const value = inputElem.value; // 검색 값

        if (!source || !val || !key) {
            console.warn('suggest 속성을 찾을 수 없습니다.');
            return;
        }

        const {data} = await axios.get(`/axios/suggest?q=${source}&k=${val}&v=${value}`);


        suggestElem.innerHTML = '';
        suggestElem.classList.add('active');

        if (!data.result || data.data.length === 0) {
            suggestElem.innerHTML = this.renderEmpty();
            return;
        }


        const items = data.data.map(item => {
            return this.renderItem(key,item[val]);
        });

        const container = this.renderContainer();
        console.log(container)
        container.innerHTML = items.join('');
        suggestElem.append(container);
    }

    renderEmpty() {
        return `<div class="client-suggest-empty active" data-state="empty">일치하는 데이터를 찾을 수 없습니다.</div>`
    }

    renderContainer() {
        const ul = document.createElement('ul');
        ul.classList.add('client-suggest-list');
        ul.dataset.state = 'results';
        return ul;
    }
    renderItem(key,val) {
        return `<li class="client-suggest-item">
                    <button onclick="layout.SuggestManager.renderItemAddTagEvt(this)" type="button" class="client-suggest-btn" data-val="${val}">
<!--                        <span class="client-suggest-label">TX24 상사</span>-->
                        <span class="client-suggest-meta">${val}</span>
                    </button>
                </li>`
    }

    renderItemAddTagEvt(elem) {
        const target = elem.closest('.search-group').querySelector('input,select');
        target.value = elem.dataset.val;
        search.addTag(elem);
    }
}