import React, { Component } from 'react';
import { Header, Responsive, Segment, Button, Sidebar, Divider, Menu, Icon, Container } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import logo from '../../images/logo.svg';
import whiteLogo from '../../images/logo-white.svg';
import MessageDemo from './MessageDemo';
import { dataToken } from '../utils';
import Footer from './Footer';
import Modal from '../modal/Modal';
import Loader from '../loader/Loader';

class DashboardLayout extends Component {
    state = { visible: false };

    toggleMenu = () => this.setState({ visible: !this.state.visible })

    render() {
        return [
            <Sidebar as={Menu} animation="overlay" width="thin" visible={this.state.visible} icon="labeled" key="sidebar" vertical inverted>
                <Menu.Item header><img src={whiteLogo} style={{ margin: 'auto' }} alt="logo" /> Ethibox { dataToken.demo && <small className="demo">demo</small> }</Menu.Item>
                <Menu.Item name="apps" as={NavLink} to="/" exact><Icon name="grid layout" />Apps</Menu.Item>
                <Menu.Item name="logout" onClick={() => { localStorage.clear(); window.location.replace('/'); }}><Icon name="sign out" />Logout</Menu.Item>
            </Sidebar>,
            <Sidebar.Pusher key="pusher">
                <Container className="main" fluid>
                    <Responsive {...Responsive.onlyMobile}>
                        <Segment floated="left" basic>
                            <Header as="h2">
                                <img src={logo} alt="logo" />
                                <Header.Content style={{ position: 'relative' }}>
                                    Ethibox { dataToken.demo && <small className="demo">demo</small> }
                                </Header.Content>
                            </Header>
                        </Segment>
                        <Segment floated="right" basic>
                            <Button onClick={this.toggleMenu} icon basic>
                                <Icon name="sidebar" />
                            </Button>
                        </Segment>
                    </Responsive>

                    { dataToken.demo && <MessageDemo /> }

                    <Responsive {...Responsive.onlyMobile} >
                        <Divider hidden />
                    </Responsive>

                    <div className="second">
                        { this.props.children }
                    </div>

                    <Footer />
                    <Modal />
                    <Loader />
                </Container>
            </Sidebar.Pusher>,
        ];
    }
}

export default DashboardLayout;
