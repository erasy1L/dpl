package redis

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var (
	Client *redis.Client
	ctx    = context.Background()
)

// InitRedis initializes the Redis client
func InitRedis() error {
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	redisPassword := os.Getenv("REDIS_PASSWORD")
	redisDB := 0 // Default DB

	Client = redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", redisHost, redisPort),
		Password:     redisPassword,
		DB:           redisDB,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
		MinIdleConns: 5,
	})

	// Test connection
	_, err := Client.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return nil
}

// CloseRedis closes the Redis connection
func CloseRedis() error {
	if Client != nil {
		return Client.Close()
	}
	return nil
}

// Set stores a key-value pair with expiration
func Set(key string, value interface{}, expiration time.Duration) error {
	return Client.Set(ctx, key, value, expiration).Err()
}

// Get retrieves a value by key
func Get(key string) (string, error) {
	return Client.Get(ctx, key).Result()
}

// Delete removes a key
func Delete(key string) error {
	return Client.Del(ctx, key).Err()
}

// Exists checks if a key exists
func Exists(key string) (bool, error) {
	result, err := Client.Exists(ctx, key).Result()
	return result > 0, err
}

// SetNX sets a key only if it doesn't exist (useful for locks)
func SetNX(key string, value interface{}, expiration time.Duration) (bool, error) {
	return Client.SetNX(ctx, key, value, expiration).Result()
}

// Increment increments a counter
func Increment(key string) (int64, error) {
	return Client.Incr(ctx, key).Result()
}

// IncrementBy increments a counter by a specific value
func IncrementBy(key string, value int64) (int64, error) {
	return Client.IncrBy(ctx, key, value).Result()
}

// Expire sets an expiration on a key
func Expire(key string, expiration time.Duration) error {
	return Client.Expire(ctx, key, expiration).Err()
}

// GetTTL gets the remaining time to live of a key
func GetTTL(key string) (time.Duration, error) {
	return Client.TTL(ctx, key).Result()
}

// HSet sets a field in a hash
func HSet(key string, field string, value interface{}) error {
	return Client.HSet(ctx, key, field, value).Err()
}

// HGet gets a field from a hash
func HGet(key string, field string) (string, error) {
	return Client.HGet(ctx, key, field).Result()
}

// HGetAll gets all fields from a hash
func HGetAll(key string) (map[string]string, error) {
	return Client.HGetAll(ctx, key).Result()
}

// HDel deletes fields from a hash
func HDel(key string, fields ...string) error {
	return Client.HDel(ctx, key, fields...).Err()
}

// ZAdd adds a member to a sorted set
func ZAdd(key string, score float64, member interface{}) error {
	return Client.ZAdd(ctx, key, redis.Z{Score: score, Member: member}).Err()
}

// ZRange gets members from a sorted set by range
func ZRange(key string, start, stop int64) ([]string, error) {
	return Client.ZRange(ctx, key, start, stop).Result()
}

// ZRevRange gets members from a sorted set in reverse order
func ZRevRange(key string, start, stop int64) ([]string, error) {
	return Client.ZRevRange(ctx, key, start, stop).Result()
}

// ZScore gets the score of a member in a sorted set
func ZScore(key string, member string) (float64, error) {
	return Client.ZScore(ctx, key, member).Result()
}
