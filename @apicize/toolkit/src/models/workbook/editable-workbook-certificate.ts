import { WorkbookCertificateType, Persistence, WorkbookCertificate } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { computed, observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"


export class EditableWorkbookCertificate extends Editable<WorkbookCertificate> {
    public readonly entityType = EditableEntityType.Certificate
    @observable accessor type = WorkbookCertificateType.PKCS8_PEM
    @observable accessor persistence = Persistence.Private
    @observable accessor pem = ''
    @observable accessor key = ''
    @observable accessor pfx = ''
    @observable accessor password = ''

    static fromWorkspace(entry: WorkbookCertificate) : EditableWorkbookCertificate {
        const result = new EditableWorkbookCertificate()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.persistence = entry.persistence ?? Persistence.Private

        switch(entry.type) {
            case WorkbookCertificateType.PKCS8_PEM:
                result.pem = entry.pem
                result.key = entry.key ?? ''
                break
            case WorkbookCertificateType.PEM:
                result.pem = entry.pem
                break
            case WorkbookCertificateType.PKCS12:
                result.pfx = entry.pfx
                result.password = entry.password
                break
            default:
                throw new Error('Invalid certificate type')
        }
        
        return result
    }

    toWorkspace(): WorkbookCertificate {
        return {
            id: this.id,
            name: this.name,
            persistence: this.persistence,
            type: this.type,
            pem: this.type === WorkbookCertificateType.PKCS8_PEM || this.type === WorkbookCertificateType.PEM
                ? this.pem : undefined,
            key: this.type === WorkbookCertificateType.PKCS8_PEM
                ? this.key : undefined,
            pfx: this.type === WorkbookCertificateType.PKCS12 
                ? this.pfx : undefined,
            password: this.type === WorkbookCertificateType.PKCS12 
                ? this.password : undefined
        } as unknown as WorkbookCertificate
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }    

    @computed get pemInvalid() {
        return (this.type === WorkbookCertificateType.PKCS8_PEM || this.type === WorkbookCertificateType.PEM)
            ? ((this.pem?.length ?? 0) === 0) : false
    }

    @computed get keyInvalid() {
        return this.type === WorkbookCertificateType.PKCS8_PEM 
            ? ((this.key?.length ?? 0) === 0) : false
    }    

    @computed get pfxInvalid() {
        return ((this.pfx?.length ?? 0) === 0)
    }

    @computed get invalid() {
        switch(this.type) {
            case WorkbookCertificateType.PKCS8_PEM:
                return this.nameInvalid
                    || this.pemInvalid
                    || this.keyInvalid
            case WorkbookCertificateType.PEM:
                return this.nameInvalid
                    || this.pemInvalid
            case WorkbookCertificateType.PKCS12:
                return this.nameInvalid 
                    || this.pfxInvalid
            default:
                return false
        }
    }
}


/**
 * Type of certificate file to open
 */
export enum CertificateFileType {
    PEM,
    Key,
    PFX
}