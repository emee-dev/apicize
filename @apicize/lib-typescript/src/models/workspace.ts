import { WorkbookAuthorization } from './workbook/workbook-authorization'
import { WorkbookScenario } from './workbook/workbook-scenario'
import { WorkbookProxy } from './workbook/workbook-proxy'
import { WorkbookCertificate } from './workbook/workbook-certificate'
import { Selection } from './selection'
import { IndexedEntities } from './indexed-entities'
import { IndexedNestedRequests } from './indexed-nested-entities'
import { WorkbookRequestEntry } from './workbook/workbook-request'

/**
 * A workspace is an indexed view of an Apicize workbook,
 * as well as any associated workbook private information file 
 * and global credentials
 */
export interface Workspace {
    version: number
    requests: IndexedNestedRequests<WorkbookRequestEntry>,
    authorizations: IndexedEntities<WorkbookAuthorization>,
    scenarios: IndexedEntities<WorkbookScenario>,
    certificates: IndexedEntities<WorkbookCertificate>,
    proxies: IndexedEntities<WorkbookProxy>,
    selectedScenario?: Selection
    selectedAuthorization?: Selection
    selectedCertificate?: Selection
    selectedProxy?: Selection
}
