"""WorldState Ingestion Agent — Automated live news and document scraper/publisher."""

import asyncio
import html
import logging
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import httpx

from worldstate_ai.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("worldstate_ingestion")

# Live free feeds representing official data, global news, economic alerts, and disaster channels.
FEEDS = {
    "BBC News World": {
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "country": "United Kingdom",
        "source_type": "news",
        "trust_score": 0.95,
    },
    "Google News Global": {
        "url": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YW5ScExuUnlZeUFTRnNnQkVnRW9JZ29FZWd0c2JHRnpaV3dnT2dKSFFpMVNaVzFoYVd4c2Jrd29BQVAB?hl=en-US&gl=US&ceid=US:en",
        "country": "Global",
        "source_type": "news",
        "trust_score": 0.85,
    },
    "CNBC Global Business": {
        "url": "https://search.cnbc.com/rs/search/all/view.rss?partnerId=2000&keywords=global%20economy",
        "country": "United States",
        "source_type": "news",
        "trust_score": 0.90,
    },
    "UN Global News": {
        "url": "https://news.un.org/feed/subscribe/en/news/all/rss.xml",
        "country": "Global",
        "source_type": "government",
        "trust_score": 0.95,
    },
    "Times of India World": {
        "url": "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
        "country": "India",
        "source_type": "news",
        "trust_score": 0.88,
    },
    "Al Jazeera English": {
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "country": "Qatar",
        "source_type": "news",
        "trust_score": 0.90,
    },
    "SCMP Asia": {
        "url": "https://www.scmp.com/rss/2/feed.xml",
        "country": "China",
        "source_type": "news",
        "trust_score": 0.89,
    },
    "France 24 World": {
        "url": "https://www.france24.com/en/rss",
        "country": "France",
        "source_type": "news",
        "trust_score": 0.92,
    },

    "RT News Russia": {
        "url": "https://www.rt.com/rss/news/",
        "country": "Russia",
        "source_type": "news",
        "trust_score": 0.82,
    },
    "China Daily Global": {
        "url": "https://www.chinadaily.com.cn/rss/world.shtml",
        "country": "China",
        "source_type": "news",
        "trust_score": 0.84,
    },
    "WSJ World News": {
        "url": "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
        "country": "United States",
        "source_type": "news",
        "trust_score": 0.94,
    },
    "MarketWatch MarketPulse": {
        "url": "https://feeds.content.dowjones.com/public/rss/mw_marketpulse.xml",
        "country": "United States",
        "source_type": "news",
        "trust_score": 0.91,
    },
    "Bloomberg Finance": {
        "url": "https://news.google.com/rss/search?q=source:Bloomberg&hl=en-US&gl=US&ceid=US:en",
        "country": "Global",
        "source_type": "news",
        "trust_score": 0.95,
    },
    "DW News Germany": {
        "url": "https://rss.dw.com/rdf/rss-en-world",
        "country": "Germany",
        "source_type": "news",
        "trust_score": 0.93,
    },
    "Defense News": {
        "url": "https://www.defensenews.com/arc/outboundfeeds/rss/category/global/",
        "country": "Global",
        "source_type": "news",
        "trust_score": 0.91,
    },
    "The Economist": {
        "url": "https://news.google.com/rss/search?q=source:The+Economist&hl=en-US&gl=US&ceid=US:en",
        "country": "United Kingdom",
        "source_type": "news",
        "trust_score": 0.94,
    },
    "Financial Times": {
        "url": "https://news.google.com/rss/search?q=source:Financial+Times&hl=en-US&gl=US&ceid=US:en",
        "country": "United Kingdom",
        "source_type": "news",
        "trust_score": 0.95,
        "category": "economic",
    },
    "USGS Earthquakes M4.5+": {
        "url": "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.atom",
        "country": "Global",
        "source_type": "disaster",
        "trust_score": 0.97,
        "category": "environment",
    },
    "GDACS Disaster Alerts": {
        "url": "https://www.gdacs.org/xml/rss.xml",
        "country": "Global",
        "source_type": "disaster",
        "trust_score": 0.96,
        "category": "environment",
    },
    "ReliefWeb Updates": {
        "url": "https://reliefweb.int/updates/rss.xml",
        "country": "Global",
        "source_type": "disaster",
        "trust_score": 0.94,
        "category": "environment",
    },
    "ECB Press Releases": {
        "url": "https://www.ecb.europa.eu/rss/press.html",
        "country": "European Union",
        "source_type": "central_bank",
        "trust_score": 0.97,
        "category": "economic",
    },
    "Federal Reserve Press Releases": {
        "url": "https://www.federalreserve.gov/feeds/press_all.xml",
        "country": "United States",
        "source_type": "central_bank",
        "trust_score": 0.97,
        "category": "economic",
    },
    "EIA Today in Energy": {
        "url": "https://www.eia.gov/rss/todayinenergy.xml",
        "country": "United States",
        "source_type": "commodity_feed",
        "trust_score": 0.96,
        "category": "commodity",
    },
    "BIS Press Releases": {
        "url": "https://www.bis.org/doclist/all_pressrels.rss",
        "country": "Global",
        "source_type": "central_bank",
        "trust_score": 0.96,
        "category": "financial",
    },
    "WTO Latest News": {
        "url": "https://www.wto.org/library/rss/latest_news_e.xml",
        "country": "Global",
        "source_type": "government",
        "trust_score": 0.95,
        "category": "trade",
    },
    "Nikkei Asia Feed": {
        "url": "https://news.google.com/rss/search?q=source:Nikkei+Asia&hl=en-US&gl=US&ceid=US:en",
        "country": "Japan",
        "source_type": "news",
        "trust_score": 0.92,
        "category": "economic",
    },
    "CNA Asia Pacific": {
        "url": "https://news.google.com/rss/search?q=source:CNA&hl=en-SG&gl=SG&ceid=SG:en",
        "country": "Singapore",
        "source_type": "news",
        "trust_score": 0.91,
        "category": "geopolitical",
    },
    "Reserve Bank of India PR": {
        "url": "https://news.google.com/rss/search?q=Reserve+Bank+of+India&hl=en-IN&gl=IN&ceid=IN:en",
        "country": "India",
        "source_type": "central_bank",
        "trust_score": 0.96,
        "category": "economic",
    },
    "Bank of Japan PR": {
        "url": "https://news.google.com/rss/search?q=Bank+of+Japan&hl=en-US&gl=US&ceid=US:en",
        "country": "Japan",
        "source_type": "central_bank",
        "trust_score": 0.96,
        "category": "economic",
    },
    "People's Bank of China PR": {
        "url": "https://news.google.com/rss/search?q=People's+Bank+of+China&hl=en-US&gl=US&ceid=US:en",
        "country": "China",
        "source_type": "central_bank",
        "trust_score": 0.95,
        "category": "economic",
    },
    "African Union Press Releases": {
        "url": "https://news.google.com/rss/search?q=African+Union&hl=en-US&gl=US&ceid=US:en",
        "country": "Global",
        "source_type": "government",
        "trust_score": 0.92,
        "category": "geopolitical",
    },
    "Al Arabiya English News": {
        "url": "https://news.google.com/rss/search?q=source:Al+Arabiya&hl=en-US&gl=US&ceid=US:en",
        "country": "Saudi Arabia",
        "source_type": "news",
        "trust_score": 0.88,
        "category": "geopolitical",
    },
    "Mercopress South America": {
        "url": "https://news.google.com/rss/search?q=source:Mercopress&hl=en-US&gl=US&ceid=US:en",
        "country": "Uruguay",
        "source_type": "news",
        "trust_score": 0.87,
        "category": "geopolitical",
    },
}


