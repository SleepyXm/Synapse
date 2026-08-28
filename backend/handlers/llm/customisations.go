package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const DefaultSystemPrompt = "You are an assistant aware of the recent conversation context with the user."

var ErrCustomisationNotFound = errors.New("customisation not found")

type customisation struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	SystemPrompt string `json:"system_prompt"`
	Builtin      bool   `json:"builtin"`
}

type customisationRequest struct {
	Name         string `json:"name"`
	SystemPrompt string `json:"system_prompt"`
}

func ListCustomisations(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		items := []customisation{{
			ID:           "default",
			Name:         "Default",
			SystemPrompt: DefaultSystemPrompt,
			Builtin:      true,
		}}

		rows, err := db.QueryContext(c,
			`SELECT id, name, system_prompt
			 FROM llm_customisations
			 WHERE user_id = $1::uuid
			 ORDER BY updated_at DESC`,
			c.GetString("userID"),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load customisations"})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var item customisation
			if err := rows.Scan(&item.ID, &item.Name, &item.SystemPrompt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load customisations"})
				return
			}
			items = append(items, item)
		}
		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load customisations"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"customisations": items})
	}
}

func CreateCustomisation(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request customisationRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name and system_prompt are required"})
			return
		}
		request.Name = strings.TrimSpace(request.Name)
		request.SystemPrompt = strings.TrimSpace(request.SystemPrompt)
		if request.Name == "" || request.SystemPrompt == "" || utf8.RuneCountInString(request.Name) > 100 || utf8.RuneCountInString(request.SystemPrompt) > 8000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name must be 1-100 characters and system_prompt must be 1-8000 characters"})
			return
		}

		item := customisation{Name: request.Name, SystemPrompt: request.SystemPrompt}
		err := db.QueryRowContext(c,
			`INSERT INTO llm_customisations (user_id, name, system_prompt)
			 VALUES ($1::uuid, $2, $3)
			 RETURNING id`,
			c.GetString("userID"), item.Name, item.SystemPrompt,
		).Scan(&item.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save customisation"})
			return
		}

		c.JSON(http.StatusCreated, item)
	}
}

func UpdateCustomisation(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, err := uuid.Parse(c.Param("id")); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "customisation not found"})
			return
		}
		var request customisationRequest
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name and system_prompt are required"})
			return
		}
		request.Name = strings.TrimSpace(request.Name)
		request.SystemPrompt = strings.TrimSpace(request.SystemPrompt)
		if request.Name == "" || request.SystemPrompt == "" || utf8.RuneCountInString(request.Name) > 100 || utf8.RuneCountInString(request.SystemPrompt) > 8000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name must be 1-100 characters and system_prompt must be 1-8000 characters"})
			return
		}

		result, err := db.ExecContext(c,
			`UPDATE llm_customisations
			 SET name = $1, system_prompt = $2, updated_at = NOW()
			 WHERE id = $3::uuid AND user_id = $4::uuid`,
			request.Name, request.SystemPrompt, c.Param("id"), c.GetString("userID"),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update customisation"})
			return
		}
		if updated, _ := result.RowsAffected(); updated == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "customisation not found"})
			return
		}

		c.JSON(http.StatusOK, customisation{
			ID: c.Param("id"), Name: request.Name, SystemPrompt: request.SystemPrompt,
		})
	}
}

func DeleteCustomisation(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, err := uuid.Parse(c.Param("id")); err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "customisation not found"})
			return
		}
		result, err := db.ExecContext(c,
			"DELETE FROM llm_customisations WHERE id = $1::uuid AND user_id = $2::uuid",
			c.Param("id"), c.GetString("userID"),
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not delete customisation"})
			return
		}
		if deleted, _ := result.RowsAffected(); deleted == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "customisation not found"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

func ResolveSystemPrompt(db *sql.DB, userID, customisationID string) (string, error) {
	if customisationID == "" || customisationID == "default" {
		return DefaultSystemPrompt, nil
	}
	if _, err := uuid.Parse(customisationID); err != nil {
		return "", ErrCustomisationNotFound
	}

	var prompt string
	err := db.QueryRow(
		"SELECT system_prompt FROM llm_customisations WHERE id = $1::uuid AND user_id = $2::uuid",
		customisationID, userID,
	).Scan(&prompt)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrCustomisationNotFound
	}
	return prompt, err
}
