import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Menu, Input } from 'semantic-ui-react';
import { searchApplication } from '../search/SearchActions';
import { changeCategory } from './SidebarActions';

class Sidebar extends React.Component {
    render() {
        const { category, categories } = this.props;
        return (
            <Menu vertical>
                <Menu.Item>
                    <Input icon="search" placeholder="Search application..." value={this.props.search} onChange={(e, data) => this.props.searchApplication(data.value)} />
                </Menu.Item>

                <Menu.Item>
                    <Menu.Header>Categories</Menu.Header>
                    <Menu.Menu>
                        <Menu.Item name="All" active={category === 'All'} onClick={() => this.props.changeCategory('All')}>All</Menu.Item>
                        { categories.map(cat =>
                            <Menu.Item key={cat.id} name={cat.name} active={category === cat.name} onClick={() => this.props.changeCategory(cat.name)}>{cat.name}</Menu.Item>)
                        }
                    </Menu.Menu>
                </Menu.Item>

                <Menu.Item>
                    <Menu.Header>Support</Menu.Header>
                    <Menu.Menu>
                        <Menu.Item name="faq" onClick={() => console.log('test')}>FAQs</Menu.Item>
                    </Menu.Menu>
                </Menu.Item>
            </Menu>
        );
    }
}

const mapStateToProps = state => ({ ...state.SidebarReducer });
const mapDispatchToProps = dispatch => bindActionCreators({ searchApplication, changeCategory }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
