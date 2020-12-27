import React from 'react';
import { useImmer } from 'use-immer';

import Modal from '../components/modal';

const modalContext = React.createContext({
    openModal: () => {},
});

const { Provider, Consumer } = modalContext;

const ModalProvider = (props) => {
    const [modal, updateModal] = useImmer({
        open: false,
        content: () => {},
        onConfirm: () => {},
        onClose: () => {},
    });

    const onClose = () => {
        modal.onClose();
        updateModal((draft) => { draft.open = false; });
    };

    const onConfirm = () => {
        modal.onConfirm();
        updateModal((draft) => { draft.open = false; });
    };

    const openModal = (m) => {
        const { content, confirmButton, closeButton, confirmClass } = m;
        updateModal((draft) => {
            draft.open = true;
            draft.content = content;
            draft.confirmButton = confirmButton;
            draft.closeButton = closeButton;
            draft.confirmClass = confirmClass;
            draft.onConfirm = m.onConfirm || modal.onConfirm;
            draft.onClose = m.onClose || modal.onClose;
        });
    };

    const { children } = props;

    return (
        <Provider value={{ openModal }}>
            { modal.open && (
                <Modal
                    content={modal.content}
                    onConfirm={() => onConfirm()}
                    onClose={() => onClose()}
                    confirmClass={modal.confirmClass}
                    confirmButton={modal.confirmButton}
                    closeButton={modal.closeButton}
                />
            ) }
            {children}
        </Provider>
    );
};

const withModal = (Component) => (props) => (
    <Consumer>
        { ({ openModal }) => (
            <Component {...props} openModal={openModal} />
        ) }
    </Consumer>
);

export {
    withModal,
    ModalProvider,
    Consumer as ModalConsumer,
};
