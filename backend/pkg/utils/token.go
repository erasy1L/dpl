package utils

import (
	"crypto/rand"
	"encoding/hex"
)

// GenerateSecureToken creates a random hex token.
func GenerateSecureToken(byteLen int) (string, error) {
	b := make([]byte, byteLen)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

