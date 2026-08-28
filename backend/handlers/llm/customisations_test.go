package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

func TestResolveSystemPromptUsesDefaultWithoutQuery(t *testing.T) {
	prompt, err := ResolveSystemPrompt(nil, "user-id", "default")
	if err != nil {
		t.Fatal(err)
	}
	if prompt != DefaultSystemPrompt {
		t.Fatalf("expected default prompt, got %q", prompt)
	}
}

func TestResolveSystemPromptRequiresOwnership(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	customisationID := "a7a850e8-6688-4c4b-ad7b-d544c7399278"
	userID := "4875ac3e-a58c-4f2e-b552-4a716bac090d"
	mock.ExpectQuery("SELECT system_prompt FROM llm_customisations").
		WithArgs(customisationID, userID).
		WillReturnRows(sqlmock.NewRows([]string{"system_prompt"}).AddRow("Be concise."))

	prompt, err := ResolveSystemPrompt(db, userID, customisationID)
	if err != nil {
		t.Fatal(err)
	}
	if prompt != "Be concise." {
		t.Fatalf("expected saved prompt, got %q", prompt)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestListCustomisationsAlwaysIncludesDefault(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	mock.ExpectQuery("SELECT id, name, system_prompt").
		WithArgs("4875ac3e-a58c-4f2e-b552-4a716bac090d").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "system_prompt"}))

	response := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(response)
	context.Set("userID", "4875ac3e-a58c-4f2e-b552-4a716bac090d")
	context.Request = httptest.NewRequest(http.MethodGet, "/api/llm/customisations", nil)

	ListCustomisations(db)(context)
	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	if body := response.Body.String(); !strings.Contains(body, `"id":"default"`) {
		t.Fatalf("expected default customisation, got %s", body)
	}
}
