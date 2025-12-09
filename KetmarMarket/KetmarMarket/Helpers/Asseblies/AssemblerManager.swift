import Swinject

final class AssemblerManager {

    static let shared = AssemblerManager()

    enum AssemblyType {
        case mainFlow
    }

    private let assembler: Assembler

    private var assemblies = Set<AssemblyType>([.mainFlow])

    var resolver: Resolver { assembler.resolver }

    init() {
        self.assembler = Assembler([
            ViewsAssembly(),
            ServicesAssembly(),
            StartUpAssembly(),
            // Predefined assemblies
            MainFlowAssembly()
        ])
    }

    init(assembler: Assembler) {
        self.assembler = assembler
    }
}

extension AssemblerManager {
    func applyAssembly(assembly: AssemblyType) {
        guard !assemblies.contains(assembly) else { return }
        assemblies.insert(assembly)
        assembler.apply(assemblies: assembly.assemblies)
    }

    func applyAssemblies(assemblies: [AssemblyType]) {
        assemblies.forEach { [weak self] assembly in
            self?.applyAssembly(assembly: assembly)
        }
    }
}

private extension AssemblerManager.AssemblyType {
    var assemblies: [Assembly] {
        switch self {
        case .mainFlow:
            [MainFlowAssembly()]
        }
    }
}
