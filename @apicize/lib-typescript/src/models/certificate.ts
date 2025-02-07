import { Identifiable } from "./identifiable"
import { Named } from "./named"

/**
 * Specifies the type of certificate used for a request
 */
export enum CertificateType { None = 'none', PKCS12 = 'PKCS12', PKCS8_PEM = 'PKCS8_PEM', PEM = 'PEM' };

export type Certificate = Pkcs12Certificate | Pkcs8PemCertificate | PemCertificate

export interface BaseCertificate extends Identifiable, Named {
    type: CertificateType
}

/**
 * Information required for PFX certificate
 */
export interface Pkcs12Certificate extends BaseCertificate {
    type: CertificateType.PKCS12
    /**
     * Base 64 representation of PFX
     */
    pfx: string
    password: string
}

/**
 * Information required for PEM certificate / key
 */
export interface Pkcs8PemCertificate extends BaseCertificate {
    type: CertificateType.PKCS8_PEM
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
export interface PemCertificate extends BaseCertificate {
    type: CertificateType.PEM
    /**
     * Base 64 representation of PEM
     */
    pem: string
}

