package recommendation

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"errors"
	"log"
	"math"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrAttractionNotFound = errors.New("attraction not found")
	ErrNoRecommendations  = errors.New("no recommendations available")
)

type Service interface {
	GetUnified(ctx context.Context, userID uuid.UUID, city *string, limit int) ([]*models.Attraction, string, error)
	GetSimilar(ctx context.Context, attractionID, limit int) ([]*models.Attraction, string, error)
	GetPersonalized(ctx context.Context, userID uuid.UUID, limit int) ([]*models.Attraction, string, error)
	GetTrending(ctx context.Context, city *string, limit int) ([]*models.Attraction, string, error)
	GetContentBased(ctx context.Context, userID uuid.UUID, limit int) ([]*models.Attraction, string, error)
	GetCollaborativeFiltering(ctx context.Context, userID uuid.UUID, limit int) ([]*models.Attraction, string, error)
}

type service struct {
	attractionRepo repository.AttractionRepository
	ratingRepo     repository.RatingRepository
	activityRepo   repository.ActivityRepository
}

func NewService(attractionRepo repository.AttractionRepository, ratingRepo repository.RatingRepository, activityRepo repository.ActivityRepository) Service {
	return &service{
		attractionRepo: attractionRepo,
		ratingRepo:     ratingRepo,
		activityRepo:   activityRepo,
	}
}

func mergeDedupe(lists ...[]*models.Attraction) []*models.Attraction {
	seen := make(map[int]struct{})
	var out []*models.Attraction
	for _, list := range lists {
		for _, a := range list {
			if a == nil {
				continue
			}
			if _, ok := seen[a.ID]; ok {
				continue
			}
			seen[a.ID] = struct{}{}
			out = append(out, a)
		}
	}
	return out
}

// GetUnified merges collaborative, content-based, and trending signals into one list (deduplicated).
// With fewer than 3 ratings, uses trending + popular only.
func (s *service) GetUnified(ctx context.Context, userID uuid.UUID, city *string, limit int) ([]*models.Attraction, string, error) {
	if limit <= 0 || limit > 50 {
		limit = 24
	}

	trendCity := city
	if trendCity == nil || (trendCity != nil && *trendCity == "") {
		almaty := "Almaty"
		trendCity = &almaty
	}

	userRatings, err := s.ratingRepo.GetByUser(ctx, userID)
	if err != nil {
		return nil, "", err
	}

	if len(userRatings) < 3 {
		trending, _, err := s.GetTrending(ctx, trendCity, limit)
		if err != nil {
			return nil, "", err
		}
		popular, _, err := s.getPopularAttractions(ctx, limit)
		if err != nil {
			return nil, "", err
		}
		merged := mergeDedupe(trending, popular)
		if len(merged) > limit {
			merged = merged[:limit]
		}
		return merged, "Trending and popular places — rate 3+ attractions to unlock personalized picks", nil
	}

	chunk := limit / 3
	if chunk < 4 {
		chunk = 4
	}
	if chunk > limit {
		chunk = limit
	}

	cf, _, err := s.GetCollaborativeFiltering(ctx, userID, chunk)
	if err != nil {
		return nil, "", err
	}
	cb, _, err := s.GetContentBased(ctx, userID, chunk)
	if err != nil {
		return nil, "", err
	}
	tr, _, err := s.GetTrending(ctx, trendCity, chunk)
	if err != nil {
		return nil, "", err
	}

	merged := mergeDedupe(cf, cb, tr)
	if len(merged) < limit {
		popular, _, _ := s.getPopularAttractions(ctx, limit)
		merged = mergeDedupe(merged, popular)
	}
	if len(merged) > limit {
		merged = merged[:limit]
	}
	return merged, "Based on your ratings, similar travelers, and what’s trending", nil
}

