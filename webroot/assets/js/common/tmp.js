var search = {
    submit: function(elem, event, option) {
        event && event.preventDefault();

        var ctn = elem.closest('.search-container'); // form 을 감싸고있는 div
        var paging = ctn.querySelector('.paging'); // 페이징 div
        var target = ctn.querySelector('.search-list'); // list table 을 감싸고있는 div

        // 기본 검색 OBJECT
        var searchBean = {
            datas: [],
            page: {
                rowsPerPage: 20,
                selectedPage: 0
            },
        };

        // 특정 url 페이지 row 세팅
        if(rowSetting(document.querySelector('.search-wrapper').getAttribute('data-url'))) {
            searchBean.page.rowsPerPage = 100;
        }

        if(option == "tag"){
            searchBean = search.setTag(elem, searchBean);
        }else{
            searchBean = search.setOptions(elem, searchBean);
        }

        // 페이징 버튼 외 검색시 페이징 초기화arrow-btn next-btn
        if(elem.className !='active' && !elem.className.includes('arrow-btn')) {
            searchBean.page.selectedPage = 0;
        }

        /* AJAX */
        console.log('searchBean:', JSON.stringify(searchBean));

        // 파일 다운로드시 조건 저장을 위해 localStorage에 저장
        localStorage.setItem('searchBean' , JSON.stringify(searchBean.datas));

        axios({
            method: 'post',
            url: ctn.querySelector('.search-wrapper').getAttribute('data-url'),
            headers: {'Content-Type': 'application/json'},
            data: JSON.stringify(searchBean)
        }).then(function (response) {
            target.innerHTML = response.data;
            const tableWrap = target.querySelector('.table-wrap');
            search.setTotal(ctn, tableWrap.getAttribute('data-total'), tableWrap.getAttribute('data-size'));
            paging = ctn.querySelector('.paging');
            if (paging) {
                search.paging(ctn, new Number(tableWrap.getAttribute('data-current')) + 1, tableWrap.getAttribute('data-lastnum'));
            }
            textMask();

            // list 응답값을 form에서 처리하고 싶을 때 정의하여 사용
            if (typeof searchCallback != 'undefined') {
                searchCallback();
            }
            // 미수신데이터
            //if(ctn.querySelector('.search-tot')) ctn.querySelector('.search-tot').innerText = tableWrap.getAttribute('data-other');
            if(ctn.querySelector('.search-totkr')){
                ctn.querySelector('.search-totkr').innerText = tableWrap.getAttribute('data-other');
                ctn.querySelector('.search-tot').innerText = tableWrap.getAttribute('data-other-amt');
            }
        }).catch(error => {
            util.redirect(error);
        });
    },
    downloadExcel: function(elem) {	// 대량 엑셀 다운로드 (검색 조건 포함)
        if (confirm("조회 조건에 따라 일정 시간이 소요될 수 있습니다. \n엑셀 다운로드를 진행 하시겠습니까?")) {
            var downUrl = '/download';
            var ctn = elem.closest('.search-container'); // form 을 감싸고있는 div
            var url = ctn.querySelector('.search-wrapper').getAttribute('data-url') + downUrl;
            var searchBean = {
                datas: [],
                page: {
                    rowsPerPage: 20,
                    selectedPage: 0
                },
            };

            axios({
                method: 'post',
                url: url,
                headers: {'Content-Type': 'application/json'},
                data: JSON.stringify(search.setOptions(elem, searchBean))
            }).then(function (res) {
                if (res.data.result.code == '600') {
                    alert(res.data.result.msg);
                } else {
                    crud.axios('insert', '/axios/secure/excel/all', {'url' : url , 'where' : JSON.parse(localStorage.getItem('searchBean')) , 'size' : res.data.size }, 'post', 'application/json',function (){console.log("저장")});
                    window.open(res.data.file.link);
                    setTimeout(function () {
                        URL.revokeObjectURL(res.data.file.link);
                    }, 100);
                }
            }).catch(error =>{
                util.redirect(error);
            });
        }
    },
    setOptions: function(elem, searchBean) {
        var ctn = elem.closest('.search-container'); // form 을 감싸고있는 div
        var searchWrap = ctn.querySelector('.search-wrapper'); // 검색도구를 감싸고있는 div
        //var isDetailMode = searchWrap.getAttribute('data-detail-mode') == 'true';

        /* 기본 검색모드 */
        // ========================== 기본기간이 있다면 가장 높은 우선순위로 검색한다. =================================
        // 날짜 datas 세팅
        if(!(searchWrap.querySelector('.blank-date') && searchWrap.querySelector('.def-date').value == '')){
            if (searchWrap.querySelector('.def-date')) { // default 검색의 날짜 class
                var dateElem = searchWrap.querySelector('.def-date'); // 당일ex) value = 2020-08-11 - 2020-08-11
                if (!dateElem.value) { // 설정이 안되어있을 경우 오늘날짜를 만든다.
                    dateElem.value = util.dateToString(new Date()) + ' - ' + util.dateToString(new Date());
                }
                var data = search.getDataFromInput(dateElem); // value, id, oper, operSep, group, priority 세팅
                data.priority = 0; // 기본기간은 우선순위 0
                searchBean.datas.push(data); // searchBean에 추가
            }
            var priority = 1;

            if (searchWrap.querySelector('.def-start-time') && searchWrap.querySelector('.def-end-time')) {
                var startElem = searchWrap.querySelector('.def-start-time'); // ex)203815000 -> 오후 8시 38분 15초 000
                var endElem = searchWrap.querySelector('.def-end-time'); // ex)235959000 -> 오후 11시 59분 59초 000
                if (!startElem.value) { // 설정이 안되어있을 경우 00시 00분으로 설정한다.
                    startElem.value = '000000';
                }
                if (!endElem.value) {
                    endElem.value = '235959';
                }
                var data = search.getDataFromInput(startElem); // value, id, oper, operSep, group, priority 세팅
                data.priority = 0; // 기본기간은 우선순위 0
                searchBean.datas.push(data); // searchBean에 추가
                data = search.getDataFromInput(endElem);
                searchBean.datas.push(data);
            }

            if (searchWrap.querySelector('.log-level')) {
                var levelElem = searchWrap.querySelector('.log-level'); // TRACE, DEBUG, INFO, WARN, ERROR
                console.log(levelElem);
                if (!levelElem.value) { // 설정이 안되어있을 경우 WARN 레벨로 설정한다
                    levelElem.value = '30000';
                } else {
                    levelElem.value = search.setLevelInt(levelElem);
                }
                var data = search.getDataFromInput(levelElem); // value, id, oper, operSep, group, priority 세팅
                data.priority = 0; // 기본기간은 우선순위 0
                searchBean.datas.push(data); // searchBean에 추가
            }
        }

        // 통합검색 datas 세팅 (forEach)
        if(searchWrap.querySelector('.search-def')){
            var defValue = searchWrap.querySelector('.search-def').value;
            if(defValue != ''){
                searchWrap.querySelectorAll('.search-def-option input').forEach(function (each) {
                    var data = search.getDataFromInput(each);
                    data.value = defValue;
                    data.priority = priority++;
                    data.group = 1;
                    searchBean.datas.push(data);
                });
            }
        }

        /* 옵션검색 구현*/
        searchWrap.querySelectorAll('.search-option').forEach(function (each) {
            var data = search.getDataFromInput(each);

            // data.value = elem.value;
            data.priority = priority++;
            if (data.value != '') {
                searchBean.datas.push(data);
            }
        });

        //옵션 검색시 검색조건
        for(var i = 0; i < searchBean.datas.length; i++) {
            var data = searchBean.datas[i];
            if(data.operSep) {
                var valArr = _.split(data.value, data.operSep, 2);
                // ex) regDay : "2020-08-12 - 2020-08-13" 를 각각 data에 넣는다.
                if(valArr.length > 1) {
                    data.value = valArr[0].replace(/-/gi,"");
                    data.operSep = '';
                    data.oper = 'ge';
                    var data2 = _.cloneDeep(data);
                    data2.value = valArr[1].replace(/-/gi, "");
                    data2.oper = 'le';
                    searchBean.datas.push(data2);
                } else {
                    data.value = valArr[0].replace(/-/gi,"");
                    data.operSep = '';
                    data.oper = 'eq';
                    searchBean.datas.push(data);
                }
            }
        }

        /* PAGING */
        if (ctn.querySelector('.paging')) { // 페이징 div
            const tableWrap = document.querySelector('.table-wrap');
            searchBean.page.rowsPerPage = tableWrap.getAttribute('data-size');
            searchBean.page.selectedPage = tableWrap.getAttribute('data-current');
        }

        return searchBean;
    },
    setTag :function(elem, searchBean){
        var ctn = elem.closest('.search-container'); // form 을 감싸고있는 div
        var searchWrap = ctn.querySelector('.search-wrapper'); // 검색도구를 감싸고있는 div

        var priority = 1;
        searchWrap.querySelectorAll('.tag').forEach(function (each) {
            if(each.style.display != "none"){
                var data = search.getTagDataFromInput(each);

                // data.value = elem.value;
                data.priority = priority++;
                if (data.value && data.value !='') {
                    searchBean.datas.push(data);
                }
            }
        });

        //옵션 검색시 검색조건
        for(var i = 0; i < searchBean.datas.length; i++) {
            var data = searchBean.datas[i];

            if(data.operSep) {
                var valArr = _.split(data.value, data.operSep, 2);
                // ex) regDay : "2020-08-12 - 2020-08-13" 를 각각 data에 넣는다.
                if(valArr.length > 1) {
                    data.value = valArr[0].replace(/-/gi,"");
                    data.operSep = '';
                    data.oper = 'ge';
                    var data2 = _.cloneDeep(data);
                    data2.value = valArr[1].replace(/-/gi, "");
                    data2.oper = 'le';
                    searchBean.datas.push(data2);
                } else {
                    data.value = valArr[0].replace(/-/gi,"");
                    data.operSep = '';
                    data.oper = 'eq';
                    searchBean.datas.push(data);
                }
            }
        }

        /* PAGING */
        if (ctn.querySelector('.paging')) { // 페이징 div
            const tableWrap = document.querySelector('.table-wrap');
            searchBean.page.rowsPerPage = tableWrap.getAttribute('data-size');
            searchBean.page.selectedPage = tableWrap.getAttribute('data-current');
        }

        return searchBean;

    },
    getDataFromInput: function(elem) {
        return {
            value: elem.value,
            id: elem.name,
            oper: elem.getAttribute('data-oper') ? elem.getAttribute('data-oper') : 'eq',
            operSep: elem.getAttribute('data-oper-sep'),
            group: elem.getAttribute('data-group'),
            priority: elem.getAttribute('data-priority')
        }
    },
    getTagDataFromInput: function(elem) {
        return {
            value: elem.querySelector(".tag-label").innerText,
            id: elem.getAttribute("data-id"),
            oper: elem.getAttribute('data-oper') ? elem.getAttribute('data-oper') : 'eq',
            operSep: elem.getAttribute('data-oper-sep') == "null" ? null : elem.getAttribute('data-oper-sep'),
            group: elem.getAttribute('data-group'),
            priority: elem.getAttribute('data-priority')
        }
    },
    setDate: function (elem) {
        var ctn = elem.closest('.search-form-left');
        //datepicker 초기화
        ctn.querySelector('.search-daterangepicker').classList.remove('on');
        ctn.querySelector('.search-daterangepicker').value = '';
        if (ctn.querySelector('.w-30 .box-val')) {
            ctn.querySelector('.w-30 .box-val').value = '';
        }
        if (ctn.querySelector('.search-btn-click') !== null) {
            ctn.querySelector('.search-btn-click').classList.remove('search-btn-click');
        }
        elem.classList.add('search-btn-click');

        var defDate = document.querySelector('.def-date');
        var date = new Date();
        var currentDate = util.dateToString(date);
        if (elem.value == 't') {
            val = currentDate + ' - ' + currentDate;
        } else if (elem.value == 'w') {
            date.setDate(date.getDate() - 7);
            val = util.dateToString(date) + ' - ' + currentDate;
        } else if (elem.value == 'm') {
            date.setMonth(date.getMonth() - 1);
            val = util.dateToString(date) + ' - ' + currentDate;
        } else if (elem.value == '3m') {
            date.setMonth(date.getMonth() - 3);
            val = util.dateToString(date) + ' - ' + currentDate;
        } else if (elem.value == 'y') {
            date.setDate(date.getDate() - 1);
            val = util.dateToString(date) + ' - ' + util.dateToString(date);
        }
        console.log("VAL : ",val);
        defDate.value = val;
        this.addTag(elem, 'fixed');
    },
    setLevelInt: function (elem) {
        var getInt = 0;
        switch (elem.value) {
            case "TRACE" : getInt = "5000";
                break;
            case "DEBUG" : getInt = "10000";
                break;
            case "INFO" : getInt = "20000";
                break;
            case "WARN" : getInt = "30000";
                break;
            case "ERROR" : getInt = "40000";
                break;
            case "30000" : getInt = "30000";
                break;
        }

        return getInt;
    },
    // multi 검색 제거
    resetMultipleTag : function(elem) {
        // 검색 옵션 input
        const selectWrap = elem.closest('.select-multiple');
        const searchOptionElem = selectWrap.querySelector('.box-val');

        // 태그 찾기 및 제거
        const searchTag = document.querySelector(`.tag[data-id="${searchOptionElem.name}"]`);
        if (searchTag) {
            search.removeTag(searchTag);
        }


        // 선택 옵션 삭제
        setTimeout(() => {
            elem.classList.remove('on');
        },200)
    },
    addTag: function(elem, opt) { //태그 추가
        var ctn = elem.closest('.search-wrapper');
        var boxElem = elem.closest('.box-group').querySelector('.box-val'); // 값 가져오기
        if (boxElem.classList.contains('typeahead')) { // typeahead
            elem.closest('.box-group').querySelector('.box-val:nth-child(1)').value = elem.closest('.box-group').querySelector('.box-val:nth-child(2)').value;
        }

        var val = boxElem.value; // 값
        var id = boxElem.name; // ID
        var oper = boxElem.getAttribute('data-oper');
        var order = boxElem.getAttribute('data-order');
        var operSep = boxElem.getAttribute('data-oper-sep');
        var group = boxElem.getAttribute('data-group');
        var selectedIndex = ''; // 선택한 옵션 값 인덱스
        var name = '';

        if (elem.closest('.box-group').querySelector('label > ul.select-form-group')) {
//			name = elem.closest('.box-group').querySelector('.select-detail-date').options[0].innerHTML; // 기존 코드 인덱스값 0번 고정으로 인한 주석처리
            selectedIndex = elem.closest('.box-group').querySelector('.select-detail-date').options.selectedIndex; // 옵션 인덱스만 유동적으로 변경
            name = elem.closest('.box-group').querySelector('.select-detail-date').options[selectedIndex].innerHTML;

            //20231212
        }else if (elem.closest('.box-group').querySelector('label > ul.select-form-group-sys')) {
            selectedIndex = elem.closest('.box-group').querySelector('.day-selector').options.selectedIndex; // 옵션 인덱스만 유동적으로 변경
            const optionIndex = elem.closest('.box-group').querySelector('.day-selector').options[selectedIndex];
            if(optionIndex){
                id    = optionIndex.value;
                name  = optionIndex.innerHTML;
                oper  = optionIndex.getAttribute('data-oper') ? null : oper;
                order = optionIndex.getAttribute('data-order')? null : order;
                operSep = optionIndex.getAttribute('data-oper-sep')? null : operSep;
                group = optionIndex.getAttribute('data-group')? null : group;
            }
        } else {
            name = elem.closest('.box-group').querySelector('.box-name').innerText; // 보여지는 이름
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

            tagDiv.addEventListener("mouseover", function () {
                tagDiv.querySelector('.tag-label').innerText = name + ' : ' + val;
            });
            tagDiv.addEventListener("mouseleave", function () {
                tagDiv.querySelector('.tag-label').innerText = val;
            });

            tagDiv.querySelector('.tag-close').addEventListener("click", function (e) {
                search.removeTag(tagDiv);

                // Radio 체크해제
                document.getElementsByName(this.closest('div').getAttribute('data-id')).forEach(function(e) {
                    e.checked = false;
                    e.value = '';
                    e.parentElement.children[0].value = '';
                });

                elem.closest('.box-group').querySelector('.box-val').disabled = false;
            });
            elem.closest('.box-group').querySelector('.box-val').disabled = false;
        }
        // reload
        ctn.querySelector('.search-reload').addEventListener("click", function (e) {
            search.removeTag(tagDiv);
            for(var i=0; i<document.querySelectorAll('.search-option').length;i++)
            {document.querySelectorAll('.search-option')[i].value=""}
            document.querySelector("form[name='search-contents']").reset();
            elem.closest('.box-group').querySelector('.box-val').disabled = false;
        })
    },
    // removeTag: function(elem) {
    //     if(elem){
    //         elem.closest('.tag').style.display = 'none';
    //     }
    //
    //     document.querySelectorAll(".select-multiple.select-input.suggest-search").forEach((e)=>{
    //         e.querySelectorAll("li").forEach((el)=>{
    //             el.classList.remove("on");
    //         });
    //     });
    // },
    onKeyDown: function(elem, option) {
        if (event.keyCode == 13) {
//			this.addTag(elem);
//			this.submit(elem, 'default');
            if(option == "tag"){
                this.submit(elem, "", "tag");
            }else{
                this.submit(elem);
            }
        }
    },
    openDetail: function(elem) {
        var ctn = elem.closest('.search-wrapper');
        var detailContents = ctn.querySelector(".detail-contents");

        if (detailContents.style.display == "none") {
            detailContents.style.display = "flex";
            ctn.querySelector('.tag-contents').style.display = "flex";
            ctn.classList.add('on');
            ctn.querySelector('.detail-btn').classList.add('on');
            ctn.querySelector('.search-def').value = '';
            if(ctn.classList.contains('on')){
                ctn.querySelector('.tag').style.display = 'none';
            }
            // $(ctn).addClass('mobile');
            if(document.querySelector('body').classList.contains('mobile')){
                document.querySelector('.page').style.zIndex = 9999;
            }
        } else {
            detailContents.style.display = "none";
            ctn.querySelector('.tag-contents').style.display = "none";
            ctn.querySelector('.detail-btn').classList.remove('on');
            ctn.classList.remove('on');
            // $(ctn).removeClass('mobile');
            if(document.querySelector('body').classList.contains('mobile')){
                document.querySelector('.page').style.zIndex = 11;
            }
        }
    },
    btnClose: function(elem) { // 상세조건 종료
        var ctn = elem.closest('.search-wrapper');
        ctn.querySelector(".detail-contents").style.display = "none";
        ctn.querySelector('.tag-contents').style.display = "none";
        // document.querySeelector('.detail-btn i').innerHTML = '<img src="./img/levels.png">';
        ctn.querySelector('.detail-btn span').innerHTML = '상세조건';
        ctn.querySelector('.detail-btn').classList.remove('on');
        ctn.classList.remove('on');
        // $('.search-wrapper').removeClass('mobile');
        if(document.querySelector('body').classList.contains('mobile')){
            document.querySelector('.page').style.zIndex = 11;
        }
    },
    selectOption: function(elem) { // 셀렉트
        var elemBoxVal = elem.closest('.box-group').querySelector('.box-val');
        if (!elem.value && elem.getAttribute('data-value') != null) {
            // Search Select
            elemBoxVal.value = elem.getAttribute('data-value');
            if(elem.parentElement.getAttribute('data-name')){
                elemBoxVal.name = elem.parentElement.getAttribute('data-name');
            }


        } else {
            // 일반 Select
            elemBoxVal.value = elem.value;
            elemBoxVal.name = elem.name;
        }

        // multiselect 리스트와 선택시 싱크 맞지않아 태그 타이머 하드코딩
        setTimeout(() => {
            this.addTag(elem);
        }, 200)

    },
    chkOption: function(elem) { // 체크
        elem.closest('.box-group').querySelector('.box-val').name = elem.name;
        elem.closest('.box-group').querySelector('.box-val').value = elem.closest('.search-check').querySelector('.chk-label').innerHTML;
        this.addTag(elem);
    },
    setTotal: function (ctn, totalSize, rowsPerPage) {
        ctn.querySelector(".search-total").innerText = totalSize;
        ctn.querySelector('.table-wrap').setAttribute('data-total', totalSize);
        search.setSizing(ctn, rowsPerPage);
    },
    setSizing: function (ctn, rowsPerPage) {
        ctn.querySelector(".search-sizing .rowsPerPage").innerText = 'show ' + rowsPerPage;
        ctn.querySelector('.table-wrap').setAttribute('data-size', rowsPerPage);
        if (document.querySelector('body').classList.contains('mobile')) {
            ctn.querySelector(".search-sizing .rowsPerPage").innerHTML = '';
        }
    },
    sizingbtn: function(t) {
        console.log(t.closest('.search-container'));
        var rowsPerPage = t.innerText.replace('show ', '');
        if (rowsPerPage != t.closest('.search-container').querySelector('.table-wrap').getAttribute('data-size')) {
            search.setSizing(t.closest('.search-container'), rowsPerPage);
            t.closest('.search-container').querySelector('.table-wrap').setAttribute('data-current', 0);
            search.submit(t);
        }
    },
    logLevelbtn: function(t) {
        document.getElementById('levelInt').value = t.innerText;
        search.submit(t);
    },
    paging: function(ctn, current, lastNum){
        //var current = new Number(ctn.querySelector('.table-wrap').getAttribute('data-current')) + 1;
        //var lastNum = new Number(ctn.querySelector('.table-wrap').getAttribute('data-lastnum'));
        var group = Math.ceil(current / 5); //그룹
        var first = group * 5 - 4; //보여질 첫번째 번호
        var last = first + 4; //보여질 마지막 번호
        console.log('paging: ', current, lastNum, first, last);
        //보여질 번호 추가
        $('.num').empty(); //번호 초기화
        if(last > lastNum - 1){
            last = lastNum;
        }

        var node = document.createElement("A");

        for(var i = first; i <= last; i++){
            var textnode = document.createTextNode(i);
            if(current == (i)){
                node.className = 'active';
                node.appendChild(textnode);
                ctn.querySelector('.num').appendChild(node);
            } else if(i > 0){
                $('.num').append('<a>'+i+'</a>');
            }
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

        ctn.querySelectorAll('.paging .num a').forEach(function (each) {
            each.addEventListener('click', function () {
                this.closest('.num').querySelector('.active').classList.remove('active');
                this.classList.add('active');
                this.closest('.search-container').querySelector('.table-wrap').setAttribute('data-current', new Number(this.innerText) -1);
                search.submit(this);
            });
        });

    },
    pagingbtn: function(str, elem){
        var ctn = elem.closest('.search-container');
        var current = new Number(ctn.querySelector('.table-wrap').getAttribute('data-current')) + 1;
        var lastNum = ctn.querySelector('.table-wrap').getAttribute('data-lastnum');
        var group = Math.ceil(current / 5); //그룹
        var first = group * 5 - 4; //보여질 첫번째 번호
        var last = first + 5; //보여질 마지막 번호
        if(str == 'prev'){
            current = first - 1;
        }
        if(str == 'next') {
            current = last;
        }
        ctn.querySelector('.table-wrap').setAttribute('data-current', current-1);
        search.paging(ctn, current, lastNum);
        search.submit(elem);
    },
    common: function(id) {
        var target = ctn.querySelector('.common-list'); // list table 을 감싸고있는 div

        // // 기본 검색 OBJECT
        // var searchBean = {
        // 	datas: [],
        // 	page: {
        // 		rowsPerPage: 20,
        // 		selectedPage: 0
        // 	},
        // };

        // /* PAGING */
        // if (paging) {
        // 	searchBean.page.rowsPerPage = tableWrap.getAttribute('data-size');
        // 	searchBean.page.selectedPage = tableWrap.getAttribute('data-current');
        // }

        axios({
            method: 'post',
            url: url,
            headers: {'Content-Type': 'application/json'},
            data: JSON.stringify(searchBean)
        }).then(function (response) {
            target.innerHTML = response.data;
            const tableWrap = target.querySelector('.table-wrap');
            search.setTotal(ctn, tableWrap.getAttribute('data-total'), tableWrap.getAttribute('data-size'));
            paging = ctn.querySelector('.paging');
            if (paging) {
                search.paging(ctn, new Number(tableWrap.getAttribute('data-current')) + 1, tableWrap.getAttribute('data-lastnum'));
            }
            textMask();
        }).catch(error =>{
            util.redirect(error);
        });;
    }
}

function textMask() {
    // 마스크
    var dateMask = $('.pg-view-group .form-control-static.date, td.date, span.date, td.day');
    var timeMask = $('.pg-view-group .form-control-static.time, td.time, span.time');
    var patt = new RegExp("^[0-9]{8}$");
    var pattM = new RegExp("^[0-9]{6}$");
    var pattT = new RegExp("^[0-9]{14}$");
    var pattFULL = new RegExp("^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}");
    var pattH = new RegExp("^[0-9]{10}$");
    var pattLOG = new RegExp("^[0-9]{17}"); // LOG DAY 8자 + LOG TIME 9자
    $.each(dateMask, function (i, e) {
        var txt = $(e).text().trim();
        if (txt && patt.test(txt)) {
            $(e).text(txt.substr(0, 4) + "-" + txt.substr(4, 2) + "-" + txt.substr(6, 2));
        } else if (txt && pattM.test(txt)) {
            $(e).text(txt.substr(0, 4) + "-" + txt.substr(4, 2));
        } else if (txt && pattT.test(txt)) {
            $(e).text(txt.substr(0, 4) + "-" + txt.substr(4, 2) + "-" + txt.substr(6, 2) + " " + txt.substr(8, 2) + ":" + txt.substr(10, 2) + ":" + txt.substr(12, 2));
        } else if (txt && pattH.test(txt)) {
            $(e).text(txt.substr(0, 4) + "-" + txt.substr(4, 2) + "-" + txt.substr(6, 2) + " " + txt.substr(8, 2));
        } else if (txt && pattFULL.test(txt)) {
            $(e).text(txt.substr(0, 19));
        } else if (txt && pattLOG.test(txt)) {
            $(e).text(txt.substr(0, 4) + "-" + txt.substr(4, 2) + "-" + txt.substr(6, 2) + " " + txt.substr(8, 2) + ":" + txt.substr(10, 2) + ":" + txt.substr(12, 2) + ":" + txt.substr(14, 2) + ":" + txt.substr(16, 3));
        }
    });
    $.each(timeMask, function (i, e) {
        var txt = $(e).text().trim();
        if (txt && pattM.test(txt)) {
            $(e).text(txt.substr(0, 2) + ":" + txt.substr(2, 2) + ":" + txt.substr(4, 2));
        }
    });

    var currencyMask = $('.digits');
    var currencyPatt = new RegExp("(^[0-9]*$)|(^-[0-9]*$)");
    $.each(currencyMask, function (i, e) {
        var txt = $(e).text().trim();
        if (txt && currencyPatt.test(txt)) {
            $(e).text(txt.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
        }
    });
    var rateT = $('.rate');
    $.each(rateT, function (i, e) {
        var txt = $(e).text().trim();
        if ($.isNumeric(txt) && txt >= 0 && txt <= 99.99) {
            $(e).text((txt * 100).toFixed(2) + ' %');
        }
    });
    var amountMask = $('.amount');
    $.each(amountMask, function (i, e) {
        var val = ($(e).is("input") ? $(e).val() : $(e).text()).trim();
        if (!val || !/^([\d\-\.]*)$/g.test(val)) return;
        /*
         if (val.split('.').length < 2) {
             val = val + '.' + '00';
         };*/
        var digit = val.split('.')[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        var minus = digit.substring(0, 1) == '-' ? '-' : '';
        minus && (digit = digit.replace('-', ''));

        digit = minus + digit;

        val = digit;

        if ($(e).is("input")) $(e).val(val);
        else $(e).text(val);
    });

    var daySelector = document.querySelector('.day-selector');
    var selectDetailDate = document.querySelector('.select-detail-date');
    if (daySelector) {
        daySelector.addEventListener('change', e => {
            const defDate = document.getElementById('defDate');
            if(defDate){
                defDate.setAttribute('name', e.target.value);
            }
        });
    }
    if (selectDetailDate) {
        selectDetailDate.addEventListener('change', e => {
            const detailDate = document.getElementById('defDate');
            if(detailDate){
                detailDate.setAttribute('name', e.target.value);
            }
        });
    }

    var min_amount = $('.min-amount');
    $.each(min_amount, function (i,e){
        var val = ($(e).is("input") ? $(e).val() : $(e).text()).replace(/,|$|₩|¥/gi,"");
        if(val<0){
            $(e).css('color','red');
        }else if ((val.split('$')[1])< 0 || currency == 'USD'){
            $(e).css('color','red');
        }
    })
    var utilization = $('.utilization');
    $.each(utilization, function (i,e){
        var val = ($(e).is("input") ? $(e).val() : $(e).text()).replace(/,|$|₩|¥|%/gi,"");
        if(val>=60){
            $(e).css('color','red');
        }
    })
    var calc_amount = $('.calc-amount');
    $.each(calc_amount, function (i,e){
        var val = ($(e).is("input") ? $(e).val() : $(e).text()).replace(/,|$|₩|¥/gi,"");
        if(parseInt(val) < 0){
            $(e).css('color','red');
        }else if (parseInt(val) > 0){
            $(e).css('color','blue');
        }
    })
    var refund = $('.refund');
    $.each(refund, function (i,e){
        var val = ($(e).is("input") ? $(e).val() : $(e).text()).replace(/,|$|₩|¥/gi,"");
        if(val == 'refund' ){
            $(e).css('color','red');
        }
    })
    var status = $('.status');
    $.each(status, function (i,e){
        var val = ($(e).is("input") ? $(e).val() : $(e).text());
        if(val == 'dispute' ||val == 'refund'||val == 'void'||val == 'chargebackreverse'||val == 'capture'){
            $(e).css('color','red');
        }else if(val == 'captured'){
            $(e).css('color','blue');
        }
    })
    var krw_amount = $('.krw_amount');
    $.each(krw_amount, function (i,e){
        var val = ($(e).is("input") ? $(e).val() : $(e).text()).trim();
        if (!val || !/^([\d\-\.]*)$/g.test(val)) return;
        if (val.split('.').length < 2) {
            val = val + '.' + '00';
        };
        var digit = val.split('.')[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        var minus = digit.substring(0, 1) == '-' ? '-' : '';
        minus && (digit = digit.replace('-', ''));
        var cent = val.split('.')[1];
        digit = minus + digit;
//         val = digit;
        if ($(e).hasClass('USD')) val =  digit + '.' + cent;
        else if ($(e).hasClass('KRW')) val =  digit;
        else if ($(e).hasClass('JPY')) val =  digit;
        else val = digit ;

        if ($(e).is("input")) $(e).val(val);
        else $(e).text(val);

    });

    $(".other-list-type").each(function(i, item) {
        if ($(this).attr("data-amount") > 0) {
            $(this).text("환급");
            $(this).css("color", "red");
        } else if ($(this).attr("data-amount") < 0) {
            $(this).text("차감");
            $(this).css("color", "blue");
        }
    });
    var underachiever = $('.underachiever');
    var currency = $('.currency');
    $.each(underachiever, function (i,e){
        var val = ($(e).is("input") ? $(e).val() : $(e).text()).replace(/,|$|₩|¥/gi,"");
        if(val < 500000 || currency == 'JPY'){
            $(e).css('color','red');
        }else if ((val.split('$')[1])< 5000 || currency == 'USD'){
            $(e).css('color','red');
        }
    })

    // last4에 대한 첫자리 마스킹
    // var last4 = $('.last4');
    // $.each(last4, function (i,e){
    // 	if(e.innerText.length === 4 ){
    // 		e.innerText = e.innerText.replace(/\w(?=\w{3})/g, "*");
    // 	}
    // })

}

function dateInit(bean) {
    let selectDay = document.querySelector('.day-selector').value;
    bean.datas.push({
            "value" : moment().add(-3,'M').format('YYYYMMDD'),
            "id" : selectDay,
            "oper" : "ge",
            "operSep" : "",
            "group" : "0",
            "priority" : "0"
        },
        {
            "value" : moment().format("YYYYMMDD"),
            "id" : selectDay,
            "oper" : "le",
            "operSep" : "",
            "group" : "0",
            "priority" : "0"
        });
    document.querySelectorAll('.day-selector option').forEach(e=>{
        if(e.value === selectDay){
            e.selected = true;
        }
    })
}

// row 100개 설정 특정 url
function rowSetting(url){
    let isUrl = false;
    let setUrls = ['/team/settle/settle/intl/deposit/list','/team/settle/collect/temp/trx/list','/team/settle/collect/temp/cap/list','/trx/cb/list','/team/settle/settle/dom/list','/team/settle/settle/intl/list']
    for(let setUrl of setUrls) {
        isUrl = setUrl === url;
        if(isUrl){
            return true;
        }
    }
}
