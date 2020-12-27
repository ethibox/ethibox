import React from 'react';
import { useImmer } from 'use-immer';

import Notification from '../components/notification';

const notificationContext = React.createContext({
    notify: () => {},
});

const { Provider, Consumer } = notificationContext;

const NotificationProvider = (props) => {
    const [notifications, updateNotifications] = useImmer([]);

    const removeNotification = (notification) => {
        updateNotifications((draft) => { draft.splice(draft.findIndex((n) => n.id === notification.id), 1); });
    };

    const addNotification = (notification) => {
        const newNotification = { id: Math.random(), ...notification };

        updateNotifications((draft) => { draft.push(newNotification); });

        if (['info', 'success', 'error'].includes(newNotification.type)) {
            setTimeout(() => {
                removeNotification(newNotification);
            }, 5000);
        }
    };

    const onClose = (notification) => {
        removeNotification(notification);
    };

    const onConfirm = (notification) => {
        notification.onConfirm();
        removeNotification(notification);
    };

    const { children } = props;

    return (
        <Provider value={{ notifications, notify: addNotification }}>
            { notifications.map((n) => (
                <Notification
                    key={n.id}
                    title={n.title}
                    message={n.message}
                    type={n.type}
                    onConfirm={() => onConfirm(n)}
                    onClose={() => onClose(n)}
                />
            )) }
            {children}
        </Provider>
    );
};

const withNotifier = (Component) => (props) => (
    <Consumer>
        { ({ notify }) => (
            <Component {...props} notify={notify} />
        ) }
    </Consumer>
);

export {
    withNotifier,
    NotificationProvider,
    Consumer as NotificationConsumer,
};
