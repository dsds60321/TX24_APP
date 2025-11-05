import Layout from './common/layout.js';
import Search from './common/search.js';

const layout = new Layout();
const search = new Search();

if (!window.layout) {
    window.layout = layout;
}

if (!window.search) {
    window.search = search;
}


// 필요한 곳에서 layout, search를 사용하도록 export
export { layout, search };