import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Dropdown, Message, Grid, Form, Button } from 'semantic-ui-react';
import { isAlpha } from 'validator';
import { subscribe } from './SubscribeActions';
import { history } from '../utils';

class Subscribe extends Component {
    state = { name: '', number: '', expMonth: '01', expYear: (new Date()).getFullYear(), cvc: '', errors: [], disabled: false };

    componentWillMount() {
        if (!new RegExp(/^pk_/).test(Stripe.key)) {
            this.setState({ disabled: true, errors: ['Bad stripe publishable key.'] });
        }

        if (!this.props.settings.isMonetizationEnabled) {
            this.setState({ disabled: true, errors: ['Monetization is not activated.'] });
        }

        if (this.props.settings.isSubscribed) {
            this.setState({ disabled: true, errors: ['You already subscribe.'] });
        }
    }

    handleChange = (e, { name, value }) => this.setState({ [name]: value, errors: [] })

    handleSubmit = () => {
        const { name, number, expMonth, expYear, cvc } = this.state;
        const errors = [];

        if (!isAlpha(name.replace(/\s/g, ''))) {
            errors.push('Please enter your name');
        }

        if (number.replace(/\s/g, '').length !== 16) {
            errors.push('Please enter a correct card number');
        }

        if (cvc.length !== 3) {
            errors.push('Security Code must be 3 digts');
        }

        if (!errors.length) {
            this.props.subscribe(name, number, expMonth, expYear, cvc).then(() => {
                if (this.props.error) {
                    this.setState({ errors: [this.props.error] });
                } else {
                    history.push('/settings');
                }
            });
        } else {
            this.setState({ errors });
        }
    }

    render() {
        const { errors, expMonth, expYear, disabled } = this.state;

        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(month => ({ text: month, value: month }));
        const years = [];
        const currentYear = (new Date()).getFullYear();
        for (let year = currentYear; year <= currentYear + 10; year += 1) {
            years.push({ text: year, value: year });
        }

        return (
            <Grid columns={2} stackable>
                <Grid.Column width={10}>
                    <Form>
                        <Message header="Error" list={errors} visible={!!errors.length} error />
                        <Form.Input label="Full name" placeholder="John Doe" icon="users" iconPosition="left" name="name" onChange={this.handleChange} />
                        <Form.Input label="Card Number" placeholder="1111 2222 3333 4444" icon="credit card" iconPosition="left" name="number" onChange={this.handleChange} />
                        <Form.Group widths="equal">
                            <Form.Field label="Month expiration" control={Dropdown} name="expMonth" options={months} value={expMonth} onChange={this.handleChange} fluid selection />
                            <Form.Field label="Year expiration" control={Dropdown} name="expYear" options={years} value={expYear} onChange={this.handleChange} fluid selection />
                        </Form.Group>
                        <Form.Input label="Security Code" icon="lock" iconPosition="left" placeholder="123" name="cvc" onChange={this.handleChange} />
                        <p>You will be billed now and on the 1th of each month thereafter. You can cancel or change your subscription at any time.</p>
                        <Button onClick={this.handleSubmit} disabled={disabled}>Pay { this.props.settings.monthlyPrice }</Button>
                    </Form>
                </Grid.Column>
            </Grid>
        );
    }
}

const mapStateToProps = state => ({ ...state.SettingsReducer, ...state.SubscribeReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ subscribe }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Subscribe);
