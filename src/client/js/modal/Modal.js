import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Header, Button, Icon } from 'semantic-ui-react';
import { closeModal } from './ModalActions';

const ModalComponent = (props) => {
    const { hasErrored, title, errorMessage, successMessage, isOpen } = props;

    document.addEventListener('keypress', ({ key }) => {
        if (isOpen && (key === 'Escape' || key === 'Enter')) {
            props.closeModal({ redirect: (errorMessage === 'Not authorized') });
        }
    });

    return (
        <Modal open={isOpen} size="large" key="modal" basic>
            { hasErrored ? <Header icon="warning sign" content={title || 'Error'} /> : <Header icon="checkmark" content={title || 'Success'} /> }
            <Modal.Content>
                { hasErrored ? <h3>{errorMessage || 'Unknow error, contact an administrator'}</h3> : <h3>{successMessage || 'Operation completed'}</h3> }
            </Modal.Content>
            <Modal.Actions>
                <Button color={hasErrored ? 'red' : 'green'} onClick={() => props.closeModal({ redirect: (errorMessage === 'Not authorized') })} inverted>
                    <Icon name="close" /> Close
                </Button>
            </Modal.Actions>
        </Modal>
    );
};

const mapStateToProps = state => ({ ...state.ModalReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ closeModal }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ModalComponent);
