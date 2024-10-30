import { Identifiable } from "../identifiable"
import { Named } from "../named"
import { Persisted } from "../persistence"

/**
 * Specifies the type of certificate used for a request
 */
export enum WorkbookCertificateType { None = 'none', PKCS12 = 'PKCS12',  PKCS8_PEM = 'PKCS8_PEM', PEM = 'PEM'};

export type WorkbookCertificate = WorkbookPkcs12Certificate | WorkbookPkcs8PemCertificate | WorkbookPemCertificate

export interface WorkbookBaseCertificate extends Identifiable, Named, Persisted {
    type: WorkbookCertificateType
}

/**
 * Information required for PFX certificate
 */
export interface WorkbookPkcs12Certificate extends WorkbookBaseCertificate {
    type: WorkbookCertificateType.PKCS12
    /**
     * Base 64 representation of PFX
     */
    pfx: string
    password: string
}

/**
 * Information required for PEM certificate / key
 */
export interface WorkbookPkcs8PemCertificate extends WorkbookBaseCertificate {
    type: WorkbookCertificateType.PKCS8_PEM
    /**
     * Base 64 representation of PEM
     */
    pem: string
    /**
     * Base 64 representation of key
     */
    key?: string
}

/**
 * Information required for PEM certificate / key
 */
export interface WorkbookPemCertificate extends WorkbookBaseCertificate {
    type: WorkbookCertificateType.PEM
    /**
     * Base 64 representation of PEM
     */
    pem: string
}

