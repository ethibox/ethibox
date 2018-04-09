import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Input, Dropdown, Modal, Header, Card, Image, Button, Icon, Dimmer, Loader } from 'semantic-ui-react';
import { isFQDN, isIP } from 'validator';
import { uninstallApplication, editDomainNameApplication } from '../application/ApplicationActions';
import { STATES, ACTIONS } from '../utils';

class Application extends React.Component {
    state = { action: '', domainName: this.props.domainName || '', error: false };

    geturl = () => {
        let url;

        if (this.props.domainName) {
            url = `https://${this.props.domainName}`;
        } else if (isIP(window.location.hostname)) {
            url = `http://${window.location.hostname}:${this.props.port}`;
        } else if (this.props.ip) {
            url = `http://${this.props.ip}:${this.props.port}`;
        } else {
            url = 'https://ethibox.fr/404';
        }

        return url;
    }

    uninstall = () => {
        this.setState({ action: '' });
        this.props.uninstallApplication(this.props.releaseName);
    }

    enterDomainName = (key) => {
        const domainName = this.state.domainName.trim();
        const { releaseName } = this.props;

        if (key === 'Enter') {
            if (isFQDN(domainName)) {
                this.props.editDomainNameApplication({ releaseName, domainName });
                this.setState({ action: '', error: false, domainName });
            } else {
                this.setState({ error: true });
            }
        }
    }

    removeDomainName = () => {
        this.props.editDomainNameApplication({ releaseName: this.props.releaseName, domainName: '' });
        this.setState({ domainName: '' });
    }

    renderDescription = () => {
        const { icon, state, error } = this.props;
        const url = this.geturl();

        return (
            <Card.Description textAlign="center">
                <Image src={icon} width="60" />
                {
                    state === STATES.RUNNING &&
                    <Card.Meta>
                        <a href={url} target="_blank">
                            <Icon name="external" /> {url}
                        </a>
                    </Card.Meta>
                }
                {
                    error &&
                    <Card.Meta>
                        <p style={{ color: 'red', fontWeight: 'bold' }}>{ error }</p>
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

        if (domainName) {
            options.push({ key: 'delete', icon: 'delete', text: 'Remove domain name', value: 'delete', onClick: () => this.removeDomainName() });
        }

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
            <Button.Group color="teal" widths={2}>
                <Button style={{ width: '90%' }} onClick={() => this.setState({ action: ACTIONS.UNINSTALL })} fluid><Icon name="delete" /> Uninstall</Button>
                <Dropdown options={options} style={{ width: 29 }} floating button className="icon" />
            </Button.Group>
        );
    }

    render() {
        return (
            <Card>
                { this.props.state !== STATES.RUNNING && !this.props.error ?
                    <Dimmer active inverted>
                        <Loader style={{ textTransform: 'capitalize' }} indeterminate>{ this.props.state }...</Loader>
                    </Dimmer> : null
                }
                <Card.Content>
                    <Card.Header>{this.props.releaseName}</Card.Header>
                    <Card.Meta>{this.props.category}</Card.Meta>
                    { this.renderDescription() }
                </Card.Content>
                <Card.Content extra>{ this.renderButtons() }</Card.Content>
                <Modal size="large" open={this.state.action === ACTIONS.UNINSTALL} onClose={() => this.setState({ action: '' })} key="uninstall" basic>
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

Application.defaultProps = { category: 'unknow' };
const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ uninstallApplication, editDomainNameApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Application);
