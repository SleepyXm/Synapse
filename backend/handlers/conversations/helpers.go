package handlers

import (
	"bytes"
	"compress/zlib"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"

	"Synapse/structs"
	"Synapse/utils"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// Compression helpers
func compressMessages(messages []structs.StoredMessage) ([]byte, error) {
	data, err := json.Marshal(messages)
	if err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	w := zlib.NewWriter(&buf)
	w.Write(data)
	w.Close()
	return buf.Bytes(), nil
}

func decompressMessages(data []byte) ([]structs.StoredMessage, error) {
	if len(data) == 0 {
		return []structs.StoredMessage{}, nil
	}
	r, err := zlib.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer r.Close()

	raw, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}

	var messages []structs.StoredMessage
	if err := json.Unmarshal(raw, &messages); err != nil {
		return nil, err
	}
	return messages, nil
}

// ConversationManager
type ConversationManager struct {
	ConversationID string
	UserID         string
	Messages       []structs.StoredMessage
	loaded         bool
	pending        bool
	title          string
	modelID        string
}

func NewConversationManager(conversationID, userID string) *ConversationManager {
	return &ConversationManager{
		ConversationID: conversationID,
		UserID:         userID,
	}
}

func (cm *ConversationManager) Load(db *sql.DB) error {
	if cm.loaded {
		return nil
	}

	var compressedData []byte
	var ownerID string
	err := db.QueryRow(
		"SELECT compressed_messages, user_id FROM conversations WHERE id = $1::uuid",
		cm.ConversationID,
	).Scan(&compressedData, &ownerID)

	if errors.Is(err, sql.ErrNoRows) {
		return fmt.Errorf("conversation not found: %w", sql.ErrNoRows)
	}
	if err != nil {
		return err
	}
	if ownerID != cm.UserID {
		return fmt.Errorf("forbidden")
	}

	messages, err := decompressMessages(compressedData)
	if err != nil {
		return err
	}

	cm.Messages = messages
	cm.loaded = true
	return nil
}

// LoadOrCreate loads a persisted conversation or, when it does not yet exist,
// accepts only a draft reserved for this user in Redis.
func (cm *ConversationManager) LoadOrCreate(ctx context.Context, db *sql.DB) error {
	if err := cm.Load(db); err == nil {
		return nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	encoded, err := utils.RDB.Get(ctx, temporaryConversationKey(cm.UserID, cm.ConversationID)).Bytes()
	if errors.Is(err, redis.Nil) {
		return fmt.Errorf("conversation not found: %w", sql.ErrNoRows)
	}
	if err != nil {
		return err
	}

	var draft conversationDraft
	if err := json.Unmarshal(encoded, &draft); err != nil {
		return fmt.Errorf("invalid conversation draft: %w", err)
	}
	cm.Messages = []structs.StoredMessage{}
	cm.loaded = true
	cm.pending = true
	cm.title = draft.Title
	cm.modelID = draft.LLMModel
	return nil
}

func (cm *ConversationManager) Append(newMessages []map[string]any) {
	for _, m := range newMessages {
		role, _ := m["role"].(string)
		cm.Messages = append(cm.Messages, structs.StoredMessage{
			ID:        uuid.New().String(),
			Message:   m,
			Role:      role,
			CreatedAt: structs.FlexTime{},
			Metadata:  map[string]any{},
		})
	}
}

func (cm *ConversationManager) Persist(ctx context.Context, db *sql.DB) error {
	compressed, err := compressMessages(cm.Messages)
	if err != nil {
		return err
	}
	if cm.pending {
		if len(cm.Messages) == 0 {
			return errors.New("cannot persist a temporary conversation without messages")
		}
		_, err = db.ExecContext(ctx,
			`INSERT INTO conversations
             (id, user_id, llm_model, title, compressed_messages, created_at, updated_at)
             VALUES ($1::uuid, $2::uuid, $3, $4, $5, NOW(), NOW())`,
			cm.ConversationID, cm.UserID, cm.modelID, cm.title, compressed,
		)
		if err != nil {
			return err
		}
		cm.pending = false
		_ = utils.RDB.Del(ctx, temporaryConversationKey(cm.UserID, cm.ConversationID)).Err()
		return nil
	}

	result, err := db.ExecContext(ctx,
		`UPDATE conversations SET compressed_messages = $1, updated_at = NOW()
         WHERE id = $2::uuid AND user_id = $3::uuid`,
		compressed, cm.ConversationID, cm.UserID,
	)
	if err != nil {
		return err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (cm *ConversationManager) GetMemorySnapshot(recentN int, systemPrompt string) []structs.LLMMessage {
	messages := cm.Messages
	if len(messages) > recentN {
		messages = messages[len(messages)-recentN:]
	}

	snapshot := make([]structs.LLMMessage, 0, len(messages)+1)
	if strings.TrimSpace(systemPrompt) != "" {
		snapshot = append(snapshot, structs.LLMMessage{
			Role: "system", Content: systemPrompt,
		})
	}
	for _, m := range messages {
		content, _ := m.Message["content"].(string)
		snapshot = append(snapshot, structs.LLMMessage{
			Role:    m.Role,
			Content: content,
		})
	}
	return snapshot
}
