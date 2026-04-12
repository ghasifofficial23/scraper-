"""
Tool: modal_pipeline.py
Layer: 2 - Navigation (Cloud Orchestrator)

Wraps the B.L.A.S.T pipeline in a serverless Modal container.
Downloads existing data from GitHub, runs the scrapers, aggregates the data,
and pushes the updated payload directly back to GitHub to trigger a Vercel rebuild.
"""

import os
import json
import shutil
import sys
import modal

app = modal.App("blast-pipeline")

image = (
    modal.Image.debian_slim()
    .pip_install("requests", "beautifulsoup4", "feedparser", "PyGithub")
)

# Mount the entire scraper project root into the Modal container as read-only.
# We mount everything from the directory above this file.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app_mount = modal.Mount.from_local_dir(
    project_root,
    remote_path="/root/app"
)

@app.function(
    image=image,
    mounts=[app_mount],
    schedule=modal.Cron("0 12 * * *"), # Runs daily at 12:00 UTC
    secrets=[modal.Secret.from_name("github-secret")]
)
def run_daily_scraper():
    print("🚀 Starting Modal Serverless Pipeline...")
    
    # 1. Create a writable workspace from the read-only Mount
    # Modal ephemeral containers have writable /tmp. 
    workspace = "/tmp/workspace"
    if os.path.exists(workspace):
        shutil.rmtree(workspace)
    shutil.copytree("/root/app", workspace)
    
    # 2. Change working directory so relative paths work accurately
    os.chdir(os.path.join(workspace, "tools"))
    sys.path.insert(0, os.path.join(workspace, "tools"))
    
    # 3. Pull latest articles.json from GitHub to preserve existing read/bookmark states
    from github import Github
    gh_token = os.environ.get("GITHUB_PAT")
    if not gh_token:
        raise ValueError("Missing GITHUB_PAT secret! Ensure it is attached to the modal app.")
        
    g = Github(gh_token)
    repo_name = "ghasifofficial23/scraper-"  # Update if repository changes!
    repo = g.get_repo(repo_name)
    
    data_file_path = "frontend/public/data/articles.json"
    repo_file = None
    try:
        repo_file = repo.get_contents(data_file_path, ref="main")
        current_data = json.loads(repo_file.decoded_content.decode("utf-8"))
        print(f"📥 Downloaded {len(current_data.get('articles', []))} existing articles from GitHub")
    except Exception as e:
        print(f"⚠️ Could not pull existing data from GitHub: {e}")
        current_data = {"articles": [], "meta": {}}
        
    # Write existing data locally so aggregator can merge it properly
    output_dir = os.path.join(workspace, "frontend", "public", "data")
    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, "articles.json"), "w", encoding="utf-8") as f:
        json.dump(current_data, f)
        
    # 4. Execute the raw scrapers
    import scraper_bensbites
    import scraper_airundown
    import scraper_reddit
    import aggregator
    
    print("▶ Scraping Ben's Bites...")
    try: scraper_bensbites.main()
    except Exception as e: print(f"Error scraping Ben's Bites: {e}")
    
    print("▶ Scraping The AI Rundown...")
    try: scraper_airundown.main()
    except Exception as e: print(f"Error scraping AI Rundown: {e}")
        
    print("▶ Scraping Reddit...")
    try: scraper_reddit.main()
    except Exception as e: print(f"Error scraping Reddit: {e}")
    
    # 5. Aggregate Results
    print("▶ Aggregating Results...")
    payload = aggregator.main()
    
    # 6. Push updated JSON back to GitHub
    print("📤 Pushing new payload back to GitHub to trigger Vercel...")
    new_content = json.dumps(payload, indent=2, ensure_ascii=False)
    
    if repo_file:
        repo.update_file(
            repo_file.path,
            "chore: automated pipeline data refresh (from Modal)",
            new_content,
            repo_file.sha,
            branch="main"
        )
    else:
        repo.create_file(
            data_file_path,
            "chore: initial automated pipeline data dump (from Modal)",
            new_content,
            branch="main"
        )
        
    print(f"✅ Successfully committed {payload['meta']['total_articles']} articles to GitHub!")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser("Modal wrapper for BLAST")
    parser.add_argument("--local", action="store_true", help="Run locally using local credentials")
    args = parser.parse_args()

    if args.local:
        with app.run():
            run_daily_scraper.remote()
    else:
        print("To deploy the cron job to Modal, run: modal deploy tools/modal_pipeline.py")
