import { DndContext, DragCancelEvent, DragEndEvent, DragMoveEvent, MouseSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { DragPosition, DraggableData, DroppableData } from "../models/drag-drop";
import { createContext, ReactNode, useContext, useState } from "react";
import { action, observable, toJS } from "mobx";
import { useWorkspace } from "./workspace.context";

/**
 * Global store for drag/drop state
 */
export class DragDropStore {
    @observable accessor dragPosition = DragPosition.None

    @action
    setDragPosition(newPosition: DragPosition) {
        this.dragPosition = newPosition
    }

}

export const DragDropProvider = ({ children }: { children?: ReactNode }) => {
    const store = new DragDropStore()

    const workspace = useWorkspace()
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8
            }
        })
    )

    const onDragCancel = (e: DragCancelEvent) => {
        store.setDragPosition(DragPosition.None)
    }

    const onDragMove = (e: DragMoveEvent) => {
        const { activatorEvent, delta, active, over } = e
        if (!over) return

        const pointer = activatorEvent as unknown as any

        const activeData = active.data.current as unknown as DraggableData
        const overData = over.data.current as unknown as DroppableData
        let evtDelta = delta as any

        let x = pointer.x + evtDelta.x
        let y = pointer.y + evtDelta.y

        let r = e.over?.rect

        let position = DragPosition.None
        if (active.id !== over.id) {
            if (overData.acceptsTypes.includes(activeData.type)) {
                if (overData.isHeader) {
                    if (overData.acceptAppend) {
                        position = DragPosition.Left
                    }
                } else if (overData.acceptAppend &&
                    ((!overData.acceptReposition) || x < 72 + (overData.depth + 1) * 16)) {
                    position = DragPosition.Left
                } else if (overData.acceptReposition) {
                    if (r) {
                        position = (y > r.top + (r.height / 2))
                            ? DragPosition.Lower
                            : DragPosition.Upper
                    }
                }
            }
        } else {
            position = DragPosition.Invalid
        }
        store.setDragPosition(position)
    }

    const onDragEnd = (e: DragEndEvent) => {
        const { activatorEvent, delta, active, over } = e
        if (!over) return

        const activeData = active.data.current as unknown as DraggableData
        const pointer = activatorEvent as unknown as any
        const overData = over.data.current as unknown as DroppableData

        let evtDelta = delta as any

        let x = pointer.x + evtDelta.x
        let y = pointer.y + evtDelta.y

        let r = e.over?.rect

        let onLowerHalf = false
        let onSection = false

        if (r) {
            if (y > r.top + (r.height / 2)) onLowerHalf = true
            if (x < 72 + overData.depth * 16) onSection = true
        }

        let id = overData.isHeader
            ? (overData.persistence ? overData.persistence : null)
            : over.id.toString()

        if (overData.isHeader && overData.persistence) {
            onSection = true
            workspace.updateExpanded(over.id.toString(), true)
        }

        if (overData.acceptsTypes.includes(activeData.type)) {
            activeData.move(id, onLowerHalf, onSection)
        }

        store.setDragPosition(DragPosition.None)
    }

    return <DragDropContext.Provider value={store}>
        <DndContext sensors={sensors} onDragMove={onDragMove} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
            {children}
        </DndContext>
    </DragDropContext.Provider>
}

export const DragDropContext = createContext<DragDropStore | null>(null)

export function useDragDrop() {
    const context = useContext(DragDropContext);
    if (!context) {
        throw new Error('useDragDropTree must be used within a DragDropTreeContext.Provider');
    }
    return context;
}
