package attraction

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"errors"
)

var (
	ErrAttractionNotFound = errors.New("attraction not found")
)

type AttractionService interface {
	GetByID(ctx context.Context, id int) (*models.Attraction, error)
	List(ctx context.Context, filter *repository.AttractionFilter, limit, offset int) ([]models.Attraction, int64, error)
	Search(ctx context.Context, query string, limit, offset int) ([]models.Attraction, error)
	GetCitiesWithCount(ctx context.Context, limit int) ([]repository.CityWithCount, error)
	Create(ctx context.Context, attraction *models.Attraction) error
	Update(ctx context.Context, attraction *models.Attraction) error
	Delete(ctx context.Context, id int) error
}

type attractionService struct {
	attractionRepo repository.AttractionRepository
	txMgr          repository.TransactionManager
}

func NewAttractionService(attractionRepo repository.AttractionRepository, txMgr repository.TransactionManager) AttractionService {
	return &attractionService{
		attractionRepo: attractionRepo,
		txMgr:          txMgr,
	}
}

func (s *attractionService) GetByID(ctx context.Context, id int) (*models.Attraction, error) {
	attraction, err := s.attractionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrAttractionNotFound
	}
	return attraction, nil
}

func (s *attractionService) List(ctx context.Context, filter *repository.AttractionFilter, limit, offset int) ([]models.Attraction, int64, error) {
	return s.attractionRepo.List(ctx, filter, limit, offset)
}

func (s *attractionService) Search(ctx context.Context, query string, limit, offset int) ([]models.Attraction, error) {
	if query == "" {
		attractions, _, err := s.attractionRepo.List(ctx, nil, limit, offset)
		return attractions, err
	}
	return s.attractionRepo.Search(ctx, query, limit, offset)
}

func (s *attractionService) Create(ctx context.Context, attraction *models.Attraction) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.attractionRepo.Create(txCtx, attraction)
	})
}

func (s *attractionService) Update(ctx context.Context, attraction *models.Attraction) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.attractionRepo.Update(txCtx, attraction)
	})
}

func (s *attractionService) Delete(ctx context.Context, id int) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.attractionRepo.Delete(txCtx, id)
	})
}

func (s *attractionService) GetCitiesWithCount(ctx context.Context, limit int) ([]repository.CityWithCount, error) {
	return s.attractionRepo.GetCitiesWithCount(ctx, limit)
}
