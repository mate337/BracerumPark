#!/bin/bash

# AI Generator CLI - Manual trigger
# Usage: ./scripts/ai_cli.sh "Your prompt here" [image]

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 \"prompt\" [image]"
    echo "Example: $0 \"Create a React login form\" image"
    exit 1
fi

PROMPT="$1"
GEN_IMAGES="false"

if [ "$2" == "image" ]; then
    GEN_IMAGES="true"
fi

echo "🚀 Triggering AI Generator..."
echo "Prompt: $PROMPT"
echo "Generate Images: $GEN_IMAGES"

gh workflow run ai-code-generator.yml \
    -f prompt="$PROMPT" \
    -f generate_images="$GEN_IMAGES"

echo "✅ Workflow triggered! Check Actions tab."
