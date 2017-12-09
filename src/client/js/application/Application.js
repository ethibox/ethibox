import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Label, Card, Image, Button, Modal, Header, Icon, Progress, Dimmer, Loader, Input } from 'semantic-ui-react';
import { installApplication, uninstallApplication, updateApplication } from '../application/ApplicationActions';

const defaultIcon = 'https://react.semantic-ui.com/assets/images/wireframe/white-image.png';
const initialApplication = { state: null, installed: false, domainError: false, domain: '', openModal: false, progress: 0 };

class Application extends React.Component {
    constructor(props) {
        super(props);
        const hyperlien = `http://${props.domain}`;
        this.state = { ...initialApplication, ...props, hyperlien };
    }

    isValidDomain = domain => domain.match(/((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}/);

    enterDomain = (key) => {
        const { id, domain, installed } = this.state;
        this.setState({ domainError: false });
        if (key === 'Enter') {
            if (this.isValidDomain(domain)) {
                if (!installed) this.install();
                else {
                    this.setState({ state: this.props.state, domain: domain || '' }, () => {
                        this.props.updateApplication({ id, domain });
                    });
                }
            } else {
                this.setState({ domainError: true });
            }
        }
    }

    stop = () => {
        this.setState({ state: 'stop', openModal: false }, () => {
            const { id, state } = this.state;
            this.props.updateApplication({ id, state });
        });
    }

    start = () => {
        this.setState({ state: 'running' }, () => {
            const { id, state } = this.state;
            this.props.updateApplication({ id, state });
        });
    }

    install = () => {
        const { name, category, icon, domain } = this.state;
        this.setState({ state: 'installing' });
        setTimeout(() => this.setState({ progress: 70 }), 2000);
        setTimeout(() => this.setState({ progress: 100 }), 5000);
        setTimeout(() => this.setState({ state: 'running' }), 6000);
        setTimeout(() => this.props.installApplication({ name, category, domain, icon, installed: true, state: 'running' }), 6200);
        setTimeout(() => this.setState({ ...initialApplication }), 6200);
    }

    uninstall = () => {
        const { id } = this.state;
        this.props.uninstallApplication(id);
    }

    renderActions = () => {
        let uninstallModal = null;
        const { state } = this.state;

        if (!['running', 'stop'].includes(state)) return null;

        if (state === 'stop') {
            uninstallModal = (
                <Modal
                    trigger={<Icon name="delete" color="red" className="right floated" onClick={() => this.setState({ openModal: true })} />}
                    basic
                    size="small"
                    open={this.state.openModal}
                    onClose={() => this.setState({ openModal: false })}
                    key="uninstall"
                >
                    <Header icon="delete" content="Uninstall application" />
                    <Modal.Content>
                        <p>Are you sure you want to uninstall this application?</p>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={() => this.setState({ openModal: false })} basic inverted>Cancel</Button>
                        <Button color="red" onClick={() => this.uninstall()} inverted><Icon name="remove" />Uninstall</Button>
                    </Modal.Actions>
                </Modal>
            );
        }

        return [
            uninstallModal,
            <Icon key="edit" onClick={() => this.setState({ state: 'edit' })} name="edit" className="right floated" />,
        ];
    }

    renderMainAction = () => {
        const { state, openModal, domain, domainError } = this.state;

        if (state === 'running') {
            return (
                <div className="ui two buttons">
                    <Modal
                        open={openModal}
                        onClose={() => this.setState({ openModal: false })}
                        trigger={<Button color="red" icon="stop" content="Stop" onClick={() => this.setState({ openModal: true })} />}
                        size="small"
                        basic
                    >
                        <Header icon="stop" content="Stop application" />
                        <Modal.Content>
                            <p>Are you sure you want to stop this application?</p>
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={() => this.setState({ openModal: false })} basic inverted>Cancel</Button>
                            <Button color="red" inverted onClick={() => this.stop()}><Icon name="stop" />Stop</Button>
                        </Modal.Actions>
                    </Modal>
                </div>
            );
        }

        if (state === 'stop') {
            return (
                <div className="ui two buttons">
                    <Button color="teal" onClick={() => this.start()}><Icon name="play" />Start</Button>
                </div>
            );
        }

        if (state === 'edit') {
            return (
                <div className="ui large transparent input">
                    <Input
                        error={domainError}
                        value={domain}
                        onBlur={() => this.setState({ state: this.props.state, domain: this.props.domain || '' })}
                        onChange={(e, data) => this.setState({ domain: data.value })}
                        onKeyDown={e => this.enterDomain(e.key)}
                        placeholder="Enter your domain name..."
                        autoFocus
                    />
                </div>
            );
        }

        if (state === 'upcomming') {
            return <div className="ui two buttons"><Button color="teal" disabled><Icon name="add" /> Install</Button></div>;
        }

        return <div className="ui two buttons"><Button color="teal" onClick={() => this.setState({ state: 'edit' })}><Icon name="add" /> Install</Button></div>;
    }

    render() {
        const { icon, name, domain, state, hyperlien, progress } = this.state;

        return (
            <Card>
                <Dimmer active={state === 'installing'} inverted>
                    <Loader indeterminate>Installation...</Loader>
                </Dimmer>
                <Card.Content>
                    { this.renderActions() }
                    <Card.Header>{name}</Card.Header>
                    { state === 'upcomming' ? <Label as="a" color="orange" ribbon="right">Upcomming</Label> : null }
                    <Card.Description textAlign="center">
                        <Image src={icon || defaultIcon} width="60" />
                        { (domain) ? <Card.Meta><a href={hyperlien} target="_blank"><Icon name="linkify" />{domain}</a></Card.Meta> : null }
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>{ this.renderMainAction() }</Card.Content>
                { (state === 'installing') ? <Progress percent={progress} attached="bottom" color="teal" indicating /> : null }
            </Card>
        );
    }
}

const mapStateToProps = state => ({ ...state.AppReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ installApplication, uninstallApplication, updateApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Application);
