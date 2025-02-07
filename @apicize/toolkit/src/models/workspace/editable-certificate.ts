import { CertificateType, Certificate } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { computed, observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"

export class EditableCertificate extends Editable<Certificate> {
    public readonly entityType = EditableEntityType.Certificate
    @observable accessor type = CertificateType.PKCS8_PEM
    @observable accessor pem = ''
    @observable accessor key = ''
    @observable accessor pfx = ''
    @observable accessor password = ''

    static fromWorkspace(entry: Certificate): EditableCertificate {
        const result = new EditableCertificate()
        result.id = entry.id
        result.name = entry.name ?? ''

        switch (entry.type) {
            case CertificateType.PKCS8_PEM:
                result.pem = entry.pem
                result.key = entry.key ?? ''
                break
            case CertificateType.PEM:
                result.pem = entry.pem
                break
            case CertificateType.PKCS12:
                result.pfx = entry.pfx
                result.password = entry.password
                break
            default:
                throw new Error('Invalid certificate type')
        }

        return result
    }

    toWorkspace(): Certificate {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            pem: this.type === CertificateType.PKCS8_PEM || this.type === CertificateType.PEM
                ? this.pem : undefined,
            key: this.type === CertificateType.PKCS8_PEM
                ? this.key : undefined,
            pfx: this.type === CertificateType.PKCS12
                ? this.pfx : undefined,
            password: this.type === CertificateType.PKCS12
                ? this.password : undefined
        } as unknown as Certificate
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get pemInvalid() {
        return (this.type === CertificateType.PKCS8_PEM || this.type === CertificateType.PEM)
            ? ((this.pem?.length ?? 0) === 0) : false
    }

    @computed get keyInvalid() {
        return this.type === CertificateType.PKCS8_PEM
            ? ((this.key?.length ?? 0) === 0) : false
    }

    @computed get pfxInvalid() {
        return ((this.pfx?.length ?? 0) === 0)
    }

    @computed get state() {
        let problem: boolean
        switch (this.type) {
            case CertificateType.PKCS8_PEM:
                problem = this.nameInvalid
                    || this.pemInvalid
                    || this.keyInvalid
            case CertificateType.PEM:
                problem = this.nameInvalid
                    || this.pemInvalid
            case CertificateType.PKCS12:
                problem = this.nameInvalid
                    || this.pfxInvalid
            default:
                problem = false
        }

        return problem
            ? EditableState.Warning
            : EditableState.None
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