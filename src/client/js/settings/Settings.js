import React from 'react';
import { connect } from 'react-redux';
import { Grid } from 'semantic-ui-react';
import SettingsUser from './SettingsUser';
import SettingsAdmin from './SettingsAdmin';

const Settings = (props) => {
    return (
        <Grid columns={2} stackable>
            <Grid.Column width={10}>
                { props.settings.isAdmin && <SettingsAdmin /> }
                <SettingsUser />
            </Grid.Column>
        </Grid>
    );
};

const mapStateToProps = state => ({ ...state.SettingsReducer });

export default connect(mapStateToProps)(Settings);
