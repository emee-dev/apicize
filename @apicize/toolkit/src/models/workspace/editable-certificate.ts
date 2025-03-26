import { CertificateType, Certificate } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { WorkspaceStore } from "../../contexts/workspace.context"

export class EditableCertificate extends Editable<Certificate> {
    public readonly entityType = EditableEntityType.Certificate
    @observable accessor type = CertificateType.PKCS8_PEM
    @observable accessor pem = ''
    @observable accessor key = ''
    @observable accessor pfx = ''
    @observable accessor password = ''


    public constructor(certificate: Certificate, workspace: WorkspaceStore) {
        super(workspace)
        this.id = certificate.id
        this.name = certificate.name ?? ''

        switch (certificate.type) {
            case CertificateType.PKCS8_PEM:
                this.pem = certificate.pem
                this.key = certificate.key ?? ''
                break
            case CertificateType.PEM:
                this.pem = certificate.pem
                break
            case CertificateType.PKCS12:
                this.pfx = certificate.pfx
                this.password = certificate.password
                break
            default:
                throw new Error('Invalid certificate type')
        }
    }

    static fromWorkspace(entry: Certificate, workspace: WorkspaceStore): EditableCertificate {
        return new EditableCertificate(entry, workspace)
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

    @action
    setType(value: CertificateType) {
        this.type = value
        this.markAsDirty()
    }

    @action
    setPem(value: string) {
        this.pem = value
        this.markAsDirty()
    }

    @action
    setKey(value: string | undefined) {
        this.key = value || ''
        this.markAsDirty()
    }

    @action
    setCertificatePfx(value: string) {
        this.pfx = value
        this.markAsDirty()
    }

    @action
    setPassword(value: string) {
        this.password = value
        this.markAsDirty()
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