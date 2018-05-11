import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Card, Image, Button, Icon, Input } from 'semantic-ui-react';
import { installApplication } from '../application/ApplicationActions';
import { openModal } from '../modal/ModalActions';

class Package extends React.Component {
    state = { action: '', releaseName: '', error: false }

    isValidReleaseName = releaseName => releaseName.match(/^[a-z]([-a-z0-9]*[a-z0-9])?$/);
    isAlreadyExist = releaseName => this.props.applications.map(release => release.releaseName).includes(releaseName);

    enterReleaseName = (key) => {
        const releaseName = this.state.releaseName.trim();

        if (key === 'Enter') {
            if (this.isAlreadyExist(releaseName)) {
                this.props.openModal({ hasErrored: true, errorMessage: "Application's name already taken" });
                this.setState({ error: true });
                return;
            }

            if (this.isValidReleaseName(releaseName)) {
                this.props.installApplication({ name: this.props.name, releaseName, category: this.props.category });
                this.setState({ action: '', releaseName: '' });
            } else {
                this.setState({ error: true });
            }
        }
    }

    renderButtons = () => {
        const { action, releaseName, error } = this.state;

        if (action === 'editReleaseName') {
            return (
                <Input
                    error={error}
                    onBlur={() => this.setState({ action: '' })}
                    value={releaseName}
                    onChange={(e, data) => this.setState({ releaseName: data.value, error: false })}
                    onKeyDown={e => this.enterReleaseName(e.key)}
                    placeholder="Enter application's name..."
                    transparent
                    autoFocus
                    fluid
                />
            );
        }

        return (
            <Button.Group color="teal" widths={2}>
                <Button color="teal" onClick={() => this.setState({ action: 'editReleaseName' })}><Icon name="add" /> Install</Button>
            </Button.Group>
        );
    }

    render() {
        const { name, category } = this.props;

        return (
            <Card>
                <Card.Content>
                    <Card.Header style={{ textTransform: 'capitalize' }}>{name}</Card.Header>
                    <Card.Meta>{category}</Card.Meta>
                    <Card.Description textAlign="center">
                        <Image src={`/icons/${name}/icon.png`} width="60" />
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>{ this.renderButtons() }</Card.Content>
            </Card>
        );
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ installApplication, openModal }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Package);
