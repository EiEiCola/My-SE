package entity

type AttachmentChat struct {
    ID        	uint   `gorm:"primaryKey;autoIncrement" json:"id"`
    MessageID 	uint   `gorm:"index" json:"message_id"` // FK -> Message.ID
    FileURL  	string `json:"file_url"`
    FileType 	string `json:"file_type"`  // image, file, sticker, ...
    FileName 	string `json:"file_name"`
    FileSize 	string `json:"file_size"`

    // ความสัมพันธ์
    Message Message `gorm:"foreignKey:MessageID;references:ID" json:"message,omitempty"`
}