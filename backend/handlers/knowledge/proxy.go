package knowledge

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"Synapse/structs"
	"Synapse/utils"

	"github.com/daulet/tokenizers"
	"github.com/gin-gonic/gin"
)

var knowledgeHTTPClient = &http.Client{Timeout: 15 * time.Minute}
var tokenizerLoad sync.Mutex

type Citation struct {
	CitationID string `json:"citation_id"`
	DocumentID string `json:"document_id"`
	Filename   string `json:"filename"`
	Page       *int   `json:"page"`
	ChunkIndex int    `json:"chunk_index"`
}

type candidate struct {
	Citation
	Text  string  `json:"text"`
	Score float32 `json:"score"`
}

type EvidencePacket struct {
	Text       string
	Results    []Citation
	TokenCount int
}

type SelectedTokenizer struct {
	tokenizer *tokenizers.Tokenizer
}

func LoadSelectedTokenizer(_ context.Context, modelID, hfToken string) (*SelectedTokenizer, error) {
	modelID = strings.TrimSpace(modelID)
	if modelID == "" || strings.Contains(modelID, "..") || strings.HasPrefix(modelID, "/") {
		return nil, fmt.Errorf("invalid selected model ID")
	}
	if err := os.MkdirAll(utils.Cfg.TokenizerCacheDir, 0o750); err != nil {
		return nil, fmt.Errorf("create tokenizer cache: %w", err)
	}
	options := []tokenizers.TokenizerConfigOption{tokenizers.WithCacheDir(utils.Cfg.TokenizerCacheDir)}
	if hfToken != "" {
		options = append(options, tokenizers.WithAuthToken(hfToken))
	}
	tokenizerLoad.Lock()
	loaded, err := tokenizers.FromPretrained(modelID, options...)
	tokenizerLoad.Unlock()
	if err != nil {
		return nil, fmt.Errorf("load tokenizer for %s: %w", modelID, err)
	}
	return &SelectedTokenizer{tokenizer: loaded}, nil
}

func (t *SelectedTokenizer) Count(text string) (int, error) {
	ids, _, err := t.tokenizer.EncodeErr(text, false)
	if err != nil {
		return 0, err
	}
	return len(ids), nil
}

func (t *SelectedTokenizer) Truncate(text string, limit int, keepEnd bool) (string, error) {
	ids, _, err := t.tokenizer.EncodeErr(text, false)
	if err != nil {
		return "", err
	}
	if len(ids) <= limit {
		return text, nil
	}
	selected := ids[:limit]
	if keepEnd {
		selected = ids[len(ids)-limit:]
	}
	return t.tokenizer.DecodeErr(selected, true)
}

func (t *SelectedTokenizer) Close() error { return t.tokenizer.Close() }

func (t *SelectedTokenizer) PackRecentMessages(messages []structs.LLMMessage, limit int) ([]structs.LLMMessage, error) {
	remaining := limit
	packed := make([]structs.LLMMessage, 0, len(messages))
	for index := len(messages) - 1; index >= 0 && remaining > 0; index-- {
		if messages[index].Role != "user" && messages[index].Role != "assistant" {
			continue // Stored history is data, never an additional instruction channel.
		}
		count, err := t.Count(messages[index].Content)
		if err != nil {
			return nil, err
		}
		message := messages[index]
		if count > remaining {
			message.Content, err = t.Truncate(message.Content, remaining, true)
			if err != nil {
				return nil, err
			}
			count = remaining
		}
		packed = append(packed, message)
		remaining -= count
	}
	for left, right := 0, len(packed)-1; left < right; left, right = left+1, right-1 {
		packed[left], packed[right] = packed[right], packed[left]
	}
	return packed, nil
}

