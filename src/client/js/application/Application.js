import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Header, Card, Image, Button, Icon, Dimmer, Loader } from 'semantic-ui-react';
import { uninstallApplication } from '../application/ApplicationActions';
import { defaultIcon } from '../../images/default-icon.png';

const RUNNING = 'running';
const LOADING = 'loading';
const ERROR_MEMORY = 'Insufficient memory';

class Application extends React.Component {
    constructor(props) {
        super(props);
        this.state = { ...props };
    }

    componentWillMount() {
        if (this.props.state === LOADING) {
            this.refreshApplication();
        }
    }

    refreshApplication = () => {
        setTimeout(() => {
            fetch(`/api/applications/${this.props.releaseName}`)
                .then(res => res.json())
                .then((application) => {
                    if (application.state === LOADING) {
                        this.refreshApplication();
                    } else {
                        this.setState(application);
                    }
                });
        }, 5000);
    }

    render() {
        const { icon, releaseName, category, port, state } = this.state;
        const hyperlink = `//${process.env.MINIKUBE_IP || window.location.hostname}:${port}`;

        return (
            <Card>
                <Dimmer active={state === LOADING} inverted>
                    <Loader indeterminate>Loading...</Loader>
                </Dimmer>
                <Card.Content>
                    <Card.Header>{releaseName}</Card.Header>
                    <Card.Meta>{category}</Card.Meta>
                    <Card.Description textAlign="center">
                        <Image src={icon || defaultIcon} width="60" />
                        {
                            state === RUNNING &&
                            <Card.Meta>
                                <a href={hyperlink} target="_blank">
                                    <Icon name="linkify" />{hyperlink}
                                </a>
                            </Card.Meta>
                        }
                        {
                            state === ERROR_MEMORY &&
                            <Card.Meta>
                                <p style={{ color: 'red', fontWeight: 'bold' }}>Error: Insufficient memory</p>
                            </Card.Meta>
                        }
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className="ui two buttons">
                        <Button color="red" onClick={() => this.setState({ action: 'UNINSTALL' })}><Icon name="delete" /> Uninstall</Button>
                    </div>
                </Card.Content>
                <Modal size="large" open={this.state.action === 'UNINSTALL'} onClose={() => this.setState({ action: '' })} key="uninstall" basic>
                    <Header icon="delete" content="Uninstall application" />
                    <Modal.Content>
                        <p>Are you sure you want to uninstall this application?</p>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={() => this.setState({ action: '' })} basic inverted>Cancel</Button>
                        <Button color="red" onClick={() => this.props.uninstallApplication(releaseName)} inverted><Icon name="remove" />Uninstall</Button>
                    </Modal.Actions>
                </Modal>
            </Card>
        );
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ uninstallApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Application);
