package utils

// Pagination constants
const (
	DefaultPage     = 1
	DefaultPageSize = 20
	MaxPageSize     = 100
)

// ValidatePagination validates and normalizes pagination parameters
func ValidatePagination(page, pageSize int) (int, int) {
	// Validate page number
	if page < 1 {
		page = DefaultPage
	}

	// Validate page size
	if pageSize < 1 {
		pageSize = DefaultPageSize
	}
	if pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}

	return page, pageSize
}
