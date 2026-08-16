package utils

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestAuthCookiePolicy(t *testing.T) {
	Cfg.AccessTokenExpireMinutes, Cfg.RefreshTokenExpireDays = 15, 7
	for _, tc := range []struct {
		name, proto string
		secure      bool
	}{
		{"local http", "", false},
		{"forwarded https", "https", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			ctx, _ := gin.CreateTestContext(recorder)
			ctx.Request = httptest.NewRequest(http.MethodGet, "http://localhost", nil)
			ctx.Request.Header.Set("X-Forwarded-Proto", tc.proto)
			SetAuthCookies(ctx, "access", "refresh")
			for _, cookie := range recorder.Header().Values("Set-Cookie") {
				if strings.Contains(cookie, "; Secure") != tc.secure {
					t.Fatalf("unexpected cookie policy: %s", cookie)
				}
			}
		})
	}
}
