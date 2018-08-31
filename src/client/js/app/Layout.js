import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Label, Header, Responsive, Segment, Button, Sidebar, Menu, Icon, Container } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import { faStoreAlt } from '@fortawesome/fontawesome-free-solid';
import { SemanticToastContainer } from 'react-semantic-toasts';
import { history } from '../utils';
import logo from '../../images/logo.svg';
import whiteLogo from '../../images/logo-white.svg';
import Footer from './Footer';
import Modal from '../modal/Modal';
import Loader from '../loader/Loader';
import { synchronize, synchronizeInterval } from '../synchronize/SynchronizeActions';

class Layout extends Component {
    state = { visible: false };

    componentWillMount() {
        const interval = process.env.NODE_ENV === 'production' ? 5000 : 2000;
        this.props.synchronize();
        this.props.synchronizeInterval({ interval });
    }

    toggleMenu = () => this.setState({ visible: !this.state.visible })

    render() {
        const { isDemoEnabled } = this.props.settings;

        return [
            <Sidebar as={Menu} animation="overlay" width="thin" visible={this.state.visible} icon="labeled" key="sidebar" vertical inverted>
                { isDemoEnabled && <Label color="red" corner="right" floating={false}><div style={{ transform: 'rotate(45deg)', marginLeft: 13, marginTop: 13 }}>Demo</div></Label> }
                <Menu.Item header>
                    <img src={whiteLogo} style={{ margin: 'auto' }} alt="logo" /> Ethibox
                </Menu.Item>
                <Menu.Item name="apps" as={NavLink} to="/" onClick={this.toggleMenu} exact><Icon name="cubes" />Apps</Menu.Item>
                <Menu.Item name="store" as={NavLink} to="/store" onClick={this.toggleMenu} exact><Icon as={FontAwesomeIcon} icon={faStoreAlt} />Store</Menu.Item>
                <Menu.Item name="settings" as={NavLink} to="/settings" onClick={this.toggleMenu} exact><Icon name="settings" />Settings</Menu.Item>
                <Menu.Item name="logout" onClick={() => history.push('/logout') && this.toggleMenu}><Icon name="sign out" />Logout</Menu.Item>
            </Sidebar>,
            <Sidebar.Pusher key="pusher">
                <Container className="main" fluid>
                    <Responsive {...Responsive.onlyMobile}>
                        <Segment floated="left" basic>
                            <Header as="h2">
                                <img src={logo} alt="logo" />
                                <Header.Content style={{ position: 'relative' }}>Ethibox</Header.Content>
                            </Header>
                        </Segment>
                        <Segment floated="right" basic>
                            <Button onClick={this.toggleMenu} icon basic>
                                <Icon name="sidebar" />
                            </Button>
                        </Segment>
                    </Responsive>

                    <div className="second">{ this.props.isSynchronized && this.props.children }</div>

                    <Footer />
                    <Modal />
                    <Loader />
                    <SemanticToastContainer position="bottom-right" />
                </Container>
            </Sidebar.Pusher>,
        ];
    }
}

const mapStateToProps = state => ({ ...state.SettingsReducer, ...state.SynchronizeReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ synchronize, synchronizeInterval }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Layout);
