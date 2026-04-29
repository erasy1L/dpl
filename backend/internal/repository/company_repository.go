package repository

import (
	"backend/internal/models"
	"context"

	"gorm.io/gorm"
)

type TourCompanyRepository interface {
	Create(ctx context.Context, company *models.TourCompany) error
	GetByID(ctx context.Context, id int) (*models.TourCompany, error)
	Update(ctx context.Context, company *models.TourCompany) error
	Delete(ctx context.Context, id int) error
	List(ctx context.Context, city *string, limit, offset int) ([]models.TourCompany, int64, error)
}

type tourCompanyRepository struct {
	db *gorm.DB
}

func NewTourCompanyRepository(db *gorm.DB) TourCompanyRepository {
	return &tourCompanyRepository{db: db}
}

func (r *tourCompanyRepository) Create(ctx context.Context, company *models.TourCompany) error {
	return r.db.WithContext(ctx).Create(company).Error
}

func (r *tourCompanyRepository) GetByID(ctx context.Context, id int) (*models.TourCompany, error) {
	var company models.TourCompany
	err := r.db.WithContext(ctx).
		Preload("Tours").
		Where("id = ?", id).
		First(&company).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *tourCompanyRepository) Update(ctx context.Context, company *models.TourCompany) error {
	return r.db.WithContext(ctx).Save(company).Error
}

func (r *tourCompanyRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&models.TourCompany{}, "id = ?", id).Error
}

func (r *tourCompanyRepository) List(ctx context.Context, city *string, limit, offset int) ([]models.TourCompany, int64, error) {
	var companies []models.TourCompany
	var total int64

	query := r.db.WithContext(ctx).Model(&models.TourCompany{})

	if city != nil && *city != "" {
		query = query.Where("city::text ILIKE ?", "%"+*city+"%")
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.Order("created_at DESC, id DESC").Find(&companies).Error; err != nil {
		return nil, 0, err
	}

	return companies, total, nil
}

