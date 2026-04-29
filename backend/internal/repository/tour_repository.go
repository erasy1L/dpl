package repository

import (
	"backend/internal/models"
	"context"

	"gorm.io/gorm"
)

type TourRepository interface {
	Create(ctx context.Context, tour *models.Tour, attractionIDs []int) error
	GetByID(ctx context.Context, id int) (*models.Tour, error)
	Update(ctx context.Context, tour *models.Tour, attractionIDs []int) error
	Delete(ctx context.Context, id int) error
	List(ctx context.Context, filter *models.TourFilter, limit, offset int) ([]models.Tour, int64, error)
	ListSchedulesByTour(ctx context.Context, tourID int) ([]models.TourSchedule, error)
	GetScheduleByID(ctx context.Context, id int) (*models.TourSchedule, error)
	UpdateSchedule(ctx context.Context, schedule *models.TourSchedule) error
}

type tourRepository struct {
	db *gorm.DB
}

func NewTourRepository(db *gorm.DB) TourRepository {
	return &tourRepository{db: db}
}

func (r *tourRepository) withDB(ctx context.Context) *gorm.DB {
	return GetDB(ctx, r.db)
}

func (r *tourRepository) Create(ctx context.Context, tour *models.Tour, attractionIDs []int) error {
	db := r.withDB(ctx)

	if err := db.Create(tour).Error; err != nil {
		return err
	}

	if len(attractionIDs) > 0 {
		relations := make([]models.TourAttraction, 0, len(attractionIDs))
		for i, id := range attractionIDs {
			relations = append(relations, models.TourAttraction{
				TourID:       tour.ID,
				AttractionID: id,
				Order:        i + 1,
			})
		}
		if err := db.Where("tour_id = ?", tour.ID).Delete(&models.TourAttraction{}).Error; err != nil {
			return err
		}
		if err := db.Create(&relations).Error; err != nil {
			return err
		}
	}

	return nil
}

func (r *tourRepository) GetByID(ctx context.Context, id int) (*models.Tour, error) {
	db := r.withDB(ctx)
	var tour models.Tour
	err := db.
		Preload("Company").
		Preload("Attractions").
		Preload("Schedules").
		Where("id = ?", id).
		First(&tour).Error
	if err != nil {
		return nil, err
	}
	return &tour, nil
}

func (r *tourRepository) Update(ctx context.Context, tour *models.Tour, attractionIDs []int) error {
	db := r.withDB(ctx)

	if err := db.Save(tour).Error; err != nil {
		return err
	}

	if attractionIDs != nil {
		if err := db.Where("tour_id = ?", tour.ID).Delete(&models.TourAttraction{}).Error; err != nil {
			return err
		}
		if len(attractionIDs) > 0 {
			relations := make([]models.TourAttraction, 0, len(attractionIDs))
			for i, id := range attractionIDs {
				relations = append(relations, models.TourAttraction{
					TourID:       tour.ID,
					AttractionID: id,
					Order:        i + 1,
				})
			}
			if err := db.Create(&relations).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func (r *tourRepository) Delete(ctx context.Context, id int) error {
	db := r.withDB(ctx)
	if err := db.Where("tour_id = ?", id).Delete(&models.TourAttraction{}).Error; err != nil {
		return err
	}
	if err := db.Where("tour_id = ?", id).Delete(&models.TourSchedule{}).Error; err != nil {
		return err
	}
	return db.Delete(&models.Tour{}, "id = ?", id).Error
}

func (r *tourRepository) List(ctx context.Context, filter *models.TourFilter, limit, offset int) ([]models.Tour, int64, error) {
	db := r.withDB(ctx)

	var tours []models.Tour
	var total int64

	query := db.Model(&models.Tour{}).Preload("Company")

	if filter != nil {
		if filter.City != nil && *filter.City != "" {
			query = query.Where("start_city::text ILIKE ? OR end_city::text ILIKE ?", "%"+*filter.City+"%", "%"+*filter.City+"%")
		}
		if filter.CompanyID != nil {
			query = query.Where("company_id = ?", *filter.CompanyID)
		}
		if filter.MinPrice != nil {
			query = query.Where("price >= ?", *filter.MinPrice)
		}
		if filter.MaxPrice != nil {
			query = query.Where("price <= ?", *filter.MaxPrice)
		}
		if filter.Duration != nil {
			query = query.Where("duration_days >= ?", *filter.Duration)
		}
		if filter.Difficulty != nil && *filter.Difficulty != "" {
			query = query.Where("difficulty = ?", *filter.Difficulty)
		}
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

	if err := query.Order("created_at DESC, id DESC").Find(&tours).Error; err != nil {
		return nil, 0, err
	}

	return tours, total, nil
}

func (r *tourRepository) ListSchedulesByTour(ctx context.Context, tourID int) ([]models.TourSchedule, error) {
	db := r.withDB(ctx)
	var schedules []models.TourSchedule
	err := db.
		Where("tour_id = ?", tourID).
		Order("start_date ASC").
		Find(&schedules).Error
	return schedules, err
}

func (r *tourRepository) GetScheduleByID(ctx context.Context, id int) (*models.TourSchedule, error) {
	db := r.withDB(ctx)
	var schedule models.TourSchedule
	if err := db.Where("id = ?", id).First(&schedule).Error; err != nil {
		return nil, err
	}
	return &schedule, nil
}

func (r *tourRepository) UpdateSchedule(ctx context.Context, schedule *models.TourSchedule) error {
	db := r.withDB(ctx)
	return db.Save(schedule).Error
}

