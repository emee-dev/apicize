export interface ApicizeTestResult {
    testName: string[]
    success: boolean,
    error?: string,
    logs?: string[]
}