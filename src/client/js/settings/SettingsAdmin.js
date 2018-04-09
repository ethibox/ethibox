import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Input, Divider, Header, Form, Button, Radio } from 'semantic-ui-react';
import { unsubscribe, updatePassword, updateAdminSettings } from './SettingsActions';

class SettingsAdmin extends Component {
    state = { stripeSecretKey: '', stripePublishableKey: '', stripePlanName: '', displayStripeForm: false };

    componentWillMount() {
        this.setState({
            stripeSecretKey: this.props.settings.stripeSecretKey || '',
            stripePublishableKey: this.props.settings.stripePublishableKey || '',
            stripePlanName: this.props.settings.stripePlanName || '',
            displayStripeForm: this.props.settings.isMonetizationEnabled || false,
        });
    }

    handleChange = e => this.setState({ [e.target.name]: e.target.value });

    toggleMonetization = (e, { checked }) => {
        this.setState({ displayStripeForm: checked });
    }

    handleSubmit = (e) => {
        e.target.blur();
        const { displayStripeForm, stripeSecretKey, stripePublishableKey, stripePlanName } = this.state;
        this.props.updateAdminSettings({ isMonetizationEnabled: displayStripeForm, stripeSecretKey, stripePublishableKey, stripePlanName });
    }

    StripeForm = () => {
        const { stripeSecretKey, stripePublishableKey, stripePlanName } = this.state;
        return [
            <Form.Group widths="equal" key="keys">
                <Form.Field
                    control={Input}
                    type="text"
                    label="Stripe Secret Key"
                    placeholder="sk_live_abcd"
                    iconPosition="left"
                    icon="key"
                    name="stripeSecretKey"
                    value={stripeSecretKey}
                    onChange={this.handleChange}
                    onKeyPress={e => (e.key === 'Enter') && e.target.blur()}
                />
                <Form.Field
                    control={Input}
                    type="text"
                    label="Stripe Publishable Key"
                    placeholder="pk_live_abcd"
                    iconPosition="left"
                    icon="key"
                    name="stripePublishableKey"
                    value={stripePublishableKey}
                    onChange={this.handleChange}
                    onKeyPress={e => (e.key === 'Enter') && e.target.blur()}
                />
            </Form.Group>,
            <Form.Field
                control={Input}
                type="text"
                label="Stripe Plan Name"
                placeholder="plan_abcd"
                iconPosition="left"
                icon="edit"
                key="plan"
                name="stripePlanName"
                value={stripePlanName}
                onChange={this.handleChange}
                onKeyPress={e => (e.key === 'Enter') && e.target.blur()}
            />,
        ];
    }

    render() {
        const { displayStripeForm } = this.state;

        return (
            <Form>
                <Header dividing>Admin settings</Header>
                { /* <Form.Field label="Store repository" control={Input} iconPosition="left" icon="linkify" value="https://charts.ethibox.fr" action="Synchronize" /> */ }
                { /* <Form.Field label="User applications limit" control={Input} placeholder="0" type="number" iconPosition="left" icon="hand paper" /> */ }
                { /* <Form.Field label="Enable registration" control={Radio} toggle /> */ }
                <Form.Field label="Enable Monetization" className="monetization" onClick={this.toggleMonetization} control={Radio} checked={displayStripeForm} toggle />
                { displayStripeForm && this.StripeForm() }
                <Button onClick={this.handleSubmit} name="save">Save settings</Button>
                <Divider hidden />
            </Form>
        );
    }
}

const mapStateToProps = state => ({ ...state.SettingsReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ unsubscribe, updatePassword, updateAdminSettings }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(SettingsAdmin);
