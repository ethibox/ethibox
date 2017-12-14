import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Card, Image, Button, Icon, Dimmer, Loader } from 'semantic-ui-react';
import { uninstallApplication } from '../application/ApplicationActions';

const defaultIcon = 'https://react.semantic-ui.com/assets/images/wireframe/white-image.png';
const ip = '192.168.1.58';

class Application extends React.Component {
    constructor(props) {
        super(props);
        this.state = { ...props };
    }

    componentWillMount() {
        if (this.props.state !== 'running') {
            this.refreshApplication();
        }
    }

    getApplication = () => {
        fetch(`/api/applications/${this.props.releaseName}`)
            .then(res => res.json())
            .then((application) => {
                console.log(application);
                if (application.state !== 'running') {
                    this.refreshApplication();
                } else {
                    this.setState(application);
                }
            });
    }

    refreshApplication = () => {
        setTimeout(() => this.getApplication(), 5000);
    }

    uninstall = (releaseName) => {
        this.props.uninstallApplication(releaseName);
    }

    render() {
        const { icon, releaseName, category, port, state } = this.state;
        const hyperlink = `http://${ip}:${port}`;

        return (
            <Card>
                <Dimmer active={state !== 'running'} inverted>
                    <Loader indeterminate>Loading...</Loader>
                </Dimmer>
                <Card.Content>
                    <Card.Header>{releaseName}</Card.Header>
                    <Card.Meta>{category}</Card.Meta>
                    <Card.Description textAlign="center">
                        <Image src={icon || defaultIcon} width="60" />
                        {
                            state === 'running' ? (
                                <Card.Meta>
                                    <a href={hyperlink} target="_blank">
                                        <Icon name="linkify" />{hyperlink}
                                    </a>
                                </Card.Meta>
                            ) : null
                        }
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className="ui two buttons">
                        <Button color="red" onClick={() => this.uninstall(releaseName)}><Icon name="delete" /> Uninstall</Button>
                    </div>
                </Card.Content>
            </Card>
        );
    }
}

const mapStateToProps = state => ({ ...state.ApplicationReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ uninstallApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Application);
