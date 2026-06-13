"""Tests for RSS and Atom ingestion parsing."""

from worldstate_ai.ingestion import parse_feed_items


def test_parse_rss_feed_items():
    feed = b"""
    <rss version="2.0">
      <channel>
        <item>
          <title>WTO publishes new trade update</title>
          <link>https://example.org/trade</link>
          <description><![CDATA[<p>Global trade flows updated.</p>]]></description>
          <pubDate>Mon, 01 Jun 2026 10:30:00 GMT</pubDate>
        </item>
      </channel>
    </rss>
    """

    docs = parse_feed_items(feed, "WTO Latest News", "https://example.org/rss.xml", "trade")

    assert len(docs) == 1
    assert docs[0]["title"] == "WTO publishes new trade update"
    assert docs[0]["content"] == "Global trade flows updated."
    assert docs[0]["url"] == "https://example.org/trade"
    assert docs[0]["metadata"]["feed_format"] == "rss"
    assert docs[0]["metadata"]["category"] == "trade"
    assert docs[0]["published_at"].startswith("2026-06-01T10:30:00")


def test_parse_atom_feed_items():
    feed = b"""
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>M 5.2 - 10 km S of Example</title>
        <link rel="alternate" href="https://earthquake.usgs.gov/example"/>
        <summary>Magnitude 5.2 earthquake detected.</summary>
        <updated>2026-06-01T11:45:00Z</updated>
      </entry>
    </feed>
    """

    docs = parse_feed_items(
        feed,
        "USGS Earthquakes M4.5+",
        "https://earthquake.usgs.gov/feed.atom",
        "environment",
    )

    assert len(docs) == 1
    assert docs[0]["title"] == "M 5.2 - 10 km S of Example"
    assert docs[0]["content"] == "Magnitude 5.2 earthquake detected."
    assert docs[0]["url"] == "https://earthquake.usgs.gov/example"
    assert docs[0]["metadata"]["feed_format"] == "atom"
    assert docs[0]["metadata"]["category"] == "environment"
    assert docs[0]["published_at"].startswith("2026-06-01T11:45:00")
