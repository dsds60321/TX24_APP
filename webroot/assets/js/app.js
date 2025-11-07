import Layout from './common/layout.js';
import Search from './common/search.js';
import SessionManager from './common/session.js';

const layout = new Layout();
const search = new Search();
const sessionManager = new SessionManager({ layout });

if (!window.layout) {
    window.layout = layout;
}

if (!window.search) {
    window.search = search;
}

if (!window.sessionManager) {
    window.sessionManager = sessionManager;
}

sessionManager.init();

// 필요한 곳에서 layout, search를 사용하도록 export
export { layout, search, sessionManager };
