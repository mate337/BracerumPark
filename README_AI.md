# 🤖 AI Code & Image Generator

Automatically generate code and images using GPT-4 and DALL-E 3.

## Quick Start

### 1️⃣ Set Up API Key

**Via GitHub UI:**
- Go to **Settings → Secrets and variables → Actions**
- Create secret `OPENAI_API_KEY` with your OpenAI key
- Get key from: https://platform.openai.com/api-keys

**Via CLI:**
```bash
gh secret set OPENAI_API_KEY --body "your-api-key-here"
```

### 2️⃣ Run Generator

**Option A: GitHub Actions UI**
1. Go to **Actions → AI Code & Image Generator**
2. Click **Run workflow**
3. Enter prompt and options
4. Watch the magic happen ✨

**Option B: Command Line**
```bash
chmod +x scripts/ai_cli.sh
./scripts/ai_cli.sh "Create a React button component" image
```

**Option C: GitHub API**
```bash
gh workflow run ai-code-generator.yml \
  -f prompt="Your prompt here" \
  -f generate_images=true
```

## 📝 Example Prompts

```
✅ "Create a TypeScript utility for date manipulation"
✅ "Generate a Python FastAPI endpoint with authentication"
✅ "Build a React component for user profile"
✅ "Make a JavaScript password validator"
✅ "Create SQL migration for user table"
```

## 📁 Output Structure

```
project/
├── src/generated/          # Generated code files
├── assets/generated/       # Generated images
├── .ai_metadata.json       # Generation metadata
└── branches/               # Automatic branches created
```

## 🔄 How It Works

1. **Prompt Input** → You describe what to generate
2. **AI Processing** → GPT-4 generates code, DALL-E creates images
3. **Branch Creation** → Auto-generated branch with timestamp
4. **Pull Request** → PR created automatically for review
5. **Review & Merge** → Review changes and merge to main

## 💰 Costs

- **GPT-4**: ~$0.03-0.06 per request
- **DALL-E 3**: ~$0.08 per image
- **GitHub Actions**: Free for public repos

## ⚙️ Configuration

### Environment Variables
```bash
OPENAI_API_KEY      # Required: Your OpenAI API key
OPENAI_MODEL        # Optional: Default "gpt-4"
IMAGE_MODEL         # Optional: Default "dall-e-3"
```

### Customization

Edit `scripts/ai_generator.py` to:
- Change AI model
- Add code formatting
- Modify language detection
- Customize output paths

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| ❌ "API key not found" | Check Secrets: Settings → Secrets → Actions |
| ❌ "Rate limit exceeded" | Wait 60 seconds, try again |
| ❌ "Branch already exists" | Timestamp auto-prevents duplicates |
| ❌ "Invalid prompt" | Keep under 200 characters |

## 🔐 Security

✅ API key stored in GitHub Secrets (encrypted)
✅ Generated code reviewed before merge
✅ No data sent to external services except OpenAI
✅ Automatic cleanup of temp files

## 📚 Advanced

### Custom Branch Name
```bash
gh workflow run ai-code-generator.yml \
  -f prompt="Your prompt" \
  -f branch_name="my-custom-branch"
```

### Generate Only Images
```bash
gh workflow run ai-code-generator.yml \
  -f prompt="A beautiful sunset landscape" \
  -f generate_images=true
```

### Local Testing
```bash
export OPENAI_API_KEY="your-key"
python scripts/ai_generator.py \
  --prompt "Your prompt" \
  --generate-images
```

## 📖 Documentation

- [OpenAI API Docs](https://platform.openai.com/docs)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [AI_SETUP.md](./AI_SETUP.md) - Setup guide

---

**Created with ❤️ by AI Bot**
