package paypal

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client is a minimal PayPal REST v2 client (OAuth + checkout orders).
type Client struct {
	cfg    Config
	httpc  *http.Client
	tok    string
	tokExp time.Time
}

func NewClient(cfg Config) *Client {
	if !cfg.IsConfigured() {
		return nil
	}
	return &Client{
		cfg: cfg,
		httpc: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) accessToken(ctx context.Context) (string, error) {
	if c == nil {
		return "", fmt.Errorf("paypal: client not configured")
	}
	if c.tok != "" && time.Now().Add(30*time.Second).Before(c.tokExp) {
		return c.tok, nil
	}

	u := c.cfg.BaseURL + "/v1/oauth2/token"
	body := "grant_type=client_credentials"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, strings.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(c.cfg.ClientID, c.cfg.ClientSecret)

	res, err := c.httpc.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return "", fmt.Errorf("paypal oauth: %s: %s", res.Status, string(b))
	}
	var out struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.Unmarshal(b, &out); err != nil {
		return "", err
	}
	c.tok = out.AccessToken
	if out.ExpiresIn > 0 {
		c.tokExp = time.Now().Add(time.Duration(out.ExpiresIn) * time.Second)
	} else {
		c.tokExp = time.Now().Add(8 * time.Hour)
	}
	return c.tok, nil
}

// CreateOrderInput is used to build a CAPTURE order.
type CreateOrderInput struct {
	Amount       string // e.g. "123.45"
	CurrencyCode string // ISO 4217, e.g. KZT, USD
	ReferenceID  string // custom id (e.g. booking uuid)
	ReturnURL    string
	CancelURL    string
}

// CreateOrderResponse contains ids and the payer approval link.
type CreateOrderResponse struct {
	OrderID     string
	ApprovalURL string
	Raw         json.RawMessage
}

// CreateOrder creates an order with intent CAPTURE and returns the approval URL.
func (c *Client) CreateOrder(ctx context.Context, in CreateOrderInput) (*CreateOrderResponse, error) {
	tok, err := c.accessToken(ctx)
	if err != nil {
		return nil, err
	}
	payload := map[string]interface{}{
		"intent": "CAPTURE",
		"purchase_units": []map[string]interface{}{
			{
				"amount": map[string]string{
					"currency_code": in.CurrencyCode,
					"value":         in.Amount,
				},
				"custom_id": in.ReferenceID,
			},
		},
		"application_context": map[string]string{
			"return_url": in.ReturnURL,
			"cancel_url": in.CancelURL,
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	u := c.cfg.BaseURL + "/v2/checkout/orders"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+tok)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	res, err := c.httpc.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("paypal create order: %s: %s", res.Status, string(b))
	}
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(b, &raw); err != nil {
		return nil, err
	}
	var out struct {
		ID    string          `json:"id"`
		Links []orderLink     `json:"links"`
	}
	if err := json.Unmarshal(b, &out); err != nil {
		return nil, err
	}
	approval := ""
	for _, l := range out.Links {
		if strings.ToLower(l.Rel) == "approve" {
			approval = l.Href
			break
		}
	}
	if approval == "" {
		return nil, fmt.Errorf("paypal: no approve link in create order response")
	}
	return &CreateOrderResponse{
		OrderID:     out.ID,
		ApprovalURL: approval,
		Raw:         b,
	}, nil
}

type orderLink struct {
	Href   string `json:"href"`
	Rel    string `json:"rel"`
	Method string `json:"method"`
}

// CaptureResult is returned after capture.
type CaptureResult struct {
	OrderID     string
	CaptureID   string
	Status      string
	Currency    string
	GrossValue  string
	Raw         json.RawMessage
}

// CaptureOrder captures a previously approved order.
func (c *Client) CaptureOrder(ctx context.Context, orderID string) (*CaptureResult, error) {
	tok, err := c.accessToken(ctx)
	if err != nil {
		return nil, err
	}
	escaped := url.PathEscape(orderID)
	u := c.cfg.BaseURL + "/v2/checkout/orders/" + escaped + "/capture"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, bytes.NewReader([]byte(`{}`)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+tok)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	res, err := c.httpc.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, fmt.Errorf("paypal capture: %s: %s", res.Status, string(b))
	}

	var out struct {
		ID     string         `json:"id"`
		Status string         `json:"status"`
		PUS    []purchaseUnit `json:"purchase_units"`
	}
	if err := json.Unmarshal(b, &out); err != nil {
		return nil, err
	}
	captureID, cur, val := "", "", ""
	if len(out.PUS) > 0 {
		if len(out.PUS[0].Payments.Captures) > 0 {
			cap0 := out.PUS[0].Payments.Captures[0]
			captureID = cap0.ID
			if cap0.Amount.CurrencyCode != "" {
				cur = cap0.Amount.CurrencyCode
			}
			if cap0.Amount.Value != "" {
				val = cap0.Amount.Value
			}
		}
	}
	return &CaptureResult{
		OrderID:    out.ID,
		CaptureID:  captureID,
		Status:     out.Status,
		Currency:   cur,
		GrossValue: val,
		Raw:        b,
	}, nil
}

type purchaseUnit struct {
	Payments struct {
		Captures []struct {
			ID     string `json:"id"`
			Amount struct {
				CurrencyCode string `json:"currency_code"`
				Value        string `json:"value"`
			} `json:"amount"`
		} `json:"captures"`
	} `json:"payments"`
}
