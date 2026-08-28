package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"Synapse/structs"
	"Synapse/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const temporaryConversationTTL = 30 * time.Minute

type conversationDraft struct {
	Title    string `json:"title"`
	LLMModel string `json:"llm_model"`
}

func temporaryConversationKey(userID, conversationID string) string {
	return "conversation:draft:" + userID + ":" + conversationID
}

func LoadChunks(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		conversationID := c.Param("conversation_id")
		userID := c.GetString("userID")

		manager := NewConversationManager(conversationID, userID)
		if err := manager.LoadOrCreate(c, db); err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}

		messages := []map[string]any{}
		for _, m := range manager.Messages {
			messages = append(messages, map[string]any{
				"id":         m.ID,
				"role":       m.Role,
				"message":    m.Message,
				"created_at": m.CreatedAt,
				"metadata":   m.Metadata,
			})
		}

		c.JSON(http.StatusOK, gin.H{"messages": messages})
	}
}

func ListConversations(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("userID")

		rows, err := db.Query(
			`SELECT id, COALESCE(title, 'Untitled Conversation'), COALESCE(llm_model, ''), created_at, updated_at FROM conversations
             WHERE user_id = $1::uuid ORDER BY updated_at DESC`,
			userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		conversations := []gin.H{}
		for rows.Next() {
			var id, title, llmModel string
			var createdAt time.Time
			var updatedAt *time.Time
			if err := rows.Scan(&id, &title, &llmModel, &createdAt, &updatedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "scan failed"})
				return
			}
			conversations = append(conversations, gin.H{
				"id":        id,
				"title":     title,
				"llm_model": llmModel,
			})
		}

		c.JSON(http.StatusOK, gin.H{"conversations": conversations})
	}
}

func CreateConversation() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req structs.CreateConversationRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and llm_model are required"})
			return
		}
		req.Title = strings.TrimSpace(req.Title)
		req.LLMModel = strings.TrimSpace(req.LLMModel)
		if req.Title == "" || req.LLMModel == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title and llm_model are required"})
			return
		}

		conversationID := uuid.New().String()
		draft, err := json.Marshal(conversationDraft{Title: req.Title, LLMModel: req.LLMModel})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create conversation"})
			return
		}
		key := temporaryConversationKey(c.GetString("userID"), conversationID)
		if err := utils.RDB.SetEx(c, key, draft, temporaryConversationTTL).Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create conversation"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"id": conversationID, "title": req.Title, "llm_model": req.LLMModel,
		})
	}
}

func UpdateConversation(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		conversationID := c.Param("conversation_id")
		userID := c.GetString("userID")

		var req structs.UpdateConversationRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		result, err := db.Exec(
			`UPDATE conversations SET title = $1, updated_at = NOW()
             WHERE id = $2 AND user_id = $3::uuid`,
			req.Title, conversationID, userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "not found or unauthorized"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "updated"})
	}
}

func DeleteConversation(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		conversationID := c.Param("conversation_id")
		userID := c.GetString("userID")

		result, err := db.Exec(
			`DELETE FROM conversations WHERE id = $1 AND user_id = $2::uuid`,
			conversationID, userID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		rows, _ := result.RowsAffected()
		if rows == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "not found or unauthorized"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "deleted"})
	}
}