def clean_feed_text(value: str | None) -> str:
    """Remove HTML noise and normalize whitespace from feed text."""
    if not value:
        return ""
    text = re.sub(r"<[^>]*>", "", value)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_feed_datetime(value: str | None) -> str:
    """Parse RSS/Atom timestamps and return an ISO-8601 UTC timestamp."""
    if not value:
        return datetime.now(timezone.utc).isoformat()

    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat()
    except Exception:
        pass

    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def parse_feed_items(feed_xml: bytes, source_name: str, feed_url: str, category: str) -> list[dict]:
    """Parse RSS 2.0 and Atom feeds into ingestion-ready document dictionaries."""
    root = ET.fromstring(feed_xml)
    docs: list[dict] = []

    rss1_ns = "{http://purl.org/rss/1.0/}"
    dc_ns = "{http://purl.org/dc/elements/1.1/}"
    rss_items = root.findall(".//item") + root.findall(f".//{rss1_ns}item")
    if rss_items:
        for item in rss_items:
            title = clean_feed_text(item.findtext("title") or item.findtext(f"{rss1_ns}title"))
            link = clean_feed_text(item.findtext("link") or item.findtext(f"{rss1_ns}link"))
            description = clean_feed_text(
                item.findtext("description") or item.findtext(f"{rss1_ns}description")
            )
            published_at = parse_feed_datetime(
                item.findtext("pubDate")
                or item.findtext(f"{dc_ns}date")
            )
            if not title:
                continue
            docs.append(
                {
                    "source_name": source_name,
                    "title": title,
                    "content": description or title,
                    "summary": (description or title)[:300],
                    "url": link or feed_url,
                    "language": "en",
                    "published_at": published_at,
                    "metadata": {
                        "category": category,
                        "feed_format": "rss",
                        "rss_feed": source_name,
                        "polled_at": datetime.now(timezone.utc).isoformat(),
                    },
                }
            )
        return docs

    atom_ns = "{http://www.w3.org/2005/Atom}"
    for entry in root.findall(f".//{atom_ns}entry"):
        title = clean_feed_text(entry.findtext(f"{atom_ns}title"))
        summary = clean_feed_text(
            entry.findtext(f"{atom_ns}summary") or entry.findtext(f"{atom_ns}content")
        )
        link = ""
        for link_el in entry.findall(f"{atom_ns}link"):
            rel = link_el.attrib.get("rel", "alternate")
            href = link_el.attrib.get("href", "")
            if href and rel in {"alternate", ""}:
                link = href
                break
        published_at = parse_feed_datetime(
            entry.findtext(f"{atom_ns}published") or entry.findtext(f"{atom_ns}updated")
        )
        if not title:
            continue
        docs.append(
            {
                "source_name": source_name,
                "title": title,
                "content": summary or title,
                "summary": (summary or title)[:300],
                "url": link or feed_url,
                "language": "en",
                "published_at": published_at,
                "metadata": {
                    "category": category,
                    "feed_format": "atom",
                    "rss_feed": source_name,
                    "polled_at": datetime.now(timezone.utc).isoformat(),
                },
            }
        )

    return docs


