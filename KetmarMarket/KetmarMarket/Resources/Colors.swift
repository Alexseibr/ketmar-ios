import UIKit

extension UIColor {
    
    // MARK: - Brand Colors
    
    /// Primary brand color - Ketmar Blue (#3B73FC)
    static let brandPrimary = UIColor(hex: "#3B73FC")
    
    /// Light blue for gradients (#EBF2FF or similar light blue)
    static let blueLight = UIColor(hex: "#EBF2FF")

    // MARK: - Text Colors
    
    /// Primary text color - Dark Gray (#1f2937)
    static let textPrimary = UIColor(hex: "#1f2937")
    
    /// Secondary text color - Medium Gray (#6b7280)
    static let textSecondary = UIColor(hex: "#6b7280")
    
    /// Tertiary text color - Light Gray (40% opacity)
    static let textTertiary = UIColor(white: 0.4, alpha: 1.0)
    
    /// Disabled/Placeholder text color (50% opacity)
    static let textDisabled = UIColor(white: 0.5, alpha: 1.0)
    
    // MARK: - Background Colors
    
    /// Main background color - Light Gray
    static let backgroundPrimary = UIColor(white: 0.96, alpha: 1.0)
    
    /// Secondary background color - Slightly darker light gray
    static let backgroundSecondary = UIColor(hex: "#f8f9fb")

    /// Card background - White
    static let backgroundCard = UIColor(hex: "#ffffff")
    
    /// Input field background
    static let backgroundInput = UIColor(white: 0.97, alpha: 1.0)
    
    /// Tab bar background (#f5f6f8)
    static let backgroundTab = UIColor(hex: "#f5f6f8")
    
    // MARK: - Border Colors
    
    /// Light border color
    static let borderLight = UIColor(white: 0.9, alpha: 1.0)
    
    /// Primary border color (brand color)
    static let borderPrimary = UIColor(hex: "#3B73FC")
    
    // MARK: - Shadow Colors
    
    /// Card shadow color
    static let shadowCard = UIColor.black.withAlphaComponent(0.1)
}
