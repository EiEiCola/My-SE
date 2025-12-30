package entity

import (
	"errors"
	"strings"
)

func ValidatePollForSubmission(p Poll) (bool, error) {
	if strings.TrimSpace(p.Question) == "" {
		return false, errors.New("question is required")
	}
	if len(p.Options) < 2 {
		return false, errors.New("at least 2 options required")
	}

	seen := make(map[string]bool)
	for _, opt := range p.Options {
		if strings.TrimSpace(opt.Label) == "" {
			return false, errors.New("option label cannot be empty")
		}
		key := strings.TrimSpace(opt.Label)
		if seen[key] {
			return false, errors.New("duplicate option labels not allowed")
		}
		seen[key] = true
	}

	if p.AllowMultiple {
		if p.MaxChoice == nil {
			return false, errors.New("max_choice must be specified when allow_multiple is true")
		}
		if *p.MaxChoice <= 1 || *p.MaxChoice > len(p.Options) {
			return false, errors.New("max_choice must be between 2 and number of options")
		}
	}

	if p.StartAt != nil && p.EndAt != nil {
		if p.EndAt.Before(*p.StartAt) {
			return false, errors.New("end_at must be after start_at")
		}
	}

	return true, nil
}
