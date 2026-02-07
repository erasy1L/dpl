package repository

import (
	"backend/internal/models"
	"context"
	"strings"

	"gorm.io/gorm"
)

type CategoryRepository interface {
	Create(ctx context.Context, category *models.Category) error
	GetByID(ctx context.Context, id int) (*models.Category, error)
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id int) error
	List(ctx context.Context, limit, offset int) ([]models.Category, error)
	Search(ctx context.Context, query string, limit, offset int) ([]models.Category, error)
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) Create(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *categoryRepository) GetByID(ctx context.Context, id int) (*models.Category, error) {
	var category models.Category
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) Update(ctx context.Context, category *models.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&models.Category{}, "id = ?", id).Error
}

func (r *categoryRepository) List(ctx context.Context, limit, offset int) ([]models.Category, error) {
	var categories []models.Category
	query := r.db.WithContext(ctx)

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Find(&categories).Error
	return categories, err
}

func (r *categoryRepository) Search(ctx context.Context, query string, limit, offset int) ([]models.Category, error) {
	var categories []models.Category
	searchQuery := "%" + strings.ToLower(query) + "%"

	dbQuery := r.db.WithContext(ctx).Where("LOWER(name_en) LIKE ? OR LOWER(name_ru) LIKE ?", searchQuery, searchQuery)

	if limit > 0 {
		dbQuery = dbQuery.Limit(limit)
	}
	if offset > 0 {
		dbQuery = dbQuery.Offset(offset)
	}

	err := dbQuery.Find(&categories).Error
	return categories, err
}