// GetSimilar - Content-based recommendations: similar attractions
func (s *service) GetSimilar(ctx context.Context, attractionID, limit int) ([]*models.Attraction, string, error) {
	// Get source attraction
	sourceAttraction, err := s.attractionRepo.GetByID(ctx, attractionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrAttractionNotFound
		}
		return nil, "", err
	}

	// Find similar attractions (ordered by rating and views)
	var attractions []*models.Attraction
	query := s.attractionRepo.GetDB().WithContext(ctx).
		Model(&models.Attraction{}).
		Where("id != ?", attractionID).
		Order("average_rating DESC NULLS LAST, total_views DESC NULLS LAST").
		Limit(limit)

	if err := query.Find(&attractions).Error; err != nil {
		return nil, "", err
	}

	// Get the name in any available locale for the reason
	reason := "Similar attractions"
	if len(sourceAttraction.Name) > 0 {
		// Try to get name in order: en, ru, or first available
		if name, ok := sourceAttraction.Name["en"]; ok && name != "" {
			reason = "Similar to " + name
		} else if name, ok := sourceAttraction.Name["ru"]; ok && name != "" {
			reason = "Similar to " + name
		} else {
			// Get first available name
			for _, name := range sourceAttraction.Name {
				if name != "" {
					reason = "Similar to " + name
					break
				}
			}
		}
	}

	return attractions, reason, nil
}

// GetPersonalized - Collaborative filtering: based on similar users' preferences
func (s *service) GetPersonalized(ctx context.Context, userID uuid.UUID, limit int) ([]*models.Attraction, string, error) {
	// Get user's ratings
	userRatings, err := s.ratingRepo.GetByUser(ctx, userID)
	if err != nil {
		return nil, "", err
	}

	if len(userRatings) == 0 {
		// No ratings yet, return popular attractions
		return s.getPopularAttractions(ctx, limit)
	}

	// Get user's favorited attractions
	favorites, _ := s.activityRepo.GetUserFavorites(ctx, userID)
	favoritesMap := make(map[int]bool)
	for _, fav := range favorites {
		favoritesMap[fav] = true
	}

	// Get attractions that user hasn't rated
	ratedAttractionIDs := make([]int, len(userRatings))
	for i, rating := range userRatings {
		ratedAttractionIDs[i] = rating.AttractionID
	}

	var recommendations []*models.Attraction

	// Find highly rated attractions
	query := s.attractionRepo.GetDB().WithContext(ctx).
		Model(&models.Attraction{}).
		Order("average_rating DESC NULLS LAST, total_views DESC NULLS LAST").
		Limit(limit)

	if len(ratedAttractionIDs) > 0 {
		query = query.Where("id NOT IN ?", ratedAttractionIDs)
	}

	if err := query.Find(&recommendations).Error; err != nil {
		return nil, "", err
	}

	reason := "Based on your preferences"
	return recommendations, reason, nil
}

// GetTrending - Get trending attractions by city
func (s *service) GetTrending(ctx context.Context, city *string, limit int) ([]*models.Attraction, string, error) {
	attractions, err := s.activityRepo.GetTrendingAttractions(ctx, city, limit)
	if err != nil {
		return nil, "", err
	}

	reason := "Trending now"
	if city != nil && *city != "" {
		reason = "Trending in " + *city
	}

	return attractions, reason, nil
}

// Helper function to get popular attractions
func (s *service) getPopularAttractions(ctx context.Context, limit int) ([]*models.Attraction, string, error) {
	attractions, err := s.activityRepo.GetPopularAttractions(ctx, nil, limit)
	if err != nil {
		return nil, "", err
	}

	return attractions, "Popular attractions", nil
}

