import { EditableNameValuePair } from "../../models/workbook/editable-name-value-pair";
import { Box } from "@mui/system";
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Close'
import {
    GridRowModesModel,
    GridRowModes,
    DataGrid,
    GridColDef,
    GridActionsCellItem,
    GridEventListener,
    GridRowId,
    GridRowEditStopReasons,
    GridFooterContainer,
} from '@mui/x-data-grid'
import React from "react";
import { GenerateIdentifier } from "../../services/random-identifier-generator";
import { Button } from "@mui/material";

export function NameValueEditor(props: {
    values: EditableNameValuePair[] | undefined,
    title: string,
    nameHeader: string,
    valueHeader: string,
    onUpdate: (pair: EditableNameValuePair[]) => void
}) {
    const [data, setData] = React.useState(props.values ?? [])
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({})

    React.useEffect(() => {
        setData(props.values ?? [])
    }, [props.values])

    const editToolbar = () => {
        const handleAddClick = () => {
            const id = GenerateIdentifier()
            setData([...data, {
                id,
                name: '',
                value: '',
                isNew: true
            }])
            setRowModesModel({
                ...rowModesModel,
                [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' }
            })
        }

        return (
            <GridFooterContainer>
                <Button color="primary" startIcon={<AddIcon />} onClick={handleAddClick}>
                    Add
                </Button>
            </GridFooterContainer>
        )
    }

    const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true
        }
    }

    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } })
    }

    const handleSaveClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } })
    }

    const handleDeleteClick = (id: GridRowId) => () => {
        const updatedRows = data.filter((row) => row.id !== id)
        // setData(updatedRows)
        props.onUpdate(updatedRows)
    }

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        })

        const editedRow = data.find((row) => row.id === id)
        if (editedRow!.isNew) {
            const updatedRows = data.filter((row) => row.id !== id)
            // setData(updatedRows)
            props.onUpdate(updatedRows)
        }
    }

    const processRowUpdate = (newRow: EditableNameValuePair) => {
        const updatedRow = { ...newRow, isNew: false }
        const updatedRows = data.map((row) => (row.id === newRow.id ? updatedRow : row))
        setData(updatedRows)
        props.onUpdate(updatedRows)
        return updatedRow
    }

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel)
    }

    const columns: GridColDef[] = [
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            headerAlign: 'left',
            width: 110,
            align: 'left',
            cellClassName: 'actions',
            getActions: ({ id }) => {
                const isInEditMode = id ? rowModesModel[id]?.mode === GridRowModes.Edit : GridRowModes.View
                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<SaveIcon />}
                            label="Save"
                            aria-label="save updated value"
                            sx={{
                                color: 'primary.main',
                            }}
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon />}
                            label="Cancel"
                            aria-label="cancel updates"
                            className="textPrimary"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                        />,
                    ]
                }

                return [
                    <GridActionsCellItem
                        icon={<EditIcon />}
                        label="Edit"
                        aria-label="edit value"
                        className="textPrimary"
                        onClick={handleEditClick(id)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<DeleteIcon />}
                        aria-label="delete value"
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                    />,
                ]
            },
        },
        // { field: 'id', headerName: 'ID', width: 128, editable: false },
        { field: 'name', headerName: props.nameHeader, width: 320, editable: true },
        { field: 'value', headerName: props.valueHeader, flex: 1, editable: true, sortable: false },
    ]

    return (
        <Box
            sx={{
                width: '100%',
                '& .actions': {
                    color: 'text.secondary',
                },
                '& .textPrimary': {
                    color: 'text.primary',
                },
            }}
        >
            <DataGrid
                autoHeight
                aria-label={props.title}
                rows={data}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                onRowEditStop={handleRowEditStop}
                processRowUpdate={processRowUpdate}
                slots={{
                    footer: editToolbar,
                }}
                // // slotProps={{
                //   toolbar: { setRows: setRowHeaders, setRowModesModel },
                // }}
                disableColumnFilter
                disableColumnSelector
                disableDensitySelector
            />
        </Box>
    )
}