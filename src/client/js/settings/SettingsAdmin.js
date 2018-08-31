import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon, Message, Dropdown, Input, Divider, Header, Form, Button, Radio } from 'semantic-ui-react';
import { unsubscribe, updatePassword, updateAdminSettings } from './SettingsActions';

class SettingsAdmin extends Component {
    componentWillMount() {
        this.setState({
            stripeSecretKey: this.props.settings.stripeSecretKey || '',
            stripePublishableKey: this.props.settings.stripePublishableKey || '',
            stripePlanName: this.props.settings.stripePlanName || '',
            isMonetizationEnabled: this.props.settings.isMonetizationEnabled || false,
            storeRepositoryUrl: this.props.settings.storeRepositoryUrl || '',
            orchestratorName: this.props.settings.orchestratorName || '',
            orchestratorToken: this.props.settings.orchestratorToken || '',
            orchestratorEndpoint: this.props.settings.orchestratorEndpoint || '',
        });
    }

    handleChange = (e, { name, value }) => this.setState({ [name]: value })

    toggleMonetization = (e, { checked }) => {
        this.setState({ isMonetizationEnabled: checked });
    }

    handleSubmit = (e) => {
        e.target.blur();
        const { orchestratorEndpoint, orchestratorToken, storeRepositoryUrl } = this.state;

        if (!orchestratorEndpoint || !orchestratorToken || !storeRepositoryUrl) {
            return;
        }

        this.props.updateAdminSettings(this.state);
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
            />,
        ];
    }

    orchestratorForm = () => {
        const { storeRepositoryUrl, orchestratorName, orchestratorToken, orchestratorEndpoint } = this.state;
        const orchestrators = [{ text: 'Kubernetes', value: 'kubernetes' }, { text: 'Docker Swarm', value: 'swarm' }];

        return [
            orchestratorName === 'swarm' && <Message key="message" info><Icon name="info" />Docker Swarm is not available for the moment. Coming soon!</Message>,
            <Form.Field
                label="Orchestrator"
                placeholder="Kubernetes"
                control={Dropdown}
                name="orchestratorName"
                key="orchestratorName"
                options={orchestrators}
                value={orchestratorName}
                onChange={this.handleChange}
                fluid
                selection
                required
            />,
            orchestratorName === 'kubernetes' && <Form.Input
                icon="plug"
                iconPosition="left"
                type="text"
                label="Endpoint URL"
                placeholder="https://192.168.99.100:8443"
                name="orchestratorEndpoint"
                key="orchestratorEndpoint"
                value={orchestratorEndpoint}
                onChange={this.handleChange}
                required
            />,
            orchestratorName === 'kubernetes' && <Form.Input
                icon="key"
                iconPosition="left"
                type="text"
                label="Token"
                placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aW"
                name="orchestratorToken"
                key="orchestratorToken"
                value={orchestratorToken}
                onChange={this.handleChange}
                required
            />,
            <Form.Field
                control={Input}
                type="text"
                label="Store repository URL"
                iconPosition="left"
                icon="linkify"
                placeholder="https://store.ethibox.fr/apps.json"
                key="storeRepositoryUrl"
                name="storeRepositoryUrl"
                value={storeRepositoryUrl}
                onChange={this.handleChange}
                required
            />,
        ];
    }

    render() {
        const { isMonetizationEnabled, orchestratorName } = this.state;

        return (
            <Form>
                <Header dividing>Admin settings</Header>
                { this.orchestratorForm() }
                <Form.Field label="Enable Monetization" className="monetization" onClick={this.toggleMonetization} control={Radio} checked={isMonetizationEnabled} toggle />
                { isMonetizationEnabled && this.StripeForm() }
                <Button onClick={this.handleSubmit} disabled={orchestratorName === 'swarm'} name="save">Save settings</Button>
                <Divider hidden />
            </Form>
        );
    }
}

const mapStateToProps = state => ({ ...state.SettingsReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ unsubscribe, updatePassword, updateAdminSettings }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(SettingsAdmin);
