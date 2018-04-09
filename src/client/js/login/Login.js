import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import isEmail from 'validator/lib/isEmail';
import { Container, Segment, Message, Grid, Button, Form } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { login } from './LoginActions';
import Loader from '../loader/Loader';
import Header from '../app/Header';
import Footer from '../app/Footer';
import Fork from '../app/Fork';

class Login extends React.Component {
    state = { email: '', password: '', errors: [] };
    handleChange = e => this.setState({ [e.target.name]: e.target.value, errors: [] });

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
            this.props.login(email, password).then(() => {
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
                    <Form.Input icon="mail outline" iconPosition="left" type="text" placeholder="E-mail address" name="email" value={email} onChange={this.handleChange} />
                    <Form.Input icon="lock" iconPosition="left" type="password" placeholder="Password" name="password" value={password} onChange={this.handleChange} />
                    <Message header="Error" list={errors} visible={!!errors.length} error />
                    <Button type="submit" color="teal" onClick={this.handleSubmit} fluid>Sign in</Button>
                </Segment>
            </Form>
        );
    }

    render() {
        return (
            <Container style={{ height: '100%' }}>
                <Fork />
                <Grid verticalAlign="middle" style={{ height: '100%' }} centered stackable>
                    <Grid.Column style={{ maxWidth: 450 }}>
                        <Header />
                        { this.renderForm() }
                        <Message style={{ textAlign: 'center' }}><p>New to us? <Link to="/register" href="/register">Create an account</Link>.</p></Message>
                        <Footer />
                    </Grid.Column>
                </Grid>
                <Loader />
            </Container>
        );
    }
}

const mapStateToProps = state => ({ ...state.LoginReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ login }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Login);
