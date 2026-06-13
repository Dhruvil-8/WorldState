package database

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// YahooFinanceResponse represents the JSON structure from Yahoo Finance charts.
type YahooFinanceResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				RegularMarketPrice float64 `json:"regularMarketPrice"`
				PreviousClose      float64 `json:"previousClose"`
				Symbol             string  `json:"symbol"`
			} `json:"meta"`
		} `json:"result"`
		Error any `json:"error"`
	} `json:"chart"`
}

// AssetTickerMap maps Entity Names to Yahoo Finance tickers.
var AssetTickerMap = map[string]string{
	"Crude Oil":                 "BZ=F",
	"Natural Gas":               "NG=F",
	"Copper":                    "HG=F",
	"Spot Gold":                 "GC=F",
	"S&P 500 Index":             "^GSPC",
	"US Dollar Index":           "DX-Y.NYB",
	"US 10-Year Treasury Yield": "^TNX",
	"EUR / USD":                 "EURUSD=X",
	"PHLX Semiconductor Index":  "^SOX",
	"Rare Earths":               "REMX",
	"Lithium":                   "LIT",
	"Bitcoin":                   "BTC-USD",
	"Ethereum":                  "ETH-USD",
	"Nifty 50 Index":            "^NSEI",
	"DAX Index":                 "^GDAXI",
	"Nikkei 225 Index":          "^N225",
	"Hang Seng Index":           "^HSI",
	"FTSE 100 Index":            "^FTSE",
	"Ibovespa Index":            "^BVSP",
}

// StartAssetPriceUpdater initiates the background ticker to pull live Yahoo Finance data or simulate based on world state risk indexes.
func StartAssetPriceUpdater(ctx context.Context, db *PostgresDB) {
	log.Println("[assets-updater] starting background pricing engine loop...")
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	// Initial fetch on boot
	updateAssetsOnce(ctx, db)

	for {
		select {
		case <-ctx.Done():
			log.Println("[assets-updater] stopping background pricing engine...")
			return
		case <-ticker.C:
			updateAssetsOnce(ctx, db)
		}
	}
}

func updateAssetsOnce(ctx context.Context, db *PostgresDB) {
	// 1. Get the latest world state to correlate fallback/simulated logic
	ws, wsErr := db.GetLatestWorldState(ctx)
	stabilityIndex := 74
	if wsErr == nil {
		stabilityIndex = ws.GlobalStability
	}

	client := &http.Client{Timeout: 8 * time.Second}

	for assetName, ticker := range AssetTickerMap {
		var price, change, changePercent float64
		var marketStatus string
		var fetched bool

		// Attempt to fetch from Yahoo Finance Chart API
		url := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=2d", ticker)
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err == nil {
			req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
			resp, err := client.Do(req)
			if err == nil && resp.StatusCode == http.StatusOK {
				body, err := io.ReadAll(resp.Body)
				resp.Body.Close()
				if err == nil {
					var yfRes YahooFinanceResponse
					if err := json.Unmarshal(body, &yfRes); err == nil && len(yfRes.Chart.Result) > 0 {
						meta := yfRes.Chart.Result[0].Meta
						price = meta.RegularMarketPrice
						prevClose := meta.PreviousClose
						if prevClose > 0 {
							change = price - prevClose
							changePercent = (change / prevClose) * 100
							fetched = true
						}
					}
				}
			}
		}

		// Fallback to simulated pricing if offline or rate-limited
		if !fetched {
			price, change, changePercent = simulateAssetPrice(assetName, stabilityIndex)
		}

		// Determine market status threshold based on deviation
		marketStatus = "stable"
		absPercent := changePercent
		if absPercent < 0 {
			absPercent = -absPercent
		}
		if absPercent > 2.0 {
			marketStatus = "critical"
		} else if absPercent > 1.2 {
			marketStatus = "stressed"
		} else if absPercent > 0.5 {
			marketStatus = "elevated"
		}

		// Serialize to metadata payload matching the Next.js expectations
		metadataPayload := map[string]any{
			"ticker":         ticker,
			"price":          formatPrice(assetName, price),
			"change":         formatChange(assetName, change),
			"change_percent": mathRound(changePercent, 2),
			"status":         marketStatus,
		}

		metaJSON, err := json.Marshal(metadataPayload)
		if err != nil {
			continue
		}

		// Update database metadata field and insert historical price point
		query := `
			WITH updated AS (
				UPDATE entities 
				SET metadata = COALESCE(metadata, '{}'::jsonb) || $1, updated_at = NOW()
				WHERE LOWER(name) = LOWER($2) OR LOWER(canonical_name) = LOWER($2)
				RETURNING id
			)
			INSERT INTO asset_price_history (entity_id, price, change, change_percent)
			SELECT id, $3, $4, $5 FROM updated
		`
		_, err = db.Pool.Exec(ctx, query, metaJSON, assetName, price, change, changePercent)
		if err != nil {
			log.Printf("[assets-updater] failed to update database for %s: %v", assetName, err)
		}
	}
}

