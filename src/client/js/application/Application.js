import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Card, Image, Button, Icon } from 'semantic-ui-react';
import { uninstallApplication, updateApplication } from '../application/ApplicationActions';

const defaultIcon = 'https://react.semantic-ui.com/assets/images/wireframe/white-image.png';
const ip = '192.168.1.58';

class Application extends React.Component {
    uninstall = (releaseName) => {
        this.props.uninstallApplication(releaseName);
    }

    render() {
        const { icon, releaseName, category, port } = this.props;
        const hyperlink = `http://${ip}:${port}`;

        return (
            <Card>
                <Card.Content>
                    <Card.Header>{releaseName}</Card.Header>
                    <Card.Meta>{category}</Card.Meta>
                    <Card.Description textAlign="center">
                        <Image src={icon || defaultIcon} width="60" />
                        <Card.Meta>
                            <a href={hyperlink} target="_blank">
                                <Icon name="linkify" />{hyperlink}
                            </a>
                        </Card.Meta>
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
const mapDispatchToProps = dispatch => bindActionCreators({ uninstallApplication, updateApplication }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Application);
