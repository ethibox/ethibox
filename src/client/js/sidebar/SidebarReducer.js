const categories = [
    { id: 0, name: 'Blog' },
    { id: 1, name: 'Chat' },
    { id: 2, name: 'Project Management' },
    { id: 3, name: 'Webmail' },
    { id: 4, name: 'Monitoring' },
    { id: 5, name: 'Development' },
    { id: 6, name: 'E-Commerce' },
    { id: 7, name: 'Forum' },
    { id: 8, name: 'Search Engine' },
    { id: 9, name: 'Sync' },
    { id: 10, name: 'Editor' },
    { id: 11, name: 'Erp' },
    { id: 12, name: 'Social Network' },
    { id: 13, name: 'Cloud' },
    { id: 14, name: 'Analytics' },
    { id: 15, name: 'Wiki' },
];

export default (state = { categories, category: 'All', search: '' }, action) => {
    switch (action.type) {
        case 'SEARCH_APPLICATION': {
            return { ...state, search: action.search, category: 'All' };
        }

        case 'CHANGE_CATEGORY': {
            return { ...state, category: action.category, search: '' };
        }

        default: {
            return { ...state };
        }
    }
}