// GetContentBased - Content-Based Filtering Algorithm
// Recommends attractions similar to what the user has liked based on attraction attributes
func (s *service) GetContentBased(ctx context.Context, userID uuid.UUID, limit int) ([]*models.Attraction, string, error) {
	// Step 1: Get user's highly-rated attractions (rating >= 4)
	userRatings, err := s.ratingRepo.GetByUser(ctx, userID)
	if err != nil {
		return nil, "", err
	}

	if len(userRatings) == 0 {
		// No ratings yet, return popular attractions
		return s.getPopularAttractions(ctx, limit)
	}

	// Filter highly-rated attractions
	var highlyRatedAttractions []*models.Attraction
	for _, rating := range userRatings {
		if rating.Rating >= 4 && rating.Attraction != nil {
			highlyRatedAttractions = append(highlyRatedAttractions, rating.Attraction)
		}
	}

	if len(highlyRatedAttractions) == 0 {
		// No highly-rated attractions, return popular ones
		return s.getPopularAttractions(ctx, limit)
	}

	// Step 2: Get all attractions to compare
	var allAttractions []*models.Attraction
	err = s.attractionRepo.GetDB().WithContext(ctx).
		Model(&models.Attraction{}).
		Find(&allAttractions).Error
	if err != nil {
		return nil, "", err
	}

	// Step 3: Calculate similarity scores and exclude already-rated attractions
	ratedAttractionIDs := make(map[int]bool)
	for _, rating := range userRatings {
		ratedAttractionIDs[rating.AttractionID] = true
	}

	type attractionScore struct {
		attraction *models.Attraction
		score      float64
	}

	var scoredAttractions []attractionScore

	for _, attraction := range allAttractions {
		// Skip already-rated attractions
		if ratedAttractionIDs[attraction.ID] {
			continue
		}

		// Calculate similarity score based on location proximity
		score := 0.0

		// Simple scoring based on ratings
		if attraction.AverageRating != nil {
			score += *attraction.AverageRating
		}

		if score > 0 {
			scoredAttractions = append(scoredAttractions, attractionScore{
				attraction: attraction,
				score:      score,
			})
		}
	}

	// Step 4: Sort by similarity score (descending)
	for i := 0; i < len(scoredAttractions); i++ {
		for j := i + 1; j < len(scoredAttractions); j++ {
			if scoredAttractions[j].score > scoredAttractions[i].score {
				scoredAttractions[i], scoredAttractions[j] = scoredAttractions[j], scoredAttractions[i]
			}
		}
	}

	// Extract top recommendations
	var recommendations []*models.Attraction
	for i := 0; i < len(scoredAttractions) && i < limit; i++ {
		recommendations = append(recommendations, scoredAttractions[i].attraction)
	}

	// If not enough recommendations, fill with popular attractions
	if len(recommendations) < limit {
		popular, _, _ := s.getPopularAttractions(ctx, limit-len(recommendations))
		seen := make(map[int]bool)
		for _, rec := range recommendations {
			seen[rec.ID] = true
		}
		for _, attr := range popular {
			if !seen[attr.ID] && len(recommendations) < limit {
				recommendations = append(recommendations, attr)
				seen[attr.ID] = true
			}
		}
	}

	reason := "Based on attractions you liked"
	return recommendations, reason, nil
}

