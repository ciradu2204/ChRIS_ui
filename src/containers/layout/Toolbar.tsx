import * as React from 'react';
import { connect } from "react-redux";
import { Dispatch } from "redux";
import { ApplicationState } from "../../store/root/applicationState";
import { IUiState } from "../../store/ui/types";
import { onDropdownSelect, onKebabDropdownSelect } from "../../store/ui/actions";
import {
    Button,
    ButtonVariant,
    Dropdown,
    DropdownItem,
    DropdownSeparator,
    DropdownToggle,
    KebabToggle,
    Toolbar,
    ToolbarGroup,
    ToolbarItem,
} from '@patternfly/react-core';
import { pf4UtilityStyles } from '../../lib/pf4-styleguides';
import { BellIcon, CogIcon } from '@patternfly/react-icons';

interface PropsFromDispatch {
    onDropdownSelect: typeof onDropdownSelect;
    onKebabDropdownSelect: typeof onKebabDropdownSelect;
}
type AllProps = IUiState & PropsFromDispatch;

class ToolbarComponent extends React.Component<AllProps> {

    onDropdownToggle = (isOpened: boolean) => {
        const { onDropdownSelect } = this.props;
        onDropdownSelect(isOpened);
    };

    onDropdownSelect = (event: React.SyntheticEvent<HTMLDivElement>) => {
        const { onDropdownSelect, isDropdownOpen } = this.props;
       !!isDropdownOpen && onDropdownSelect(isDropdownOpen); // NOTES: Toggle menu ****** to be determined, depending on actions (duplicate call for right now - stub)
    };

    onKebabDropdownToggle = (isOpened: boolean) => {
        const { onKebabDropdownSelect } = this.props;
        onKebabDropdownSelect(isOpened);
    };

    onKebabDropdownSelect = (event: React.SyntheticEvent<HTMLDivElement>) => {
        const { onKebabDropdownSelect, isKebabDropdownOpen } = this.props;
        !!isKebabDropdownOpen && onKebabDropdownSelect(isKebabDropdownOpen);// NOTES: Toggle menu ****** to be determined, depending on actions (duplicate call for right now - stub)
    };

    render() {
        const { isDropdownOpen, isKebabDropdownOpen } = this.props;
        const kebabDropdownItems = [
            <DropdownItem key="kebab1">
                <BellIcon /> Notifications
            </DropdownItem>,
            <DropdownItem key="kebab2">
                <CogIcon /> Settings
            </DropdownItem>
        ];

        const userDropdownItems = [
            <DropdownItem key="dd1">Link 1</DropdownItem>,
            <DropdownItem key="dd2" component="a">Link 2</DropdownItem>,
            <DropdownItem key="dd3">Link 3</DropdownItem>,
            <DropdownItem key="dd4">Link 4</DropdownItem>,
            <DropdownItem key="dd5" component="a">Link 5</DropdownItem>
        ];
        return (
            <Toolbar>
                <ToolbarGroup className={`${pf4UtilityStyles.accessibleStyles.screenReader} ${pf4UtilityStyles.accessibleStyles.visibleOnLg}`}>
                    <ToolbarItem>
                        <Button id="expanded-example-uid-01" aria-label="Notifications actions" variant={ButtonVariant.plain}>
                            <BellIcon />
                        </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                        <Button id="expanded-example-uid-02" aria-label="Settings actions" variant={ButtonVariant.plain}>
                            <CogIcon />
                        </Button>
                    </ToolbarItem>
                </ToolbarGroup>
                <ToolbarGroup>
                    <ToolbarItem className={`${pf4UtilityStyles.accessibleStyles.hiddenOnLg} ${pf4UtilityStyles.spacingStyles.mr_0}`}>
                        <Dropdown
                            isPlain
                            position="right"
                            onSelect={this.onKebabDropdownSelect}
                            toggle={<KebabToggle onToggle={this.onKebabDropdownToggle} />}
                            isOpen={isKebabDropdownOpen}
                            dropdownItems={kebabDropdownItems}
                        /> 
                    </ToolbarItem>
                    <ToolbarItem className={`${pf4UtilityStyles.accessibleStyles.screenReader} ${pf4UtilityStyles.accessibleStyles.visibleOnMd}`}>
                        <Dropdown
                            isPlain
                            position="right"
                            onSelect={this.onDropdownSelect}
                            isOpen={isDropdownOpen}
                            toggle={<DropdownToggle onToggle={this.onDropdownToggle}>[User Name]</DropdownToggle>}
                            dropdownItems={userDropdownItems}
                        />
                    </ToolbarItem>
                </ToolbarGroup>
            </Toolbar>
        )
    }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onDropdownSelect: (isOpened: boolean) => dispatch(onDropdownSelect(isOpened)),
    onKebabDropdownSelect: (isOpened: boolean) => dispatch(onKebabDropdownSelect(isOpened)),
});

const mapStateToProps = ({ ui }: ApplicationState) => ({
    isDropdownOpen: ui.isDropdownOpen,
    isKebabDropdownOpen: ui.isKebabDropdownOpen
});


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ToolbarComponent)

