package paypal

import "os"

// Config holds PayPal REST API credentials. Optional: if ClientID is empty, checkout is disabled.
type Config struct {
	ClientID     string
	ClientSecret string
	// BaseURL is https://api-m.sandbox.paypal.com or https://api-m.paypal.com
	BaseURL string
}

// ConfigFromEnv returns config when PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set.
// PAYPAL_SANDBOX=true (default) uses the sandbox API.
func ConfigFromEnv() Config {
	sandbox := os.Getenv("PAYPAL_SANDBOX") != "false" && os.Getenv("PAYPAL_SANDBOX") != "0"
	base := "https://api-m.paypal.com"
	if sandbox {
		base = "https://api-m.sandbox.paypal.com"
	}
	return Config{
		ClientID:     os.Getenv("PAYPAL_CLIENT_ID"),
		ClientSecret: os.Getenv("PAYPAL_CLIENT_SECRET"),
		BaseURL:      base,
	}
}

func (c Config) IsConfigured() bool {
	return c.ClientID != "" && c.ClientSecret != "" && c.BaseURL != ""
}
