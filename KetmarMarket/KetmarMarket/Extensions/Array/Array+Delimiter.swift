public extension Array {
    /// Returns elements, divided in groups by item-delimiter
    /// E.g.: ["Anna", "Andrew", "Paul"].delimited { "–" } => ["Anna", "–", "Andrew", "–", "Paul"]
    func delimited(_ makeDelimiter: (_ idx: Int) -> Element?) -> [Element] {
        guard count > 1 else {
            return self
        }
        return dropFirst().enumerated().reduce([self[0]]) { result, item in
            if let newElement = makeDelimiter(item.offset + 1) {
                result + [newElement, item.element]
            } else {
                result + [item.element]
            }
        }
    }

    /// Returns elements, divided in groups by item-delimiter
    func delimited(_ makeDelimiter: () -> Element?) -> [Element] {
        guard count > 1 else {
            return self
        }
        return dropFirst().enumerated().reduce([self[0]]) { result, item in
            if let newElement = makeDelimiter() {
                result + [newElement, item.element]
            } else {
                result + [item.element]
            }
        }
    }
}
