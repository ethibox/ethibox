import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Modal, Header, Button, Icon } from 'semantic-ui-react';
import { openModal, closeModal } from './ModalActions';

class ModalComponent extends React.Component {
    render() {
        const { hasErrored, title, errorMessage, successMessage, loadingMessage, isLoading, open } = this.props;

        return (
            <Modal open={open} size="large" key="modal" basic>
                { hasErrored && <Header icon="warning sign" content={title || 'Error'} /> }
                { isLoading && <Header icon="info" content={title || 'Loading'} /> }
                { (!hasErrored && !isLoading) && <Header icon="checkmark" content={title || 'Success'} /> }
                <Modal.Content>
                    { hasErrored && <h3>{errorMessage || 'Unknow error, contact an administrator'}</h3> }
                    { isLoading && <h3>{loadingMessage || 'Loading...'}</h3> }
                    { (!hasErrored && !isLoading) && <h3>{successMessage || 'Operation completed'}</h3> }
                </Modal.Content>
                <Modal.Actions>
                    <Button color={hasErrored ? 'red' : 'green'} onClick={() => this.props.closeModal()} inverted>
                        <Icon name="close" /> Close
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

const mapStateToProps = state => ({ ...state.ModalReducer, ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ openModal, closeModal }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ModalComponent);
