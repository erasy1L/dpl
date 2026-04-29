package repository

import (
	"backend/internal/models"
	"context"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

// ChatContextRepository loads attraction/tour snippets for the LLM system prompt.
type ChatContextRepository struct {
	db *gorm.DB
}

func NewChatContextRepository(db *gorm.DB) *ChatContextRepository {
	return &ChatContextRepository{db: db}
}

func firstLocalizedName(ls models.LocalizedString) string {
	if ls == nil {
		return ""
	}
	for _, k := range []string{"en", "ru", "kz"} {
		if v := strings.TrimSpace(ls[k]); v != "" {
			return v
		}
	}
	for _, v := range ls {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func firstLocalizedCity(ls models.LocalizedString) string {
	return firstLocalizedName(ls)
}

// AttractionsTopByCity returns up to limit attractions in city (JSONB city match).
func (r *ChatContextRepository) AttractionsTopByCity(ctx context.Context, citySubstring string, limit int) ([]models.Attraction, error) {
	if limit <= 0 {
		limit = 5
	}
	pat := "%" + citySubstring + "%"
	var list []models.Attraction
	err := r.db.WithContext(ctx).
		Preload("Categories").
		Where("city::text ILIKE ?", pat).
		Order("average_rating DESC NULLS LAST, total_views DESC NULLS LAST").
		Limit(limit).
		Find(&list).Error
	return list, err
}

// AttractionsSearchName ILIKE on name JSONB text
func (r *ChatContextRepository) AttractionsSearchName(ctx context.Context, term string, limit int) ([]models.Attraction, error) {
	if limit <= 0 {
		limit = 8
	}
	pat := "%" + term + "%"
	var list []models.Attraction
	err := r.db.WithContext(ctx).
		Preload("Categories").
		Where("name::text ILIKE ?", pat).
		Order("average_rating DESC NULLS LAST").
		Limit(limit).
		Find(&list).Error
	return list, err
}

// AttractionsByCategoryKeyword matches category name_en/name_ru containing keyword
func (r *ChatContextRepository) AttractionsByCategoryKeyword(ctx context.Context, keyword string, limit int) ([]models.Attraction, error) {
	if limit <= 0 {
		limit = 8
	}
	pat := "%" + keyword + "%"
	var list []models.Attraction
	sub := r.db.Table("attraction_categories").
		Select("attraction_id").
		Joins("JOIN categories ON categories.id = attraction_categories.category_id").
		Where("categories.name_en ILIKE ? OR categories.name_ru ILIKE ?", pat, pat)
	err := r.db.WithContext(ctx).
		Preload("Categories").
		Where("id IN (?)", sub).
		Order("average_rating DESC NULLS LAST").
		Limit(limit).
		Find(&list).Error
	return list, err
}

// ToursListActive returns tours with company and next schedules for context
func (r *ChatContextRepository) ToursListActive(ctx context.Context, filter *models.TourFilter, limit int) ([]models.Tour, error) {
	if limit <= 0 {
		limit = 10
	}
	q := r.db.WithContext(ctx).Model(&models.Tour{}).Where("is_active = ?", true).Preload("Company")
	if filter != nil {
		if filter.City != nil && *filter.City != "" {
			pat := "%" + *filter.City + "%"
			q = q.Where("start_city::text ILIKE ? OR end_city::text ILIKE ?", pat, pat)
		}
		if filter.CompanyID != nil {
			q = q.Where("company_id = ?", *filter.CompanyID)
		}
	}
	var tours []models.Tour
	if err := q.Order("average_rating DESC NULLS LAST").Limit(limit).Find(&tours).Error; err != nil {
		return nil, err
	}
	for i := range tours {
		var scheds []models.TourSchedule
		_ = r.db.WithContext(ctx).
			Where("tour_id = ? AND status = ? AND available_spots > 0 AND start_date >= ?", tours[i].ID, "scheduled", time.Now().Truncate(24*time.Hour)).
			Order("start_date ASC").
			Limit(3).
			Find(&scheds).Error
		tours[i].Schedules = scheds
	}
	return tours, nil
}

// CountActiveTours returns rows with is_active = true (authoritative for "how many tours").
func (r *ChatContextRepository) CountActiveTours(ctx context.Context) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.Tour{}).Where("is_active = ?", true).Count(&n).Error
	return n, err
}

// CountAttractions returns total attractions (authoritative for "how many attractions").
func (r *ChatContextRepository) CountAttractions(ctx context.Context) (int64, error) {
	var n int64
	err := r.db.WithContext(ctx).Model(&models.Attraction{}).Count(&n).Error
	return n, err
}

// FormatAttractionsContext builds markdown lines for system prompt
func FormatAttractionsContext(attractions []models.Attraction) string {
	if len(attractions) == 0 {
		return "(none)"
	}
	var b strings.Builder
	for _, a := range attractions {
		name := firstLocalizedName(a.Name)
		city := firstLocalizedCity(a.City)
		rating := 0.0
		if a.AverageRating != nil {
			rating = *a.AverageRating
		}
		cats := make([]string, 0, len(a.Categories))
		for _, c := range a.Categories {
			if c.NameEn != "" {
				cats = append(cats, c.NameEn)
			} else if c.NameRu != "" {
				cats = append(cats, c.NameRu)
			}
		}
		catStr := strings.Join(cats, ", ")
		b.WriteString(fmt.Sprintf("- ID: %d | Name: %s | City: %s | Rating: %.1f | Categories: %s\n", a.ID, name, city, rating, catStr))
	}
	return b.String()
}

// FormatToursContext builds markdown lines for system prompt
func FormatToursContext(tours []models.Tour) string {
	if len(tours) == 0 {
		return "(none)"
	}
	var b strings.Builder
	for _, t := range tours {
		name := firstLocalizedName(t.Name)
		company := ""
		if t.Company != nil {
			company = firstLocalizedName(t.Company.Name)
		}
		dur := fmt.Sprintf("%d days", t.DurationDays)
		if t.DurationDays == 0 {
			dur = fmt.Sprintf("%d hours", t.DurationHours)
		}
		next := "n/a"
		spots := 0
		if len(t.Schedules) > 0 {
			s := t.Schedules[0]
			next = s.StartDate.Format("2006-01-02")
			spots = s.AvailableSpots
		}
		b.WriteString(fmt.Sprintf(
			"- ID: %d | Name: %s | Company: %s | Price: %.0f %s | Duration: %s | Difficulty: %s | Next available: %s (%d spots)\n",
			t.ID, name, company, t.Price, t.Currency, dur, t.Difficulty, next, spots,
		))
	}
	return b.String()
}
