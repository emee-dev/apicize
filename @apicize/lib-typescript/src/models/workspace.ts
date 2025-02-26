import { IndexedEntities } from './indexed-entities'
import { RequestEntry } from './request'
import { SelectedParametersWithData } from './selected-parameters'
import { Scenario } from './scenario'
import { Authorization } from './authorization'
import { Certificate } from './certificate'
import { Proxy } from './proxy'
import { ExternalData } from './external-data'

/**
 * A workspace is an indexed view of an Apicize workbook,
 * as well as any associated workbook private information file 
 * and global credentials
 */
export interface Workspace {
    version: number
    requests: IndexedEntities<RequestEntry>,
    scenarios: IndexedEntities<Scenario>,
    authorizations: IndexedEntities<Authorization>,
    certificates: IndexedEntities<Certificate>,
    proxies: IndexedEntities<Proxy>,
    data: IndexedEntities<ExternalData>,
    defaults: SelectedParametersWithData,
    warnings?: string[],
}
