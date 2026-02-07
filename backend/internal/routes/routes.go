package routes

import (
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/services/activity"
	"backend/internal/services/analytics"
	"backend/internal/services/attraction"
	"backend/internal/services/auth"
	"backend/internal/services/category"
	"backend/internal/services/rating"
	"backend/internal/services/recommendation"
	"backend/internal/services/user"
	"backend/pkg/db/postgres"
	"backend/pkg/db/redis"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// Initialize repositories
	userRepo := repository.NewUserRepository(postgres.DB)
	categoryRepo := repository.NewCategoryRepository(postgres.DB)
	attractionRepo := repository.NewAttractionRepository(postgres.DB)
	ratingRepo := repository.NewRatingRepository(postgres.DB)
	activityRepo := repository.NewActivityRepository(postgres.DB)
	prefsRepo := repository.NewUserPreferencesRepository(postgres.DB)
	analyticsRepo := repository.NewAnalyticsRepository(postgres.DB)
	txMgr := repository.NewTransactionManager(postgres.DB)

	// Initialize services
	authService := auth.NewAuthService(userRepo)
	userService := user.NewUserService(userRepo, txMgr)
	categoryService := category.NewCategoryService(categoryRepo, txMgr)
	attractionService := attraction.NewAttractionService(attractionRepo, txMgr)
	ratingService := rating.NewService(ratingRepo, attractionRepo)
	activityService := activity.NewService(activityRepo, prefsRepo, attractionRepo)
	recommendationService := recommendation.NewService(attractionRepo, ratingRepo, activityRepo)
	analyticsService := analytics.NewService(analyticsRepo, redis.Client)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	attractionHandler := handlers.NewAttractionHandler(attractionService)
	ratingHandler := handlers.NewRatingHandler(ratingService)
	activityHandler := handlers.NewActivityHandler(activityService)
	recommendationHandler := handlers.NewRecommendationHandler(recommendationService)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)

	// API v1 routes
	api := app.Group("/api/v1")

	// Auth routes
	authGroup := api.Group("/auth")
	authGroup.Post("/sign-in", authHandler.SignIn)
	authGroup.Post("/sign-out", authHandler.SignOut)
	authGroup.Post("/sign-up", authHandler.SignUp)

	// Auth middleware
	authMiddleware := middleware.AuthMiddleware()

	// User routes (protected)
	usersGroup := api.Group("/users")
	usersGroup.Get("/me", authMiddleware, userHandler.GetMyProfile)
	usersGroup.Get("/me/preferences", authMiddleware, activityHandler.GetPreferences)
	usersGroup.Put("/me/preferences", authMiddleware, activityHandler.UpdatePreferences)
	usersGroup.Get("/me/favorites", authMiddleware, activityHandler.GetMyFavorites)
	usersGroup.Post("/me/favorites", authMiddleware, activityHandler.AddFavorite)
	usersGroup.Delete("/me/favorites/:attraction_id", authMiddleware, activityHandler.RemoveFavorite)
	usersGroup.Get("/me/activity", authMiddleware, activityHandler.GetMyActivity)

	// Category routes
	api.Get("/category", categoryHandler.ListCategories)

	// Attraction routes
	attractionsGroup := api.Group("/attractions")
	attractionsGroup.Get("", attractionHandler.ListAttractions)
	attractionsGroup.Get("/:id", attractionHandler.GetAttraction)
	attractionsGroup.Get("/:id/ratings", ratingHandler.GetAttractionRatings)
	attractionsGroup.Post("/:id/view", activityHandler.TrackView)
	attractionsGroup.Post("/:id/share", activityHandler.TrackShare)
	attractionsGroup.Get("/popular", activityHandler.GetPopular)
	attractionsGroup.Get("/trending", activityHandler.GetTrending)

	// Rating routes (protected)
	ratingsGroup := api.Group("/ratings")
	ratingsGroup.Post("", authMiddleware, ratingHandler.CreateOrUpdateRating)
	ratingsGroup.Get("/my", authMiddleware, ratingHandler.GetMyRatings)
	ratingsGroup.Put("/:id", authMiddleware, ratingHandler.UpdateRating)
	ratingsGroup.Delete("/:id", authMiddleware, ratingHandler.DeleteRating)

	// Check if attraction is favorited (can also be accessed via /users/me/favorites)
	api.Get("/favorites/:attraction_id/check", authMiddleware, activityHandler.IsFavorite)

	// Recommendations
	recommendationsGroup := api.Group("/recommendations")
	recommendationsGroup.Get("/similar/:id", recommendationHandler.GetSimilar)
	recommendationsGroup.Get("/trending", recommendationHandler.GetTrending)
	recommendationsGroup.Get("/personalized", authMiddleware, recommendationHandler.GetPersonalized)
	recommendationsGroup.Get("/content-based", authMiddleware, recommendationHandler.GetContentBased)
	recommendationsGroup.Get("/collaborative", authMiddleware, recommendationHandler.GetCollaborative)

	// Analytics (public endpoints)
	analyticsGroup := api.Group("/analytics")
	analyticsGroup.Get("/overview", analyticsHandler.GetOverview)
	analyticsGroup.Get("/views-over-time", analyticsHandler.GetViewsOverTime)
	analyticsGroup.Get("/categories", analyticsHandler.GetCategories)
	analyticsGroup.Get("/cities", analyticsHandler.GetCities)
	analyticsGroup.Get("/top-attractions", analyticsHandler.GetTopAttractions)
	analyticsGroup.Get("/rating-distribution", analyticsHandler.GetRatingDistribution)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
		})
	})

	// Suppress unused variable warnings
	_ = userService
}
