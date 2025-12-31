import UIKit
import Capacitor

// FIX: iOS Status Bar Custom Color
// This file should be kept when removing screenshot mode changes.
// Ensures status bar uses dark content (black text/icons) which is closer to velyar blue (#285A66)
// than white. iOS only supports black or white - true velyar blue would require custom overlay.

extension CAPBridgeViewController {
    open override var preferredStatusBarStyle: UIStatusBarStyle {
        // Use darkContent to ensure dark text/icons on light background
        // This is the closest we can get to velyar blue without a custom implementation
        return .darkContent
    }
    
    open override var prefersStatusBarHidden: Bool {
        return false
    }
}

