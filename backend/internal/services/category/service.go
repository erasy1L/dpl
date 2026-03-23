package category

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"errors"
)

var (
	ErrCategoryNotFound = errors.New("category not found")
)

type CategoryService interface {
	GetByID(ctx context.Context, id int) (*models.Category, error)
	List(ctx context.Context, limit, offset int) ([]models.Category, error)
	ListWithCount(ctx context.Context, limit, offset int) ([]repository.CategoryWithCount, error)
	Search(ctx context.Context, query string, limit, offset int) ([]models.Category, error)
	SearchWithCount(ctx context.Context, query string, limit, offset int) ([]repository.CategoryWithCount, error)
	Create(ctx context.Context, category *models.Category) error
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id int) error
}

type categoryService struct {
	categoryRepo repository.CategoryRepository
	txMgr        repository.TransactionManager
}

func NewCategoryService(categoryRepo repository.CategoryRepository, txMgr repository.TransactionManager) CategoryService {
	return &categoryService{
		categoryRepo: categoryRepo,
		txMgr:        txMgr,
	}
}

func (s *categoryService) GetByID(ctx context.Context, id int) (*models.Category, error) {
	category, err := s.categoryRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrCategoryNotFound
	}
	return category, nil
}

func (s *categoryService) List(ctx context.Context, limit, offset int) ([]models.Category, error) {
	return s.categoryRepo.List(ctx, limit, offset)
}

func (s *categoryService) Search(ctx context.Context, query string, limit, offset int) ([]models.Category, error) {
	if query == "" {
		return s.categoryRepo.List(ctx, limit, offset)
	}
	return s.categoryRepo.Search(ctx, query, limit, offset)
}

func (s *categoryService) ListWithCount(ctx context.Context, limit, offset int) ([]repository.CategoryWithCount, error) {
	return s.categoryRepo.ListWithCount(ctx, limit, offset)
}

func (s *categoryService) SearchWithCount(ctx context.Context, query string, limit, offset int) ([]repository.CategoryWithCount, error) {
	if query == "" {
		return s.categoryRepo.ListWithCount(ctx, limit, offset)
	}
	return s.categoryRepo.SearchWithCount(ctx, query, limit, offset)
}

func (s *categoryService) Create(ctx context.Context, category *models.Category) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.categoryRepo.Create(txCtx, category)
	})
}

func (s *categoryService) Update(ctx context.Context, category *models.Category) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.categoryRepo.Update(txCtx, category)
	})
}

func (s *categoryService) Delete(ctx context.Context, id int) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.categoryRepo.Delete(txCtx, id)
	})
}
