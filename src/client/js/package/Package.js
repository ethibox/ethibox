import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Form, Label, Card, Image, Button, Icon, Input } from 'semantic-ui-react';
import { installApplication } from '../application/ApplicationActions';

class Package extends React.Component {
    state = { action: '', releaseName: '', error: false, errorMessage: '' }

    isValidReleaseName = releaseName => releaseName.match(/^[a-z]([-a-z0-9]*[a-z0-9])?$/i);
    isAlreadyExist = releaseName => this.props.applications.map(release => release.releaseName).includes(releaseName);

    enterReleaseName = (key) => {
        const releaseName = this.state.releaseName.trim().toLowerCase();

        if (key === 'Enter') {
            if (this.isAlreadyExist(releaseName)) {
                this.setState({ error: true, errorMessage: 'Application\'s name already taken' });
                return;
            }

            if (this.isValidReleaseName(releaseName)) {
                this.props.installApplication({ name: this.props.name, releaseName, category: this.props.category });
                this.setState({ action: '', releaseName: '' });
            } else {
                this.setState({ error: true, errorMessage: 'Please enter a valid name' });
            }
        }
    }

    renderButtons = () => {
        const { action, releaseName, error, errorMessage } = this.state;

        if (action === 'editReleaseName') {
            return (
                <Form.Field>
                    <Input
                        error={error}
                        onBlur={() => this.setState({ action: '' })}
                        value={releaseName}
                        onChange={(e, data) => this.setState({ releaseName: data.value, error: false, errorMessage: '' })}
                        onKeyDown={e => this.enterReleaseName(e.key)}
                        placeholder="Enter application's name..."
                        transparent
                        autoFocus
                        fluid
                    />
                    { error ? <Label color="red" basic pointing>{ errorMessage }</Label> : '' }
                </Form.Field>
            );
        }

        return (
            <Button.Group color="teal" widths={2}>
                <Button color="teal" onClick={() => this.setState({ action: 'editReleaseName' })}><Icon name="add" /> Install</Button>
            </Button.Group>
        );
    }

    render() {
        const { name, icon, category } = this.props;

        return (
            <Card>
                <Card.Content>
                    <Card.Header style={{ textTransform: 'capitalize' }}>{name}</Card.Header>
                    <Card.Meta>{category}</Card.Meta>
                    <Card.Description textAlign="center">
                        <Image src={icon} width="60" />
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>{ this.renderButtons() }</Card.Content>
            </Card>
        );
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ installApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Package);
