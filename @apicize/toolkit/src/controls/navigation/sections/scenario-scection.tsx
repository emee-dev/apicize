import { GetTitle, Persistence } from "@apicize/lib-typescript"
import { ListItemIcon, ListItemText, Menu, MenuItem, SvgIcon, useTheme } from "@mui/material"
import ScenarioIcon from "../../../icons/scenario-icon"
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"
import { useWorkspace } from "../../../contexts/workspace.context"
import { useState } from "react"
import { ParameterSection } from "./parameter-section"
import { MenuPosition } from "../../../models/menu-position"
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useFeedback } from "../../../contexts/feedback.context"
import { observer } from "mobx-react-lite"
import { useWorkspaceSession } from "../../../contexts/workspace-session.context"

export const ScenarioSection = observer((props: {
    includeHeader: boolean,
}) => {
    const workspace = useWorkspace()
    const session = useWorkspaceSession()
    const feedback = useFeedback()
    const theme = useTheme()

    const [scenarioMenu, setScenarioMenu] = useState<MenuPosition | undefined>(undefined)

    const closeScenarioMenu = () => {
        setScenarioMenu(undefined)
    }

    const selectScenario = (id: string) => {
        workspace.changeActive(EditableEntityType.Scenario, id)
    }

    const handleAddScenario = (persistence: Persistence, targetScenarioId?: string | null) => {
        closeScenarioMenu()
        workspace.addScenario(persistence, targetScenarioId)
    }

    const handleSelectHeader = (headerId: string, helpTopic?: string) => {
        // closeAllMenus()
        if (helpTopic) {
            session.updateExpanded(headerId, true)
            session.showHelp(helpTopic)
        }
    }

    const handleMoveScenario = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectScenario(id)
        workspace.moveScenario(session.id, id, destinationID, onLowerHalf, isSection)
    }

    const handleDupeScenario = () => {
        closeScenarioMenu()
        const id = scenarioMenu?.id
        if (!id) return
        workspace.copyScenario(id)
    }

    const showScenarioMenu = (event: React.MouseEvent, persistence: Persistence, id: string) => {
        setScenarioMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence,
            }
        )
    }

    const handleDeleteScenario = () => {
        closeScenarioMenu()
        const id = scenarioMenu?.id
        if (!id) return
        feedback.confirm({
            title: 'Delete Scenario',
            message: `Are you are you sure you want to delete ${GetTitle(workspace.scenarios.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                workspace.deleteScenario(id)
            }
        })
    }

    function ScenarioMenu() {
        return scenarioMenu
            ? <Menu
                id='scenario-menu'
                open={scenarioMenu !== undefined}
                onClose={closeScenarioMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: scenarioMenu?.mouseY ?? 0,
                    left: scenarioMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddScenario(scenarioMenu.persistence, scenarioMenu?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='scenario'><ScenarioIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Scenario</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeScenario()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: theme.palette.scenario.light }} />
                    </ListItemIcon>
                    <ListItemText>Duplicate Scenario</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteScenario()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText>Delete Scenario</ListItemText>
                </MenuItem>
            </Menu>
            : <></>
    }

    return <ParameterSection
        title='Scenarios'
        includeHeader={props.includeHeader}
        icon={<ScenarioIcon />}
        contextMenu={<ScenarioMenu />}
        iconColor='scenario'
        helpTopic='workspace/scenarios'
        type={EditableEntityType.Scenario}
        parameters={workspace.scenarios}
        onSelect={selectScenario}
        onSelectHeader={handleSelectHeader}
        onAdd={handleAddScenario}
        onMove={handleMoveScenario}
        onItemMenu={showScenarioMenu}
    />
})