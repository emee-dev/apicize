import { ApicizeExecutionType, ApicizeGroup, ApicizeGroupRun, ApicizeRequest, ApicizeResult, ExecutionResultSummary } from "@apicize/lib-typescript";
import { OverridableStringUnion } from '@mui/types'
import { SvgIconPropsColorOverrides } from "@mui/material"
import { action, makeObservable, observable, toJS } from "mobx";

export type ExecutionData = ApicizeGroup | ApicizeGroupRun | ApicizeRequest | ApicizeExecutionType

export class Execution {
     public accessor requestOrGroupId: string
     @observable public accessor isRunning = false
     @observable public accessor resultIndex = NaN
     @observable public accessor panel = 'Info'
     @observable public accessor hasResults = false
     @observable public accessor lastExecuted = 0
     @observable public accessor results: ExecutionResultSummary[] = []

     public constructor(requestOrGroupId: string) {
          this.requestOrGroupId = requestOrGroupId
     }

     @action
     public startExecution() {
          this.isRunning = true
          this.lastExecuted = Date.now()
     }

     @action
     public completeExecution(summaries: ExecutionResultSummary[]) {
          this.isRunning = false
          this.lastExecuted = Date.now()
          this.results = summaries

          // Check index bounds
          let oldLength = summaries.length
          this.resultIndex = (isNaN(this.resultIndex) || this.resultIndex >= summaries.length || summaries.length != oldLength)
               ? 0 : this.resultIndex
          this.hasResults = (this.results?.length ?? 0) > 0
     }

     @action
     public stopExecution() {
          this.isRunning = false
          this.lastExecuted = Date.now()
     }

     @action
     public changeResultIndex(resultIndex: number) {
          this.resultIndex = resultIndex
     }
}

export type InfoColorType = OverridableStringUnion<
     | 'inherit'
     | 'success'
     | 'warning'
     | 'error'
     | 'disabled'
     | 'private'
     | 'vault',
     SvgIconPropsColorOverrides>


export { ApicizeResult };

