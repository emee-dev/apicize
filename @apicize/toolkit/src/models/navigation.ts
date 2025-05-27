export interface NavigationEntry {
    id: string
    name: string
    state: NavigationEntryState
}

export interface NavigationRequestEntry extends NavigationEntry {
    children?: NavigationRequestEntry[]
}

export interface ParamNavigationSection {
    public: NavigationEntry[]
    private: NavigationEntry[]
    vault: NavigationEntry[]
}

export interface Navigation {
    requests: NavigationRequestEntry[]
    scenarios: ParamNavigationSection
    authorizations: ParamNavigationSection
    certificates: ParamNavigationSection
    proxies: ParamNavigationSection
}

export enum NavigationEntryState {
    None = 0,
    Dirty = 1,
    Warning = 2,
    Error = 4,
    Running = 8,

}