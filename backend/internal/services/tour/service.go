package tour

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrTourNotFound        = errors.New("tour not found")
	ErrScheduleNotFound    = errors.New("tour schedule not found")
	ErrCompanyDoesNotExist = errors.New("company does not exist")
)

type Service interface {
	Create(ctx context.Context, req *models.CreateTourRequest) (*models.Tour, error)
	GetByID(ctx context.Context, id int) (*models.Tour, error)
	List(ctx context.Context, filter *models.TourFilter, limit, offset int) ([]models.Tour, int64, error)
	Update(ctx context.Context, id int, req *models.UpdateTourRequest) (*models.Tour, error)
	Delete(ctx context.Context, id int) error
	GetSchedules(ctx context.Context, tourID int) ([]models.TourSchedule, error)
}

type service struct {
	tourRepo     repository.TourRepository
	companyRepo  repository.TourCompanyRepository
	txMgr        repository.TransactionManager
}

func NewService(
	tourRepo repository.TourRepository,
	companyRepo repository.TourCompanyRepository,
	txMgr repository.TransactionManager,
) Service {
	return &service{
		tourRepo:    tourRepo,
		companyRepo: companyRepo,
		txMgr:       txMgr,
	}
}

func (s *service) Create(ctx context.Context, req *models.CreateTourRequest) (*models.Tour, error) {
	var created *models.Tour

	err := s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		if _, err := s.companyRepo.GetByID(txCtx, req.CompanyID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrCompanyDoesNotExist
			}
			return err
		}

		t := &models.Tour{
			CompanyID:        req.CompanyID,
			Name:             req.Name,
			Description:      req.Description,
			ShortDescription: req.ShortDescription,
			Images:           models.ImageArray(req.Images),
			DurationDays:     req.DurationDays,
			DurationHours:    req.DurationHours,
			MaxGroupSize:     req.MaxGroupSize,
			Price:            req.Price,
			Currency:         req.Currency,
			Difficulty:       req.Difficulty,
			StartCity:        req.StartCity,
			EndCity:          req.EndCity,
		}
		if req.IsActive != nil {
			t.IsActive = *req.IsActive
		}

		if err := s.tourRepo.Create(txCtx, t, req.AttractionIDs); err != nil {
			return err
		}

		created = t
		return nil
	})

	if err != nil {
		return nil, err
	}

	return created, nil
}

func (s *service) GetByID(ctx context.Context, id int) (*models.Tour, error) {
	tour, err := s.tourRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTourNotFound
		}
		return nil, err
	}
	return tour, nil
}

func (s *service) List(ctx context.Context, filter *models.TourFilter, limit, offset int) ([]models.Tour, int64, error) {
	return s.tourRepo.List(ctx, filter, limit, offset)
}

func (s *service) Update(ctx context.Context, id int, req *models.UpdateTourRequest) (*models.Tour, error) {
	var updated *models.Tour

	err := s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		tour, err := s.tourRepo.GetByID(txCtx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTourNotFound
			}
			return err
		}

		if req.CompanyID != nil {
			if _, err := s.companyRepo.GetByID(txCtx, *req.CompanyID); err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return ErrCompanyDoesNotExist
				}
				return err
			}
			tour.CompanyID = *req.CompanyID
		}
		if req.Name != nil {
			tour.Name = req.Name
		}
		if req.Description != nil {
			tour.Description = req.Description
		}
		if req.ShortDescription != nil {
			tour.ShortDescription = req.ShortDescription
		}
		if req.Images != nil {
			tour.Images = models.ImageArray(req.Images)
		}
		if req.DurationDays != nil {
			tour.DurationDays = *req.DurationDays
		}
		if req.DurationHours != nil {
			tour.DurationHours = *req.DurationHours
		}
		if req.MaxGroupSize != nil {
			tour.MaxGroupSize = *req.MaxGroupSize
		}
		if req.Price != nil {
			tour.Price = *req.Price
		}
		if req.Currency != nil {
			tour.Currency = *req.Currency
		}
		if req.Difficulty != nil {
			tour.Difficulty = *req.Difficulty
		}
		if req.StartCity != nil {
			tour.StartCity = req.StartCity
		}
		if req.EndCity != nil {
			tour.EndCity = req.EndCity
		}
		if req.IsActive != nil {
			tour.IsActive = *req.IsActive
		}

		if err := s.tourRepo.Update(txCtx, tour, req.AttractionIDs); err != nil {
			return err
		}

		updated = tour
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updated, nil
}

func (s *service) Delete(ctx context.Context, id int) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		if _, err := s.tourRepo.GetByID(txCtx, id); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTourNotFound
			}
			return err
		}
		return s.tourRepo.Delete(txCtx, id)
	})
}

func (s *service) GetSchedules(ctx context.Context, tourID int) ([]models.TourSchedule, error) {
	return s.tourRepo.ListSchedulesByTour(ctx, tourID)
}

