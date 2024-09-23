export interface ApicizeRequest {
    url: string
    headers: Map<string, string>
    text?: string
    data: number[]
}