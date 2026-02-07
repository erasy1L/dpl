package repository

import (
	"backend/internal/models"
	"context"
	"fmt"

	"gorm.io/gorm"
)

type AttractionFilter struct {
	City        *string
	Search      *string
	CategoryIDs []int
}

type AttractionRepository interface {
	Create(ctx context.Context, attraction *models.Attraction) error
	GetByID(ctx context.Context, id int) (*models.Attraction, error)
	Update(ctx context.Context, attraction *models.Attraction) error
	Delete(ctx context.Context, id int) error
	List(ctx context.Context, filter *AttractionFilter, limit, offset int) ([]models.Attraction, int64, error)
	Search(ctx context.Context, query string, limit, offset int) ([]models.Attraction, error)
	IncrementViews(ctx context.Context, attractionID int) error
	GetDB() *gorm.DB
}

type attractionRepository struct {
	db *gorm.DB
}

func (r *attractionRepository) GetDB() *gorm.DB {
	return r.db
}

func NewAttractionRepository(db *gorm.DB) AttractionRepository {
	return &attractionRepository{db: db}
}

func (r *attractionRepository) Create(ctx context.Context, attraction *models.Attraction) error {
	return r.db.WithContext(ctx).Create(attraction).Error
}

func (r *attractionRepository) GetByID(ctx context.Context, id int) (*models.Attraction, error) {
	var attraction models.Attraction
	err := r.db.WithContext(ctx).Preload("Categories").Where("id = ?", id).First(&attraction).Error
	if err != nil {
		return nil, err
	}
	return &attraction, nil
}

func (r *attractionRepository) Update(ctx context.Context, attraction *models.Attraction) error {
	return r.db.WithContext(ctx).Save(attraction).Error
}

func (r *attractionRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&models.Attraction{}, "id = ?", id).Error
}

func (r *attractionRepository) List(ctx context.Context, filter *AttractionFilter, limit, offset int) ([]models.Attraction, int64, error) {
	var attractions []models.Attraction
	var total int64

	// Build base query
	baseQuery := r.db.WithContext(ctx).Model(&models.Attraction{})

	baseQuery = baseQuery.Debug()

	// Apply filters
	if filter != nil {
		if filter.City != nil && *filter.City != "" {
			// Search in JSONB city field for any locale
			baseQuery = baseQuery.Where("city::text ILIKE ?", fmt.Sprintf("%%%s%%", *filter.City))
		}
		if filter.Search != nil && *filter.Search != "" {
			// Search in JSONB name and description fields for any locale
			searchPattern := fmt.Sprintf("%%%s%%", *filter.Search)
			baseQuery = baseQuery.Where(
				"name::text ILIKE ? OR description::text ILIKE ? OR address::text ILIKE ?",
				searchPattern, searchPattern, searchPattern,
			)
		}
		if len(filter.CategoryIDs) > 0 {
			// Use subquery to filter by categories
			baseQuery = baseQuery.Where("id IN (?)",
				r.db.Table("attraction_categories").
					Select("attraction_id").
					Where("category_id IN ?", filter.CategoryIDs),
			)
		}
	}

	// Get total count
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and ordering
	query := baseQuery.Order("created_at DESC, id DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Preload("Categories").Find(&attractions).Error
	return attractions, total, err
}

func (r *attractionRepository) Search(ctx context.Context, query string, limit, offset int) ([]models.Attraction, error) {
	var attractions []models.Attraction
	searchPattern := fmt.Sprintf("%%%s%%", query)

	dbQuery := r.db.WithContext(ctx).Where(
		"name::text ILIKE ? OR description::text ILIKE ? OR address::text ILIKE ?",
		searchPattern, searchPattern, searchPattern,
	)

	if limit > 0 {
		dbQuery = dbQuery.Limit(limit)
	}
	if offset > 0 {
		dbQuery = dbQuery.Offset(offset)
	}

	err := dbQuery.Order("created_at DESC, id DESC").Preload("Categories").Find(&attractions).Error
	return attractions, err
}

func (r *attractionRepository) IncrementViews(ctx context.Context, attractionID int) error {
	result := r.db.WithContext(ctx).
		Model(&models.Attraction{}).
		Where("id = ?", attractionID).
		UpdateColumn("total_views", gorm.Expr("total_views + 1"))

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
