import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Header, Card, Image, Button, Icon, Dimmer, Loader } from 'semantic-ui-react';
import { uninstallApplication } from '../application/ApplicationActions';

const RUNNING = 'running';
const LOADING = 'loading';
const ERROR = 'error';

class Application extends React.Component {
    state = { action: '' };

    uninstall = () => {
        this.setState({ action: '' });
        this.props.uninstallApplication(this.props.releaseName);
    }

    renderDescription = () => {
        const { name, port, state } = this.props;
        const hyperlink = `http://${process.env.MINIKUBE_IP || window.location.hostname}:${port}`;

        return (
            <Card.Description textAlign="center">
                <Image src={`/icons/${name}/icon.png`} width="60" />
                {
                    state === RUNNING &&
                    <Card.Meta>
                        <a href={hyperlink} target="_blank">
                            <Icon name="linkify" />{hyperlink}
                        </a>
                    </Card.Meta>
                }
                {
                    state === ERROR &&
                    <Card.Meta>
                        <p style={{ color: 'red', fontWeight: 'bold' }}>Error</p>
                    </Card.Meta>
                }
            </Card.Description>
        );
    }

    render() {
        return (
            <Card>
                <Dimmer active={this.props.state === LOADING} inverted>
                    <Loader indeterminate>Loading...</Loader>
                </Dimmer>
                <Card.Content>
                    <Card.Header>{this.props.releaseName}</Card.Header>
                    <Card.Meta>{this.props.category}</Card.Meta>
                    { this.renderDescription() }
                </Card.Content>
                <Card.Content extra>
                    <div className="ui two buttons">
                        <Button color="red" onClick={() => this.setState({ action: 'UNINSTALL' })}><Icon name="delete" /> Uninstall</Button>
                    </div>
                </Card.Content>
                <Modal size="large" open={this.state.action === 'UNINSTALL'} onClose={() => this.setState({ action: '' })} key="uninstall" basic>
                    <Header icon="delete" content="Uninstall application" />
                    <Modal.Content><p>Are you sure you want to uninstall this application?</p></Modal.Content>
                    <Modal.Actions>
                        <Button onClick={() => this.setState({ action: '' })} basic inverted>Cancel</Button>
                        <Button color="red" onClick={() => this.uninstall()} inverted><Icon name="remove" />Uninstall</Button>
                    </Modal.Actions>
                </Modal>
            </Card>
        );
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ uninstallApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Application);
