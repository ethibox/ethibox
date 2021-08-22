import { clear, redirect } from '../utils';

const Logout = () => {
    setTimeout(() => {
        clear();
        redirect('/login');
    }, 2000);

    return 'Redirect...';
};

export default Logout;
