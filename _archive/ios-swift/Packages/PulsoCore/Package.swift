// swift-tools-version:5.10
import PackageDescription

// Lógica pura (sin UI ni frameworks de Apple) compartida por la app.
// Se puede probar con `swift test` sin Xcode.
let package = Package(
    name: "PulsoCore",
    platforms: [.iOS(.v17), .macOS(.v14), .watchOS(.v10)],
    products: [.library(name: "PulsoCore", targets: ["PulsoCore"])],
    targets: [
        .target(name: "PulsoCore"),
        .testTarget(name: "PulsoCoreTests", dependencies: ["PulsoCore"]),
    ]
)
