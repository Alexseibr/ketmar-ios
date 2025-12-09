import UIKit

extension UIColor {

    /// Initializes a UIColor from a hex string.
    /// - Parameters:
    ///   - hex: The hex string, which can be 6 or 8 characters long (e.g., "#RRGGBB" or "#RRGGBBAA").
    ///   - alpha: Optional alpha value (0.0 - 1.0). Overrides alpha from hex string if provided.
    /// - Returns: A UIColor object if the hex string is valid, or nil otherwise.
    public convenience init?(hex: String, alpha: CGFloat? = nil) {
        var hexSanitized = hex.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)
        
        // Remove the hash prefix if it exists
        if hexSanitized.hasPrefix("#") {
            hexSanitized.removeFirst()
        }
        
        // Check for valid length (6 or 8 characters)
        guard hexSanitized.count == 6 || hexSanitized.count == 8 else {
            return nil
        }
        
        // Scan the hex string into an unsigned integer
        var rgbValue: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgbValue)
        
        // Extract components based on the number of characters
        var r, g, b, a: CGFloat
        
        if hexSanitized.count == 8 {
            r = CGFloat((rgbValue & 0xff000000) >> 24) / 255.0
            g = CGFloat((rgbValue & 0x00ff0000) >> 16) / 255.0
            b = CGFloat((rgbValue & 0x0000ff00) >> 8) / 255.0
            a = CGFloat(rgbValue & 0x000000ff) / 255.0
        } else { // 6 characters (RGB)
            r = CGFloat((rgbValue & 0xff0000) >> 16) / 255.0
            g = CGFloat((rgbValue & 0x00ff00) >> 8) / 255.0
            b = CGFloat(rgbValue & 0x0000ff) / 255.0
            a = alpha ?? 1.0 // Use provided alpha or default to 1.0
        }

        self.init(red: r, green: g, blue: b, alpha: alpha ?? a)
    }
}
