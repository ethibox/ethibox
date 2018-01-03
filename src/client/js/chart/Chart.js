import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Card, Image, Button, Icon, Input } from 'semantic-ui-react';
import { installApplication } from '../application/ApplicationActions';

const defaultIcon = 'https://react.semantic-ui.com/assets/images/wireframe/white-image.png';

class Chart extends React.Component {
    state = { action: '', releaseName: '', error: false }

    install(releaseName) {
        const { name, icon, category } = this.props;
        this.props.installApplication({ name, icon, category, releaseName });
    }

    isValidReleaseName = releaseName => releaseName.match(/^[a-z]+$/);

    enterReleaseName = (key) => {
        const { releaseName } = this.state;

        if (key === 'Enter') {
            if (this.isValidReleaseName(releaseName)) {
                this.install(releaseName.trim());
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
                <div className="ui large transparent input">
                    <Input
                        error={error}
                        onBlur={() => this.setState({ action: '' })}
                        value={releaseName}
                        onChange={(e, data) => this.setState({ releaseName: data.value, error: false })}
                        onKeyDown={e => this.enterReleaseName(e.key)}
                        placeholder="Enter name..."
                        autoFocus
                    />
                </div>
            );
        }

        return (
            <div className="ui two buttons">
                <Button color="teal" onClick={() => this.setState({ action: 'editReleaseName' })}><Icon name="add" /> Install</Button>
            </div>
        );
    }

    render() {
        const { name, icon, category } = this.props;

        return (
            <Card>
                <Card.Content>
                    <Card.Header>{name}</Card.Header>
                    <Card.Meta>{category}</Card.Meta>
                    <Card.Description textAlign="center">
                        <Image src={icon || defaultIcon} width="60" />
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>{ this.renderButtons() }</Card.Content>
            </Card>
        );
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ installApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Chart);
