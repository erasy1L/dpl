package polarapp

import (
	"context"
	"fmt"

	polargo "github.com/polarsource/polar-go"
	"github.com/polarsource/polar-go/models/components"
	"github.com/polarsource/polar-go/models/operations"
)

// GetOrderByCheckoutID returns the first order linked to a checkout (after payment, order should exist).
func (c *Client) GetOrderByCheckoutID(ctx context.Context, checkoutID string) (*components.Order, error) {
	if c == nil {
		return nil, fmt.Errorf("polar: client is nil")
	}
	f := operations.CreateCheckoutIDFilterStr(checkoutID)
	req := operations.OrdersListRequest{
		CheckoutID: &f,
		Limit:      polargo.Int64(1),
		Page:       polargo.Int64(1),
	}
	res, err := c.sdk.Orders.List(ctx, req)
	if err != nil {
		return nil, err
	}
	if res == nil || res.GetListResourceOrder() == nil {
		return nil, nil
	}
	items := res.GetListResourceOrder().GetItems()
	if len(items) == 0 {
		return nil, nil
	}
	return &items[0], nil
}
