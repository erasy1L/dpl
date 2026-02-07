package repository

import (
	"backend/internal/models"
	"context"
	"time"

	"gorm.io/gorm"
)

type AnalyticsRepository interface {
	GetOverview(ctx context.Context) (*models.AnalyticsOverview, error)
	GetViewsOverTime(ctx context.Context, days int) ([]models.TimeSeriesData, error)
	GetCategoryDistribution(ctx context.Context) ([]models.CategoryData, error)
	GetCityStatistics(ctx context.Context) ([]models.CityData, error)
	GetTopAttractions(ctx context.Context, sortBy string, limit int) ([]models.AttractionAnalytics, error)
	GetRatingDistribution(ctx context.Context) (map[int]int, error)
}

type analyticsRepository struct {
	db *gorm.DB
}

func NewAnalyticsRepository(db *gorm.DB) AnalyticsRepository {
	return &analyticsRepository{db: db}
}

// GetOverview - get overall analytics metrics
func (r *analyticsRepository) GetOverview(ctx context.Context) (*models.AnalyticsOverview, error) {
	var overview models.AnalyticsOverview

	// Total attractions
	var totalAttractions int64
	if err := r.db.WithContext(ctx).Model(&models.Attraction{}).Count(&totalAttractions).Error; err != nil {
		return nil, err
	}
	overview.TotalAttractions = int(totalAttractions)

	// Total views
	var totalViews int64
	if err := r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Where("activity_type = ?", models.ActivityTypeView).
		Count(&totalViews).Error; err != nil {
		return nil, err
	}
	overview.TotalViews = int(totalViews)

	// Total ratings
	var totalRatings int64
	if err := r.db.WithContext(ctx).Model(&models.Rating{}).Count(&totalRatings).Error; err != nil {
		return nil, err
	}
	overview.TotalRatings = int(totalRatings)

	// Average rating
	var avgRating float64
	if err := r.db.WithContext(ctx).
		Model(&models.Rating{}).
		Select("COALESCE(AVG(rating), 0)").
		Scan(&avgRating).Error; err != nil {
		return nil, err
	}
	overview.AverageRating = avgRating

	// Active users in last 7 days
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	var activeUsers int64
	if err := r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Where("created_at > ?", sevenDaysAgo).
		Distinct("user_id").
		Count(&activeUsers).Error; err != nil {
		return nil, err
	}
	overview.ActiveUsers7Days = int(activeUsers)

	// Calculate trends (views change)
	fourteenDaysAgo := time.Now().AddDate(0, 0, -14)
	var viewsLast7Days, viewsPrevious7Days int64

	r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Where("activity_type = ? AND created_at > ?", models.ActivityTypeView, sevenDaysAgo).
		Count(&viewsLast7Days)

	r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Where("activity_type = ? AND created_at BETWEEN ? AND ?", models.ActivityTypeView, fourteenDaysAgo, sevenDaysAgo).
		Count(&viewsPrevious7Days)

	if viewsPrevious7Days > 0 {
		overview.Trends.ViewsChange = float64(viewsLast7Days-viewsPrevious7Days) / float64(viewsPrevious7Days) * 100
	}

	// Calculate ratings change
	var ratingsLast7Days, ratingsPrevious7Days int64

	r.db.WithContext(ctx).
		Model(&models.Rating{}).
		Where("created_at > ?", sevenDaysAgo).
		Count(&ratingsLast7Days)

	r.db.WithContext(ctx).
		Model(&models.Rating{}).
		Where("created_at BETWEEN ? AND ?", fourteenDaysAgo, sevenDaysAgo).
		Count(&ratingsPrevious7Days)

	if ratingsPrevious7Days > 0 {
		overview.Trends.RatingsChange = float64(ratingsLast7Days-ratingsPrevious7Days) / float64(ratingsPrevious7Days) * 100
	}

	return &overview, nil
}

// GetViewsOverTime - get views time series data
func (r *analyticsRepository) GetViewsOverTime(ctx context.Context, days int) ([]models.TimeSeriesData, error) {
	var data []models.TimeSeriesData

	startDate := time.Now().AddDate(0, 0, -days)

	err := r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Select("DATE(created_at) as date, COUNT(*) as views").
		Where("activity_type = ? AND created_at > ?", models.ActivityTypeView, startDate).
		Group("DATE(created_at)").
		Order("date").
		Scan(&data).Error

	return data, err
}

// GetCategoryDistribution - get attraction distribution by category
func (r *analyticsRepository) GetCategoryDistribution(ctx context.Context) ([]models.CategoryData, error) {
	var data []models.CategoryData

	err := r.db.WithContext(ctx).
		Table("attractions").
		Select("categories.name as category, COUNT(attractions.id) as count").
		Joins("LEFT JOIN categories ON attractions.category_id = categories.id").
		Group("categories.name").
		Order("count DESC").
		Scan(&data).Error

	if err != nil {
		return nil, err
	}

	// Calculate percentages
	var total int
	for _, item := range data {
		total += item.Count
	}

	for i := range data {
		if total > 0 {
			data[i].Percentage = float64(data[i].Count) / float64(total) * 100
		}
	}

	return data, nil
}

// GetCityStatistics - get statistics by city
func (r *analyticsRepository) GetCityStatistics(ctx context.Context) ([]models.CityData, error) {
	var data []models.CityData

	err := r.db.WithContext(ctx).
		Table("attractions").
		Select(`
			city,
			COUNT(id) as attractions,
			COALESCE(SUM(total_views), 0) as total_views,
			COALESCE(AVG(average_rating), 0) as average_rating
		`).
		Group("city").
		Order("attractions DESC").
		Scan(&data).Error

	return data, err
}

// GetTopAttractions - get top attractions by various metrics
func (r *analyticsRepository) GetTopAttractions(ctx context.Context, sortBy string, limit int) ([]models.AttractionAnalytics, error) {
	var data []models.AttractionAnalytics

	query := r.db.WithContext(ctx).
		Table("attractions").
		Select(`
			attractions.id,
			attractions.name_en as name,
			attractions.city,
			COALESCE(attractions.total_views, 0) as views,
			COALESCE(attractions.average_rating, 0) as rating,
			COALESCE(attractions.trending_score, 0) as trend
		`)

	// Sort by specified metric
	switch sortBy {
	case "rating":
		query = query.Order("average_rating DESC NULLS LAST")
	case "trend":
		query = query.Order("trending_score DESC NULLS LAST")
	default: // views
		query = query.Order("total_views DESC NULLS LAST")
	}

	query = query.Limit(limit)

	err := query.Scan(&data).Error
	return data, err
}

// GetRatingDistribution - get distribution of ratings
func (r *analyticsRepository) GetRatingDistribution(ctx context.Context) (map[int]int, error) {
	distribution := make(map[int]int)

	var results []struct {
		Rating int
		Count  int
	}

	err := r.db.WithContext(ctx).
		Model(&models.Rating{}).
		Select("rating, COUNT(*) as count").
		Group("rating").
		Order("rating DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	// Initialize all ratings (1-5) with 0
	for i := 1; i <= 5; i++ {
		distribution[i] = 0
	}

	// Fill in actual counts
	for _, result := range results {
		distribution[result.Rating] = result.Count
	}

	return distribution, nil
}
