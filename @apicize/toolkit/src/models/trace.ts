export interface ReqwestEventConnect {
    event: 'Connect'
    timestamp: string
    host: string
}

export interface ReqwestEventRead {
    event: 'Read'
    timestamp: string
    id: string
    data: string
}

export interface ReqwestEventWrite {
    event: 'Write'
    timestamp: string
    id: string
    data: string
}

export interface ReqwestClear {
    event: 'Clear'
}

export type ReqwestEvent = ReqwestEventConnect | ReqwestEventRead | ReqwestEventWrite | ReqwestClear