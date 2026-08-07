import { DomainFilter, domainFilterFrom, load, monitor } from "../../common";

type Filter = {
    filters: Promise<DomainFilter> | null;
    invert: Promise<boolean> | null;
};

const page: Filter = {
    filters: null,
    invert: null,
};
const image: Filter = {
    filters: null,
    invert: null,
};

function monitorSettings(): void {
    monitor("excludedPageDomains", (st) => {
        page.filters = Promise.resolve(
            domainFilterFrom(st.excludedPageDomains)
        );
    });
    monitor("pageDomainsAreWhitelist", (st) => {
        page.invert = Promise.resolve(st.pageDomainsAreWhitelist);
    });

    monitor("excludedSourceDomains", (st) => {
        image.filters = Promise.resolve(
            domainFilterFrom(st.excludedSourceDomains)
        );
    });
    monitor("sourceDomainsAreWhitelist", (st) => {
        image.invert = Promise.resolve(st.sourceDomainsAreWhitelist);
    });
}

export async function getFilterState(): Promise<
    [DomainFilter, boolean, DomainFilter, boolean]
> {
    if (
        page.filters == null ||
        page.invert == null ||
        image.filters == null ||
        image.invert == null
    ) {
        const loading = load();

        page.filters = loading.then((settings) =>
            domainFilterFrom(settings.excludedPageDomains)
        );
        page.invert = loading.then(
            (settings) => settings.pageDomainsAreWhitelist
        );

        image.filters = loading.then((settings) =>
            domainFilterFrom(settings.excludedSourceDomains)
        );
        image.invert = loading.then(
            (settings) => settings.sourceDomainsAreWhitelist
        );

        Promise.all([
            loading,
            page.filters,
            page.invert,
            image.filters,
            image.invert,
        ])
            .then(monitorSettings)
            .catch(console.error);
    }

    return Promise.all([
        page.filters,
        page.invert,
        image.filters,
        image.invert,
    ]);
}
