package polarapp

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/google/uuid"
	polargo "github.com/polarsource/polar-go"
	"github.com/polarsource/polar-go/models/components"
)

// Client wraps the official Polar Go SDK (import path: polargo).
type Client struct {
	sdk       *polargo.Polar
	productID string
}

// NewClient returns a Polar API client, or nil if not configured.
func NewClient(cfg Config) *Client {
	if !cfg.IsConfigured() {
		return nil
	}
	opts := []polargo.SDKOption{polargo.WithSecurity(cfg.AccessToken)}
	if cfg.Sandbox {
		opts = append(opts, polargo.WithServer("sandbox"))
	}
	return &Client{
		sdk:       polargo.New(opts...),
		productID: cfg.ProductID,
	}
}

// Presentment maps tour ISO currency to Polar presentment. SDK supports a limited set.
func Presentment(tourCurrency string) (components.PresentmentCurrency, error) {
	c := strings.ToLower(strings.TrimSpace(tourCurrency))
	switch c {
	case "usd", "":
		return components.PresentmentCurrencyUsd, nil
	case "eur":
		return components.PresentmentCurrencyEur, nil
	case "gbp":
		return components.PresentmentCurrencyGbp, nil
	case "kzt":
		// No dedicated const in polar-go, but the API type is string; Polar supports KZT (ISO) for many regions.
		return components.PresentmentCurrency("kzt"), nil
	default:
		return "", fmt.Errorf("tour currency %q is not mapped for Polar; supported in app: kzt, usd, eur, gbp", tourCurrency)
	}
}

// MinorAmount returns the checkout amount in minor units (cents) for 2-decimal currencies.
func MinorAmount(major float64) int64 {
	return int64(math.Round(major*100 + 1e-9))
}

// CreateCheckoutSession builds a one-product checkout and returns the session (URL, id, etc.).
func (c *Client) CreateCheckoutSession(
	ctx context.Context,
	majorAmount float64,
	currency components.PresentmentCurrency,
	bookingID uuid.UUID,
	successURL, returnURL, customerEmail string,
) (*components.Checkout, error) {
	if c == nil {
		return nil, fmt.Errorf("polar: client is nil")
	}
	amount := MinorAmount(majorAmount)
	meta := map[string]components.CheckoutCreateMetadata{
		"booking_id": components.CreateCheckoutCreateMetadataStr(bookingID.String()),
	}
	allowDisc := false
	requireBill := false
	req := components.CheckoutCreate{
		Products:              []string{c.productID},
		Amount:                &amount,
		Currency:              currency.ToPointer(),
		Metadata:              meta,
		SuccessURL:            &successURL,
		ReturnURL:             &returnURL,
		CustomerEmail:         &customerEmail,
		AllowDiscountCodes:    &allowDisc,
		RequireBillingAddress: &requireBill,
	}
	res, err := c.sdk.Checkouts.Create(ctx, req)
	if err != nil {
		return nil, err
	}
	if res == nil || res.Checkout == nil {
		return nil, fmt.Errorf("polar: empty checkout response")
	}
	return res.Checkout, nil
}

// GetCheckout fetches a checkout session by id.
func (c *Client) GetCheckout(ctx context.Context, checkoutID string) (*components.Checkout, error) {
	if c == nil {
		return nil, fmt.Errorf("polar: client is nil")
	}
	res, err := c.sdk.Checkouts.Get(ctx, checkoutID)
	if err != nil {
		return nil, err
	}
	if res == nil || res.Checkout == nil {
		return nil, fmt.Errorf("polar: empty get checkout")
	}
	return res.Checkout, nil
}
