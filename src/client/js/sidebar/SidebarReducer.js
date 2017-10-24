const categories = [
    { id: 0, name: 'Blog' },
    { id: 1, name: 'Chat' },
    { id: 2, name: 'Blog' },
    { id: 3, name: 'Project Management' },
    { id: 4, name: 'Webmail' },
    { id: 5, name: 'Monitoring' },
    { id: 6, name: 'Development' },
    { id: 7, name: 'E-Commerce' },
    { id: 8, name: 'Forum' },
    { id: 9, name: 'Search Engine' },
    { id: 10, name: 'Sync' },
    { id: 11, name: 'Editor' },
    { id: 12, name: 'Erp' },
    { id: 13, name: 'Social Network' },
    { id: 14, name: 'Cloud' },
    { id: 15, name: 'Analytics' },
    { id: 16, name: 'Wiki' },
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
