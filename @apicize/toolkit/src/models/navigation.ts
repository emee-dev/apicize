export interface NavigationEntry {
    id: string
    name: string
}

export interface NavigationHierarchicalEntry {
    id: string
    name: string
    children?: NavigationHierarchicalEntry[]
}

export interface ParamNavigationSection {
    public: NavigationEntry[]
    private: NavigationEntry[]
    vault: NavigationEntry[]
}

export interface Navigation {
    requests: NavigationHierarchicalEntry[]
    scenarios: ParamNavigationSection
    authorizations: ParamNavigationSection
    certificates: ParamNavigationSection
    proxies: ParamNavigationSection
}