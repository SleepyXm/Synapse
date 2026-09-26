package knowledge

import (
	"context"
	"os"
	"strings"
	"testing"

	"Synapse/utils"
)

func TestRealSelectedTokenizerCapsEvidence(t *testing.T) {
	modelID := os.Getenv("HF_TOKENIZER_TEST_MODEL")
	if modelID == "" {
		t.Skip("set HF_TOKENIZER_TEST_MODEL to run the real Hugging Face tokenizer test")
	}
	utils.Cfg.TokenizerCacheDir = t.TempDir()
	tokenizer, err := LoadSelectedTokenizer(context.Background(), modelID, os.Getenv("HF_TOKEN"))
	if err != nil {
		t.Fatal(err)
	}
	defer tokenizer.Close()
	candidates := []candidate{{Citation: Citation{CitationID: "one", DocumentID: "doc", Filename: "evidence.txt"}, Text: strings.Repeat("grounded evidence ", 2000)}}
	packet, err := tokenizer.packEvidence(candidates, 1000)
	if err != nil {
		t.Fatal(err)
	}
	count, err := tokenizer.Count(packet.Text)
	if err != nil {
		t.Fatal(err)
	}
	if count > 1000 || len(packet.Results) != 1 {
		t.Fatalf("evidence used %d tokens with %d citations", count, len(packet.Results))
	}
}
