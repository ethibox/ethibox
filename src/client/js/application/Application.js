import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Card, Image, Button, Icon, Dimmer, Loader } from 'semantic-ui-react';
import { uninstallApplication } from '../application/ApplicationActions';

const defaultIcon = 'https://react.semantic-ui.com/assets/images/wireframe/white-image.png';
const ERROR_MEMORY = 'Insufficient memory';
const RUNNING = 'running';
const LOADING = 'loading';

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
        const hyperlink = `http://192.168.99.100:${port}`;

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
                        <Button color="red" onClick={() => this.props.uninstallApplication(releaseName)}><Icon name="delete" /> Uninstall</Button>
                    </div>
                </Card.Content>
            </Card>
        );
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ uninstallApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Application);
