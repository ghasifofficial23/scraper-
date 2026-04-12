"""
Tool: run_pipeline.py
Layer: 2 - Navigation (Orchestrator)

Runs the full B.L.A.S.T. scraper pipeline in order:
  1. scraper_bensbites.py
  2. scraper_airundown.py
  3. aggregator.py
  4. Serves the Flask API for dashboard refresh

Usage:
  python tools/run_pipeline.py           -- run once
  python tools/run_pipeline.py --serve   -- run + start Flask server
  python tools/run_pipeline.py --schedule -- run + schedule every 24h
"""

import os
import sys
import logging
import argparse
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format="[Pipeline] %(asctime)s %(levelname)s: %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger(__name__)

# Add tools dir to path
sys.path.insert(0, os.path.dirname(__file__))

import scraper_bensbites
import scraper_airundown
import scraper_reddit
import aggregator


def run_pipeline():
    log.info("=" * 60)
    log.info(f"B.L.A.S.T. Pipeline starting at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 60)

    # Step 1: Ben's Bites
    log.info("▶ Step 1/3: Scraping Ben's Bites...")
    try:
        bb_articles = scraper_bensbites.main()
        log.info(f"  → {len(bb_articles)} articles (last 24h)")
    except Exception as e:
        log.error(f"Ben's Bites scraper failed: {e}")

    # Step 2: AI Rundown
    log.info("▶ Step 2/4: Scraping The AI Rundown...")
    try:
        ar_articles = scraper_airundown.main()
        log.info(f"  → {len(ar_articles)} new issues")
    except Exception as e:
        log.error(f"AI Rundown scraper failed: {e}")

    # Step 3: Reddit
    log.info("▶ Step 3/4: Scraping Reddit (r/ArtificialInteligence)...")
    try:
        reddit_articles = scraper_reddit.main()
        log.info(f"  → {len(reddit_articles)} top posts")
    except Exception as e:
        log.error(f"Reddit scraper failed: {e}")

    # Step 4: Aggregate
    log.info("▶ Step 4/4: Aggregating payload...")
    try:
        payload = aggregator.main()
        log.info(f"  → {payload['meta']['total_articles']} total articles in payload")
    except Exception as e:
        log.error(f"Aggregator failed: {e}")

    log.info("✅ Pipeline complete!")
    log.info("=" * 60)


def start_flask_server():
    """Tiny Flask API so the dashboard can trigger refreshes."""
    from flask import Flask, jsonify
    from flask_cors import CORS
    
    app = Flask(__name__)
    
    try:
        CORS(app)
    except ImportError:
        pass  # flask-cors not required

    @app.route("/api/refresh", methods=["POST", "GET"])
    def refresh():
        log.info("Manual refresh triggered from dashboard")
        run_pipeline()
        return jsonify({"status": "ok", "message": "Pipeline complete"})

    @app.route("/api/status", methods=["GET"])
    def status():
        import json
        payload_path = os.path.join(os.path.dirname(__file__), "..", "data", "articles.json")
        try:
            with open(payload_path) as f:
                data = json.load(f)
            return jsonify({"status": "ok", "meta": data.get("meta", {})})
        except Exception:
            return jsonify({"status": "no_data"})

    log.info("🌐 Flask API running at http://localhost:5050")
    log.info("   POST /api/refresh  — trigger scraper pipeline")
    log.info("   GET  /api/status   — get last refresh time")
    app.run(host="localhost", port=5050, debug=False)


def run_scheduled():
    import schedule
    import time

    log.info("⏰ Scheduling pipeline every 24 hours...")
    run_pipeline()  # Run immediately on start

    schedule.every(24).hours.do(run_pipeline)
    
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="B.L.A.S.T. Pipeline Runner")
    parser.add_argument("--serve", action="store_true", help="Run pipeline then start Flask API server")
    parser.add_argument("--schedule", action="store_true", help="Run pipeline on 24h schedule")
    args = parser.parse_args()

    if args.schedule:
        run_scheduled()
    elif args.serve:
        run_pipeline()
        start_flask_server()
    else:
        run_pipeline()
