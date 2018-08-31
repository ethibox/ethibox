import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import isEmail from 'validator/lib/isEmail';
import { Container, Segment, Message, Grid, Button, Form } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { register } from './RegisterActions';
import { getParameterByName } from '../utils';
import Loader from '../loader/Loader';
import Header from '../app/Header';
import Footer from '../app/Footer';
import Fork from '../app/Fork';

class Register extends React.Component {
    state = { email: '', password: '', errors: [] };

    handleChange = e => this.setState({ [e.target.name]: e.target.value });

    handleSubmit = () => {
        const errors = [];
        const { email, password } = this.state;

        if (!isEmail(email)) {
            errors.push('Please enter your e-mail');
        }

        if (!password || password.length < 6) {
            errors.push('Your password must be at least 6 characters');
        }

        this.setState({ errors });

        if (!errors.length) {
            this.props.register(email, password).then(() => {
                if (this.props.error) {
                    this.setState({ errors: [this.props.error] });
                }
            });
        }
    }

    renderForm = () => {
        const { email, password, errors } = this.state;

        return (
            <Form size="large">
                <Segment stacked>
                    <Form.Input icon="mail" iconPosition="left" type="text" placeholder="E-mail address" name="email" value={email} onChange={this.handleChange} />
                    <Form.Input icon="lock" iconPosition="left" type="password" placeholder="Password" name="password" value={password} onChange={this.handleChange} />
                    <Message header="Error" list={errors} visible={!!errors.length} error />
                    <Button type="submit" color="teal" onClick={this.handleSubmit} fluid>Create an account</Button>
                </Segment>
            </Form>
        );
    }

    render() {
        const isFirstAccount = getParameterByName('first');

        return (
            <Container style={{ height: '100%' }}>
                <Fork />
                <Grid verticalAlign="middle" style={{ height: '100%' }} centered stackable>
                    <Grid.Column style={{ maxWidth: 450 }}>
                        <Header />
                        { isFirstAccount && <Message style={{ textAlign: 'center' }}><p>Please create the initial administrator user.</p></Message> }
                        { this.renderForm() }
                        { !isFirstAccount && <Message style={{ textAlign: 'center' }}><p>Already have an account? <Link to="/login" href="/login">Sign in</Link></p></Message> }
                        <Footer />
                    </Grid.Column>
                </Grid>
                <Loader />
            </Container>
        );
    }
}

const mapStateToProps = state => ({ ...state.RegisterReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ register }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Register);
