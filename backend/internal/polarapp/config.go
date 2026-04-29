package polarapp

import "os"

// Config is loaded from the environment. ProductID is a catalog product
// in Polar (preferably a “custom” / pay-what-you-need price) for tour totals.
type Config struct {
	AccessToken string
	ProductID   string
	// Webhook secret from Polar (whsec_...); used to verify standard-webhooks signature.
	WebhookSecret string
	Sandbox       bool
}

// ConfigFromEnv returns Polar settings. If AccessToken or ProductID is missing, IsConfigured is false.
func ConfigFromEnv() Config {
	return Config{
		AccessToken:   os.Getenv("POLAR_ACCESS_TOKEN"),
		ProductID:     os.Getenv("POLAR_PRODUCT_ID"),
		WebhookSecret: os.Getenv("POLAR_WEBHOOK_SECRET"),
		Sandbox:       os.Getenv("POLAR_SANDBOX") != "false" && os.Getenv("POLAR_SANDBOX") != "0",
	}
}

func (c Config) IsConfigured() bool {
	return c.AccessToken != "" && c.ProductID != ""
}

func (c Config) IsWebhookConfigured() bool {
	return c.WebhookSecret != ""
}