async def ingest_document(client: httpx.AsyncClient, doc: dict) -> bool:
    """Send a single raw document to the Go backend API."""
    url = f"{settings.backend_url}/api/v1/documents"
    payload = {
        "source_name": doc["source_name"],
        "title": doc["title"],
        "content": doc["content"],
        "summary": doc["summary"],
        "url": doc["url"],
        "language": doc["language"],
        "published_at": doc.get("published_at") or datetime.now(timezone.utc).isoformat(),
        "metadata": doc["metadata"],
    }

    try:
        response = await client.post(url, json=payload, timeout=10.0)
        if response.status_code == 201:
            logger.info(f"Successfully ingested: '{doc['title'][:60]}...' (Source: {doc['source_name']})")
            return True
        elif response.status_code == 409:
            logger.warning(f"Document already exists (SHA256 deduplicated): '{doc['title'][:60]}...'")
            return True
        else:
            logger.error(
                f"Failed to ingest document '{doc['title']}': HTTP {response.status_code} - {response.text}"
            )
            return False
    except Exception as e:
        logger.error(f"Network error contacting Go backend at {url}: {e}")
        return False


async def run_continuous_ingestion(interval_seconds: int = 600):
    """Loop forever to ingest live RSS feed documents."""
    logger.info("Starting continuous live RSS ingestion loop...")

    # Wait 10 seconds on boot for the Go backend migrations to finish
    await asyncio.sleep(10)

    # 1. Register sources first to maintain relational foreign key constraints
    async with httpx.AsyncClient() as client:
        for source_name, info in FEEDS.items():
            url = info["url"]
            source_payload = {
                "name": source_name,
                "source_type": info["source_type"],
                "url": url,
                "country": info["country"],
                "trust_score": info["trust_score"],
            }
            try:
                src_res = await client.post(
                    f"{settings.backend_url}/api/v1/sources", json=source_payload, timeout=10.0
                )
                if src_res.status_code == 201:
                    logger.info(f"Registered live source: {source_name}")
            except Exception as e:
                logger.warning(f"Could not check/register source {source_name}: {e}")

        # 2. Continuous Loop
        while True:
            try:
                logger.info("Fetching and processing live RSS feeds...")
                for source_name, info in FEEDS.items():
                    feed_url = info["url"]
                    try:
                        logger.info(f"Polling feed: {source_name}...")
                        res = await client.get(feed_url, timeout=15.0)
                        if res.status_code != 200:
                            logger.error(f"Failed to fetch {source_name}: HTTP {res.status_code}")
                            continue

                        docs = parse_feed_items(
                            res.content,
                            source_name,
                            feed_url,
                            info.get("category", "other"),
                        )
                        logger.info(f"Found {len(docs)} items in {source_name}")

                        ingested_count = 0
                        # Process at most 10 items per feed per loop iteration to manage rate limits
                        for doc in docs[:10]:
                            success = await ingest_document(client, doc)
                            if success:
                                ingested_count += 1

                            # Short sleep between documents
                            await asyncio.sleep(0.5)

                        logger.info(f"Ingested {ingested_count} new documents from {source_name}")
                    except Exception as feed_err:
                        logger.error(f"Error processing feed {source_name}: {feed_err}")

            except Exception as loop_err:
                logger.error(f"Error in continuous RSS loop iteration: {loop_err}")

            logger.info(f"Sleeping for {interval_seconds} seconds before next RSS poll...")
            await asyncio.sleep(interval_seconds)