func simulateAssetPrice(name string, stabilityIndex int) (price float64, change float64, changePercent float64) {
	// Baseline values
	basePrice := 100.0
	riskSensitivity := 0.0 // negative value means price drops when stability drops (e.g. stocks)

	switch name {
	case "Crude Oil":
		basePrice = 80.0
		riskSensitivity = -0.15 // price rises when stability falls
	case "Spot Gold":
		basePrice = 2300.0
		riskSensitivity = -0.10 // price rises when stability falls
	case "S&P 500 Index":
		basePrice = 5300.0
		riskSensitivity = 0.20 // price drops when stability falls
	case "US Dollar Index":
		basePrice = 104.0
		riskSensitivity = -0.05 // USD rises when stability falls
	case "US 10-Year Treasury Yield":
		basePrice = 4.40
		riskSensitivity = 0.02
	case "Copper":
		basePrice = 9800.0
		riskSensitivity = 0.12
	case "EUR / USD":
		basePrice = 1.08
		riskSensitivity = 0.05
	case "PHLX Semiconductor Index":
		basePrice = 5000.0
		riskSensitivity = 0.25
	case "Natural Gas":
		basePrice = 2.50
		riskSensitivity = -0.08
	case "Rare Earths":
		basePrice = 85.0
		riskSensitivity = -0.10
	case "Lithium":
		basePrice = 75.0
		riskSensitivity = 0.05
	case "Bitcoin":
		basePrice = 67000.0
		riskSensitivity = 0.40
	case "Ethereum":
		basePrice = 3500.0
		riskSensitivity = 0.45
	case "Nifty 50 Index":
		basePrice = 22500.0
		riskSensitivity = 0.18
	case "DAX Index":
		basePrice = 18000.0
		riskSensitivity = 0.15
	case "Nikkei 225 Index":
		basePrice = 38000.0
		riskSensitivity = 0.12
	case "Hang Seng Index":
		basePrice = 18000.0
		riskSensitivity = 0.22
	case "FTSE 100 Index":
		basePrice = 8200.0
		riskSensitivity = 0.10
	case "Ibovespa Index":
		basePrice = 125000.0
		riskSensitivity = 0.25
	}

	// Stability difference from baseline 75
	diff := float64(stabilityIndex - 75)
	
	// Simulated price based on stability vector
	simPrice := basePrice + (diff * riskSensitivity * (basePrice * 0.01))
	
	// Add tiny deterministic day fluctuation based on current time
	now := time.Now().UTC()
	minuteFactor := float64(now.Minute()) / 60.0
	jitter := (minuteFactor - 0.5) * (basePrice * 0.005)
	
	price = simPrice + jitter
	prevPrice := simPrice - (jitter * 0.5)
	change = price - prevPrice
	changePercent = (change / prevPrice) * 100
	return
}

func formatPrice(name string, val float64) string {
	if strings.Contains(name, "Yield") {
		return fmt.Sprintf("%.3f%%", val)
	}
	if name == "EUR / USD" {
		return fmt.Sprintf("%.4f", val)
	}
	if val > 1000 {
		str := fmt.Sprintf("%.2f", val)
		parts := strings.Split(str, ".")
		intPart := parts[0]
		var result []string
		for len(intPart) > 3 {
			result = append([]string{intPart[len(intPart)-3:]}, result...)
			intPart = intPart[:len(intPart)-3]
		}
		if len(intPart) > 0 {
			result = append([]string{intPart}, result...)
		}
		formattedInt := strings.Join(result, ",")
		
		if strings.Contains(name, "Index") || name == "S&P 500 Index" || name == "PHLX Semiconductor Index" {
			return fmt.Sprintf("%s.%s", formattedInt, parts[1])
		}
		return fmt.Sprintf("$%s.%s", formattedInt, parts[1])
	}
	if strings.Contains(name, "Index") || name == "S&P 500 Index" || name == "PHLX Semiconductor Index" {
		return fmt.Sprintf("%.2f", val)
	}
	return fmt.Sprintf("$%.2f", val)
}

func formatChange(name string, val float64) string {
	sign := ""
	if val >= 0 {
		sign = "+"
	}
	if strings.Contains(name, "Yield") {
		return fmt.Sprintf("%s%.3f", sign, val)
	}
	if name == "EUR / USD" {
		return fmt.Sprintf("%s%.4f", sign, val)
	}
	if strings.Contains(name, "Index") {
		return fmt.Sprintf("%s%.2f", sign, val)
	}
	if val < 0 {
		return fmt.Sprintf("-$%.2f", -val)
	}
	return fmt.Sprintf("+$%.2f", val)
}

func mathRound(val float64, precision int) float64 {
	p := 1.0
	for i := 0; i < precision; i++ {
		p *= 10
	}
	valInt := int(val*p + 0.5)
	if val < 0 {
		valInt = int(val*p - 0.5)
	}
	return float64(valInt) / p
}
