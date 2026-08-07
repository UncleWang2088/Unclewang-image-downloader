import type { Opaque } from "type-fest";

// bar or foo or *
type Name = Opaque<string, "name">;
// [bar, foo, *]
type Tail = Opaque<Name[], "tail">;

// *.foo.bar.com -> tld=com, tail=[bar, foo, *]
interface DomainSpec {
    tail: Tail;
    tld: Name;
}

function fallsUnderName(name: Name, filter: Name): boolean {
    return filter === name || filter === "*";
}

function fallsUnderTail(tail: Tail, filter: Tail): boolean {
    if (filter.length !== tail.length) {
        return false;
    }

    return Array(filter.length)
        .fill(0)
        .map((_, index) => index)
        .every((i) => fallsUnderName(tail[i]!, filter[i]!));
}

function toDomainFilter(domain: string): DomainSpec {
    const [tld, ...tail] = domain.split(".").reverse();
    return {
        tail: tail as Tail,
        tld: tld as Name,
    };
}

function getOrNew<K, V>(key: K, map: Map<K, Set<V>>): Set<V> {
    const entry = map.get(key);
    if (entry == null) {
        const set = new Set<V>();
        map.set(key, set);
        return set;
    } else {
        return entry;
    }
}

function matches(tree: Map<Name, Set<Tail>>, domain: string): boolean {
    const target = toDomainFilter(domain);
    const filtersForTld = tree.get(target.tld);

    return filtersForTld == null
        ? false
        : [...filtersForTld].some((filter) =>
              fallsUnderTail(target.tail, filter)
          );
}

export type DomainFilter = (domain: string) => boolean;

export function domainFilterFrom(domains: readonly string[]): DomainFilter {
    const tree = new Map<Name, Set<Tail>>();

    domains
        .map(toDomainFilter)
        .forEach((filter) => getOrNew(filter.tld, tree).add(filter.tail));

    return (domain: string): boolean => matches(tree, domain);
}

// matches "foo.*.bar"
export const DOMAIN_NAME_FILTER_PATTERN =
    /^(?:(?:[\w-]+|\*)\.)*(?:[\w-]+|\*)$/iu;
