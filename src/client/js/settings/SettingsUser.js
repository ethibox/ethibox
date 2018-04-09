import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Input, Header, Form, Message, Button, Radio } from 'semantic-ui-react';
import { unsubscribe, updatePassword } from './SettingsActions';
import { history } from '../utils';

class SettingsUser extends Component {
    state = { loading: false, openModal: false, password: '', confirmPassword: '', errors: [] };

    handleChange = e => this.setState({ [e.target.name]: e.target.value, errors: [] });

    toggleSubscribe = (e, { checked }) => {
        if (checked) {
            history.push('/subscribe');
        } else {
            this.setState({ openModal: true });
        }
    }

    unsubscribe = () => {
        this.setState({ openModal: false });
        this.props.unsubscribe();
    }

    handleSubmit = (e) => {
        e.target.blur();

        const { password, confirmPassword } = this.state;
        const errors = [];

        this.setState({ loading: true });

        if (password.length < 6) {
            errors.push('Your password must be at least 6 characters');
        }

        if (password !== confirmPassword) {
            errors.push('Passwords doesn\'t match');
        }

        if (!errors.length) {
            this.props.updatePassword(password).then(() => this.setState({ errors, loading: false, password: '', confirmPassword: '' }));
        } else {
            this.setState({ errors, loading: false });
        }
    }

    renderModal = () => {
        return (
            <Modal size="mini" open={this.state.openModal} onClose={this.close}>
                <Modal.Header>Unsubscribe</Modal.Header>
                <Modal.Content>
                    <p>Are you sure you want unsubscribe ?</p>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => this.setState({ openModal: false })} negative>No</Button>
                    <Button positive icon="checkmark" labelPosition="right" content="Yes" onClick={() => this.unsubscribe()} />
                </Modal.Actions>
            </Modal>
        );
    }

    render() {
        const { loading, password, confirmPassword, errors } = this.state;
        const { isSubscribed, isMonetizationEnabled } = this.props.settings;

        return (
            <Form>
                <Header dividing>User settings</Header>
                { isMonetizationEnabled && <Form.Field label="Subscribe premium account" className="subscribe" control={Radio} onChange={this.toggleSubscribe} checked={isSubscribed} toggle /> }
                <Form.Group widths="equal">
                    <Form.Field
                        control={Input}
                        label="Password"
                        type="password"
                        name="password"
                        placeholder="Password"
                        iconPosition="left"
                        icon="lock"
                        onChange={this.handleChange}
                        value={password}
                    />
                    <Form.Field
                        control={Input}
                        label="Confirm password"
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm password"
                        icon="lock"
                        iconPosition="left"
                        onChange={this.handleChange}
                        value={confirmPassword}
                        onKeyPress={e => (e.key === 'Enter') && e.target.blur()}
                    />
                </Form.Group>
                <Message header="There was some errors with your submission" list={errors} visible={!!errors.length} error />
                <Button name="password" syle={{ outline: 'none' }} onClick={this.handleSubmit} loading={loading} disabled={loading}>Update password</Button>
                { this.renderModal() }
            </Form>
        );
    }
}

const mapStateToProps = state => ({ ...state.SettingsReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ unsubscribe, updatePassword }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(SettingsUser);
