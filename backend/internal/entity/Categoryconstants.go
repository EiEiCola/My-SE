package entity

// AllowedCategoryIcons - รายการ icon keys ที่อนุญาตสำหรับ Category
// ใช้ใน validation tag: valid:"in(Book|School|Tech|Music|...)"
var AllowedCategoryIcons = map[string]string{
	"Book":        "📚",
	"School":      "🏫",
	"Tech":        "💻",
	"Music":       "🎵",
	"Food":        "🍔",
	"Travel":      "✈️",
	"Shopping":    "🛒",
	"Health":      "🏥",
	"Sports":      "⚽",
	"Movie":       "🎬",
	"Game":        "🎮",
	"Beauty":      "💄",
	"Home":        "🏠",
	"Car":         "🚗",
	"Pet":         "🐾",
	"Fashion":     "👗",
	"Finance":     "💰",
	"Art":         "🎨",
	"Photography": "📷",
	"News":        "📰",
}

// GetIconEmoji คืนค่า emoji จาก key (ใช้สำหรับ frontend display)
func GetIconEmoji(key string) string {
	if emoji, exists := AllowedCategoryIcons[key]; exists {
		return emoji
	}
	return "📁" // default icon
}
