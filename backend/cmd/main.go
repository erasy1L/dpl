package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"backend/internal/jobs"
	"backend/internal/middleware"
	"backend/internal/repository"
	"backend/internal/routes"
	"backend/pkg/db/postgres"
	"backend/pkg/db/redis"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	if os.Getenv("ENV") != "production" {
		_ = godotenv.Load()
	}

	// Initialize database connection
	if err := postgres.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize Redis connection
	if err := redis.InitRedis(); err != nil {
		log.Println("Warning: Failed to initialize Redis:", err)
		log.Println("Continuing without Redis...")
	} else {
		log.Println("Redis connected successfully")
	}

	// Start background job for stats refresh
	activityRepo := repository.NewActivityRepository(postgres.DB)
	statsJob := jobs.NewStatsRefreshJob(activityRepo, 5*time.Minute)
	go statsJob.Start()
	defer statsJob.Stop()

	// Close connections when done
	defer func() {
		if err := postgres.CloseDB(); err != nil {
			log.Println("Error closing database:", err)
		}
		if err := redis.CloseRedis(); err != nil {
			log.Println("Error closing Redis:", err)
		}
	}()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Tourism Recommendation API",
	})

	// Middleware
	app.Use(recover.New())
	app.Use(middleware.LoggerConfig())
	app.Use(middleware.CORSConfig())

	// Setup routes
	routes.SetupRoutes(app)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", port)
		if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	<-shutdown
	log.Println("Shutting down server...")

	// Gracefully shutdown the server
	if err := app.Shutdown(); err != nil {
		log.Println("Error during server shutdown:", err)
	}

	log.Println("Server stopped successfully")
}
