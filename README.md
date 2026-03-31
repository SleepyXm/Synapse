# Synapse

An LLM platform for interacting with Hugging Face models. Requires a Hugging Face API token (BYOK).

## Requirements

- Node.js 18+
- A Hugging Face account with an API token

## Installation

```bash
git clone https://github.com/your-org/hubchat.git
cd hubchat
npm install
```

## Configuration

```bash
cp .env.example .env
```

```env
PORT=3000
```

User-supplied Hugging Face API tokens are saved to a users profile. accessed only when interacting with the model.

## Running

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Usage

1. Enter your Hugging Face API token when prompted
2. Search for a model available on hugging face
3. Start a chat session

## Supported Models

Any model available via the [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index) with chat or text generation support.

## Project Structure

```
hubchat/
├── src/
│   ├── api/      # Hugging Face API client
│   ├── chat/     # Chat logic
│   └── ui/       # Frontend
├── public/
└── .env.example
```

## Roadmap

- [x] Chat
- [ ] More features coming

## License

MIT