func RetrieveAndPackEvidence(ctx context.Context, userID, knowledgeBaseID, query string, tokenizer *SelectedTokenizer) (EvidencePacket, error) {
	body, _ := json.Marshal(map[string]string{"knowledge_base_id": knowledgeBaseID, "query": query})
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(utils.Cfg.KnowledgeServiceURL, "/")+"/internal/v1/retrieve", bytes.NewReader(body))
	if err != nil {
		return EvidencePacket{}, err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+utils.Cfg.KnowledgeServiceToken)
	request.Header.Set("X-Synapse-User-ID", userID)
	response, err := knowledgeHTTPClient.Do(request)
	if err != nil {
		return EvidencePacket{}, fmt.Errorf("knowledge service is unavailable: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode/100 != 2 {
		message, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		return EvidencePacket{}, fmt.Errorf("knowledge retrieval failed (%d): %s", response.StatusCode, strings.TrimSpace(string(message)))
	}
	var envelope struct {
		Data []candidate `json:"data"`
	}
	if err := json.NewDecoder(response.Body).Decode(&envelope); err != nil {
		return EvidencePacket{}, fmt.Errorf("decode knowledge candidates: %w", err)
	}
	return tokenizer.packEvidence(envelope.Data, 1000)
}

func (t *SelectedTokenizer) packEvidence(candidates []candidate, limit int) (EvidencePacket, error) {
	packet := EvidencePacket{Results: []Citation{}}
	for _, item := range candidates {
		page := ""
		if item.Page != nil {
			page = fmt.Sprintf(" page=%d", *item.Page)
		}
		label := fmt.Sprintf("[source:%s file=%q%s chunk=%d]\n", item.CitationID, item.Filename, page, item.ChunkIndex)
		if packet.Text == "" {
			label = "Evidence:\n" + label
		} else {
			label = "\n\n" + label
		}
		used, err := t.Count(packet.Text)
		if err != nil {
			return EvidencePacket{}, err
		}
		labelTokens, err := t.Count(label)
		if err != nil {
			return EvidencePacket{}, err
		}
		if used+labelTokens >= limit {
			break
		}
		entry, err := t.Truncate(label+item.Text, limit-used, false)
		if err != nil {
			return EvidencePacket{}, err
		}
		packet.Text += entry
		packet.Results = append(packet.Results, item.Citation)
		packet.TokenCount, err = t.Count(packet.Text)
		if err != nil {
			return EvidencePacket{}, err
		}
		if packet.TokenCount >= limit {
			break
		}
	}
	if packet.TokenCount > limit {
		var err error
		packet.Text, err = t.Truncate(packet.Text, limit, false)
		if err != nil {
			return EvidencePacket{}, err
		}
		packet.TokenCount, err = t.Count(packet.Text)
		if err != nil {
			return EvidencePacket{}, err
		}
	}
	return packet, nil
}

func Proxy(c *gin.Context) {
	if strings.TrimSpace(utils.Cfg.KnowledgeServiceToken) == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "knowledge service is not configured"})
		return
	}
	target := strings.TrimRight(utils.Cfg.KnowledgeServiceURL, "/") + "/internal/v1" + strings.TrimPrefix(c.Request.URL.Path, "/api")
	if c.Request.URL.RawQuery != "" {
		target += "?" + c.Request.URL.RawQuery
	}
	request, err := http.NewRequestWithContext(c, c.Request.Method, target, c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not prepare knowledge request"})
		return
	}
	request.Header.Set("Content-Type", c.GetHeader("Content-Type"))
	request.Header.Set("Accept", "application/json")
	request.Header.Set("Authorization", "Bearer "+utils.Cfg.KnowledgeServiceToken)
	request.Header.Set("X-Synapse-User-ID", c.GetString("userID"))
	response, err := knowledgeHTTPClient.Do(request)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "knowledge service is unavailable"})
		return
	}
	defer response.Body.Close()
	c.Header("Content-Type", response.Header.Get("Content-Type"))
	c.Status(response.StatusCode)
	_, _ = io.Copy(c.Writer, response.Body)
}
