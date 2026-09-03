# 🤖 AI Integration Setup Guide

## ⚡ Configuration Required

### 1. Add OpenAI API Key to Secrets

1. Go to: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (get from https://platform.openai.com/api-keys)
5. Click **Add secret**

### 2. Usage

Go to: **Actions → AI Code & Image Generator** and click **Run workflow**

Fill in:
- **Prompt**: Describe what you want to generate (required)
- **Branch name**: Custom branch name (optional - auto-generated if empty)
- **Generate images**: Check to create images with DALL-E

### 3. Example Prompts

```
"Create a React component for a user login form with validation"
"Generate a Python FastAPI endpoint for data processing"
"Make a TypeScript utility for date formatting"
```

## Features

✅ Generates code using GPT-4
✅ Creates images using DALL-E 3
✅ Automatically creates branches
✅ Creates pull requests for review
✅ Detects programming language
✅ Saves metadata

## 📁 File Structure

```
src/generated/          - Generated code files
assets/generated/       - Generated images
.ai_generation_metadata.json - Metadata from last generation
```

## 💰 Cost Estimate

- **GPT-4 API**: ~$0.03-0.06 per request
- **DALL-E 3**: ~$0.08 per image
- **Branch/PR Creation**: Free

## ⚠️ Security Notes

- Keep your OpenAI API key secret
- Review generated code before merging
- Generated content should be reviewed for quality/safety
