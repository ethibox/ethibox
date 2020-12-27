import { clear, redirect } from '../utils';

export default () => {
    setTimeout(() => {
        clear();
        redirect('/login');
    }, 2000);

    return 'Redirect...';
};
