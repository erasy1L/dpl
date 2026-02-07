package analytics

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

type Service interface {
	GetOverview(ctx context.Context) (*models.AnalyticsOverview, error)
	GetViewsOverTime(ctx context.Context, days int) ([]models.TimeSeriesData, error)
	GetCategoryDistribution(ctx context.Context) ([]models.CategoryData, error)
	GetCityStatistics(ctx context.Context) ([]models.CityData, error)
	GetTopAttractions(ctx context.Context, sortBy string, limit int) ([]models.AttractionAnalytics, error)
	GetRatingDistribution(ctx context.Context) (map[int]int, error)
}

type service struct {
	analyticsRepo repository.AnalyticsRepository
	cache         *redis.Client
}

func NewService(analyticsRepo repository.AnalyticsRepository, cache *redis.Client) Service {
	return &service{
		analyticsRepo: analyticsRepo,
		cache:         cache,
	}
}

// GetOverview - get overall analytics with caching
func (s *service) GetOverview(ctx context.Context) (*models.AnalyticsOverview, error) {
	cacheKey := "analytics:overview"

	// Try cache first
	if s.cache != nil {
		if cached, err := s.cache.Get(ctx, cacheKey).Result(); err == nil {
			var overview models.AnalyticsOverview
			if err := json.Unmarshal([]byte(cached), &overview); err == nil {
				return &overview, nil
			}
		}
	}

	// Get from DB
	overview, err := s.analyticsRepo.GetOverview(ctx)
	if err != nil {
		return nil, err
	}

	// Cache for 10 minutes
	if s.cache != nil {
		if data, err := json.Marshal(overview); err == nil {
			s.cache.Set(ctx, cacheKey, data, 10*time.Minute)
		}
	}

	return overview, nil
}

// GetViewsOverTime - get views time series with caching
func (s *service) GetViewsOverTime(ctx context.Context, days int) ([]models.TimeSeriesData, error) {
	// Validate days parameter
	if days <= 0 {
		days = 30
	}
	if days > 365 {
		days = 365
	}

	cacheKey := "analytics:views_over_time:" + string(rune(days))

	// Try cache first
	if s.cache != nil {
		if cached, err := s.cache.Get(ctx, cacheKey).Result(); err == nil {
			var data []models.TimeSeriesData
			if err := json.Unmarshal([]byte(cached), &data); err == nil {
				return data, nil
			}
		}
	}

	// Get from DB
	data, err := s.analyticsRepo.GetViewsOverTime(ctx, days)
	if err != nil {
		return nil, err
	}

	// Cache for 10 minutes
	if s.cache != nil {
		if jsonData, err := json.Marshal(data); err == nil {
			s.cache.Set(ctx, cacheKey, jsonData, 10*time.Minute)
		}
	}

	return data, nil
}

// GetCategoryDistribution - get category distribution with caching
func (s *service) GetCategoryDistribution(ctx context.Context) ([]models.CategoryData, error) {
	cacheKey := "analytics:categories"

	// Try cache first
	if s.cache != nil {
		if cached, err := s.cache.Get(ctx, cacheKey).Result(); err == nil {
			var data []models.CategoryData
			if err := json.Unmarshal([]byte(cached), &data); err == nil {
				return data, nil
			}
		}
	}

	// Get from DB
	data, err := s.analyticsRepo.GetCategoryDistribution(ctx)
	if err != nil {
		return nil, err
	}

	// Cache for 10 minutes
	if s.cache != nil {
		if jsonData, err := json.Marshal(data); err == nil {
			s.cache.Set(ctx, cacheKey, jsonData, 10*time.Minute)
		}
	}

	return data, nil
}

// GetCityStatistics - get city statistics with caching
func (s *service) GetCityStatistics(ctx context.Context) ([]models.CityData, error) {
	cacheKey := "analytics:cities"

	// Try cache first
	if s.cache != nil {
		if cached, err := s.cache.Get(ctx, cacheKey).Result(); err == nil {
			var data []models.CityData
			if err := json.Unmarshal([]byte(cached), &data); err == nil {
				return data, nil
			}
		}
	}

	// Get from DB
	data, err := s.analyticsRepo.GetCityStatistics(ctx)
	if err != nil {
		return nil, err
	}

	// Cache for 10 minutes
	if s.cache != nil {
		if jsonData, err := json.Marshal(data); err == nil {
			s.cache.Set(ctx, cacheKey, jsonData, 10*time.Minute)
		}
	}

	return data, nil
}

// GetTopAttractions - get top attractions with caching
func (s *service) GetTopAttractions(ctx context.Context, sortBy string, limit int) ([]models.AttractionAnalytics, error) {
	// Validate parameters
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	if sortBy != "views" && sortBy != "rating" && sortBy != "trend" {
		sortBy = "views"
	}

	cacheKey := "analytics:top_attractions:" + sortBy + ":" + string(rune(limit))

	// Try cache first
	if s.cache != nil {
		if cached, err := s.cache.Get(ctx, cacheKey).Result(); err == nil {
			var data []models.AttractionAnalytics
			if err := json.Unmarshal([]byte(cached), &data); err == nil {
				return data, nil
			}
		}
	}

	// Get from DB
	data, err := s.analyticsRepo.GetTopAttractions(ctx, sortBy, limit)
	if err != nil {
		return nil, err
	}

	// Cache for 10 minutes
	if s.cache != nil {
		if jsonData, err := json.Marshal(data); err == nil {
			s.cache.Set(ctx, cacheKey, jsonData, 10*time.Minute)
		}
	}

	return data, nil
}

// GetRatingDistribution - get rating distribution with caching
func (s *service) GetRatingDistribution(ctx context.Context) (map[int]int, error) {
	cacheKey := "analytics:rating_distribution"

	// Try cache first
	if s.cache != nil {
		if cached, err := s.cache.Get(ctx, cacheKey).Result(); err == nil {
			var data map[int]int
			if err := json.Unmarshal([]byte(cached), &data); err == nil {
				return data, nil
			}
		}
	}

	// Get from DB
	data, err := s.analyticsRepo.GetRatingDistribution(ctx)
	if err != nil {
		return nil, err
	}

	// Cache for 10 minutes
	if s.cache != nil {
		if jsonData, err := json.Marshal(data); err == nil {
			s.cache.Set(ctx, cacheKey, jsonData, 10*time.Minute)
		}
	}

	return data, nil
}
