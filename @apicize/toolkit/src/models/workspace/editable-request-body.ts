import { Body, BodyType, NameValuePair } from "@apicize/lib-typescript"
import { action, makeObservable, observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EntityBody, WorkspaceStore } from "../../contexts/workspace.context"
import { Editable, EditableState } from "../editable"
import { EntityType } from "./entity-type"
export class EditableRequestBody extends Editable<Body> {
    public readonly entityType = EntityType.Request
    public readonly state = EditableState.None

    @observable public accessor type: BodyType = BodyType.None
    @observable public accessor data: string | NameValuePair[] | Uint8Array | undefined = undefined

    public constructor(info: RequestBodyInfo, workspace: WorkspaceStore) {
        super(workspace)
        this.id = info.id
        if (info.body && info.body.data) {
            this.type = info.body.type
            this.data = info.body.data
        } else {
            this.type = BodyType.None
            this.data = undefined
        }
        makeObservable(this)
    }

    public onUpdate() {
        this.markAsDirty()
        this.workspace.updateBody({
            entityType: 'Body',
            id: this.id,
            body: {
                type: this.type,
                data: this.data
            } as Body
        })
    }

    @action
    setBody(body: Body) {
        this.type = body.type
        this.data = body.data
        this.onUpdate()
    }

    @action
    setBodyType(value: BodyType | undefined) {
        if (this.data) {
            switch (value) {
                case BodyType.Raw:
                    switch (this.type) {
                        case BodyType.Form:
                            this.type = BodyType.Raw
                            this.data = (new TextEncoder()).encode(
                                encodeFormData(this.data as EditableNameValuePair[])
                            )
                            break
                        case BodyType.XML:
                        case BodyType.JSON:
                        case BodyType.Text:
                            this.type = BodyType.Raw
                            this.data = (new TextEncoder()).encode(this.data as string)
                            break
                        case BodyType.Raw:
                            break
                        default:
                            this.type = BodyType.Raw
                            this.data = new Uint8Array()
                    }
                    break
                case BodyType.Form:
                    switch (this.type) {
                        case BodyType.JSON:
                        case BodyType.XML:
                        case BodyType.Text:
                            this.type = BodyType.Form,
                                this.data = decodeFormData(this.data as string)
                            break
                        case BodyType.Raw:
                            this.type = BodyType.Form,
                                this.data = decodeFormData(new TextDecoder().decode(this.data as Uint8Array))
                            break
                        case BodyType.Form:
                            this.type = BodyType.Form
                            this.data = this.data as NameValuePair[]
                            break
                        default:
                            this.type = BodyType.Form
                            this.data = []
                            break
                    }
                    break
                case BodyType.JSON:
                case BodyType.XML:
                case BodyType.Text:
                    switch (this.type) {
                        case BodyType.JSON:
                        case BodyType.XML:
                        case BodyType.Text:
                            this.type = value
                            break
                        case BodyType.Raw:
                            this.type = value
                            this.data = (new TextDecoder()).decode(this.data as Uint8Array)
                            break
                        default:
                            this.type = BodyType.None
                            this.data = undefined
                            break
                    }
                    break
                case BodyType.None:
                default:
                    this.type = BodyType.None
                    this.data = undefined

            }
        } else {
            switch (value) {
                case BodyType.Form:
                    this.type = BodyType.Form
                    this.data = []
                    break
                case BodyType.XML:
                case BodyType.JSON:
                case BodyType.Text:
                    this.type = value
                    this.data = ''
                    break
                case BodyType.None:
                default:
                    this.type = BodyType.None
                    this.data = undefined
                    break
            }
        }
        this.onUpdate()
    }

    @action
    setBodyData(value: string | Uint8Array | EditableNameValuePair[]) {
        this.data = value
        this.onUpdate()
    }

    @action
    refreshFromExternalUpdate(updatedItem: EntityBody) {
        if (updatedItem.body) {
            switch (updatedItem.body.type) {
                case BodyType.Form:
                    this.type = BodyType.Form
                    this.data = updatedItem.body.data.map((d) => ({ id: GenerateIdentifier(), ...d }))
                    break
                case BodyType.Raw:
                    this.type = BodyType.Raw
                    this.data = updatedItem.body.data
                    break
                case BodyType.Text:
                case BodyType.JSON:
                case BodyType.XML:
                    this.type = updatedItem.body.type,
                        this.data = updatedItem.body.data
                    break
                case BodyType.None:
                    this.type = BodyType.None
                    this.data = updatedItem.body.data
                    break
            }
        }
    }
}

const encodeFormData = (data: EditableNameValuePair[]) =>
    (data.length === 0)
        ? ''
        : data.map(nv =>
            `${encodeURIComponent(nv.name)}=${encodeURIComponent(nv.value)}`
        ).join('&')

const decodeFormData = (bodyData: string | number[] | undefined) => {
    let data: string | undefined;
    if (bodyData instanceof Array) {
        const buffer = Uint8Array.from(bodyData)
        data = (new TextDecoder()).decode(buffer)
    } else {
        data = bodyData
    }
    if (data && data.length > 0) {
        const parts = data.split('&')
        return parts.map(p => {
            const id = GenerateIdentifier()
            const nv = p.split('=')
            if (nv.length == 1) {
                return { id, name: decodeURIComponent(nv[0]), value: "" } as EditableNameValuePair
            } else {
                return { id, name: decodeURIComponent(nv[0]), value: decodeURIComponent(nv[1]) } as EditableNameValuePair
            }
        })
    } else {
        return []
    }
}

export interface RequestBodyInfo {
    id: string
    body?: Body
}