async def run_one_shot_ingestion():
    """Run a one-shot ingestion of live RSS feed items."""
    logger.info("Initializing WorldState One-Shot Live RSS Ingest...")
    logger.info(f"Targeting Go Backend: {settings.backend_url}")

    async with httpx.AsyncClient() as client:
        # Register sources
        for source_name, info in FEEDS.items():
            url = info["url"]
            source_payload = {
                "name": source_name,
                "source_type": info["source_type"],
                "url": url,
                "country": info["country"],
                "trust_score": info["trust_score"],
            }
            try:
                await client.post(
                    f"{settings.backend_url}/api/v1/sources", json=source_payload, timeout=10.0
                )
            except Exception as e:
                logger.warning(f"Could not register source {source_name}: {e}")

        # Ingest feed documents
        for source_name, info in FEEDS.items():
            feed_url = info["url"]
            try:
                res = await client.get(feed_url, timeout=15.0)
                if res.status_code == 200:
                    docs = parse_feed_items(
                        res.content,
                        source_name,
                        feed_url,
                        info.get("category", "other"),
                    )
                    for doc in docs[:5]:  # Ingest top 5 items per feed in one-shot
                        await ingest_document(client, doc)
            except Exception as e:
                logger.error(f"Error in one-shot feed {source_name}: {e}")


if __name__ == "__main__":
    asyncio.run(run_one_shot_ingestion())
