#!/usr/bin/env python3
"""
AI Code & Image Generator using OpenAI
Generates code, images, and creates branches automatically
"""

import os
import json
import argparse
from pathlib import Path
from datetime import datetime
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_code(prompt: str) -> str:
    """Generate code using GPT-4"""
    print(f"🔨 Generating code for: {prompt}")
    
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are an expert code generator. Generate clean, well-documented, production-ready code. Include comments and type hints. Return ONLY the code."
            },
            {
                "role": "user",
                "content": f"Generate code for: {prompt}"
            }
        ],
        temperature=0.7,
        max_tokens=2000
    )
    
    return response.choices[0].message.content

def generate_image(prompt: str, filename: str = None) -> str:
    """Generate image using DALL-E 3"""
    print(f"🖼️  Generating image for: {prompt}")
    
    if filename is None:
        filename = f"generated_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        n=1
    )
    
    image_url = response.data[0].url
    
    import requests
    img_response = requests.get(image_url)
    
    assets_dir = Path("assets/generated")
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    filepath = assets_dir / filename
    with open(filepath, "wb") as f:
        f.write(img_response.content)
    
    print(f"✅ Image saved: {filepath}")
    return str(filepath)

def create_branch_name(prompt: str) -> str:
    """Generate a branch name from prompt"""
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "Generate a short git branch name (lowercase, hyphens, max 40 chars). Return ONLY the name."
            },
            {
                "role": "user",
                "content": prompt[:100]
            }
        ],
        max_tokens=20
    )
    
    branch_name = response.choices[0].message.content.strip().lower()
    branch_name = "".join(c if c.isalnum() or c == "-" else "-" for c in branch_name)
    branch_name = branch_name.strip("-")[:40]
    
    return f"ai-{branch_name}-{datetime.now().strftime('%s')}"

def save_branch_name(branch_name: str):
    """Save branch name for GitHub Actions"""
    with open("/tmp/branch_name.txt", "w") as f:
        f.write(branch_name)

def detect_language(prompt: str) -> str:
    """Detect programming language from prompt"""
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "Detect programming language. Return ONLY file extension (py,js,ts,tsx,java,go,rb,php,cpp)."
            },
            {
                "role": "user",
                "content": prompt[:100]
            }
        ],
        max_tokens=10
    )
    
    ext = response.choices[0].message.content.strip().lower()
    return ext if ext in ["py","js","ts","tsx","java","go","rb","php","cpp"] else "ts"

def main():
    parser = argparse.ArgumentParser(description="AI Code & Image Generator")
    parser.add_argument("--prompt", required=True, help="Describe what to generate")
    parser.add_argument("--branch", help="Custom branch name")
    parser.add_argument("--generate-images", action="store_true", help="Generate images")
    
    args = parser.parse_args()
    
    print(f"\n🚀 AI Generator Started")
    print(f"📝 Prompt: {args.prompt}\n")
    
    # Generate branch name
    branch_name = args.branch or create_branch_name(args.prompt)
    save_branch_name(branch_name)
    print(f"📌 Branch: {branch_name}")
    
    # Generate code
    code = generate_code(args.prompt)
    
    # Detect language and save code
    ext = detect_language(args.prompt)
    code_dir = Path("src/generated")
    code_dir.mkdir(parents=True, exist_ok=True)
    
    code_file = code_dir / f"generated_{branch_name.split('-')[1]}.{ext}"
    with open(code_file, "w") as f:
        f.write(code)
    print(f"✅ Code saved: {code_file}")
    
    # Generate images if requested
    if args.generate_images:
        image_prompt = f"Visual representation: {args.prompt}"
        generate_image(image_prompt, f"generated_{branch_name}.png")
    
    # Create metadata file
    metadata = {
        "prompt": args.prompt,
        "branch": branch_name,
        "generated_at": datetime.now().isoformat(),
        "files": [str(code_file)],
        "model": "gpt-4",
        "image_generated": args.generate_images
    }
    
    meta_file = Path(".ai_metadata.json")
    with open(meta_file, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\n✅ Generation complete!\n")

if __name__ == "__main__":
    main()
