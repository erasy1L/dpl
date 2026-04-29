package company

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"errors"

	"gorm.io/gorm"
)

var (
	ErrCompanyNotFound = errors.New("company not found")
)

type Service interface {
	Create(ctx context.Context, req *models.CreateTourCompanyRequest) (*models.TourCompany, error)
	GetByID(ctx context.Context, id int) (*models.TourCompany, error)
	List(ctx context.Context, city *string, limit, offset int) ([]models.TourCompany, int64, error)
	Update(ctx context.Context, id int, req *models.UpdateTourCompanyRequest) (*models.TourCompany, error)
	Delete(ctx context.Context, id int) error
}

type service struct {
	companyRepo repository.TourCompanyRepository
	txMgr       repository.TransactionManager
}

func NewService(companyRepo repository.TourCompanyRepository, txMgr repository.TransactionManager) Service {
	return &service{
		companyRepo: companyRepo,
		txMgr:       txMgr,
	}
}

func (s *service) Create(ctx context.Context, req *models.CreateTourCompanyRequest) (*models.TourCompany, error) {
	company := &models.TourCompany{
		Name:        req.Name,
		Description: req.Description,
		Logo:        req.Logo,
		Website:     req.Website,
		Phone:       req.Phone,
		Email:       req.Email,
		City:        req.City,
		Address:     req.Address,
	}

	err := s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.companyRepo.Create(txCtx, company)
	})
	if err != nil {
		return nil, err
	}

	return company, nil
}

func (s *service) GetByID(ctx context.Context, id int) (*models.TourCompany, error) {
	company, err := s.companyRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCompanyNotFound
		}
		return nil, err
	}
	return company, nil
}

func (s *service) List(ctx context.Context, city *string, limit, offset int) ([]models.TourCompany, int64, error) {
	return s.companyRepo.List(ctx, city, limit, offset)
}

func (s *service) Update(ctx context.Context, id int, req *models.UpdateTourCompanyRequest) (*models.TourCompany, error) {
	var updated *models.TourCompany

	err := s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		company, err := s.companyRepo.GetByID(txCtx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrCompanyNotFound
			}
			return err
		}

		if req.Name != nil {
			company.Name = req.Name
		}
		if req.Description != nil {
			company.Description = req.Description
		}
		if req.Logo != nil {
			company.Logo = *req.Logo
		}
		if req.Website != nil {
			company.Website = req.Website
		}
		if req.Phone != nil {
			company.Phone = *req.Phone
		}
		if req.Email != nil {
			company.Email = *req.Email
		}
		if req.City != nil {
			company.City = req.City
		}
		if req.Address != nil {
			company.Address = req.Address
		}
		if req.IsVerified != nil {
			company.IsVerified = *req.IsVerified
		}

		if err := s.companyRepo.Update(txCtx, company); err != nil {
			return err
		}

		updated = company
		return nil
	})
	if err != nil {
		return nil, err
	}

	return updated, nil
}

func (s *service) Delete(ctx context.Context, id int) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		_, err := s.companyRepo.GetByID(txCtx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrCompanyNotFound
			}
			return err
		}
		return s.companyRepo.Delete(txCtx, id)
	})
}

