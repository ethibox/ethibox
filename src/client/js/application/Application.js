import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Input, Dropdown, Modal, Header, Card, Image, Button, Icon, Dimmer, Loader } from 'semantic-ui-react';
import isFQDN from 'validator/lib/isFQDN';
import { uninstallApplication } from '../application/ApplicationActions';

const RUNNING = 'running';
const LOADING = 'loading';
const ERROR = 'error';

class Application extends React.Component {
    state = { action: '', domainName: '', error: false };

    uninstall = () => {
        this.setState({ action: '' });
        this.props.uninstallApplication(this.props.releaseName);
    }

    enterDomainName = (key) => {
        const { domainName } = this.state;

        if (key === 'Enter') {
            if (isFQDN(domainName)) {
                // this.editDomainName(domainName.trim());
            } else {
                this.setState({ error: true });
            }
        }
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
                            <Icon name="external" /> {hyperlink}
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

    renderButtons = () => {
        const { action, domainName, error } = this.state;
        const options = [
            { key: 'edit', icon: 'edit', text: 'Edit domain name', value: 'edit', onClick: () => this.setState({ action: 'editDomainName' }) },
        ];

        if (action === 'editDomainName') {
            return (
                <Input
                    error={error}
                    onBlur={() => this.setState({ action: '' })}
                    value={domainName}
                    onChange={(e, data) => this.setState({ domainName: data.value, error: false })}
                    onKeyDown={e => this.enterDomainName(e.key)}
                    placeholder="Enter domain name..."
                    transparent
                    autoFocus
                    fluid
                />
            );
        }

        return (
            <Button.Group color="red" widths={2}>
                <Button style={{ width: '90%' }} onClick={() => this.setState({ action: 'UNINSTALL' })} fluid>Uninstall</Button>
                <Dropdown options={options} style={{ width: 29 }} floating button className="icon" />
            </Button.Group>
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
                <Card.Content extra>{ this.renderButtons() }</Card.Content>
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
