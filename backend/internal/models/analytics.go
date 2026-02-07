package models

import "time"

// AttractionStats represents statistics for an attraction
type AttractionStats struct {
	ID            int        `json:"id" gorm:"primaryKey;autoIncrement"`
	AttractionID  int        `json:"attraction_id" gorm:"not null;uniqueIndex" validate:"required"`
	ViewCount     int        `json:"view_count" gorm:"default:0"`
	ClickCount    int        `json:"click_count" gorm:"default:0"`
	FavoriteCount int        `json:"favorite_count" gorm:"default:0"`
	ShareCount    int        `json:"share_count" gorm:"default:0"`
	LastViewedAt  *time.Time `json:"last_viewed_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt     time.Time  `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`

	Attraction *Attraction `json:"attraction,omitempty" gorm:"foreignKey:AttractionID;references:ID"`
}

// TableName specifies the table name for AttractionStats model
func (AttractionStats) TableName() string {
	return "attraction_stats"
}

// PopularAttraction represents a popular attraction with aggregated data
type PopularAttraction struct {
	AttractionID int     `json:"attraction_id"`
	Name         string  `json:"name"`
	CategoryName string  `json:"category_name"`
	City         string  `json:"city"`
	ViewCount    int     `json:"view_count"`
	Rating       float32 `json:"rating"`
	ReviewCount  int     `json:"review_count"`
	Popularity   float32 `json:"popularity"`
}

// CategoryStats represents statistics for a category
type CategoryStats struct {
	CategoryID      int     `json:"category_id"`
	CategoryName    string  `json:"category_name"`
	AttractionCount int     `json:"attraction_count"`
	TotalViews      int     `json:"total_views"`
	AverageRating   float32 `json:"average_rating"`
}

// UserEngagement represents user engagement metrics
type UserEngagement struct {
	TotalUsers      int     `json:"total_users"`
	ActiveUsers     int     `json:"active_users"`
	TotalActivities int     `json:"total_activities"`
	TotalRatings    int     `json:"total_ratings"`
	AverageRating   float32 `json:"average_rating"`
}

// TrendingAttraction represents trending attractions based on recent activity
type TrendingAttraction struct {
	AttractionID   int       `json:"attraction_id"`
	Name           string    `json:"name"`
	City           string    `json:"city"`
	RecentViews    int       `json:"recent_views"`
	TrendScore     float32   `json:"trend_score"`
	LastActivityAt time.Time `json:"last_activity_at"`
}

// SearchQuery represents a search query log
type SearchQuery struct {
	ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Query       string    `json:"query" gorm:"type:varchar(255);not null;index"`
	UserID      *string   `json:"user_id,omitempty" gorm:"type:uuid;index"`
	ResultCount int       `json:"result_count" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP;index"`
}

// TableName specifies the table name for SearchQuery model
func (SearchQuery) TableName() string {
	return "search_queries"
}

// PopularSearchTerm represents popular search terms
type PopularSearchTerm struct {
	Query       string `json:"query"`
	SearchCount int    `json:"search_count"`
}

// AnalyticsOverview represents overall analytics metrics
type AnalyticsOverview struct {
	TotalAttractions int     `json:"total_attractions"`
	TotalViews       int     `json:"total_views"`
	TotalRatings     int     `json:"total_ratings"`
	AverageRating    float64 `json:"average_rating"`
	ActiveUsers7Days int     `json:"active_users_7days"`
	Trends           struct {
		ViewsChange   float64 `json:"views_change"`
		RatingsChange float64 `json:"ratings_change"`
	} `json:"trends"`
}

// TimeSeriesData represents time series data point
type TimeSeriesData struct {
	Date  string `json:"date"`
	Views int    `json:"views"`
}

// CategoryData represents category distribution data
type CategoryData struct {
	Category   string  `json:"category"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

// CityData represents city statistics
type CityData struct {
	City          string  `json:"city"`
	Attractions   int     `json:"attractions"`
	TotalViews    int     `json:"total_views"`
	AverageRating float64 `json:"average_rating"`
}

// AttractionAnalytics represents attraction analytics data
type AttractionAnalytics struct {
	ID     int     `json:"id"`
	Name   string  `json:"name"`
	City   string  `json:"city"`
	Views  int     `json:"views"`
	Rating float64 `json:"rating"`
	Trend  float64 `json:"trend"`
}
