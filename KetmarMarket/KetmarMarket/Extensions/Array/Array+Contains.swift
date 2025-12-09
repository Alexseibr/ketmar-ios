public extension Array {
    @inlinable func contains<T>(_: T.Type) -> Bool {
        contains(where: { $0 is T })
    }

    @inlinable func first<T>(_: T.Type) -> T? {
        first(where: { $0 is T }) as? T
    }

    @inlinable func last<T>(_: T.Type) -> T? {
        last(where: { $0 is T }) as? T
    }
}