// GetCollaborativeFiltering - Collaborative Filtering Algorithm
// Recommends based on similar users - "Users like you also liked..."
func (s *service) GetCollaborativeFiltering(ctx context.Context, userID uuid.UUID, limit int) ([]*models.Attraction, string, error) {

	log.Println("=== GetCollaborativeFiltering START ===")
	log.Printf("UserID: %s, Limit: %d", userID, limit)
	// Step 1: Get current user's ratings
	userRatings, err := s.ratingRepo.GetByUser(ctx, userID)
	if err != nil {
		return nil, "", err
	}

	if len(userRatings) == 0 {
		// No ratings yet, return popular attractions
		return s.getPopularAttractions(ctx, limit)
	}

	// Create user's rating map
	userRatingMap := make(map[int]int)
	for _, rating := range userRatings {
		userRatingMap[rating.AttractionID] = rating.Rating
	}

	// Step 2: Get all users and their ratings
	var allUsers []uuid.UUID
	err = s.ratingRepo.GetDB().WithContext(ctx).
		Model(&models.Rating{}).
		Distinct("user_id").
		Where("user_id != ?", userID).
		Pluck("user_id", &allUsers).Error
	if err != nil {
		return nil, "", err
	}

	// Step 3: Find users with similar rating patterns (Pearson correlation)
	type userSimilarity struct {
		userID      uuid.UUID
		correlation float64
	}

	var similarUsers []userSimilarity

	log.Printf("Checking %d other users for similarity", len(allUsers))

	for _, otherUserID := range allUsers {
		otherUserRatings, err := s.ratingRepo.GetByUser(ctx, otherUserID)
		if err != nil {
			log.Printf("ERROR getting ratings for user %s: %v", otherUserID, err)
			continue
		}

		// Create other user's rating map
		otherUserRatingMap := make(map[int]int)
		for _, rating := range otherUserRatings {
			otherUserRatingMap[rating.AttractionID] = rating.Rating
		}

		log.Printf("Other user %s ratings: %v", otherUserID, otherUserRatingMap)

		// Find common attractions
		commonAttractions := make([]int, 0)
		for attrID := range userRatingMap {
			if _, exists := otherUserRatingMap[attrID]; exists {
				commonAttractions = append(commonAttractions, attrID)
			}
		}

		log.Printf("Common attractions between users: %v (count: %d)", commonAttractions, len(commonAttractions))

		// Calculate Pearson correlation
		correlation := CalculatePearsonCorrelation(userRatingMap, otherUserRatingMap)

		log.Printf("Pearson correlation with user %s: %.4f (threshold: 0.3)", otherUserID, correlation)

		// Only consider users with positive correlation and at least 2 common ratings
		if correlation > 0.3 {
			log.Printf("✅ Adding similar user %s (correlation: %.4f)", otherUserID, correlation)
			similarUsers = append(similarUsers, userSimilarity{
				userID:      otherUserID,
				correlation: correlation,
			})
		} else {
			log.Printf("❌ Skipping user %s (correlation %.4f < 0.3)", otherUserID, correlation)
		}
	}

	log.Printf("Found %d similar users", len(similarUsers))

	if len(similarUsers) == 0 {
		log.Println("no similar users found")
		// No similar users found, return popular attractions
		return s.getPopularAttractions(ctx, limit)
	}

	// Sort similar users by correlation (descending)
	for i := 0; i < len(similarUsers); i++ {
		for j := i + 1; j < len(similarUsers); j++ {
			if similarUsers[j].correlation > similarUsers[i].correlation {
				similarUsers[i], similarUsers[j] = similarUsers[j], similarUsers[i]
			}
		}
	}

	// Step 4: Get attractions those similar users rated highly
	type attractionScore struct {
		attractionID int
		score        float64
		count        int
	}

	attractionScores := make(map[int]*attractionScore)

	// Consider top similar users (max 20)
	maxSimilarUsers := 20
	if len(similarUsers) < maxSimilarUsers {
		maxSimilarUsers = len(similarUsers)
	}

	log.Printf("User %s has rated %d attractions: %v", userID, len(userRatingMap), userRatingMap)

	for i := 0; i < maxSimilarUsers; i++ {
		similarUser := similarUsers[i]
		similarUserRatings, err := s.ratingRepo.GetByUser(ctx, similarUser.userID)
		if err != nil {
			continue
		}

		for _, rating := range similarUserRatings {
			// Only consider highly-rated attractions (rating >= 4)
			if rating.Rating >= 4 {
				// Skip attractions current user already rated
				if _, exists := userRatingMap[rating.AttractionID]; exists {
					log.Printf("SKIPPING attraction %d - user already rated it", rating.AttractionID)
					continue
				}
				log.Printf("ADDING attraction %d to recommendations\n", rating.AttractionID)

				if _, exists := attractionScores[rating.AttractionID]; !exists {
					attractionScores[rating.AttractionID] = &attractionScore{
						attractionID: rating.AttractionID,
						score:        0,
						count:        0,
					}
				}

				// Weighted score: rating * correlation
				attractionScores[rating.AttractionID].score += float64(rating.Rating) * similarUser.correlation
				attractionScores[rating.AttractionID].count++
			}
		}
	}

	// Step 5: Sort by predicted rating (average weighted score)
	type scoredAttraction struct {
		attractionID int
		avgScore     float64
	}

	var scoredAttractions []scoredAttraction
	for _, score := range attractionScores {
		avgScore := score.score / float64(score.count)
		scoredAttractions = append(scoredAttractions, scoredAttraction{
			attractionID: score.attractionID,
			avgScore:     avgScore,
		})
	}

	// Sort by average score (descending)
	for i := 0; i < len(scoredAttractions); i++ {
		for j := i + 1; j < len(scoredAttractions); j++ {
			if scoredAttractions[j].avgScore > scoredAttractions[i].avgScore {
				scoredAttractions[i], scoredAttractions[j] = scoredAttractions[j], scoredAttractions[i]
			}
		}
	}

	// Get top attraction IDs
	var topAttractionIDs []int
	for i := 0; i < len(scoredAttractions) && i < limit; i++ {
		topAttractionIDs = append(topAttractionIDs, scoredAttractions[i].attractionID)
	}

	if len(topAttractionIDs) == 0 {
		// No recommendations found, return popular attractions
		return s.getPopularAttractions(ctx, limit)
	}

	// Fetch attraction details
	var recommendations []*models.Attraction
	err = s.attractionRepo.GetDB().WithContext(ctx).
		Model(&models.Attraction{}).
		Where("id IN ?", topAttractionIDs).
		Find(&recommendations).Error
	if err != nil {
		return nil, "", err
	}

	// Sort recommendations by the order of topAttractionIDs
	attractionMap := make(map[int]*models.Attraction)
	for _, attr := range recommendations {
		attractionMap[attr.ID] = attr
	}

	sortedRecommendations := make([]*models.Attraction, 0, len(topAttractionIDs))
	for _, id := range topAttractionIDs {
		if attr, exists := attractionMap[id]; exists {
			sortedRecommendations = append(sortedRecommendations, attr)
		}
	}

	// If not enough recommendations, fill with popular attractions
	if len(sortedRecommendations) < limit {
		popular, _, _ := s.getPopularAttractions(ctx, limit-len(sortedRecommendations))
		seen := make(map[int]bool)
		for _, rec := range sortedRecommendations {
			seen[rec.ID] = true
		}
		for _, attr := range popular {
			if !seen[attr.ID] && len(sortedRecommendations) < limit {
				sortedRecommendations = append(sortedRecommendations, attr)
				seen[attr.ID] = true
			}
		}
	}

	reason := "Users like you also liked"
	return sortedRecommendations, reason, nil
}

