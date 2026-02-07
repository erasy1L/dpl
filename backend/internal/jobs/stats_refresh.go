package jobs

import (
	"backend/internal/repository"
	"context"
	"log"
	"time"
)

// StatsRefreshJob periodically refreshes attraction statistics
type StatsRefreshJob struct {
	activityRepo repository.ActivityRepository
	interval     time.Duration
	stopChan     chan struct{}
}

// NewStatsRefreshJob creates a new stats refresh job
func NewStatsRefreshJob(activityRepo repository.ActivityRepository, interval time.Duration) *StatsRefreshJob {
	return &StatsRefreshJob{
		activityRepo: activityRepo,
		interval:     interval,
		stopChan:     make(chan struct{}),
	}
}

// Start begins the periodic stats refresh job
func (j *StatsRefreshJob) Start() {
	ticker := time.NewTicker(j.interval)
	defer ticker.Stop()

	log.Printf("Stats refresh job started (interval: %v)", j.interval)

	// Run immediately on start
	j.refresh()

	for {
		select {
		case <-ticker.C:
			j.refresh()
		case <-j.stopChan:
			log.Println("Stats refresh job stopped")
			return
		}
	}
}

// Stop stops the stats refresh job
func (j *StatsRefreshJob) Stop() {
	close(j.stopChan)
}

// refresh performs the actual refresh operations
func (j *StatsRefreshJob) refresh() {
	ctx := context.Background()

	// Refresh materialized view
	if err := j.activityRepo.RefreshStats(ctx); err != nil {
		log.Printf("Failed to refresh attraction stats: %v", err)
	} else {
		log.Println("Attraction stats refreshed successfully")
	}

	// Update trending scores
	if err := j.activityRepo.UpdateTrendingScores(ctx); err != nil {
		log.Printf("Failed to update trending scores: %v", err)
	} else {
		log.Println("Trending scores updated successfully")
	}
}
