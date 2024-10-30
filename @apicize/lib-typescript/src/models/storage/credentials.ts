import { WorkbookAuthorization } from "../workbook/workbook-authorization"
import { WorkbookCertificate } from "../workbook/workbook-certificate"
import { WorkbookProxy } from "../workbook/workbook-proxy"
import { WorkbookScenario } from "../workbook/workbook-scenario"

/**
 * Storgte of workbook or global credentials
 */
export interface Credentials {
    scenarios?: WorkbookScenario[]
    authorizations?: WorkbookAuthorization[]
    certificates?: WorkbookCertificate[]
    proxies?: WorkbookProxy[]
}