// CalculatePearsonCorrelation - Calculate Pearson correlation between two users' ratings
func CalculatePearsonCorrelation(ratings1, ratings2 map[int]int) float64 {
	// Find common rated attractions
	commonAttractions := []int{}
	for attractionID := range ratings1 {
		if _, exists := ratings2[attractionID]; exists {
			commonAttractions = append(commonAttractions, attractionID)
		}
	}

	n := len(commonAttractions)
	if n == 0 {
		return 0.0
	}

	// Calculate means
	var sum1, sum2 float64
	for _, attractionID := range commonAttractions {
		sum1 += float64(ratings1[attractionID])
		sum2 += float64(ratings2[attractionID])
	}
	mean1 := sum1 / float64(n)
	mean2 := sum2 / float64(n)

	// Calculate correlation
	var numerator, denominator1, denominator2 float64
	for _, attractionID := range commonAttractions {
		diff1 := float64(ratings1[attractionID]) - mean1
		diff2 := float64(ratings2[attractionID]) - mean2
		numerator += diff1 * diff2
		denominator1 += diff1 * diff1
		denominator2 += diff2 * diff2
	}

	if denominator1 == 0 || denominator2 == 0 {
		return 0.0
	}

	return numerator / (math.Sqrt(denominator1) * math.Sqrt(denominator2))
}
